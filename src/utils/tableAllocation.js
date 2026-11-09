export function localDateTime(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function formatAllocationTime(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export const tableNames = (tables = []) => tables.map((table) => `Table #${table.tableNumber ?? table.id}`).join(' + ');

function integer(value, min, max, label) {
  const number = value === '' || value == null ? NaN : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new Error(`${label} must be an integer between ${min} and ${max}.`);
  return number;
}

function instant(value, label) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new Error(`${label} is invalid.`);
  return date.toISOString();
}

export function buildRecommendationRequest(form, { combination = false, alternatives = false } = {}) {
  const request = {
    guestCount: integer(form.guestCount, 1, 100, 'Guest count'),
    durationMinutes: integer(form.durationMinutes, 30, 360, 'Duration'),
    maxResults: combination ? 10 : integer(form.maxResults, 1, 10, 'Result limit'),
    allowCombination: combination || Boolean(form.allowCombination),
    alternativeMode: alternatives ? 'ALWAYS' : form.alternativeMode,
    maxAlternatives: integer(form.maxAlternatives, 1, 10, 'Alternative limit'),
    maxShiftMinutes: integer(form.maxShiftMinutes, 15, 180, 'Time shift'),
  };
  if (!['AUTO', 'ALWAYS', 'NEVER'].includes(request.alternativeMode)) throw new Error('Invalid alternative mode.');
  if (form.startTime) {
    request.startTime = instant(form.startTime, 'Start time');
    if (new Date(request.startTime).getTime() < Date.now() - 5 * 60000) throw new Error('Start time cannot be in the past.');
  }
  if (form.preferredAreaId) request.preferredAreaId = integer(form.preferredAreaId, 1, Number.MAX_SAFE_INTEGER, 'Area');
  return request;
}

export function buildOptimizationRequest(form) {
  const windowStart = instant(form.windowStart, 'Window start');
  const windowEnd = instant(form.windowEnd, 'Window end');
  const duration = new Date(windowEnd) - new Date(windowStart);
  if (duration <= 0) throw new Error('Window end must be after window start.');
  if (duration > 72 * 3600000) throw new Error('The optimization window cannot exceed 72 hours.');
  return {
    windowStart, windowEnd,
    lockWindowMinutes: integer(form.lockWindowMinutes, 0, 720, 'Lock window'),
    maxMoves: integer(form.maxMoves, 1, 100, 'Move limit'),
    includeConfirmed: Boolean(form.includeConfirmed),
  };
}

export function buildAllocationBooking(selection, note = '') {
  const { option, startTime, endTime, partySize } = selection;
  instant(startTime, 'Recommended start time');
  instant(endTime, 'Recommended end time');
  if (new Date(startTime) <= new Date()) throw new Error('This start time has passed. Please search again for a future slot.');
  if (!option?.tableIds?.length || !['SINGLE', 'SMALL', 'MEDIUM', 'LARGE', 'XLARGE'].includes(partySize)) throw new Error('The recommendation is incomplete. Please search again.');
  if (new Date(endTime) <= new Date(startTime)) throw new Error('The recommended time slot is invalid.');
  return { partySize, reservationType: 'TABLE', startTime, endTime, tableIds: [...option.tableIds], note };
}

export function allocationPermissions(user, token) {
  let permissions;
  try {
    const segment = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const payload = JSON.parse(atob(segment.padEnd(Math.ceil(segment.length / 4) * 4, '=')));
    if (Array.isArray(payload.permissions)) permissions = payload.permissions;
  } catch { /* The backend still validates every request. */ }
  const role = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const roles = permissions ?? (role ? [`ROLE_${role.replace(/^ROLE_/, '').toUpperCase()}`] : []);
  const has = (...allowed) => allowed.some((name) => roles.includes(`ROLE_${name}`));
  return {
    canRecommend: has('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN'),
    canPreview: has('STAFF', 'MANAGER', 'ADMIN'),
    canApply: has('MANAGER', 'ADMIN'),
    canBook: has('CUSTOMER'),
  };
}

export function allocationError(error) {
  if (error?.response?.status === 403) return 'Your account does not have permission for this action.';
  if (error?.response?.status === 401) return 'Your session has expired. Please sign in again.';
  if (error?.code === 'ERR_NETWORK') return 'Unable to connect to the server. Please try again.';
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Refresh the preview or search before trying again.';
  const message = error?.response?.data?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.map((item) => typeof item === 'string' ? item : item?.message || JSON.stringify(item)).join('; ');
  if (message && typeof message === 'object') return Object.entries(message).map(([key, value]) => `${key}: ${String(value)}`).join('; ');
  return error?.message || 'Unable to complete this request.';
}
