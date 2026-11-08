import test from 'node:test';
import assert from 'node:assert/strict';
import { allocationError, allocationPermissions, buildAllocationBooking, buildOptimizationRequest, buildRecommendationRequest, localDateTime } from '../src/utils/tableAllocation.js';

const future = '2099-05-01T18:30';
const form = { guestCount: '12', startTime: future, durationMinutes: '90', preferredAreaId: '7', maxResults: '5', allowCombination: false, alternativeMode: 'AUTO', maxAlternatives: '4', maxShiftMinutes: '120' };

test('recommendations preserve local time and serialize numeric and optional fields', () => {
  const request = buildRecommendationRequest(form);
  assert.deepEqual(request, { guestCount: 12, startTime: new Date(future).toISOString(), durationMinutes: 90, preferredAreaId: 7, maxResults: 5, allowCombination: false, alternativeMode: 'AUTO', maxAlternatives: 4, maxShiftMinutes: 120 });
  assert.equal(localDateTime(new Date(future)), future);
  const walkIn = buildRecommendationRequest({ ...form, startTime: '', preferredAreaId: '' });
  assert.equal('startTime' in walkIn, false);
  assert.equal('preferredAreaId' in walkIn, false);
});

test('combination and alternative searches use the backend contract', () => {
  const request = buildRecommendationRequest(form, { combination: true, alternatives: true });
  assert.equal(request.allowCombination, true);
  assert.equal(request.maxResults, 10);
  assert.equal(request.alternativeMode, 'ALWAYS');
});

test('invalid numbers, dates and modes are rejected before sending', () => {
  for (const [key, value] of [['guestCount', 0], ['guestCount', 101], ['guestCount', 2.5], ['durationMinutes', 29], ['maxResults', 11], ['maxAlternatives', ''], ['maxShiftMinutes', 181], ['preferredAreaId', -1], ['alternativeMode', 'SOMETIMES'], ['startTime', 'bad'], ['startTime', '2000-01-01T00:00']]) {
    assert.throws(() => buildRecommendationRequest({ ...form, [key]: value }), undefined, `${key}=${value}`);
  }
});

test('optimization allows a 72-hour window and a zero-minute lock', () => {
  const request = buildOptimizationRequest({ windowStart: future, windowEnd: '2099-05-04T18:30', lockWindowMinutes: '0', maxMoves: '100', includeConfirmed: false });
  assert.equal(new Date(request.windowEnd) - new Date(request.windowStart), 72 * 3600000);
  assert.equal(request.lockWindowMinutes, 0);
  assert.equal(request.maxMoves, 100);
  assert.equal(request.includeConfirmed, false);
  for (const end of [future, '2099-05-01T18:00', '2099-05-04T18:31', 'invalid']) {
    assert.throws(() => buildOptimizationRequest({ windowStart: future, windowEnd: end, lockWindowMinutes: 60, maxMoves: 10 }));
  }
});

test('booking uses every recommended table and the selected alternative slot exactly', () => {
  const selection = { option: { tableIds: [4, 7, 9] }, partySize: 'LARGE', startTime: '2099-05-01T12:00:00Z', endTime: '2099-05-01T13:00:00Z' };
  assert.deepEqual(buildAllocationBooking(selection, 'Window please'), { partySize: 'LARGE', reservationType: 'TABLE', startTime: selection.startTime, endTime: selection.endTime, tableIds: [4, 7, 9], note: 'Window please' });
  assert.throws(() => buildAllocationBooking({ ...selection, startTime: '2000-01-01T00:00:00Z' }), /passed/);
  assert.throws(() => buildAllocationBooking({ ...selection, endTime: selection.startTime }), /invalid/);
  assert.throws(() => buildAllocationBooking({ ...selection, startTime: 'invalid' }), /invalid/);
  assert.throws(() => buildAllocationBooking({ ...selection, option: { tableIds: [] } }), /incomplete/);
});

test('role controls match backend preview, apply and booking permissions', () => {
  assert.deepEqual(allocationPermissions({ role: 'ROLE_CUSTOMER' }), { canRecommend: true, canPreview: false, canApply: false, canBook: true });
  assert.deepEqual(allocationPermissions({ role: 'STAFF' }), { canRecommend: true, canPreview: true, canApply: false, canBook: false });
  for (const role of ['ROLE_MANAGER', 'ROLE_ADMIN']) assert.deepEqual(allocationPermissions({ role }), { canRecommend: true, canPreview: true, canApply: true, canBook: false });
  assert.deepEqual(allocationPermissions(null), { canRecommend: false, canPreview: false, canApply: false, canBook: false });
  // Prefer JWT authorities when available, rather than granting more rights from the stored user object.
  const token = `x.${btoa(JSON.stringify({ permissions: ['ROLE_CUSTOMER'] }))}.x`;
  assert.equal(allocationPermissions({ role: 'ROLE_ADMIN' }, token).canApply, false);
});

test('validation, access and network failures have readable feedback', () => {
  assert.match(allocationError({ response: { status: 403 } }), /permission/);
  assert.match(allocationError({ code: 'ERR_NETWORK' }), /connect/);
  assert.match(allocationError({ code: 'ECONNABORTED' }), /too long/);
  assert.equal(allocationError({ response: { data: { message: { guestCount: 'Too many guests' } } } }), 'guestCount: Too many guests');
  assert.equal(allocationError({ response: { data: { message: ['A', { message: 'B' }] } } }), 'A; B');
});
