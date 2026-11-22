'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { normalizePlate, normalizeState } = require('../src/states');

test('normalizePlate strips separators and uppercases', () => {
  assert.strictEqual(normalizePlate(' abc-12 34 '), 'ABC1234');
  assert.strictEqual(normalizePlate('7xyz.890'), '7XYZ890');
});
test('normalizePlate rejects bad input', () => {
  for (const bad of ['', '   ', 'ABCDEFGHI', 'AB$12', null, 42, undefined]) assert.strictEqual(normalizePlate(bad), null);
});
test('normalizeState', () => {
  assert.strictEqual(normalizeState('ny'), 'NY');
  assert.strictEqual(normalizeState('DC'), 'DC');
  assert.strictEqual(normalizeState('XX'), null);
  assert.strictEqual(normalizeState('toString'), null);
});
