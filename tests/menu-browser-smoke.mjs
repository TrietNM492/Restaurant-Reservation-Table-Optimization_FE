// Run with: node tests/menu-browser-smoke.mjs
// Uses installed Chrome and built-in Node APIs. All API requests use in-memory fixtures.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import assert from 'node:assert/strict';

const origin = 'http://127.0.0.1:4175';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = await mkdtemp(join(tmpdir(), 'menu-smoke-'));
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], { stdio: 'ignore' });
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9227', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
let socket;
let sequence = 0;
const pending = new Map();
const requests = [];
const exceptions = [];
let failBrowse = false;
const screenshot = async (name) => {
  await mkdir('test-output', { recursive: true });
  const { cssContentSize } = await send('Page.getLayoutMetrics');
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: cssContentSize.width, height: Math.min(cssContentSize.height, 2600), scale: 1 } });
  await writeFile(join('test-output', name), Buffer.from(result.data, 'base64'));
};
const categories = [{ id: 1, code: 'MAIN', name: 'Main course', itemCount: 2, description: null }];
const items = [
  { id: 1, categoryId: 1, categoryName: 'Main course', itemName: 'Seafood rice', price: 89000, estimatedPrepMinutes: 15, status: 'AVAILABLE', originId: 1, originMadeIn: 'Vietnam' },
  { id: 2, categoryId: 1, categoryName: 'Main course', itemName: 'Sold out noodles', price: 75000, estimatedPrepMinutes: 10, status: 'OUT_OF_STOCK' },
];
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
async function until(expression, label) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await delay(100);
  }
  throw new Error(`Timed out: ${label}\n${await evaluate('document.body.innerText')}\nDialogs: ${await evaluate('Array.from(document.querySelectorAll("[role=dialog], .MuiDialog-paper")).map(x => x.outerHTML.slice(0, 1400)).join("\\n")')}\nExceptions: ${exceptions.join('\n')}`);
}
async function click(text, scope = 'document') {
  const expression = `Array.from(${scope}.querySelectorAll('button,a')).find(x => x.textContent.trim() === ${JSON.stringify(text)})`;
  await until(`Boolean(${expression})`, `button ${text}`);
  await evaluate(`${expression}.click()`);
}
async function fill(label, value) {
  await until(`Array.from(document.querySelectorAll('label')).some(x => x.textContent.trim() === ${JSON.stringify(label)} && document.getElementById(x.htmlFor))`, `input ${label}`);
  const expression = `(() => { const label = Array.from(document.querySelectorAll('label')).find(x => x.textContent.trim() === ${JSON.stringify(label)}); const input = document.getElementById(label.htmlFor); Object.getOwnPropertyDescriptor(input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); })()`;
  await evaluate(expression);
}
async function go(path) {
  await send('Page.navigate', { url: `${origin}${path}` });
  await until('document.readyState === "complete"', 'page load');
}
const pageResult = (rows, params, defaultPage = 0) => {
  const page = Number(params.get('page') ?? defaultPage);
  const size = Number(params.get('size') ?? 10);
  return { meta: { page: defaultPage === 0 ? page + 1 : page, pageSize: size, pages: 1, total: rows.length, hasNext: false, hasPrevious: false }, result: rows };
};
async function fixture(event) {
  const { requestId, request } = event;
  const url = new URL(request.url);
  requests.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), method: request.method, authorization: request.headers.Authorization, body: request.postData ? JSON.parse(request.postData) : null });
  const last = requests.at(-1);
  let result;
  let status = 200;
  const path = url.pathname.replace('/api/v1', '');
  if (request.method === 'OPTIONS') {
    result = null;
  } else if (path === '/menus/categories') result = categories.map((category) => ({ ...category, itemCount: items.filter((item) => item.categoryId === category.id && item.status !== 'ARCHIVED').length })).filter((category) => category.itemCount > 0);
  else if (path === '/menus' && failBrowse) { status = 503; result = null; }
  else if (path === '/menus') {
    let rows = items.filter((item) => item.status !== 'ARCHIVED');
    if (url.searchParams.get('q')) rows = rows.filter((item) => item.itemName.toLowerCase().includes(url.searchParams.get('q').toLowerCase()));
    result = pageResult(rows.map((item) => ({ ...item, available: item.status === 'AVAILABLE' })), url.searchParams, 1);
  } else if (/^\/menus\/\d+$/.test(path)) {
    const item = items.find((entry) => entry.id === Number(path.split('/').at(-1)) && entry.status !== 'ARCHIVED');
    if (item) result = { ...item, available: item.status === 'AVAILABLE' }; else { status = 404; result = { message: 'Not found' }; }
  } else if (path.startsWith('/admin/menu-category')) {
    const id = Number(path.split('/')[3]);
    if (request.method === 'POST') { result = { ...last.body, id: 3, itemCount: 0 }; categories.push(result); status = 201; }
    else if (request.method === 'PUT') { const index = categories.findIndex((category) => category.id === id); categories[index] = { ...categories[index], ...last.body }; result = categories[index]; }
    else if (request.method === 'DELETE') { categories.splice(categories.findIndex((category) => category.id === id), 1); status = 204; }
    else result = id ? categories.find((category) => category.id === id) : pageResult(categories, url.searchParams);
  } else if (path.startsWith('/admin/menu-item')) {
    const id = Number(path.split('/')[3]);
    if (request.method === 'POST') { result = { ...last.body, id: 3, categoryName: categories.find((category) => category.id === last.body.categoryId)?.name }; items.push(result); status = 201; }
    else if (request.method === 'PUT' || request.method === 'PATCH') { const item = items.find((entry) => entry.id === id); Object.assign(item, last.body); result = item; }
    else if (request.method === 'DELETE') { items.find((item) => item.id === id).status = 'ARCHIVED'; status = 204; }
    else result = id ? items.find((item) => item.id === id) : pageResult(items, url.searchParams);
  } else { status = 404; result = { message: `Unmocked API: ${path}` }; }
  await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [
    { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin },
    { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'authorization, content-type' },
    { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
  ], body: Buffer.from(status === 204 ? '' : JSON.stringify({ statusCode: status, data: result, message: 'OK' })).toString('base64') });
}

