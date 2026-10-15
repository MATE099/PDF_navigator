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

#pdf-sentence-overlay .pdfnav-hint {
  font: 12px/1.35 system-ui, sans-serif;
  color: var(--pdfnav-muted);
}

#pdf-sentence-overlay .pdfnav-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;
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

#pdf-sentence-overlay .pdfnav-sentence-text {
  font: var(--pdfnav-font-size)/1.5 system-ui, sans-serif;
  color: var(--pdfnav-text);
  word-break: break-word;
}
`;
