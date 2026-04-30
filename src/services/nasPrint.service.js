// NAS 列印服務 API 包裝（呼叫 nas-print-service FastAPI 端點）
// NAS 服務位置由 localStorage 'nasPrintBaseUrl' 設定，預設 http://192.168.1.100:8000
const DEFAULT_BASE = 'http://192.168.1.100:8000';

export function getNasBase() {
  try {
    return localStorage.getItem('nasPrintBaseUrl') || DEFAULT_BASE;
  } catch {
    return DEFAULT_BASE;
  }
}

export function setNasBase(url) {
  try { localStorage.setItem('nasPrintBaseUrl', url); } catch {}
}

async function postJson(path, payload) {
  const res = await fetch(`${getNasBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`NAS API ${path} failed: ${res.status}`);
  return res;
}

export async function previewLabel(payload, page = 1) {
  const res = await postJson(`/api/preview-image?page=${page}`, payload);
  return res.blob();
}

export async function previewStock(payload, page = 1) {
  const res = await postJson(`/api/preview-stock?page=${page}`, payload);
  return res.blob();
}

export async function printLabel(payload) {
  return postJson('/api/print-label', payload);
}

export async function printStock(payload) {
  return postJson('/api/print-stock', payload);
}
