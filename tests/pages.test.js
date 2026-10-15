import test from 'node:test';
import assert from 'node:assert/strict';

import { splitPagesIntoSentences } from '../modules/text-utils.js';

test('tags every sentence with its 1-based page number', () => {
  assert.deepEqual(splitPagesIntoSentences(['First one. Second one.', 'Third one.']), [
    { text: 'First one.', page: 1 },
    { text: 'Second one.', page: 1 },
    { text: 'Third one.', page: 2 }
  ]);
});

test('joins a sentence that continues onto the next page', () => {
  assert.deepEqual(splitPagesIntoSentences(['The results were', 'very clear. Next point.']), [
    { text: 'The results were very clear.', page: 1 },
    { text: 'Next point.', page: 2 }
  ]);
});

test('does not join when the next page starts a new sentence', () => {
  assert.deepEqual(splitPagesIntoSentences(['Chapter One', 'Introduction text.']), [
    { text: 'Chapter One', page: 1 },
    { text: 'Introduction text.', page: 2 }
  ]);
});

test('skips empty pages without breaking page numbers', () => {
  assert.deepEqual(splitPagesIntoSentences(['Intro.', '', 'Last page.']), [
    { text: 'Intro.', page: 1 },
    { text: 'Last page.', page: 3 }
  ]);
});

test('returns an empty list for no pages', () => {
  assert.deepEqual(splitPagesIntoSentences([]), []);
  assert.deepEqual(splitPagesIntoSentences(undefined), []);
});
