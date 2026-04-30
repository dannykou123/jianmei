<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  zIndex: { type: Number, default: 60 },
});
const emit = defineEmits(['close']);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      :style="{ zIndex }"
      @click.self="emit('close')"
    >
      <div
        class="g-modal w-full animate-zoom-in flex flex-col"
        :class="[compact ? 'g-modal-compact max-w-sm' : 'max-w-3xl max-h-[90vh] overflow-hidden']"
      >
        <div v-if="title || $slots.header" class="g-modal-header flex items-center justify-between">
          <slot name="header">
            <h3 class="text-lg font-bold">{{ title }}</h3>
          </slot>
          <button
            type="button"
            class="text-stone-500 hover:text-stone-800 text-xl"
            @click="emit('close')"
            aria-label="關閉"
          >
            <i class="fas fa-xmark"></i>
          </button>
        </div>
        <div class="g-modal-body overflow-y-auto flex-1 flex flex-col">
          <slot />
        </div>
        <div v-if="$slots.footer" class="g-modal-footer flex justify-end gap-2">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
