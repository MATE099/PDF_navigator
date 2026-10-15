import test from 'node:test';
import assert from 'node:assert/strict';

import { clampIndex, parseSentenceNumber } from '../modules/navigation.js';

test('clampIndex keeps indexes within the list', () => {
  assert.equal(clampIndex(-3, 10), 0);
  assert.equal(clampIndex(4, 10), 4);
  assert.equal(clampIndex(99, 10), 9);
});

test('clampIndex returns -1 for an empty list', () => {
  assert.equal(clampIndex(0, 0), -1);
});

test('parseSentenceNumber converts 1-based input to a 0-based index', () => {
  assert.equal(parseSentenceNumber('1', 5), 0);
  assert.equal(parseSentenceNumber(' 5 ', 5), 4);
});

test('parseSentenceNumber rejects out-of-range or non-numeric input', () => {
  assert.equal(parseSentenceNumber('0', 5), -1);
  assert.equal(parseSentenceNumber('6', 5), -1);
  assert.equal(parseSentenceNumber('abc', 5), -1);
  assert.equal(parseSentenceNumber('', 5), -1);
});
