<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: { type: Object, default: () => ({ start: null, end: null }) },
});
const emit = defineEmits(['update:modelValue']);

const open = ref(false);
const draft = ref({ start: null, end: null });
const hoverDate = ref(null);

// Left calendar anchor (right = left+1 month)
const leftYear = ref(new Date().getFullYear());
const leftMonth = ref(new Date().getMonth());

const rightYear = computed(() => leftMonth.value === 11 ? leftYear.value + 1 : leftYear.value);
const rightMonth = computed(() => leftMonth.value === 11 ? 0 : leftMonth.value + 1);

function openPicker() {
  draft.value = {
    start: props.modelValue?.start ? parseISO(props.modelValue.start) : null,
    end:   props.modelValue?.end   ? parseISO(props.modelValue.end)   : null,
  };
  if (draft.value.start) {
    leftYear.value = draft.value.start.getFullYear();
    leftMonth.value = draft.value.start.getMonth();
  }
  open.value = true;
}

function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function toISO(d) {
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dayNum(d) {
  return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() : null;
}

function prevMonth() {
  if (leftMonth.value === 0) { leftMonth.value = 11; leftYear.value--; }
  else leftMonth.value--;
}
function nextMonth() {
  if (leftMonth.value === 11) { leftMonth.value = 0; leftYear.value++; }
  else leftMonth.value++;
}

function calDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const prevTotal = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = first - 1; i >= 0; i--)
    days.push({ date: new Date(year, month - 1, prevTotal - i), cur: false });
  for (let d = 1; d <= total; d++)
    days.push({ date: new Date(year, month, d), cur: true });
  while (days.length < 42)
    days.push({ date: new Date(year, month + 1, days.length - first - total + 1), cur: false });
  return days;
}

const leftDays  = computed(() => calDays(leftYear.value, leftMonth.value));
const rightDays = computed(() => calDays(rightYear.value, rightMonth.value));

function selectDate(date) {
  const s = draft.value.start;
  const e = draft.value.end;
  if (!s || (s && e)) {
    draft.value = { start: date, end: null };
  } else {
    if (date < s) draft.value = { start: date, end: s };
    else          draft.value = { start: s,    end: date };
  }
  hoverDate.value = null;
}

function isStart(date)  { return draft.value.start && dayNum(date) === dayNum(draft.value.start); }
function isEnd(date)    { return draft.value.end   && dayNum(date) === dayNum(draft.value.end); }
function isEdge(date)   { return isStart(date) || isEnd(date); }
function isInRange(date) {
  const s = draft.value.start;
  const e = draft.value.end || (draft.value.start ? hoverDate.value : null);
  if (!s || !e) return false;
  const d = dayNum(date);
  return d > Math.min(dayNum(s), dayNum(e)) && d < Math.max(dayNum(s), dayNum(e));
}
function isToday(date) { return dayNum(date) === dayNum(new Date()); }

function apply() {
  emit('update:modelValue', { start: toISO(draft.value.start), end: toISO(draft.value.end) });
  open.value = false;
}
function clear() {
  draft.value = { start: null, end: null };
  emit('update:modelValue', { start: null, end: null });
  open.value = false;
}

const displayText = computed(() => {
  const v = props.modelValue;
  if (!v?.start && !v?.end) return null;
  const fmt = (s) => { if (!s) return ''; const [, m, d] = s.split('-'); return `${+m}/${+d}`; };
  if (v.start && v.end) return `${fmt(v.start)} – ${fmt(v.end)}`;
  return `${fmt(v.start)} 起`;
});

const hasValue = computed(() => !!(props.modelValue?.start || props.modelValue?.end));

const DAYS = ['日','一','二','三','四','五','六'];
const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

const root = ref(null);
function onOutsideClick(e) {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false;
}
onMounted(() => document.addEventListener('mousedown', onOutsideClick));
onUnmounted(() => document.removeEventListener('mousedown', onOutsideClick));
</script>

