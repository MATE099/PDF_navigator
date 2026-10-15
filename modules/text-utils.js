// Private-use character: it must not be a regex word character, otherwise `\b`
// stops matching after it (e.g. the "S" in an already protected "U.S.").
const PROTECTED_DOT = '\uE000';
const SENTENCE_BREAK = '__PDF_SENTENCE_BREAK__';
const COMMON_ABBREVIATIONS = [
  'Mr.',
  'Mrs.',
  'Ms.',
  'Dr.',
  'Prof.',
  'Sr.',
  'Jr.',
  'St.',
  'Mt.',
  'No.',
  'Nos.',
  'Fig.',
  'Figs.',
  'Eq.',
  'Eqs.',
  'Ref.',
  'Refs.',
  'vs.',
  'etc.',
  'e.g.',
  'i.e.',
  'al.'
];

function normalizeTextForSentenceSplit(text) {
  return (text || '')
    .replace(/\u00ad/g, '')
    .replace(/([A-Za-z])-\s*\n\s*([A-Za-z])/g, '$1$2')
    .replace(/\r\n?/g, '\n')
    .replace(/([a-z0-9,;:)\]])\n(?=[a-z0-9("'[])/g, '$1 ')
    .replace(/\n{2,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ +([,.;:!?])/g, '$1')
    .replace(/([([{]) +/g, '$1')
    .replace(/ +([)\]}])/g, '$1')
    .trim();
}

function protectSpecialDots(text) {
  let protectedText = text;

  for (const abbreviation of COMMON_ABBREVIATIONS) {
    const escaped = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    protectedText = protectedText.replace(
      new RegExp(`\\b${escaped}`, 'g'),
      abbreviation.replaceAll('.', PROTECTED_DOT)
    );
  }

  protectedText = protectedText.replace(/\b([A-Z])\.(?=[A-Z]\.)/g, `$1${PROTECTED_DOT}`);
  protectedText = protectedText.replace(/\b([A-Z])\.(?=\s+[A-Z]\.)/g, `$1${PROTECTED_DOT}`);
  protectedText = protectedText.replace(/\b([A-Z])\.(?=\s+[A-Z][a-z])/g, `$1${PROTECTED_DOT}`);
  protectedText = protectedText.replace(/(\d)\.(\d)/g, `$1${PROTECTED_DOT}$2`);

  return protectedText;
}

export function splitIntoSentences(text) {
  const normalized = normalizeTextForSentenceSplit(text);
  if (!normalized) {
    return [];
  }

  const protectedText = protectSpecialDots(normalized)
    .replace(/\n{2,}/g, `${SENTENCE_BREAK}`)
    .replace(/([.!?]["')\]]*)\s+(?=[A-Z0-9("'[])/g, `$1${SENTENCE_BREAK}`);

  return protectedText
    .split(SENTENCE_BREAK)
    .map((value) => value.replaceAll(PROTECTED_DOT, '.'))
    .map((value) => value.trim())
    .filter(Boolean);
}

export const DEFAULT_WORDS_PER_MINUTE = 200;

export function countWords(text) {
  const matches = String(text ?? '').trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

// For each index, the number of words from that sentence to the end of the list.
// Computed once so "time left" stays cheap while navigating.
export function buildRemainingWordCounts(sentences) {
  const remaining = new Array((sentences || []).length + 1).fill(0);
  for (let index = remaining.length - 2; index >= 0; index -= 1) {
    remaining[index] = remaining[index + 1] + countWords(sentences[index]);
  }
  return remaining;
}

export function estimateMinutes(wordCount, wordsPerMinute = DEFAULT_WORDS_PER_MINUTE) {
  if (!wordCount || wordsPerMinute <= 0) {
    return 0;
  }
  return wordCount / wordsPerMinute;
}

export function formatDuration(minutes) {
  if (minutes <= 0) {
    return '0 min';
  }
  if (minutes < 1) {
    return '<1 min';
  }

  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (!hours) {
    return `${rest} min`;
  }
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function sanitizeSentence(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .replace(/ +([,.;:!?])/g, '$1')
    .trim();
}
