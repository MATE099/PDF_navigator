import { splitIntoSentences, sanitizeSentence } from './modules/text-utils.js';
import { SentenceOverlay } from './modules/sentence-overlay.js';
import { isTypingTarget, resolveShortcut } from './modules/shortcuts.js';
import { clampIndex } from './modules/navigation.js';
import { loadDocumentState, saveDocumentState } from './modules/storage.js';

const POSITION_SAVE_DELAY_MS = 400;

const overlay = new SentenceOverlay({ onSelect: (index) => moveToSentence(index) });
let sentences = [];
let currentIndex = -1;
let isProcessing = false;
let keyboardNavigationInitialized = false;
let positionSaveTimer = null;

function isPdfDocument() {
  const url = window.location.href;
  return url.toLowerCase().endsWith('.pdf') || url.includes('/pdf') || document.contentType === 'application/pdf';
}

async function extractPdfText() {
  if (!isPdfDocument()) {
    throw new Error('This page is not a PDF document.');
  }

  const text = document.body?.innerText || '';
  if (!text) {
    throw new Error('No text could be extracted from the current PDF view.');
  }

  return text;
}

function normalizeSentences(nextSentences) {
  return (nextSentences || [])
    .map(sanitizeSentence)
    .filter(Boolean);
}

function clearPdfExperience() {
  clearTimeout(positionSaveTimer);
  if (currentIndex >= 0) {
    saveDocumentState(window.location.href, { position: currentIndex });
  }

  sentences = [];
  currentIndex = -1;
  overlay.destroyOverlay();
}

function setupKeyboardNavigation() {
  if (keyboardNavigationInitialized) {
    return;
  }

  // Each action name returned by resolveShortcut maps to one function here.
  const actions = {
    next: () => moveToSentence(currentIndex + 1),
    previous: () => moveToSentence(currentIndex - 1),
    first: () => moveToSentence(0),
    last: () => moveToSentence(sentences.length - 1),
    close: () => clearPdfExperience(),
    search: () => overlay.focusSearch(),
    goto: () => overlay.focusGoto()
  };

  document.addEventListener('keydown', (event) => {
    if (!sentences.length || isTypingTarget(event.target)) {
      return;
    }

    const action = resolveShortcut(event);
    if (!action || !actions[action]) {
      return;
    }

    event.preventDefault();
    actions[action]();
  });

  keyboardNavigationInitialized = true;
}

// Waits until the user pauses before writing, so holding Tab doesn't hammer storage.
function schedulePositionSave() {
  clearTimeout(positionSaveTimer);
  positionSaveTimer = setTimeout(() => {
    saveDocumentState(window.location.href, { position: currentIndex });
  }, POSITION_SAVE_DELAY_MS);
}

function moveToSentence(nextIndex) {
  if (!sentences.length) {
    return;
  }

  currentIndex = clampIndex(nextIndex, sentences.length);
  overlay.setActiveIndex(currentIndex);
  schedulePositionSave();
}

// Shared by both extraction paths: renders the panel and restores the saved position.
async function showSentences(nextSentences) {
  sentences = nextSentences;
  overlay.createOverlay();
  overlay.renderSentences(sentences);
  setupKeyboardNavigation();

  const savedState = await loadDocumentState(window.location.href);
  const startIndex = clampIndex(savedState.position, sentences.length);
  moveToSentence(startIndex);
  if (startIndex > 0) {
    overlay.showToast(`Resumed at sentence ${startIndex + 1}`);
  }

  window.postMessage({ type: 'pdf-sentence-navigation-ready', count: sentences.length }, '*');
}

async function initializePdfExperience() {
  if (isProcessing) {
    return { ok: false, error: 'PDF processing is already in progress.' };
  }

  isProcessing = true;

  try {
    const rawText = await extractPdfText();
    const extractedSentences = normalizeSentences(splitIntoSentences(rawText));

    if (!extractedSentences.length) {
      throw new Error('No sentences were found in the loaded PDF.');
    }

    await showSentences(extractedSentences);
    chrome.runtime.sendMessage({ type: 'pdf-processing-complete', count: sentences.length });
    return { ok: true, count: sentences.length };
  } catch (error) {
    const message = error?.message || 'Processing failed.';
    chrome.runtime.sendMessage({ type: 'pdf-processing-failed', message });
    return { ok: false, error: message };
  } finally {
    isProcessing = false;
  }
}

async function renderProvidedSentences(providedSentences) {
  if (isProcessing) {
    return { ok: false, error: 'PDF processing is already in progress.' };
  }

  isProcessing = true;

  try {
    const nextSentences = normalizeSentences(providedSentences);
    if (!nextSentences.length) {
      throw new Error('No sentences were found in the loaded PDF.');
    }

    await showSentences(nextSentences);
    return { ok: true, count: sentences.length };
  } catch (error) {
    return { ok: false, error: error?.message || 'Processing failed.' };
  } finally {
    isProcessing = false;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'process-pdf') {
    initializePdfExperience().then(sendResponse);
    return true;
  }

  if (message?.type === 'render-pdf-sentences') {
    renderProvidedSentences(message.sentences).then(sendResponse);
    return true;
  }

  return false;
});
