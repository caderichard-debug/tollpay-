'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { createServer } = require('../server');

test('API endpoints', async (t) => {
  const server = createServer().listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(() => server.close());

  const post = (body) => fetch(`${base}/api/lookup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  const ok = await post({ plate: 'abc 123', state: 'fl' });
  assert.strictEqual(ok.status, 200);
  const data = await ok.json();
  assert.strictEqual(data.plate, 'ABC123');
  assert.strictEqual(data.state, 'FL');

  assert.strictEqual((await post({ plate: '!!', state: 'FL' })).status, 400);
  assert.strictEqual((await post({ plate: 'ABC', state: 'ZZ' })).status, 400);
  assert.strictEqual((await fetch(`${base}/api/lookup`)).status, 405);

  const page = await fetch(base);
  assert.strictEqual(page.status, 200);
  assert.ok(page.headers.get('content-security-policy'));
  assert.strictEqual((await fetch(`${base}/..%2fserver.js`)).status, 403);
});
