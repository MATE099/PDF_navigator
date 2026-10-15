import test from 'node:test';
import assert from 'node:assert/strict';

import { getDocumentKey, loadDocumentState, saveDocumentState } from '../modules/storage.js';

// Minimal in-memory stand-in for chrome.storage.local.
function installFakeStorage() {
  const data = {};
  globalThis.chrome = {
    storage: {
      local: {
        async get(key) {
          return key in data ? { [key]: data[key] } : {};
        },
        async set(values) {
          Object.assign(data, values);
        }
      }
    }
  };
  return data;
}

test('getDocumentKey ignores the #hash part of the URL', () => {
  assert.equal(getDocumentKey('https://example.com/a.pdf#page=3'), 'doc:https://example.com/a.pdf');
  assert.equal(getDocumentKey('not a url'), 'doc:not a url');
});

test('loadDocumentState returns defaults when nothing is saved', async () => {
  installFakeStorage();
  assert.deepEqual(await loadDocumentState('https://example.com/a.pdf'), { position: 0 });
});

test('saveDocumentState merges changes into the saved record', async () => {
  installFakeStorage();
  const url = 'https://example.com/a.pdf';

  await saveDocumentState(url, { position: 12 });
  await saveDocumentState(url, { extra: true });
  const state = await loadDocumentState(url);

  assert.equal(state.position, 12);
  assert.equal(state.extra, true);
});

test('storage helpers fall back safely when chrome.storage is missing', async () => {
  delete globalThis.chrome;
  assert.deepEqual(await loadDocumentState('https://example.com/a.pdf'), { position: 0 });
  await assert.doesNotReject(saveDocumentState('https://example.com/a.pdf', { position: 1 }));
});
