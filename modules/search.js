// Pure search helpers used by the overlay (no DOM access, so they are easy to test).

function normalizeQuery(query) {
  return (query || '').trim().toLowerCase();
}

// Returns the indexes of all sentences that contain the query (case-insensitive).
export function findMatches(sentences, query) {
  const needle = normalizeQuery(query);
  if (!needle) {
    return [];
  }

  const matches = [];
  (sentences || []).forEach((sentence, index) => {
    if (String(sentence).toLowerCase().includes(needle)) {
      matches.push(index);
    }
  });
  return matches;
}

// Picks the next (direction = 1) or previous (direction = -1) match relative to the
// current sentence, wrapping around at the ends. Returns -1 when there are no matches.
export function getNextMatch(matches, currentIndex, direction = 1) {
  if (!matches?.length) {
    return -1;
  }

  if (direction >= 0) {
    return matches.find((index) => index > currentIndex) ?? matches[0];
  }

  return [...matches].reverse().find((index) => index < currentIndex) ?? matches[matches.length - 1];
}

// Splits text into pieces so the matching parts can be wrapped in <mark>.
export function splitByQuery(text, query) {
  const value = String(text ?? '');
  const needle = normalizeQuery(query);
  if (!needle) {
    return [{ text: value, match: false }];
  }

  const parts = [];
  const lower = value.toLowerCase();
  let position = 0;

  while (position < value.length) {
    const found = lower.indexOf(needle, position);
    if (found === -1) {
      parts.push({ text: value.slice(position), match: false });
      break;
    }

    if (found > position) {
      parts.push({ text: value.slice(position, found), match: false });
    }
    parts.push({ text: value.slice(found, found + needle.length), match: true });
    position = found + needle.length;
  }

  return parts;
}
