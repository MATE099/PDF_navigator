export class SentenceOverlay {
  constructor() {
    this.sentences = [];
    this.activeIndex = -1;
    this.container = null;
  }

  createOverlay() {
    if (this.container) {
      return this.container;
    }

    this.container = document.createElement('div');
    this.container.id = 'pdf-sentence-overlay';
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.right = '0';
    this.container.style.bottom = '0';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '2147483647';
    this.container.style.overflow = 'visible';
    document.body.appendChild(this.container);
    return this.container;
  }

  renderSentences(sentences) {
    this.sentences = sentences;
    this.activeIndex = -1;
    if (!this.container) {
      this.createOverlay();
    }

    this.container.replaceChildren();

    const body = document.body;
    const bodyHeight = body.scrollHeight || window.innerHeight;
    const bodyWidth = body.scrollWidth || window.innerWidth;

    const basePadding = 24;

    const containerWidth = Math.min(bodyWidth - basePadding * 2, window.innerWidth - basePadding * 2);

    sentences.forEach((sentence, index) => {
      const marker = document.createElement('div');
      marker.dataset.index = String(index);
      marker.textContent = sentence;
      marker.style.position = 'absolute';
      marker.style.left = `${basePadding}px`;
      marker.style.width = `${Math.max(260, containerWidth)}px`;
      marker.style.padding = '8px 10px';
      marker.style.borderRadius = '8px';
      marker.style.background = 'rgba(37, 99, 235, 0.12)';
      marker.style.color = '#111827';
      marker.style.font = '14px/1.45 system-ui, sans-serif';
      marker.style.boxShadow = '0 0 0 1px rgba(37, 99, 235, 0.2)';
      marker.style.opacity = '0.95';
      marker.style.transform = 'translateY(0)';
      marker.style.display = 'block';
      marker.style.whiteSpace = 'normal';
      marker.style.wordBreak = 'break-word';
      marker.style.pointerEvents = 'none';

      const topOffset = basePadding + index * 56;
      marker.style.top = `${Math.min(topOffset, bodyHeight - 120)}px`;
      this.container.appendChild(marker);
    });
  }

  setActiveIndex(index) {
    if (index < 0 || index >= this.sentences.length) {
      return;
    }

    this.activeIndex = index;
    const marker = this.container?.querySelector(`[data-index="${index}"]`);
    if (!marker) {
      return;
    }

    Array.from(this.container?.children || []).forEach((child) => {
      child.style.background = 'rgba(37, 99, 235, 0.12)';
      child.style.boxShadow = '0 0 0 1px rgba(37, 99, 235, 0.2)';
      child.style.outline = 'none';
    });

    marker.style.background = 'rgba(250, 204, 21, 0.9)';
    marker.style.boxShadow = '0 0 0 2px rgba(217, 119, 6, 0.45)';
    marker.style.outline = '2px solid rgba(217, 119, 6, 0.65)';

    marker.scrollIntoView({ block: 'center', inline: 'nearest' });
  }
}
