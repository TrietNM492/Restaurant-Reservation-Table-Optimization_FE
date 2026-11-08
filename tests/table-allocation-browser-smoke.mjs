// npm run test:allocation:browser
// Follows the existing menu smoke test: installed headless Chrome, Node CDP, in-memory API fixtures.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import assert from 'node:assert/strict';

const origin = 'http://127.0.0.1:4176';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = await mkdtemp(join(tmpdir(), 'allocation-smoke-'));
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4176', '--strictPort'], { stdio: 'ignore', windowsHide: true });
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9228', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
let socket;
let authScript;
let sequence = 0;
let failRecommend = false;
let failApply = false;
let failBooking = false;
const pending = new Map();
const requests = [];
const exceptions = [];
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression, label) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await delay(100);
  }
  throw new Error(`Timed out: ${label}\n${await evaluate('document.body.innerText')}\n${exceptions.join('\n')}`);
}
async function click(text) {
  const target = `Array.from(document.querySelectorAll('button,a')).find(x => x.textContent.trim() === ${JSON.stringify(text)} && !x.disabled)`;
  await until(target, `button ${text}`);
  await evaluate(`${target}.click()`);
}
async function fill(name, value) {
  const target = `document.querySelector('[name="${name}"]')`;
  await until(target, `field ${name}`);
  await evaluate(`(() => { const input = ${target}; Object.getOwnPropertyDescriptor(input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(String(value))}); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); })()`);
}
async function go(path) {
  await send('Page.navigate', { url: `${origin}${path}` });
  await until('document.readyState === "complete"', 'page loaded');
}
async function role(name) {
  if (authScript) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: authScript.identifier });
  const token = `x.${Buffer.from(JSON.stringify({ permissions: [`ROLE_${name}`] })).toString('base64url')}.x`;
  const source = name ? `localStorage.setItem('restaurant-auth', ${JSON.stringify(JSON.stringify({ accessToken: token, user: { id: 1, role: `ROLE_${name}`, name: `${name} Test` } }))})` : 'localStorage.removeItem("restaurant-auth")';
  authScript = await send('Page.addScriptToEvaluateOnNewDocument', { source });
  if (await evaluate('location.origin') === origin) await evaluate(source);
}
async function screenshot(name) {
  await mkdir('test-output', { recursive: true });
  const { cssContentSize } = await send('Page.getLayoutMetrics');
  const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: cssContentSize.width, height: Math.min(cssContentSize.height, 2600), scale: 1 } });
  await writeFile(join('test-output', name), Buffer.from(image.data, 'base64'));
}
const tables = [
  { id: 1, tableNumber: 11, capacity: 6, areaId: 7, areaCode: 'GARDEN', areaName: 'GARDEN', status: 'AVAILABLE' },
  { id: 2, tableNumber: 12, capacity: 6, areaId: 7, areaCode: 'GARDEN', areaName: 'GARDEN', status: 'AVAILABLE' },
];
function option(combination = false) {
  return { rank: 1, type: combination ? 'TABLE_COMBINATION' : 'SINGLE_TABLE', tableIds: combination ? [1, 2] : [1], tables: combination ? tables : [tables[0]], totalCapacity: combination ? 12 : 6, spareSeats: 2, score: 82.6, scoreBreakdown: { capacityFit: .73, schedulePacking: 1, areaMatch: null }, reasons: ['Available throughout the requested slot', 'Keeps the schedule compact'] };
}
function recommendation(body, alternatives) {
  const start = body.startTime || new Date(Date.now() + 3600000).toISOString();
  const end = new Date(new Date(start).getTime() + body.durationMinutes * 60000).toISOString();
  return { guestCount: body.guestCount, suggestedPartySize: body.guestCount > 8 ? 'LARGE' : 'SMALL', startTime: start, endTime: end, durationMinutes: body.durationMinutes, availableTableCount: 8, recommendations: [option(body.guestCount > 6)], message: 'Ranked allocations for your request.', alternatives: alternatives ? [{ rank: 1, type: 'LATER_START', startTime: new Date(new Date(start).getTime() + 30 * 60000).toISOString(), endTime: new Date(new Date(end).getTime() + 30 * 60000).toISOString(), durationMinutes: body.durationMinutes, shiftMinutes: 30, durationChangeMinutes: 0, convenienceScore: 90, score: 88.5, explanation: 'Starts 30 minutes later than requested', recommendation: option(true) }] : [] };
}
function optimization(body, applied) {
  const before = { reservations: 3, requiredSeats: 10, assignedSeats: 18, wastedSeats: 8, seatUtilizationPercent: 55.6, idleGaps: 2, multiTableReservations: 1 };
  return { ...body, applied, reservationsInScope: 3, movableReservations: 2, before, after: { ...before, assignedSeats: 12, wastedSeats: 2, seatUtilizationPercent: 83.3, idleGaps: 0 }, movesCount: 1, moves: [{ reservationId: 21, reservationNo: 'RES-TEST-21', reservationStatus: 'PENDING', partySize: 'SMALL', requiredSeats: 4, startTime: body.windowStart, endTime: body.windowEnd, fromTables: tables, toTables: [tables[0]], wastedSeatsBefore: 8, wastedSeatsAfter: 2, reason: 'Reduce unused seats' }], message: applied ? 'Optimization applied successfully.' : 'Preview ready. No changes saved.' };
}
async function fixture({ requestId, request }) {
  const path = new URL(request.url).pathname.replace('/api/v1', '');
  const body = request.postData ? JSON.parse(request.postData) : null;
  requests.push({ path, body, method: request.method, authorization: request.headers.Authorization });
  let status = 200;
  let data;
  if (request.method === 'OPTIONS') data = null;
  else if (path === '/tables/floor-plan') data = [{ areaId: 7, areaCode: 'GARDEN', areaName: 'Garden', tables }];
  else if (path.startsWith('/tables/recommendations')) {
    if (failRecommend) { status = 503; data = { message: 'Allocation temporarily unavailable' }; }
    else data = recommendation(body, path.endsWith('/alternatives') || body.alternativeMode === 'ALWAYS');
  } else if (path.endsWith('/allocation-optimization/preview')) data = optimization(body, false);
  else if (path.endsWith('/allocation-optimization/apply')) {
    if (failApply) { status = 409; data = { message: 'Reservations changed; preview again' }; }
    else data = optimization(body, true);
  } else if (path === '/reservations') {
    if (failBooking) { status = 409; data = { message: 'Table is already reserved during this slot' }; }
    else { status = 201; data = { reservationNo: 'RES-BOOKED-01', ...body }; }
  } else { status = 404; data = { message: `Unmocked request: ${path}` }; }
  await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [
    { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin },
    { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'authorization, content-type' },
    { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
  ], body: Buffer.from(JSON.stringify(status >= 400 ? data : { statusCode: status, data })).toString('base64') });
}
const count = (path) => requests.filter((request) => request.method === 'POST' && request.path === path).length;

