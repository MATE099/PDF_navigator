import { OVERLAY_CSS, OVERLAY_STYLE_ID } from './overlay-styles.js';
import { SHORTCUT_HINT } from './shortcuts.js';
import { findMatches, getNextMatch, splitByQuery } from './search.js';
import { parseSentenceNumber } from './navigation.js';

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
  constructor({ onSelect } = {}) {
    this.onSelect = onSelect;
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
    const title = createElement('div', 'pdfnav-title', 'PDF Sentence Navigator');
    const counterRow = createElement('div', 'pdfnav-counter-row');
    const counter = createElement('div', 'pdfnav-counter');
    const hint = createElement('div', 'pdfnav-hint', SHORTCUT_HINT);
    const list = createElement('div', 'pdfnav-list');
    const toast = createElement('div', 'pdfnav-toast');

    container.id = 'pdf-sentence-overlay';
    toast.setAttribute('role', 'status');

    // One listener on the list handles clicks for every sentence card.
    list.addEventListener('click', (event) => {
      const card = event.target.closest('.pdfnav-sentence');
      if (card && this.onSelect) {
        this.onSelect(Number(card.dataset.index));
      }
    });

    counterRow.append(counter, this.createGotoInput());
    header.append(title, counterRow, hint, this.createSearchBar());
    container.append(header, list, toast);
    document.body.appendChild(container);

    this.toast = toast;
    this.container = container;
    this.counter = counter;
    this.list = list;
    return container;
  }

  renderSentences(sentences) {
    this.sentences = sentences;
    this.activeIndex = -1;
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
      return;
    }

    this.counter.textContent = `Sentence ${this.activeIndex + 1} of ${this.sentences.length}`;
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
    this.gotoInput = null;
    this.searchInput = null;
    this.searchStatus = null;
    this.searchQuery = '';
    this.matches = [];
    this.container?.remove();
    this.container = null;
  }
}
