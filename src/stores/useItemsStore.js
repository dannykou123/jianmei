// useItemsStore：Items collection 共用快取（admin / organizer / customer 都會用到）
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listItems } from '@/services/items.service';

export const useItemsStore = defineStore('items', () => {
  const items = ref([]);
  const loaded = ref(false);
  const loading = ref(false);

  async function fetch(force = false) {
    if (loaded.value && !force) return items.value;
    loading.value = true;
    try {
      items.value = await listItems();
      loaded.value = true;
    } finally {
      loading.value = false;
    }
    return items.value;
  }

  function byType(type) {
    // 舊版商品沒有 type 欄位，預設視為 'regular'；依建立時間升序排列
    return items.value
      .filter((it) => (it.type || 'regular') === type)
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return ta - tb;
      });
  }

  function byName(name) {
    return items.value.find((it) => it.name === name);
  }

  function priceMap() {
    const map = {};
    items.value.forEach((it) => { map[it.name] = it.price || 0; });
    return map;
  }

  return { items, loaded, loading, fetch, byType, byName, priceMap };
});
