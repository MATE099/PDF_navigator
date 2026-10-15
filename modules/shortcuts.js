// Maps keyboard events to navigator action names.
// Kept free of DOM/Chrome APIs so it can be unit-tested in Node.
const SHORTCUTS = [
  { key: 'Tab', shift: false, action: 'next' },
  { key: 'Tab', shift: true, action: 'previous' },
  { key: 'j', action: 'next' },
  { key: 'k', action: 'previous' },
  { key: 'Home', action: 'first' },
  { key: 'End', action: 'last' },
  { key: 'Escape', action: 'close' },
  { key: '/', action: 'search' }
];

export const SHORTCUT_HINT = 'Tab / J: next · Shift+Tab / K: previous · Home / End · /: search · Esc: close';

export function resolveShortcut(event) {
  if (!event || event.ctrlKey || event.metaKey || event.altKey) {
    return null;
  }

  const key = event.key?.length === 1 ? event.key.toLowerCase() : event.key;
  const match = SHORTCUTS.find((shortcut) => (
    shortcut.key === key && (shortcut.shift === undefined || shortcut.shift === Boolean(event.shiftKey))
  ));

  return match ? match.action : null;
}

// True when the user is typing in a field, so single-letter shortcuts must not fire.
export function isTypingTarget(target) {
  if (!target) {
    return false;
  }

  const tagName = target.tagName?.toUpperCase();
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || Boolean(target.isContentEditable);
}
