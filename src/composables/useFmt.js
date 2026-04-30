// 時間/金額/狀態格式化工具
export function fmtTs(ts) {
  if (!ts) return '';
  let date;
  if (ts.toDate) date = ts.toDate();
  else if (ts instanceof Date) date = ts;
  else if (typeof ts === 'string') date = new Date(ts);
  else if (typeof ts === 'number') date = new Date(ts);
  else if (ts.seconds != null) date = new Date(ts.seconds * 1000);
  else return '';
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

export function fmtMoney(n) {
  const num = Number(n) || 0;
  return `$${num.toLocaleString()}`;
}

export function fmtDate(ts) {
  const s = fmtTs(ts);
  return s ? s.split(' ')[0] : '';
}

export function toDateInputValue(ts) {
  if (!ts) return '';
  let date;
  if (ts.toDate) date = ts.toDate();
  else if (ts instanceof Date) date = ts;
  else date = new Date(ts);
  if (isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const STATUS_LABEL = {
  pending: '待審核',
  approved: '已接單',
  rejected: '已拒絕',
  expired: '已過期',
  open: '開團中',
  closed: '已關團',
};

export const STATUS_BADGE_CLASS = {
  pending: 'g-badge-pending',
  approved: 'g-badge-approved',
  rejected: 'g-badge-rejected',
  expired: 'g-badge-expired',
  open: 'g-badge-info',
  closed: 'g-badge-neutral',
};
