'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { lookupAll, AGENCIES } = require('../src/providers');

test('every agency has valid metadata', () => {
  const ids = new Set();
  for (const a of AGENCIES) {
    assert.ok(!ids.has(a.id), `duplicate id ${a.id}`); ids.add(a.id);
    assert.match(a.url, /^https:\/\//);
    assert.ok(a.states.length > 0);
  }
});

test('without demo, every agency is manual and total is 0', async () => {
  const r = await lookupAll('ABC1234', 'NY');
  assert.strictEqual(r.totalDue, 0);
  assert.strictEqual(r.summary.manual, AGENCIES.length);
  assert.ok(r.results[0].homeState, 'home-state agencies come first');
});

test('demo mode is deterministic and totals add up', async () => {
  const a = await lookupAll('ABC1234', 'TX', { demo: true });
  const b = await lookupAll('ABC1234', 'TX', { demo: true });
  assert.deepStrictEqual(a.results.map((r) => r.due), b.results.map((r) => r.due));
  const sum = a.results.reduce((s, r) => s + (r.due || 0), 0);
  assert.ok(Math.abs(sum - a.totalDue) < 0.01);
  for (const r of a.results) for (const t of r.tolls) assert.strictEqual(t.demo, true);
});

test('custom lookup functions are used, and failures become errors', async () => {
  const agencies = [
    { id: 'live', name: 'Live', network: 'X', states: ['NY'], url: 'https://x.test', lookup: async () => ({ status: 'found', tolls: [{ amount: 2.5, fees: 1 }] }) },
    { id: 'broken', name: 'Broken', network: 'X', states: ['NY'], url: 'https://y.test', lookup: async () => { throw new Error('boom'); } },
  ];
  const r = await lookupAll('ABC', 'NY', { agencies });
  assert.strictEqual(r.totalDue, 3.5);
  assert.strictEqual(r.results.find((x) => x.agencyId === 'broken').status, 'error');
});
