import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBookmarksMarkdown, getDocumentName, getExportFileName } from '../modules/export.js';

test('getDocumentName uses the decoded PDF file name', () => {
  assert.equal(getDocumentName('https://site.com/papers/My%20Paper.pdf?x=1#page=2'), 'My Paper');
  assert.equal(getDocumentName('https://site.com/'), 'document');
  assert.equal(getDocumentName('not a url'), 'document');
});

test('getExportFileName produces a safe file name', () => {
  assert.equal(getExportFileName('https://site.com/My%20Paper%3A%20v2.pdf'), 'My-Paper-v2-bookmarks.md');
  assert.equal(getExportFileName('https://site.com/'), 'document-bookmarks.md');
});

test('buildBookmarksMarkdown lists bookmarks with page and sentence numbers', () => {
  const markdown = buildBookmarksMarkdown({
    url: 'https://site.com/paper.pdf',
    sentences: ['First.', 'Second.', 'Third.'],
    pages: [1, 1, 2],
    bookmarks: [0, 2],
    exportedAt: new Date('2026-10-15T12:00:00Z')
  });

  assert.equal(markdown, [
    '# Bookmarks: paper',
    '',
    '- Source: https://site.com/paper.pdf',
    '- Exported: 2026-10-15',
    '- Bookmarks: 2',
    '',
    '## Page 1, sentence 1',
    '',
    '> First.',
    '',
    '## Page 2, sentence 3',
    '',
    '> Third.',
    ''
  ].join('\n'));
});

test('buildBookmarksMarkdown works without page numbers', () => {
  const markdown = buildBookmarksMarkdown({
    url: 'https://site.com/paper.pdf',
    sentences: ['Only.'],
    bookmarks: [0],
    exportedAt: new Date('2026-10-15T12:00:00Z')
  });

  assert.match(markdown, /## Sentence 1\n\n> Only\./);
});
