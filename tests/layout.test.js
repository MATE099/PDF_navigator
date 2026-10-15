import test from 'node:test';
import assert from 'node:assert/strict';

import { clampPanelPosition } from '../modules/layout.js';

const panel = { width: 300, height: 400 };
const viewport = { width: 1000, height: 800 };

test('keeps a position that already fits', () => {
  assert.deepEqual(clampPanelPosition({ left: 100, top: 50 }, panel, viewport), { left: 100, top: 50 });
});

test('pulls the panel back inside the viewport', () => {
  assert.deepEqual(clampPanelPosition({ left: -50, top: 2000 }, panel, viewport, 8), { left: 8, top: 392 });
  assert.deepEqual(clampPanelPosition({ left: 5000, top: -10 }, panel, viewport, 8), { left: 692, top: 8 });
});

test('handles a viewport smaller than the panel', () => {
  assert.deepEqual(clampPanelPosition({ left: 50, top: 50 }, panel, { width: 200, height: 200 }, 8), { left: 8, top: 8 });
});

test('returns null when there is no saved position', () => {
  assert.equal(clampPanelPosition(null, panel, viewport), null);
});
