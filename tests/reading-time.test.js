import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MIN_AUTO_PLAY_DELAY_MS,
  buildRemainingWordCounts,
  countWords,
  estimateMinutes,
  formatDuration,
  getAutoPlayDelay
} from '../modules/text-utils.js';

test('getAutoPlayDelay scales with sentence length', () => {
  const twentyWords = Array.from({ length: 20 }, () => 'word').join(' ');
  assert.equal(getAutoPlayDelay(twentyWords, 200), 6000);
});

test('getAutoPlayDelay never goes below the minimum delay', () => {
  assert.equal(getAutoPlayDelay('Hi.', 200), MIN_AUTO_PLAY_DELAY_MS);
  assert.equal(getAutoPlayDelay('', 200), MIN_AUTO_PLAY_DELAY_MS);
});

test('countWords counts whitespace-separated words', () => {
  assert.equal(countWords('One two  three\nfour'), 4);
  assert.equal(countWords('   '), 0);
  assert.equal(countWords(undefined), 0);
});

test('buildRemainingWordCounts sums words from each index to the end', () => {
  assert.deepEqual(buildRemainingWordCounts(['a b', 'c', 'd e f']), [6, 4, 3, 0]);
  assert.deepEqual(buildRemainingWordCounts([]), [0]);
});

test('estimateMinutes divides words by reading speed', () => {
  assert.equal(estimateMinutes(400, 200), 2);
  assert.equal(estimateMinutes(0), 0);
});

test('formatDuration produces short human-readable labels', () => {
  assert.equal(formatDuration(0), '0 min');
  assert.equal(formatDuration(0.4), '<1 min');
  assert.equal(formatDuration(12.4), '12 min');
  assert.equal(formatDuration(60), '1 h');
  assert.equal(formatDuration(95), '1 h 35 min');
});
