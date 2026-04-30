<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '請確認' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '確定' },
  cancelText: { type: String, default: '取消' },
  danger: { type: Boolean, default: false },
});
const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/30 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-fade-in"
      @click.self="emit('cancel')"
    >
      <div class="g-modal g-modal-compact w-full max-w-sm animate-zoom-in">
        <div class="g-modal-header">
          <h3 class="text-lg font-bold">{{ title }}</h3>
        </div>
        <div class="g-modal-body">
          <p class="text-stone-700 whitespace-pre-line">{{ message }}</p>
        </div>
        <div class="g-modal-footer flex justify-end gap-2">
          <button type="button" class="g-btn g-btn-glass" @click="emit('cancel')">{{ cancelText }}</button>
          <button
            type="button"
            class="g-btn"
            :class="danger ? 'g-btn-danger' : 'g-btn-primary'"
            @click="emit('confirm')"
          >{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
