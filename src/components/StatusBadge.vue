<script setup>
import { computed } from 'vue';
import { STATUS_LABEL, STATUS_BADGE_CLASS } from '@/composables/useFmt';

const props = defineProps({
  status: { type: String, required: true },
  label: { type: String, default: '' },
});

const cls = computed(() => STATUS_BADGE_CLASS[props.status] || 'g-badge-neutral');
const text = computed(() => props.label || STATUS_LABEL[props.status] || props.status);
</script>

<template>
  <span class="g-badge" :class="cls">{{ text }}</span>
</template>
