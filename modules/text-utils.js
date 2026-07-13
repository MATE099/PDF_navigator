export function splitIntoSentences(text) {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return [];
  }

  const matches = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return matches
    .map((value) => value.trim())
    .filter(Boolean);
}

export function sanitizeSentence(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}
