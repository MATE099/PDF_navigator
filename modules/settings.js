// User preferences shared by every PDF (theme, font size, ...).
import { readValue, writeValue } from './storage.js';

const SETTINGS_KEY = 'settings';
const THEMES = ['dark', 'light'];

export const FONT_SIZE_MIN = 11;
export const FONT_SIZE_MAX = 24;
export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'dark',
  fontSize: 14,
  minimized: false,
  showHelp: true,
  // null means "use the default top-right corner".
  panelPosition: null
});

function isValidPosition(position) {
  return Boolean(position) && Number.isFinite(position.left) && Number.isFinite(position.top);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Fills in defaults and fixes invalid values (e.g. from an older version of the extension).
export function normalizeSettings(raw) {
  const settings = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
  settings.theme = THEMES.includes(settings.theme) ? settings.theme : DEFAULT_SETTINGS.theme;
  settings.fontSize = Number.isFinite(settings.fontSize)
    ? clamp(Math.round(settings.fontSize), FONT_SIZE_MIN, FONT_SIZE_MAX)
    : DEFAULT_SETTINGS.fontSize;
  settings.minimized = Boolean(settings.minimized);
  settings.showHelp = Boolean(settings.showHelp);
  settings.panelPosition = isValidPosition(settings.panelPosition)
    ? { left: settings.panelPosition.left, top: settings.panelPosition.top }
    : null;
  return settings;
}

export function changeFontSize(settings, delta) {
  return normalizeSettings({ ...settings, fontSize: settings.fontSize + delta });
}

export function toggleTheme(settings) {
  return normalizeSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' });
}

export async function loadSettings() {
  return normalizeSettings(await readValue(SETTINGS_KEY, {}));
}

export async function saveSettings(settings) {
  await writeValue(SETTINGS_KEY, normalizeSettings(settings));
}
