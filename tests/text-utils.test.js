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

test('splits on question and exclamation marks', () => {
  assert.deepEqual(splitIntoSentences('Is it done? Yes! Great.'), ['Is it done?', 'Yes!', 'Great.']);
});

test('keeps closing quotes and brackets with their sentence', () => {
  assert.deepEqual(splitIntoSentences('He said "Hi." Then left.'), ['He said "Hi."', 'Then left.']);
  assert.deepEqual(splitIntoSentences('Prices rose (see Table 2.) Then fell.'), [
    'Prices rose (see Table 2.)',
    'Then fell.'
  ]);
});

test('does not split on academic abbreviations', () => {
  assert.deepEqual(splitIntoSentences('Smith et al. found it. Others agreed.'), [
    'Smith et al. found it.',
    'Others agreed.'
  ]);
  assert.deepEqual(splitIntoSentences('See Fig. 3 for details. Next one.'), [
    'See Fig. 3 for details.',
    'Next one.'
  ]);
  assert.deepEqual(splitIntoSentences('Use tools, e.g. hammers. Then stop.'), [
    'Use tools, e.g. hammers.',
    'Then stop.'
  ]);
});

test('keeps dotted acronyms and spaced initials together', () => {
  assert.deepEqual(splitIntoSentences('The U.S. Army arrived. It was late.'), [
    'The U.S. Army arrived.',
    'It was late.'
  ]);
  assert.deepEqual(splitIntoSentences('J. R. R. Tolkien wrote books. Many.'), [
    'J. R. R. Tolkien wrote books.',
    'Many.'
  ]);
});

test('returns an empty list for empty or blank input', () => {
  assert.deepEqual(splitIntoSentences(''), []);
  assert.deepEqual(splitIntoSentences('   \n\n  '), []);
  assert.deepEqual(splitIntoSentences(null), []);
});

test('sanitizeSentence normalizes spacing around punctuation', () => {
  const input = '  Hello   ,  world !  ';

  assert.equal(sanitizeSentence(input), 'Hello, world!');
});