try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { await fetch(origin); await fetch('http://127.0.0.1:9228/json/version'); break; } catch { await delay(100); }
  }
  const target = await (await fetch('http://127.0.0.1:9228/json/new', { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  socket.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data);
    if (event.id) { const entry = pending.get(event.id); pending.delete(event.id); if (event.error) entry?.reject(new Error(event.error.message)); else entry?.resolve(event.result); }
    else if (event.method === 'Fetch.requestPaused') fixture(event.params).catch((error) => exceptions.push(error.message));
    else if (event.method === 'Runtime.exceptionThrown') exceptions.push(event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*localhost:8080/api/v1/*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await role('ADMIN');
  await go('/admin/table-allocation');
  await until('document.querySelector("input[name=guestCount]")', 'recommendation form');
  failRecommend = true; await click('Recommend tables');
  await until('document.body.innerText.includes("Allocation temporarily unavailable")', 'API failure');
  failRecommend = false; await click('Recommend tables');
  await until('document.body.innerText.includes("Recommended allocations")', 'recommendations');
  assert.equal(requests.findLast((request) => request.path === '/tables/recommendations').body.guestCount, 4);
  await click('View details'); await until('document.querySelector(".MuiDialog-paper")?.innerText.includes("Capacity fit")', 'details'); await click('Close details');
  await fill('guestCount', '10');
  await until('!document.body.innerText.includes("Recommended allocations")', 'invalidate result after edit');
  await click('Recommend tables'); await until('document.body.innerText.includes("Table #11 + Table #12")', 'combination result');
  await screenshot('allocation-desktop.png');
  await click('Alternative Recommendation'); await click('Find alternatives');
  await until('document.body.innerText.includes("Starts 30 minutes later")', 'alternatives');
  await click('View alternative details'); await until('document.querySelector(".MuiDialog-paper")', 'alternative details'); await click('Close details');
  assert.equal(count('/reservations'), 0);
  console.log('PASS recommendation error/retry, combinations, details, alternative endpoint, result invalidation');

  await click('Allocation Optimization'); await click('Preview optimization');
  await until('document.body.innerText.includes("RES-TEST-21")', 'preview moves');
  await screenshot('optimization-desktop.png');
  await click('Apply optimization'); await click('Cancel');
  assert.equal(count('/tables/allocation-optimization/apply'), 0);
  await fill('maxMoves', '3'); await until('!document.body.innerText.includes("RES-TEST-21")', 'invalidate preview');
  await click('Preview optimization'); await until('document.body.innerText.includes("RES-TEST-21")', 'new preview');
  failApply = true; await click('Apply optimization'); await click('Confirm optimization');
  await until('document.body.innerText.includes("Reservations changed; preview again") && !document.querySelector(".MuiDialog-paper")', 'apply conflict');
  assert.equal(await evaluate('Array.from(document.querySelectorAll("button")).some(x => x.textContent === "Apply optimization")'), false);
  failApply = false; await click('Preview optimization'); await until('document.body.innerText.includes("RES-TEST-21")', 'preview after conflict');
  await click('Apply optimization'); await click('Confirm optimization');
  await until('document.body.innerText.includes("Optimization applied successfully.")', 'applied result');
  assert.equal(requests.findLast((request) => request.path.endsWith('/apply')).body.maxMoves, 3);
  console.log('PASS preview, before/after, cancel, stale-plan invalidation, apply conflict and successful apply');

  await role('STAFF'); await go('/admin/table-allocation?view=optimization'); await click('Preview optimization');
  await until('document.body.innerText.includes("RES-TEST-21")', 'staff preview');
  assert.equal(await evaluate('Array.from(document.querySelectorAll("button")).some(x => x.textContent === "Apply optimization")'), false);
  await role('CUSTOMER'); await go('/admin/table-allocation');
  await until('document.body.innerText.includes("This workspace is available to STAFF")', 'customer staff-workspace gate');
  await go('/tables/combinations?view=scoring'); await click('Find combinations');
  await until('document.body.innerText.includes("Capacity fit")', 'combination scores');
  const combinationRequest = requests.findLast((request) => request.path === '/tables/recommendations');
  assert.equal(combinationRequest.body.allowCombination, true); assert.equal(combinationRequest.body.maxResults, 10);
  await screenshot('combination-scoring-desktop.png');
  await click('Review & book'); await fill('note', 'Window please');
  failBooking = true; await click('Confirm booking'); await until('document.body.innerText.includes("Table is already reserved")', 'booking conflict');
  failBooking = false; await click('Confirm booking');
  await until('document.body.innerText.includes("RES-BOOKED-01") && !document.querySelector(".MuiDialog-paper")', 'booking success');
  const booking = requests.findLast((request) => request.path === '/reservations').body;
  assert.deepEqual(booking.tableIds, [1, 2]); assert.equal(booking.note, 'Window please'); assert.equal(booking.partySize, 'LARGE'); assert.equal(booking.startTime, combinationRequest.body.startTime);
  await go('/tables/recommendations?view=alternatives'); await click('Find alternatives');
  await until('document.body.innerText.includes("Starts 30 minutes later")', 'customer alternatives');
  const originalSlot = requests.findLast((request) => request.path.endsWith('/alternatives')).body.startTime;
  await click('Review alternative & book'); await click('Confirm booking');
  await until('document.body.innerText.includes("RES-BOOKED-01")', 'alternative booked');
  assert.equal(new Date(requests.findLast((request) => request.path === '/reservations').body.startTime) - new Date(originalSlot), 30 * 60000);
  console.log('PASS staff/customer permissions, combination scoring, all-table booking, conflict/retry, alternative time payload');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await go('/tables/combinations'); await click('Find combinations'); await until('document.body.innerText.includes("Table #11 + Table #12")', 'mobile combinations');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'mobile page overflow');
  await screenshot('allocation-mobile.png');
  await role('ADMIN'); await go('/admin/table-allocation?view=optimization'); await click('Preview optimization');
  await until('document.body.innerText.includes("RES-TEST-21")', 'mobile optimization');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'mobile optimization overflow');
  await screenshot('optimization-mobile.png');
  await role(null); await go('/tables/recommendations'); await until('location.pathname === "/login"', 'guest redirect');
  assert.deepEqual(exceptions, []);
  console.log('PASS mobile layouts, guest redirect, no runtime exceptions');
} finally {
  socket?.close(); chrome.kill(); vite.kill();
  await delay(500);
  const target = resolve(profile);
  const profileRelative = relative(resolve(tmpdir()), target);
  if (profileRelative.startsWith('allocation-smoke-') && !profileRelative.includes('..')) await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
