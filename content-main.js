import { getAutoPlayDelay, splitIntoSentences, sanitizeSentence } from './modules/text-utils.js';
import { SentenceOverlay } from './modules/sentence-overlay.js';
import { isTypingTarget, resolveShortcut } from './modules/shortcuts.js';
import { clampIndex, sanitizeBookmarks, toggleBookmark } from './modules/navigation.js';
import { getNextMatch } from './modules/search.js';
import { copyText } from './modules/clipboard.js';
import { isSpeechSupported, speak, stopSpeaking } from './modules/speech.js';
import { buildBookmarksMarkdown, downloadTextFile, getExportFileName } from './modules/export.js';
import {
  DEFAULT_SETTINGS,
  changeFontSize,
  loadSettings,
  normalizeSettings,
  saveSettings,
  toggleTheme
} from './modules/settings.js';
import { loadDocumentState, saveDocumentState } from './modules/storage.js';

const POSITION_SAVE_DELAY_MS = 400;

// Every action name (from keyboard shortcuts or toolbar buttons) maps to one function here.
const actions = {
  next: () => moveToSentence(currentIndex + 1),
  previous: () => moveToSentence(currentIndex - 1),
  first: () => moveToSentence(0),
  last: () => moveToSentence(sentences.length - 1),
  close: () => clearPdfExperience(),
  search: () => overlay.focusSearch(),
  goto: () => overlay.focusGoto(),
  bookmark: () => toggleCurrentBookmark(),
  nextBookmark: () => jumpToBookmark(1),
  previousBookmark: () => jumpToBookmark(-1),
  copy: () => copyCurrentSentence(),
  toggleAutoPlay: () => togglePlayback('auto'),
  toggleSpeech: () => togglePlayback('speech'),
  fontUp: () => updateSettings(changeFontSize(settings, 1)),
  fontDown: () => updateSettings(changeFontSize(settings, -1)),
  toggleTheme: () => updateSettings(toggleTheme(settings)),
  toggleHelp: () => updateSettings({ ...settings, showHelp: !settings.showHelp }),
  toggleMinimize: () => updateSettings({ ...settings, minimized: !settings.minimized }),
  movePanel: (position) => updateSettings({ ...settings, panelPosition: position }),
  exportBookmarks: () => exportBookmarks()
};

const overlay = new SentenceOverlay({
  onSelect: (index) => moveToSentence(index),
  onAction: (name, payload) => actions[name]?.(payload)
});
let sentences = [];
// Page number for each sentence (null when the page is unknown, e.g. the DOM-text fallback).
let sentencePages = [];
let currentIndex = -1;
let bookmarks = [];
let isProcessing = false;
let keyboardNavigationInitialized = false;
let positionSaveTimer = null;
let settings = DEFAULT_SETTINGS;
let playbackMode = null;
let autoPlayTimer = null;

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

// The popup may be closed (e.g. when started with the keyboard command), so a missing listener is fine.
function notifyPopup(message) {
  try {
    Promise.resolve(chrome.runtime.sendMessage(message)).catch(() => {});
  } catch {
    // The extension was reloaded and this page's content script is orphaned.
  }
}

// Cleans up sentences and drops empty ones, keeping the optional page numbers aligned.
function normalizeSentences(nextSentences, nextPages = []) {
  const texts = [];
  const pages = [];

  (nextSentences || []).forEach((sentence, index) => {
    const text = sanitizeSentence(sentence);
    if (text) {
      texts.push(text);
      pages.push(Number.isInteger(nextPages?.[index]) ? nextPages[index] : null);
    }
  });

  return { texts, pages };
}

function clearPdfExperience() {
  stopPlayback();
  clearTimeout(positionSaveTimer);
  if (currentIndex >= 0) {
    saveDocumentState(window.location.href, { position: currentIndex });
  }

  sentences = [];
  sentencePages = [];
  currentIndex = -1;
  bookmarks = [];
  overlay.destroyOverlay();
}

