import { OVERLAY_CSS, OVERLAY_STYLE_ID } from './overlay-styles.js';
import { SHORTCUT_HINT } from './shortcuts.js';
import { findMatches, getNextMatch, splitByQuery } from './search.js';
import { parseSentenceNumber } from './navigation.js';
import { DEFAULT_WORDS_PER_MINUTE, buildRemainingWordCounts, estimateMinutes, formatDuration } from './text-utils.js';

// Small helper so building DOM nodes stays readable.
function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (textContent !== undefined) {
    element.textContent = textContent;
  }
  return element;
}

function injectStyles() {
  if (document.getElementById(OVERLAY_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = OVERLAY_STYLE_ID;
  style.textContent = OVERLAY_CSS;
  (document.head || document.documentElement).appendChild(style);
}

export class SentenceOverlay {
  // onSelect(index) is called when the user clicks a sentence card.
  // onAction(name) is called by toolbar buttons with the same action names the keyboard shortcuts use.
  constructor({ onSelect, onAction } = {}) {
    this.onSelect = onSelect;
    this.onAction = onAction;
    this.sentences = [];
    this.activeIndex = -1;
    this.container = null;
    this.counter = null;
    this.list = null;
    this.gotoInput = null;
    this.searchInput = null;
    this.searchStatus = null;
    this.searchQuery = '';
    this.matches = [];
    this.searchTimer = null;
    this.toast = null;
    this.toastTimer = null;
    this.bookmarks = new Set();
    this.remainingWords = [0];
    this.wordsPerMinute = DEFAULT_WORDS_PER_MINUTE;
    this.progressTrack = null;
    this.progressFill = null;
    this.progressLabel = null;
  }

  createSearchBar() {
    const bar = createElement('div', 'pdfnav-search-bar');
    const input = createElement('input', 'pdfnav-search');
    const status = createElement('div', 'pdfnav-search-status');

    input.type = 'search';
    input.placeholder = 'Search sentences… ( / )';
    input.setAttribute('aria-label', 'Search sentences');

    // Wait for a short pause in typing so large PDFs are not re-searched on every key.
    input.addEventListener('input', () => {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.applySearch(input.value), 120);
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        clearTimeout(this.searchTimer);
        this.applySearch(input.value);
        this.goToMatch(event.shiftKey ? -1 : 1);
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        input.value = '';
        this.applySearch('');
        input.blur();
      }
    });

    bar.append(input, status);
    this.searchInput = input;
    this.searchStatus = status;
    return bar;
  }

  createGotoInput() {
    const input = createElement('input', 'pdfnav-goto');
    input.type = 'number';
    input.min = '1';
    input.placeholder = 'Go to #';
    input.title = 'Type a sentence number and press Enter (G)';
    input.setAttribute('aria-label', 'Go to sentence number');

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const index = parseSentenceNumber(input.value, this.sentences.length);
        input.classList.toggle('is-invalid', index === -1);
        if (index !== -1) {
          this.onSelect?.(index);
          input.value = '';
          input.blur();
        }
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        input.value = '';
        input.classList.remove('is-invalid');
        input.blur();
      }
    });

    this.gotoInput = input;
    return input;
  }

  focusGoto() {
    if (this.gotoInput) {
      this.gotoInput.max = String(this.sentences.length);
      this.gotoInput.focus();
    }
  }

  createToolbar() {
    const toolbar = createElement('div', 'pdfnav-toolbar');
    const buttons = [
      { label: 'A−', title: 'Smaller text (-)', action: 'fontDown' },
      { label: 'A+', title: 'Larger text (+)', action: 'fontUp' },
      { label: '◐', title: 'Toggle light/dark theme (T)', action: 'toggleTheme' }
    ];

    buttons.forEach(({ label, title, action }) => {
      const button = createElement('button', 'pdfnav-tool', label);
      button.type = 'button';
      button.title = title;
      button.setAttribute('aria-label', title);
      button.addEventListener('click', () => this.onAction?.(action));
      toolbar.append(button);
    });

    return toolbar;
  }

  applySettings(settings) {
    this.settings = settings;
    if (!this.container) {
      return;
    }

    this.container.dataset.theme = settings.theme;
    this.container.style.setProperty('--pdfnav-font-size', `${settings.fontSize}px`);
  }

  // Shows a badge such as "▶ Auto-play" in the title row; an empty label hides it.
  setPlaybackLabel(label) {
    if (!this.playbackBadge) {
      return;
    }

    this.playbackBadge.textContent = label;
    this.playbackBadge.classList.toggle('is-visible', Boolean(label));
  }

  // Marks bookmarked sentence cards with a star.
  setBookmarks(bookmarks) {
    this.bookmarks = new Set(bookmarks);
    Array.from(this.list?.children || []).forEach((card) => {
      card.classList.toggle('is-bookmarked', this.bookmarks.has(Number(card.dataset.index)));
    });
  }

  // Shows a short message at the bottom of the panel, e.g. "Copied!".
  showToast(message, durationMs = 2200) {
    if (!this.toast) {
      return;
    }

    clearTimeout(this.toastTimer);
    this.toast.textContent = message;
    this.toast.classList.add('is-visible');
    this.toastTimer = setTimeout(() => this.toast?.classList.remove('is-visible'), durationMs);
  }

  focusSearch() {
    this.searchInput?.focus();
    this.searchInput?.select();
  }

  applySearch(query) {
    this.searchQuery = query;
    this.matches = findMatches(this.sentences, query);
    const matchSet = new Set(this.matches);

    Array.from(this.list?.children || []).forEach((card) => {
      const index = Number(card.dataset.index);
      card.classList.toggle('is-match', matchSet.has(index));
      this.renderSentenceText(card.querySelector('.pdfnav-sentence-text'), this.sentences[index], matchSet.has(index) ? query : '');
    });

    if (this.searchStatus) {
      const count = this.matches.length;
      this.searchStatus.textContent = query.trim() ? `${count} match${count === 1 ? '' : 'es'} · Enter / Shift+Enter` : '';
    }
  }

  goToMatch(direction) {
    const index = getNextMatch(this.matches, this.activeIndex, direction);
    if (index !== -1 && this.onSelect) {
      this.onSelect(index);
    }
  }

  // Writes the sentence into the element, wrapping query matches in <mark> (no innerHTML, so PDF text is never parsed as HTML).
  renderSentenceText(element, sentence, query) {
    if (!element) {
      return;
    }

    element.replaceChildren(...splitByQuery(sentence, query).map((part) => (
      part.match ? createElement('mark', 'pdfnav-mark', part.text) : document.createTextNode(part.text)
    )));
  }

  createOverlay() {
    if (this.container) {
      return this.container;
    }

    injectStyles();

    const container = createElement('aside');
    const header = createElement('div', 'pdfnav-header');
    const titleRow = createElement('div', 'pdfnav-title-row');
    const title = createElement('div', 'pdfnav-title', 'PDF Sentence Navigator');
    const playbackBadge = createElement('div', 'pdfnav-playback');
    const counterRow = createElement('div', 'pdfnav-counter-row');
    const counter = createElement('div', 'pdfnav-counter');
    const progress = createElement('div', 'pdfnav-progress');
    const progressTrack = createElement('div', 'pdfnav-progress-track');
    const progressFill = createElement('div', 'pdfnav-progress-fill');
    const progressLabel = createElement('div', 'pdfnav-progress-label');
    const hint = createElement('div', 'pdfnav-hint', SHORTCUT_HINT);
    const list = createElement('div', 'pdfnav-list');
    const toast = createElement('div', 'pdfnav-toast');

    container.id = 'pdf-sentence-overlay';
    toast.setAttribute('role', 'status');
    progressTrack.setAttribute('role', 'progressbar');
    progressTrack.setAttribute('aria-label', 'Reading progress');
    progressTrack.setAttribute('aria-valuemin', '0');
    progressTrack.setAttribute('aria-valuemax', '100');
    progressTrack.append(progressFill);
    progress.append(progressTrack, progressLabel);

    // One listener on the list handles clicks for every sentence card.
    list.addEventListener('click', (event) => {
      const card = event.target.closest('.pdfnav-sentence');
      if (card && this.onSelect) {
        this.onSelect(Number(card.dataset.index));
      }
    });

    counterRow.append(counter, this.createGotoInput());
    titleRow.append(title, playbackBadge, this.createToolbar());
    header.append(titleRow, counterRow, progress, hint, this.createSearchBar());
    container.append(header, list, toast);
    document.body.appendChild(container);

    this.playbackBadge = playbackBadge;
    this.progressTrack = progressTrack;
    this.progressFill = progressFill;
    this.progressLabel = progressLabel;
    this.toast = toast;
    this.container = container;
    this.counter = counter;
    this.list = list;
    if (this.settings) {
      this.applySettings(this.settings);
    }
    return container;
  }

  renderSentences(sentences) {
    this.sentences = sentences;
    this.activeIndex = -1;
    this.remainingWords = buildRemainingWordCounts(sentences);
    if (!this.container) {
      this.createOverlay();
    }

    this.updateCounter();
    this.list?.replaceChildren();

    sentences.forEach((sentence, index) => {
      const marker = createElement('div', 'pdfnav-sentence');
      const sentenceNumber = createElement('div', 'pdfnav-sentence-label', `Sentence ${index + 1}`);
      const sentenceText = createElement('div', 'pdfnav-sentence-text', sentence);

      marker.dataset.index = String(index);
      marker.classList.toggle('is-bookmarked', this.bookmarks.has(index));
      marker.append(sentenceNumber, sentenceText);
      this.list?.appendChild(marker);
    });

    if (this.searchQuery) {
      this.applySearch(this.searchQuery);
    }
  }

  updateCounter() {
    if (!this.counter) {
      return;
    }

    if (!this.sentences.length || this.activeIndex < 0) {
      this.counter.textContent = `${this.sentences.length} sentence${this.sentences.length === 1 ? '' : 's'} loaded`;
      this.updateProgress();
      return;
    }

    this.counter.textContent = `Sentence ${this.activeIndex + 1} of ${this.sentences.length}`;
    this.updateProgress();
  }

  updateProgress() {
    if (!this.progressFill || !this.progressLabel) {
      return;
    }

    const total = this.sentences.length;
    const percent = total && this.activeIndex >= 0 ? Math.round(((this.activeIndex + 1) / total) * 100) : 0;
    const wordsLeft = this.remainingWords[Math.max(this.activeIndex, 0)] || 0;
    const timeLeft = formatDuration(estimateMinutes(wordsLeft, this.wordsPerMinute));

    this.progressFill.style.width = `${percent}%`;
    this.progressTrack.setAttribute('aria-valuenow', String(percent));
    this.progressLabel.textContent = `${percent}% read · ~${timeLeft} left`;
  }

  setActiveIndex(index) {
    if (index < 0 || index >= this.sentences.length) {
      return;
    }

    const previous = this.list?.querySelector('.pdfnav-sentence.is-active');
    const marker = this.list?.querySelector(`[data-index="${index}"]`);

    this.activeIndex = index;
    this.updateCounter();
    if (!marker) {
      return;
    }

    previous?.classList.remove('is-active');
    marker.classList.add('is-active');
    marker.scrollIntoView({ block: 'center', inline: 'nearest' });
  }

  destroyOverlay() {
    this.sentences = [];
    this.activeIndex = -1;
    this.counter = null;
    this.list = null;
    clearTimeout(this.searchTimer);
    clearTimeout(this.toastTimer);
    this.toast = null;
    this.playbackBadge = null;
    this.bookmarks = new Set();
    this.remainingWords = [0];
    this.progressTrack = null;
    this.progressFill = null;
    this.progressLabel = null;
    this.gotoInput = null;
    this.searchInput = null;
    this.searchStatus = null;
    this.searchQuery = '';
    this.matches = [];
    this.container?.remove();
    this.container = null;
  }
}
