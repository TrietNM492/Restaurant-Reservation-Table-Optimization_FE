export const MENU_STATUSES = {
  AVAILABLE: { label: 'Available', color: 'success' },
  OUT_OF_STOCK: { label: 'Out of stock', color: 'warning' },
  ARCHIVED: { label: 'Archived', color: 'default' },
};

export const formatMenuPrice = (price) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(price ?? 0);

export function menuError(error) {
  const status = error?.response?.status;
  if (status === 403) return 'You need an administrator account to manage the menu.';
  if (status === 404) return 'This record no longer exists or is no longer visible. Refresh the list.';
  if (status >= 500) return 'The server could not complete this request. Please try again or contact support.';
  const message = error?.response?.data?.message;
  if (typeof message === 'string') return message;
  if (message && typeof message === 'object') return Object.values(message).join(' ');
  return error?.message || 'Unable to connect. Please try again.';
}

export function applyMenuFieldErrors(error, setError) {
  const message = error?.response?.data?.message;
  if (message && typeof message === 'object' && !Array.isArray(message)) {
    Object.entries(message).forEach(([field, value]) => setError(field, { type: 'server', message: String(value) }));
  }
}

const nullableText = (value) => value?.trim() || null;
export const categoryBody = (values) => ({
  code: values.code.trim().toUpperCase(), name: values.name.trim(),
  description: nullableText(values.description), menuQr: nullableText(values.menuQr),
  menuPicture: nullableText(values.menuPicture),
});
export const itemBody = (values) => ({
  categoryId: Number(values.categoryId), itemName: values.itemName.trim(),
  description: nullableText(values.description), price: Number(values.price),
  itemPicture: nullableText(values.itemPicture), status: values.status,
  estimatedPrepMinutes: values.estimatedPrepMinutes === '' ? null : Number(values.estimatedPrepMinutes),
  originId: values.originId === '' ? null : Number(values.originId),
});

export function readBrowseParams(search) {
  const positiveInteger = (key, fallback, max = Number.MAX_SAFE_INTEGER) => {
    const value = Number(search.get(key));
    return Number.isInteger(value) && value > 0 ? Math.min(value, max) : fallback;
  };
  const params = { page: positiveInteger('page', 1), size: positiveInteger('size', 12, 50), sort: search.get('sort') || 'name' };
  if (!['name', 'price_asc', 'price_desc', 'newest'].includes(params.sort)) params.sort = 'name';
  if (search.get('q')?.trim()) params.q = search.get('q').trim();
  const categoryId = positiveInteger('categoryId', null);
  if (categoryId) params.categoryId = categoryId;
  for (const key of ['minPrice', 'maxPrice']) {
    const value = search.get(key);
    if (value !== null && value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0) params[key] = Number(value);
  }
  return params;
}
