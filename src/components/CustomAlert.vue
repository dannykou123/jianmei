<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '提示' },
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }, // info | success | warn | error
});
const emit = defineEmits(['close']);

const iconMap = {
  info: 'fa-circle-info',
  success: 'fa-circle-check',
  warn: 'fa-triangle-exclamation',
  error: 'fa-circle-xmark',
};
const colorMap = {
  info: 'text-blue-600',
  success: 'text-green-600',
  warn: 'text-amber-600',
  error: 'text-red-600',
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/30 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-fade-in"
      @click.self="emit('close')"
    >
      <div class="g-modal g-modal-compact w-full max-w-sm animate-zoom-in">
        <div class="g-modal-body text-center">
          <i class="fas text-5xl mb-3" :class="[iconMap[type], colorMap[type]]"></i>
          <h3 class="text-lg font-bold mb-2">{{ title }}</h3>
          <p class="text-stone-600 whitespace-pre-line">{{ message }}</p>
        </div>
        <div class="g-modal-footer flex justify-center">
          <button type="button" class="g-btn g-btn-primary" @click="emit('close')">確定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
