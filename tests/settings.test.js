import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_SETTINGS,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  changeFontSize,
  normalizeSettings,
  toggleTheme
} from '../modules/settings.js';

test('normalizeSettings fills in defaults', () => {
  assert.deepEqual(normalizeSettings(undefined), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ theme: 'light' }), { ...DEFAULT_SETTINGS, theme: 'light' });
});

test('normalizeSettings repairs invalid values', () => {
  const settings = normalizeSettings({ theme: 'neon', fontSize: 'big' });
  assert.equal(settings.theme, 'dark');
  assert.equal(settings.fontSize, DEFAULT_SETTINGS.fontSize);
});

test('normalizeSettings keeps valid panel positions and drops broken ones', () => {
  assert.deepEqual(normalizeSettings({ panelPosition: { left: 10, top: 20 } }).panelPosition, { left: 10, top: 20 });
  assert.equal(normalizeSettings({ panelPosition: { left: 'x', top: 20 } }).panelPosition, null);
  assert.equal(normalizeSettings({ minimized: 1 }).minimized, true);
});

test('changeFontSize stays within the allowed range', () => {
  assert.equal(changeFontSize({ ...DEFAULT_SETTINGS, fontSize: 14 }, 1).fontSize, 15);
  assert.equal(changeFontSize({ ...DEFAULT_SETTINGS, fontSize: FONT_SIZE_MAX }, 1).fontSize, FONT_SIZE_MAX);
  assert.equal(changeFontSize({ ...DEFAULT_SETTINGS, fontSize: FONT_SIZE_MIN }, -1).fontSize, FONT_SIZE_MIN);
});

test('toggleTheme switches between dark and light', () => {
  const light = toggleTheme(DEFAULT_SETTINGS);
  assert.equal(light.theme, 'light');
  assert.equal(toggleTheme(light).theme, 'dark');
});
