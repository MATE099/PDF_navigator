import { OVERLAY_CSS, OVERLAY_STYLE_ID } from './overlay-styles.js';

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
  }

  createOverlay() {
    if (this.container) {
      return this.container;
    }

    injectStyles();

    const container = createElement('aside');
    const header = createElement('div', 'pdfnav-header');
    const title = createElement('div', 'pdfnav-title', 'PDF Sentence Navigator');
    const counter = createElement('div', 'pdfnav-counter');
    const hint = createElement('div', 'pdfnav-hint', 'Tab: next, Shift+Tab: previous, Esc: dismiss');
    const list = createElement('div', 'pdfnav-list');

    container.id = 'pdf-sentence-overlay';

    // One listener on the list handles clicks for every sentence card.
    list.addEventListener('click', (event) => {
      const card = event.target.closest('.pdfnav-sentence');
      if (card && this.onSelect) {
        this.onSelect(Number(card.dataset.index));
      }
    });

    header.append(title, counter, hint);
    container.append(header, list);
    document.body.appendChild(container);

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
    this.container?.remove();
    this.container = null;
  }
}