<template>
  <div ref="root" class="relative inline-block">
    <!-- Trigger button -->
    <button
      class="g-btn g-btn-glass g-btn-sm flex items-center gap-2"
      :class="{ 'ring-2 ring-brand': hasValue }"
      @click="openPicker"
    >
      <i class="fas fa-calendar-days text-sm" :style="hasValue ? 'color: var(--brand)' : ''"></i>
      <span :style="hasValue ? 'color: var(--brand); font-weight:700' : ''">
        {{ displayText || '日期' }}
      </span>
      <i v-if="hasValue" class="fas fa-xmark text-xs ml-0.5 hover:text-red-500"
         @click.stop="clear" style="opacity:.7"></i>
      <i v-else class="fas fa-chevron-down text-xs" style="opacity:.5"></i>
    </button>

    <!-- Picker panel -->
    <Transition name="dp-slide">
      <div v-if="open"
           class="absolute z-50 mt-2 g-card-solid animate-slide-down"
           style="min-width:580px; padding:16px; left:0; box-shadow: var(--glass-shadow-lg)">

        <!-- Header: nav + month labels -->
        <div class="flex items-center gap-2 mb-3">
          <button class="g-btn g-btn-glass g-btn-sm px-2" @click="prevMonth">
            <i class="fas fa-chevron-left text-xs"></i>
          </button>
          <div class="flex-1 grid grid-cols-2 gap-2 text-center">
            <span class="font-bold text-sm">
              {{ leftYear }}年 {{ MONTH_NAMES[leftMonth] }}
            </span>
            <span class="font-bold text-sm">
              {{ rightYear }}年 {{ MONTH_NAMES[rightMonth] }}
            </span>
          </div>
          <button class="g-btn g-btn-glass g-btn-sm px-2" @click="nextMonth">
            <i class="fas fa-chevron-right text-xs"></i>
          </button>
        </div>

        <!-- Dual calendars -->
        <div class="grid grid-cols-2 gap-4">
          <div v-for="(cal, ci) in [{ days: leftDays }, { days: rightDays }]" :key="ci">
            <!-- Weekday header -->
            <div class="grid grid-cols-7 mb-1">
              <div v-for="d in DAYS" :key="d"
                   class="text-center text-xs font-bold py-1"
                   style="color: var(--text-muted)">{{ d }}</div>
            </div>
            <!-- Day cells -->
            <div class="grid grid-cols-7 gap-y-0.5">
              <div
                v-for="(cell, di) in cal.days" :key="di"
                class="relative flex items-center justify-center"
              >
                <!-- Range background strip -->
                <div
                  v-if="isInRange(cell.date) && cell.cur"
                  class="absolute inset-y-0 left-0 right-0"
                  style="background: rgba(176,115,106,0.12)"
                ></div>
                <!-- Day button -->
                <button
                  class="relative z-10 w-8 h-8 rounded-full text-xs font-medium transition-all"
                  :class="{
                    'opacity-30 cursor-default': !cell.cur,
                    'bg-brand text-white font-bold shadow-sm': isEdge(cell.date) && cell.cur,
                    'bg-transparent hover:bg-brand-soft': !isEdge(cell.date) && cell.cur,
                    'ring-1 ring-brand ring-offset-1': isToday(cell.date) && !isEdge(cell.date),
                  }"
                  :style="isEdge(cell.date) && cell.cur ? 'background: var(--brand); color:#fff' : ''"
                  :disabled="!cell.cur"
                  @click="cell.cur && selectDate(cell.date)"
                  @mouseenter="cell.cur && draft.start && !draft.end && (hoverDate = cell.date)"
                  @mouseleave="hoverDate = null"
                >
                  {{ cell.date.getDate() }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Selection hint -->
        <p class="text-xs mt-3 text-center" style="color: var(--text-muted)">
          <template v-if="!draft.start">點選起始日期</template>
          <template v-else-if="draft.start && !draft.end">再點選結束日期</template>
          <template v-else>
            已選：{{ toISO(draft.start) }} ~ {{ toISO(draft.end) }}
          </template>
        </p>

        <!-- Actions -->
        <div class="flex gap-2 mt-3 pt-3" style="border-top: 1px solid var(--glass-border-subtle)">
          <button class="g-btn g-btn-glass g-btn-sm flex-1" @click="clear">
            <i class="fas fa-xmark"></i> 清除篩選
          </button>
          <button
            class="g-btn g-btn-brand g-btn-sm flex-1"
            :disabled="!draft.start"
            @click="apply"
          >
            <i class="fas fa-check"></i> 套用日期篩選
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dp-slide-enter-active { animation: slide-down 0.25s var(--spring, cubic-bezier(0.23,1,0.32,1)); }
.dp-slide-leave-active { animation: slide-down 0.15s reverse; }
.bg-brand-soft { background: rgba(176,115,106,0.1); }
.bg-brand { background: var(--brand); }
.ring-brand { --tw-ring-color: var(--brand); }
</style>
