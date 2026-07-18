# Local PDF Sentence Navigator

A Chrome extension that detects PDF documents, extracts text locally, splits it into sentences, and lets you move through them with Tab and Shift+Tab.

## Features

- Detects PDF documents opened in Chrome
- Extracts text locally in the browser with a bundled PDF parser
- Splits content into sentence-like segments with PDF-aware cleanup
- Shows a focused navigation panel with active sentence progress
- Uses Tab and Shift+Tab to move between sentences
- Lets you dismiss the overlay with Escape
- Uses a reduced permission set for a local extension workflow

## Important limitation

Chrome's built-in PDF viewer is a sandboxed web page and does not expose the PDF text directly to extensions in a fully reliable way. This project now works around that by fetching the current PDF URL into the extension, parsing it locally with a bundled PDF parser, and then rendering the sentence overlay in the active tab. If that direct parsing path fails, the extension falls back to extracting visible text from the current page. Complex, scanned, image-based, or access-restricted PDFs may still fail to produce usable text.

## Installation

1. Clone or download this project.
2. Run `npm install` in the project folder so the bundled PDF parser dependency is installed and synced into `vendor/pdfjs`.
3. Open Chrome and navigate to chrome://extensions.
4. Enable "Developer mode".
5. Click "Load unpacked" and select this project folder.

## Usage

1. Open a PDF document in Chrome.
2. Click the extension icon.
3. Press "Process current PDF".
4. Use Tab to move to the next sentence, Shift+Tab to move to the previous sentence, and Escape to dismiss the overlay.

## Project structure

- manifest.json — Manifest V3 configuration
- background.js — Background service worker that fetches and parses the current PDF
- content.js — Content script that renders the sentence overlay and provides a DOM-text fallback
- popup.html / popup.js — Extension popup UI
- vendor/pdfjs/ — Bundled PDF.js runtime files used by the extension
- scripts/sync-pdfjs.mjs — Syncs vendored PDF.js files from `node_modules`
- modules/
  - text-utils.js — Sentence splitting and cleanup helpers
  - sentence-overlay.js — Highlighting and sentence navigation overlay
- tests/
  - text-utils.test.js — Sentence cleanup and splitting coverage

## Development notes

- The extension processes PDF text locally in the browser after fetching the current PDF source.
- Remote PDFs may be requested again from their original URL so they can be parsed locally by the extension.
- No PDF content is sent to third-party analysis services.
- The implementation is intentionally modular and production-oriented so it can be extended later.

## Verification

- Run `npm run verify` to execute syntax checks and unit tests.
- Run `npm run sync:pdfjs` if you update `pdfjs-dist` and want to refresh the vendored runtime files.

## Testing checklist

- Load the extension in Chrome.
- Open a local or remote PDF.
- Click the extension icon and process the page.
- Verify that the navigation panel opens and the first sentence is highlighted.
- Press Tab and Shift+Tab to move through the sentences.
- Press Escape and confirm the overlay closes cleanly.
- Confirm that the active sentence remains visible inside the navigation panel.
