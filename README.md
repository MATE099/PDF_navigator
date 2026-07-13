# Local PDF Sentence Navigator

A Chrome extension that detects PDF documents, extracts text locally, splits it into sentences, and lets you move through them with Tab and Shift+Tab.

## Features

- Detects PDF documents opened in Chrome
- Extracts text locally in the browser
- Splits content into sentence-like segments
- Highlights one active sentence at a time
- Uses Tab and Shift+Tab to move between sentences
- Scrolls the active sentence into view
- Uses the minimum practical permissions for a local extension workflow

## Important limitation

Chrome's built-in PDF viewer is a sandboxed web page and does not expose the PDF text directly to extensions in a fully reliable way. This project uses the best supported approach available in the extension environment: it inspects the current document content rendered in the active tab and attempts to extract visible text for the current PDF page. In many cases, that works well for simple or text-based PDFs, but complex, scanned, or image-based PDFs may not produce usable text.

## Installation

1. Clone or download this project.
2. Open Chrome and navigate to chrome://extensions.
3. Enable "Developer mode".
4. Click "Load unpacked" and select this project folder.

## Usage

1. Open a PDF document in Chrome.
2. Click the extension icon.
3. Press "Process current PDF".
4. Use Tab to move to the next sentence and Shift+Tab to move to the previous sentence.

## Project structure

- manifest.json — Manifest V3 configuration
- background.js — Background service worker
- content.js — Main content script that detects and processes the PDF page
- popup.html / popup.js — Extension popup UI
- modules/
  - text-utils.js — Sentence splitting and cleanup helpers
  - sentence-overlay.js — Highlighting and sentence navigation overlay

## Development notes

- The extension processes everything locally in the browser.
- No network requests are made by the extension.
- The implementation is intentionally modular and production-oriented so it can be extended later.

## Testing checklist

- Load the extension in Chrome.
- Open a local or remote PDF.
- Click the extension icon and process the page.
- Verify that the first sentence is highlighted.
- Press Tab and Shift+Tab to move through the sentences.
- Confirm that the active sentence remains visible on screen.