try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { await fetch(origin); await fetch('http://127.0.0.1:9227/json/version'); break; } catch { await delay(100); }
  }
  const target = await (await fetch('http://127.0.0.1:9227/json/new', { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  socket.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data);
    if (event.id) { const promise = pending.get(event.id); pending.delete(event.id); if (event.error) promise?.reject(new Error(event.error.message)); else promise?.resolve(event.result); }
    else if (event.method === 'Fetch.requestPaused') fixture(event.params).catch((error) => exceptions.push(error.message));
    else if (event.method === 'Runtime.exceptionThrown') exceptions.push(event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*localhost:8080/api/v1/*' }] });
  const token = `x.${Buffer.from(JSON.stringify({ permissions: ['ROLE_ADMIN'] })).toString('base64url')}.x`;
  const authScript = await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('restaurant-auth', ${JSON.stringify(JSON.stringify({ accessToken: token, user: { role: 'ROLE_ADMIN', name: 'Menu Admin' } }))})` });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  await go('/admin/menu-categories');
  await until('document.body.innerText.includes("Main course")', 'categories list');
  assert.ok(requests.some((request) => request.path.endsWith('/admin/menu-category') && request.query.page === '0'));
  await click('Add category'); await fill('Category code', 'DRINKS'); await fill('Category name', 'Drinks'); await click('Save changes');
  await until('document.body.innerText.includes("Category created successfully.")', 'category create');
  assert.equal(categories.at(-1).code, 'DRINKS');
  await click('Edit', 'Array.from(document.querySelectorAll("tr")).find(x => x.textContent.includes("Drinks"))');
  await until('document.querySelector(".MuiDialog-paper")?.innerText.includes("Edit category")', 'category edit');
  await fill('Category name', 'Beverages'); await click('Save changes');
  await until('document.body.innerText.includes("Category updated successfully.")', 'category update');
  assert.equal(categories.at(-1).name, 'Beverages');
  assert.equal(await evaluate('Array.from(document.querySelectorAll("tr")).find(x => x.textContent.includes("Main course")).querySelectorAll("button")[1].disabled'), true);
  await click('Delete', 'Array.from(document.querySelectorAll("tr")).find(x => x.textContent.includes("Beverages"))'); await click('Confirm');
  await until('!document.querySelector(".MuiDialog-paper")', 'category delete');
  assert.equal(categories.length, 1);
  console.log('PASS category create/update/delete, nonempty deletion disabled, zero-based pagination');

  await go('/admin/menu-items');
  await until('document.body.innerText.includes("Seafood rice")', 'items list');
  await screenshot('menu-admin.png');
  await click('Edit');
  await until('document.querySelector(".MuiDialog-paper")?.innerText.includes("Edit menu item") && document.querySelector("input[name=price]")', 'item edit');
  await fill('Price (VND)', '95000'); await click('Save changes');
  await until('document.body.innerText.includes("Menu item updated successfully.")', 'item update');
  assert.equal(items[0].price, 95000); assert.equal(items[0].originId, 1);
  await click('Add item');
  await until('document.querySelector(".MuiDialog-paper")?.innerText.includes("Category")', 'item editor');
  await evaluate('document.querySelector(".MuiDialog-paper [role=combobox]").dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }))');
  await until('Array.from(document.querySelectorAll("[role=option]")).some(x => x.textContent === "Main course")', 'category selector');
  await evaluate('Array.from(document.querySelectorAll("[role=option]")).find(x => x.textContent === "Main course").click()');
  await fill('Item name', 'Test dish'); await fill('Price (VND)', '0'); await fill('Preparation time (minutes)', '0'); await click('Save changes');
  await until('document.body.innerText.includes("Menu item created successfully.")', 'item create');
  assert.equal(items.at(-1).price, 0); assert.equal(items.at(-1).categoryId, 1); assert.equal(items.at(-1).estimatedPrepMinutes, 0);
  await click('Archive'); await click('Confirm');
  await until('document.body.innerText.includes("Restore")', 'archive');
  await click('Restore'); await click('Confirm');
  await until('!document.querySelector(".MuiDialog-paper")', 'restore');
  assert.equal(items[0].status, 'AVAILABLE');
  console.log('PASS item create, selector, zero values, archive and restore');

  await go('/menus');
  await until('document.body.innerText.includes("Sold out noodles")', 'public menu');
  await screenshot('menu-desktop.png');
  assert.ok(requests.some((request) => request.path.endsWith('/menus') && request.query.page === '1'));
  assert.ok(requests.filter((request) => request.path.includes('/menus') && request.method === 'GET').every((request) => !request.authorization));
  const browseRequests = requests.filter((request) => request.path.endsWith('/menus')).length;
  await fill('Min price (VND)', '100'); await fill('Max price (VND)', '50'); await click('Search');
  await until('document.body.innerText.includes("Maximum must be at least the minimum.")', 'price validation');
  assert.equal(requests.filter((request) => request.path.endsWith('/menus')).length, browseRequests);
  await fill('Min price (VND)', ''); await fill('Max price (VND)', '');
  await fill('Search dishes', 'rice'); await click('Search');
  await until('location.search.includes("q=rice") && !document.body.innerText.includes("Sold out noodles") && Array.from(document.querySelectorAll("a")).some(x => x.textContent.includes("Seafood rice"))', 'search');
  await evaluate('Array.from(document.querySelectorAll("a")).find(x => x.textContent.includes("Seafood rice")).click()');
  await until('document.querySelector(".MuiDialog-paper")?.innerText.includes("Estimated preparation: 15 minutes")', 'dish detail');
  await click('Back to menu');
  await until('!document.querySelector(".MuiDialog-paper") && location.search.includes("q=rice")', 'preserve filters');
  await go('/menus/999');
  await until('document.body.innerText.includes("This record no longer exists")', 'hidden dish error');
  console.log('PASS public browsing, sold-out display, search, detail, URL preservation, 404');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await go('/menus'); await until('document.body.innerText.includes("Sold out noodles")', 'mobile menu');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'mobile page should not overflow');
  await screenshot('menu-mobile.png');
  failBrowse = true;
  await go('/menus'); await until('document.body.innerText.includes("The server could not complete this request")', 'API error');
  failBrowse = false; await click('Retry'); await until('document.body.innerText.includes("Seafood rice")', 'retry');
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: authScript.identifier });
  await evaluate('localStorage.removeItem("restaurant-auth")');
  await go('/admin/menu-items'); await until('location.pathname === "/login"', 'guest admin redirect');
  await go('/menus'); await until('document.body.innerText.includes("Seafood rice")', 'guest browsing');
  const customerToken = `x.${Buffer.from(JSON.stringify({ permissions: ['ROLE_CUSTOMER'] })).toString('base64url')}.x`;
  await evaluate(`localStorage.setItem('restaurant-auth', ${JSON.stringify(JSON.stringify({ accessToken: customerToken, user: { role: 'ROLE_CUSTOMER' } }))})`);
  await go('/admin/menu-items'); await until('document.body.innerText.includes("Administrator access is required")', 'customer forbidden');
  assert.deepEqual(exceptions, []);
  console.log('PASS mobile layout, price validation, API error/retry, guest browsing, auth guards, no runtime exceptions');
} finally {
  socket?.close(); chrome.kill(); vite.kill();
  await delay(500);
  const profileRelativeToTemp = relative(resolve(tmpdir()), resolve(profile));
  if (profileRelativeToTemp.startsWith('menu-smoke-') && !profileRelativeToTemp.includes('..')) {
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
