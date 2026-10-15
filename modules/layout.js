// Keeps the floating panel on screen while dragging or after the window is resized.
export const PANEL_MARGIN = 8;

export function clampPanelPosition(position, panelSize, viewportSize, margin = PANEL_MARGIN) {
  if (!position) {
    return null;
  }

  const maxLeft = Math.max(margin, viewportSize.width - panelSize.width - margin);
  const maxTop = Math.max(margin, viewportSize.height - panelSize.height - margin);

  return {
    left: Math.round(Math.min(Math.max(Number(position.left) || 0, margin), maxLeft)),
    top: Math.round(Math.min(Math.max(Number(position.top) || 0, margin), maxTop))
  };
}
