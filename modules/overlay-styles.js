// All overlay styles live here and are injected once as a <style> tag.
// Every selector is scoped to #pdf-sentence-overlay so the host page is not affected.
export const OVERLAY_STYLE_ID = 'pdf-sentence-overlay-styles';

export const OVERLAY_CSS = `
#pdf-sentence-overlay {
  --pdfnav-bg: rgba(15, 23, 42, 0.96);
  --pdfnav-text: #e2e8f0;
  --pdfnav-muted: #94a3b8;
  --pdfnav-accent: #93c5fd;
  --pdfnav-card: rgba(37, 99, 235, 0.12);
  --pdfnav-card-border: rgba(148, 163, 184, 0.18);
  --pdfnav-active: rgba(250, 204, 21, 0.18);
  --pdfnav-active-border: rgba(250, 204, 21, 0.7);
  --pdfnav-font-size: 14px;

  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2147483647;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(380px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  padding: 14px;
  overflow: hidden;
  border-radius: 16px;
  background: var(--pdfnav-bg);
  color: var(--pdfnav-text);
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(10px);
  font-family: system-ui, sans-serif;
}

#pdf-sentence-overlay *,
#pdf-sentence-overlay *::before,
#pdf-sentence-overlay *::after {
  box-sizing: border-box;
}

#pdf-sentence-overlay .pdfnav-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

#pdf-sentence-overlay .pdfnav-title {
  font: 600 14px/1.2 system-ui, sans-serif;
  letter-spacing: 0.01em;
}

#pdf-sentence-overlay .pdfnav-counter {
  font: 600 13px/1.2 system-ui, sans-serif;
  color: var(--pdfnav-accent);
}

#pdf-sentence-overlay .pdfnav-counter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

#pdf-sentence-overlay .pdfnav-goto {
  width: 84px;
  padding: 4px 8px;
  border: 1px solid var(--pdfnav-card-border);
  border-radius: 8px;
  outline: none;
  background: rgba(15, 23, 42, 0.6);
  color: var(--pdfnav-text);
  font: 12px/1.3 system-ui, sans-serif;
}

#pdf-sentence-overlay .pdfnav-goto:focus {
  border-color: var(--pdfnav-accent);
}

#pdf-sentence-overlay .pdfnav-goto.is-invalid {
  border-color: #f87171;
}

#pdf-sentence-overlay .pdfnav-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

#pdf-sentence-overlay .pdfnav-progress-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
}

#pdf-sentence-overlay .pdfnav-progress-fill {
  width: 0;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #3b82f6, #facc15);
  transition: width 200ms ease;
}

#pdf-sentence-overlay .pdfnav-progress-label {
  font: 11px/1.3 system-ui, sans-serif;
  color: var(--pdfnav-muted);
}

#pdf-sentence-overlay .pdfnav-hint {
  font: 12px/1.35 system-ui, sans-serif;
  color: var(--pdfnav-muted);
}

#pdf-sentence-overlay .pdfnav-search-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

#pdf-sentence-overlay .pdfnav-search {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--pdfnav-card-border);
  border-radius: 10px;
  outline: none;
  background: rgba(15, 23, 42, 0.6);
  color: var(--pdfnav-text);
  font: 13px/1.3 system-ui, sans-serif;
}

#pdf-sentence-overlay .pdfnav-search:focus {
  border-color: var(--pdfnav-accent);
}

#pdf-sentence-overlay .pdfnav-search-status {
  min-height: 14px;
  font: 11px/1.3 system-ui, sans-serif;
  color: var(--pdfnav-muted);
}

#pdf-sentence-overlay .pdfnav-sentence.is-match:not(.is-active) {
  box-shadow: inset 3px 0 0 var(--pdfnav-accent), inset 0 0 0 1px var(--pdfnav-card-border);
}

#pdf-sentence-overlay .pdfnav-mark {
  padding: 0 1px;
  border-radius: 3px;
  background: rgba(250, 204, 21, 0.45);
  color: inherit;
}

#pdf-sentence-overlay .pdfnav-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;
}

#pdf-sentence-overlay .pdfnav-toast {
  position: absolute;
  left: 50%;
  bottom: 14px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.95);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  color: var(--pdfnav-text);
  font: 600 12px/1.3 system-ui, sans-serif;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 8px);
  transition: opacity 160ms ease, transform 160ms ease;
}

#pdf-sentence-overlay .pdfnav-toast.is-visible {
  opacity: 1;
  transform: translate(-50%, 0);
}

#pdf-sentence-overlay .pdfnav-sentence {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--pdfnav-card);
  box-shadow: inset 0 0 0 1px var(--pdfnav-card-border);
  transition: background 120ms ease, box-shadow 120ms ease;
  cursor: pointer;
}

#pdf-sentence-overlay .pdfnav-sentence:not(.is-active):hover {
  box-shadow: inset 0 0 0 1px var(--pdfnav-accent);
}

#pdf-sentence-overlay .pdfnav-sentence.is-active {
  background: var(--pdfnav-active);
  box-shadow: inset 0 0 0 2px var(--pdfnav-active-border);
}

#pdf-sentence-overlay .pdfnav-sentence-label {
  margin-bottom: 6px;
  font: 600 11px/1.2 system-ui, sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pdfnav-accent);
}

#pdf-sentence-overlay .pdfnav-sentence.is-bookmarked .pdfnav-sentence-label::after {
  content: ' ★';
  color: #facc15;
}

#pdf-sentence-overlay .pdfnav-sentence-text {
  font: var(--pdfnav-font-size)/1.5 system-ui, sans-serif;
  color: var(--pdfnav-text);
  word-break: break-word;
}
`;
