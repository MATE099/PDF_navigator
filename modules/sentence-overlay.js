export class SentenceOverlay {
  constructor() {
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

    const container = document.createElement('aside');
    const header = document.createElement('div');
    const title = document.createElement('div');
    const counter = document.createElement('div');
    const hint = document.createElement('div');
    const list = document.createElement('div');

    this.container = container;
    this.counter = counter;
    this.list = list;

    this.container.id = 'pdf-sentence-overlay';
    this.container.style.position = 'fixed';
    this.container.style.top = '16px';
    this.container.style.right = '16px';
    this.container.style.width = 'min(380px, calc(100vw - 32px))';
    this.container.style.maxHeight = 'calc(100vh - 32px)';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '12px';
    this.container.style.padding = '14px';
    this.container.style.borderRadius = '16px';
    this.container.style.background = 'rgba(15, 23, 42, 0.96)';
    this.container.style.color = '#e2e8f0';
    this.container.style.boxShadow = '0 20px 45px rgba(15, 23, 42, 0.35)';
    this.container.style.backdropFilter = 'blur(10px)';
    this.container.style.pointerEvents = 'auto';
    this.container.style.zIndex = '2147483647';
    this.container.style.overflow = 'hidden';

    header.style.display = 'flex';
    header.style.flexDirection = 'column';
    header.style.gap = '6px';

    title.textContent = 'PDF Sentence Navigator';
    title.style.font = '600 14px/1.2 system-ui, sans-serif';
    title.style.letterSpacing = '0.01em';

    counter.style.font = '600 13px/1.2 system-ui, sans-serif';
    counter.style.color = '#93c5fd';

    hint.textContent = 'Tab: next, Shift+Tab: previous, Esc: dismiss';
    hint.style.font = '12px/1.35 system-ui, sans-serif';
    hint.style.color = '#94a3b8';

    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';
    list.style.overflowY = 'auto';
    list.style.paddingRight = '4px';

    header.append(title, counter, hint);
    this.container.append(header, list);
    document.body.appendChild(this.container);
    return this.container;
  }

  renderSentences(sentences) {
    this.sentences = sentences;
    this.activeIndex = -1;
    if (!this.container) {
      this.createOverlay();
    }

    this.container.style.display = 'flex';
    this.updateCounter();
    this.list?.replaceChildren();

    sentences.forEach((sentence, index) => {
      const marker = document.createElement('div');
      const sentenceNumber = document.createElement('div');
      const sentenceText = document.createElement('div');

      marker.dataset.index = String(index);
      marker.style.padding = '10px 12px';
      marker.style.borderRadius = '12px';
      marker.style.background = 'rgba(37, 99, 235, 0.12)';
      marker.style.boxShadow = 'inset 0 0 0 1px rgba(148, 163, 184, 0.18)';
      marker.style.transition = 'background 120ms ease, box-shadow 120ms ease';

      sentenceNumber.textContent = `Sentence ${index + 1}`;
      sentenceNumber.style.font = '600 11px/1.2 system-ui, sans-serif';
      sentenceNumber.style.textTransform = 'uppercase';
      sentenceNumber.style.letterSpacing = '0.06em';
      sentenceNumber.style.color = '#93c5fd';
      sentenceNumber.style.marginBottom = '6px';

      sentenceText.textContent = sentence;
      sentenceText.style.font = '14px/1.5 system-ui, sans-serif';
      sentenceText.style.color = '#e2e8f0';
      sentenceText.style.wordBreak = 'break-word';

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

    this.activeIndex = index;
    this.updateCounter();
    const marker = this.list?.querySelector(`[data-index="${index}"]`);
    if (!marker) {
      return;
    }

    Array.from(this.list?.children || []).forEach((child) => {
      child.style.background = 'rgba(37, 99, 235, 0.12)';
      child.style.boxShadow = 'inset 0 0 0 1px rgba(148, 163, 184, 0.18)';
    });

    marker.style.background = 'rgba(250, 204, 21, 0.18)';
    marker.style.boxShadow = 'inset 0 0 0 2px rgba(250, 204, 21, 0.7)';

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
