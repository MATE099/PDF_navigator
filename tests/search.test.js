import test from 'node:test';
import assert from 'node:assert/strict';

import { findMatches, getNextMatch, splitByQuery } from '../modules/search.js';

const sentences = ['The cat sat.', 'A dog ran.', 'Cats sleep a lot.', 'Birds fly.'];

test('findMatches is case-insensitive and ignores surrounding spaces', () => {
  assert.deepEqual(findMatches(sentences, '  CAT '), [0, 2]);
});

test('findMatches returns nothing for an empty query', () => {
  assert.deepEqual(findMatches(sentences, ''), []);
  assert.deepEqual(findMatches(sentences, '   '), []);
});

test('getNextMatch moves forward and wraps around', () => {
  assert.equal(getNextMatch([1, 4, 7], 1, 1), 4);
  assert.equal(getNextMatch([1, 4, 7], 7, 1), 1);
  assert.equal(getNextMatch([1, 4, 7], -1, 1), 1);
});

test('getNextMatch moves backward and wraps around', () => {
  assert.equal(getNextMatch([1, 4, 7], 4, -1), 1);
  assert.equal(getNextMatch([1, 4, 7], 1, -1), 7);
});

test('getNextMatch returns -1 without matches', () => {
  assert.equal(getNextMatch([], 3, 1), -1);
});

test('splitByQuery marks every occurrence while keeping original casing', () => {
  assert.deepEqual(splitByQuery('Cat and cat', 'cat'), [
    { text: 'Cat', match: true },
    { text: ' and ', match: false },
    { text: 'cat', match: true }
  ]);
});

test('splitByQuery returns the whole text when the query is empty', () => {
  assert.deepEqual(splitByQuery('Hello', ''), [{ text: 'Hello', match: false }]);
});
