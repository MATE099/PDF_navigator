import test from 'node:test';
import assert from 'node:assert/strict';

import { sanitizeSentence, splitIntoSentences } from '../modules/text-utils.js';

test('keeps abbreviations and decimals inside the same sentence', () => {
  const input = 'Dr. Smith wrote 3.14 in the report. It was correct.';

  assert.deepEqual(splitIntoSentences(input), [
    'Dr. Smith wrote 3.14 in the report.',
    'It was correct.'
  ]);
});

test('joins PDF-style hyphenated line breaks', () => {
  const input = 'This is a hyphen-\nated word in a PDF. Next sentence follows.';

  assert.deepEqual(splitIntoSentences(input), [
    'This is a hyphenated word in a PDF.',
    'Next sentence follows.'
  ]);
});

test('keeps wrapped lines in the same sentence', () => {
  const input = 'First line wraps\ninto the same sentence\nand keeps going. New sentence.';

  assert.deepEqual(splitIntoSentences(input), [
    'First line wraps into the same sentence and keeps going.',
    'New sentence.'
  ]);
});

test('respects paragraph breaks as stronger boundaries', () => {
  const input = 'First paragraph sentence.\n\nSecond paragraph begins here';

  assert.deepEqual(splitIntoSentences(input), [
    'First paragraph sentence.',
    'Second paragraph begins here'
  ]);
});

test('sanitizeSentence normalizes spacing around punctuation', () => {
  const input = '  Hello   ,  world !  ';

  assert.equal(sanitizeSentence(input), 'Hello, world!');
});
