import { splitIntoSentences, sanitizeSentence } from './modules/text-utils.js';
import { SentenceOverlay } from './modules/sentence-overlay.js';

const overlay = new SentenceOverlay();
let sentences = [];
let currentIndex = -1;
let isProcessing = false;
let keyboardNavigationInitialized = false;

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
  sentences = [];
  currentIndex = -1;
  overlay.destroyOverlay();
}

function setupKeyboardNavigation() {
  if (keyboardNavigationInitialized) {
    return;
  }

  document.addEventListener('keydown', (event) => {
    if (!sentences.length) {
      return;
    }

    if (event.key === 'Escape') {
      clearPdfExperience();
      return;
    }

    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      moveToSentence(currentIndex + 1);
    }

    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      moveToSentence(currentIndex - 1);
    }
  });

  keyboardNavigationInitialized = true;
}

function moveToSentence(nextIndex) {
  if (!sentences.length) {
    return;
  }

  if (nextIndex < 0) {
    nextIndex = 0;
  }

  if (nextIndex >= sentences.length) {
    nextIndex = sentences.length - 1;
  }

  currentIndex = nextIndex;
  overlay.setActiveIndex(currentIndex);
}

async function initializePdfExperience() {
  if (isProcessing) {
    throw new Error('PDF processing is already in progress.');
  }

  isProcessing = true;

  try {
    if (!isPdfDocument()) {
      throw new Error('This page is not a PDF document.');
    }

    const rawText = await extractPdfText();
    const extractedSentences = normalizeSentences(splitIntoSentences(rawText));

    if (!extractedSentences.length) {
      throw new Error('No sentences were found in the loaded PDF.');
    }

    sentences = extractedSentences;
    overlay.createOverlay();
    overlay.renderSentences(sentences);
    setupKeyboardNavigation();
    moveToSentence(0);

    window.postMessage({ type: 'pdf-sentence-navigation-ready', count: sentences.length }, '*');
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
    throw new Error('PDF processing is already in progress.');
  }

  isProcessing = true;

  try {
    const nextSentences = normalizeSentences(providedSentences);
    if (!nextSentences.length) {
      throw new Error('No sentences were found in the loaded PDF.');
    }

    sentences = nextSentences;
    overlay.createOverlay();
    overlay.renderSentences(sentences);
    setupKeyboardNavigation();
    moveToSentence(0);

    window.postMessage({ type: 'pdf-sentence-navigation-ready', count: sentences.length }, '*');
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
