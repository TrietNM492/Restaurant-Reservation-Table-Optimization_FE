import test from 'node:test';
import assert from 'node:assert/strict';
import { applyMenuFieldErrors, categoryBody, itemBody, menuError, readBrowseParams } from '../src/utils/menuUtils.js';

test('category payload normalizes code and explicitly clears optional fields', () => {
  assert.deepEqual(categoryBody({ code: ' main ', name: ' Món chính ', description: ' ', menuPicture: '', menuQr: ' qr ' }), { code: 'MAIN', name: 'Món chính', description: null, menuPicture: null, menuQr: 'qr' });
});
test('item payload preserves zero price and zero preparation time', () => {
  assert.deepEqual(itemBody({ categoryId: '3', itemName: ' Rice ', price: '0', description: '', itemPicture: '', estimatedPrepMinutes: '0', originId: '', status: 'OUT_OF_STOCK' }), { categoryId: 3, itemName: 'Rice', price: 0, description: null, itemPicture: null, estimatedPrepMinutes: 0, originId: null, status: 'OUT_OF_STOCK' });
});
test('empty optional preparation and origin are cleared on update', () => {
  const result = itemBody({ categoryId: 3, itemName: 'Rice', price: 10, estimatedPrepMinutes: '', originId: '', status: 'ARCHIVED' });
  assert.equal(result.estimatedPrepMinutes, null);
  assert.equal(result.originId, null);
  assert.equal(result.status, 'ARCHIVED');
});
test('public URL uses one-based pages, caps size and rejects unsafe query values', () => {
  assert.deepEqual(readBrowseParams(new URLSearchParams('page=0&size=500&sort=bad&q=%20rice%20&categoryId=-2&minPrice=-1&maxPrice=Infinity')), { page: 1, size: 50, sort: 'name', q: 'rice' });
  assert.deepEqual(readBrowseParams(new URLSearchParams('page=2&size=24&sort=price_desc&categoryId=3&minPrice=0&maxPrice=100000')), { page: 2, size: 24, sort: 'price_desc', categoryId: 3, minPrice: 0, maxPrice: 100000 });
});
test('validation errors are mapped to fields and shown as readable text', () => {
  const error = { response: { status: 400, data: { message: { itemName: 'Name required', price: 'Price invalid' } } } };
  const fields = [];
  applyMenuFieldErrors(error, (...args) => fields.push(args));
  assert.equal(fields[0][0], 'itemName');
  assert.equal(fields[1][1].message, 'Price invalid');
  assert.equal(menuError(error), 'Name required Price invalid');
});
test('authorization, hidden items, conflicts and server failures have messages', () => {
  assert.match(menuError({ response: { status: 403 } }), /administrator/);
  assert.match(menuError({ response: { status: 404 } }), /no longer/);
  assert.equal(menuError({ response: { status: 409, data: { message: 'Duplicate code' } } }), 'Duplicate code');
  assert.match(menuError({ response: { status: 500 } }), /server/);
});
