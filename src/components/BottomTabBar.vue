<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  tabs: { type: Array, required: true }, // [{ key, label, icon, badge?: number }]
});
const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <nav class="bottom-tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="bottom-tab-item"
      :class="{ 'is-active': modelValue === tab.key }"
      @click="emit('update:modelValue', tab.key)"
    >
      <i :class="tab.icon"></i>
      <span>{{ tab.label }}</span>
      <span v-if="tab.badge && tab.badge > 0" class="bottom-tab-badge">{{ tab.badge > 99 ? '99+' : tab.badge }}</span>
    </button>
  </nav>
</template>
