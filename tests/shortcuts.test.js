import test from 'node:test';
import assert from 'node:assert/strict';

import { isTypingTarget, resolveShortcut } from '../modules/shortcuts.js';

test('maps Tab and Shift+Tab to next and previous', () => {
  assert.equal(resolveShortcut({ key: 'Tab', shiftKey: false }), 'next');
  assert.equal(resolveShortcut({ key: 'Tab', shiftKey: true }), 'previous');
});

test('supports vim-style keys regardless of case', () => {
  assert.equal(resolveShortcut({ key: 'j' }), 'next');
  assert.equal(resolveShortcut({ key: 'K', shiftKey: true }), 'previous');
});

test('maps Home, End and Escape', () => {
  assert.equal(resolveShortcut({ key: 'Home' }), 'first');
  assert.equal(resolveShortcut({ key: 'End' }), 'last');
  assert.equal(resolveShortcut({ key: 'Escape' }), 'close');
});

test('maps / to search and G to go-to', () => {
  assert.equal(resolveShortcut({ key: '/' }), 'search');
  assert.equal(resolveShortcut({ key: 'g' }), 'goto');
});

test('ignores keys combined with Ctrl, Alt or Meta', () => {
  assert.equal(resolveShortcut({ key: 'j', ctrlKey: true }), null);
  assert.equal(resolveShortcut({ key: 'Tab', altKey: true }), null);
  assert.equal(resolveShortcut({ key: 'k', metaKey: true }), null);
});

test('returns null for unknown keys', () => {
  assert.equal(resolveShortcut({ key: 'x' }), null);
  assert.equal(resolveShortcut(null), null);
});

test('detects text inputs as typing targets', () => {
  assert.equal(isTypingTarget({ tagName: 'input' }), true);
  assert.equal(isTypingTarget({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(isTypingTarget({ tagName: 'DIV' }), false);
  assert.equal(isTypingTarget(null), false);
});
