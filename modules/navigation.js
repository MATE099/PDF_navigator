// Pure index helpers for moving around the sentence list.

// Keeps an index inside [0, total - 1]. Returns -1 when there is nothing to navigate.
export function clampIndex(index, total) {
  if (!total || total < 1) {
    return -1;
  }

  return Math.min(Math.max(Math.trunc(Number(index) || 0), 0), total - 1);
}

// Adds the index if missing, removes it if present. Returns a new sorted array.
export function toggleBookmark(bookmarks, index) {
  const set = new Set(bookmarks || []);
  if (set.has(index)) {
    set.delete(index);
  } else {
    set.add(index);
  }

  return [...set].sort((a, b) => a - b);
}

// Drops bookmarks that no longer point at a sentence (e.g. the PDF changed).
export function sanitizeBookmarks(bookmarks, total) {
  if (!Array.isArray(bookmarks)) {
    return [];
  }

  return [...new Set(bookmarks.filter((index) => Number.isInteger(index) && index >= 0 && index < total))]
    .sort((a, b) => a - b);
}

// Converts what the user typed ("12") into a zero-based index, or -1 if it is invalid.
export function parseSentenceNumber(value, total) {
  const number = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(number) || number < 1 || number > total) {
    return -1;
  }

  return number - 1;
}
