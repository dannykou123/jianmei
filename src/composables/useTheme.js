// useTheme：深色模式切換（沿用 localStorage 'colorScheme'）
import { ref, watch } from 'vue';

const stored = (() => {
  try { return localStorage.getItem('colorScheme'); } catch { return null; }
})();
const isDark = ref(stored === 'dark');

function apply(dark) {
  if (dark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  try { localStorage.setItem('colorScheme', dark ? 'dark' : 'light'); } catch {}
}

apply(isDark.value);
watch(isDark, apply);

export function useTheme() {
  function toggle() { isDark.value = !isDark.value; }
  return { isDark, toggle };
}