function setupKeyboardNavigation() {
  if (keyboardNavigationInitialized) {
    return;
  }

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

// Playback modes: 'auto' advances on a timer, 'speech' reads each sentence aloud and then advances.
const PLAYBACK_MODES = {
  auto: { badge: '▶ Auto-play', started: 'Auto-play on · Space to pause', stopped: 'Auto-play paused' },
  speech: { badge: '🔊 Reading aloud', started: 'Reading aloud · R to stop', stopped: 'Stopped reading' }
};

function togglePlayback(mode) {
  if (playbackMode === mode) {
    stopPlayback();
    overlay.showToast(PLAYBACK_MODES[mode].stopped);
    return;
  }

  if (mode === 'speech' && !isSpeechSupported()) {
    overlay.showToast('Text-to-speech is not available in this browser');
    return;
  }

  stopPlayback();
  playbackMode = mode;
  overlay.setPlaybackLabel(PLAYBACK_MODES[mode].badge);
  overlay.showToast(PLAYBACK_MODES[mode].started);
  continuePlayback();
}

function stopPlayback() {
  clearTimeout(autoPlayTimer);
  if (playbackMode === 'speech') {
    stopSpeaking();
  }
  playbackMode = null;
  overlay.setPlaybackLabel('');
}

// Called after every move so playback continues from wherever the user navigated to.
function continuePlayback() {
  if (playbackMode === 'auto') {
    clearTimeout(autoPlayTimer);
    autoPlayTimer = setTimeout(advancePlayback, getAutoPlayDelay(sentences[currentIndex]));
  }

  if (playbackMode === 'speech') {
    speak(sentences[currentIndex], {
      onEnd: advancePlayback,
      onError: (error) => {
        stopPlayback();
        overlay.showToast(`Speech stopped: ${error.message}`);
      }
    });
  }
}

function advancePlayback() {
  if (currentIndex >= sentences.length - 1) {
    stopPlayback();
    overlay.showToast('Reached the last sentence');
    return;
  }

  moveToSentence(currentIndex + 1);
}

function moveToSentence(nextIndex) {
  if (!sentences.length) {
    return;
  }

  currentIndex = clampIndex(nextIndex, sentences.length);
  overlay.setActiveIndex(currentIndex);
  schedulePositionSave();
  continuePlayback();
}

function toggleCurrentBookmark() {
  if (currentIndex < 0) {
    return;
  }

  const wasBookmarked = bookmarks.includes(currentIndex);
  bookmarks = toggleBookmark(bookmarks, currentIndex);
  overlay.setBookmarks(bookmarks);
  overlay.showToast(wasBookmarked ? 'Bookmark removed' : `Bookmarked sentence ${currentIndex + 1}`);
  saveDocumentState(window.location.href, { bookmarks });
}

function updateSettings(nextSettings) {
  settings = normalizeSettings(nextSettings);
  overlay.applySettings(settings);
  saveSettings(settings);
}

async function copyCurrentSentence() {
  const sentence = sentences[currentIndex];
  if (!sentence) {
    return;
  }

  const copied = await copyText(sentence);
  overlay.showToast(copied ? 'Sentence copied' : 'Copy failed');
}

function exportBookmarks() {
  if (!bookmarks.length) {
    overlay.showToast('No bookmarks to export. Press B to add one.');
    return;
  }

  const url = window.location.href;
  const markdown = buildBookmarksMarkdown({ url, sentences, pages: sentencePages, bookmarks });
  downloadTextFile(getExportFileName(url), markdown);
  overlay.showToast(`Exported ${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'}`);
}

function jumpToBookmark(direction) {
  const target = getNextMatch(bookmarks, currentIndex, direction);
  if (target === -1) {
    overlay.showToast('No bookmarks yet. Press B to add one.');
    return;
  }

  moveToSentence(target);
}

// Shared by both extraction paths: renders the panel and restores the saved state.
async function showSentences({ texts, pages }) {
  sentences = texts;
  sentencePages = pages;
  const [savedState, savedSettings] = await Promise.all([loadDocumentState(window.location.href), loadSettings()]);
  bookmarks = sanitizeBookmarks(savedState.bookmarks, sentences.length);
  settings = savedSettings;

  overlay.applySettings(settings);
  overlay.createOverlay();
  overlay.setBookmarks(bookmarks);
  overlay.renderSentences(sentences, sentencePages);
  setupKeyboardNavigation();

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

    if (!extractedSentences.texts.length) {
      throw new Error('No sentences were found in the loaded PDF.');
    }

    await showSentences(extractedSentences);
    notifyPopup({ type: 'pdf-processing-complete', count: sentences.length });
    return { ok: true, count: sentences.length };
  } catch (error) {
    const message = error?.message || 'Processing failed.';
    notifyPopup({ type: 'pdf-processing-failed', message });
    return { ok: false, error: message };
  } finally {
    isProcessing = false;
  }
}

async function renderProvidedSentences(providedSentences, providedPages) {
  if (isProcessing) {
    return { ok: false, error: 'PDF processing is already in progress.' };
  }

  isProcessing = true;

  try {
    const nextSentences = normalizeSentences(providedSentences, providedPages);
    if (!nextSentences.texts.length) {
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
    renderProvidedSentences(message.sentences, message.pages).then(sendResponse);
    return true;
  }

  return false;
});
