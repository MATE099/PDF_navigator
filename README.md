# Local PDF Sentence Navigator

A Chrome extension that detects PDF documents, extracts text locally, splits it into sentences, and lets you read them one at a time from a keyboard-first side panel.

## Features

- Extracts PDF text locally in the browser with a bundled PDF parser (nothing is uploaded)
- Splits content into sentences with PDF-aware cleanup (hyphenation, wrapped lines, abbreviations, initials, acronyms)
- Shows the page of every sentence and joins sentences that continue across a page break
- Keyboard navigation, click-to-jump and "go to sentence number"
- Search with highlighted matches and next/previous match navigation
- Bookmarks, with jumping between them and export to Markdown
- Remembers your reading position for every PDF
- Reading progress bar with estimated time left
- Auto-play mode and read-aloud (text-to-speech) mode
- Light/dark theme and adjustable text size
- Draggable, minimizable panel with a collapsible shortcut list
- `Alt+Shift+P` starts the navigator without opening the popup

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Tab` / `J` | Next sentence |
| `Shift+Tab` / `K` | Previous sentence |
| `Home` / `End` | First / last sentence |
| `G` | Go to a sentence number |
| `/` | Search (`Enter` / `Shift+Enter` for next / previous match, `Esc` to clear) |
| `B` | Bookmark the current sentence |
| `N` / `Shift+N` | Next / previous bookmark |
| `E` | Export bookmarks as Markdown |
| `C` | Copy the current sentence |
| `Space` | Start / pause auto-play |
| `R` | Start / stop reading aloud |
| `+` / `-` | Larger / smaller text |
| `T` | Toggle light / dark theme |
| `M` | Minimize / expand the panel |
| `?` | Show / hide the shortcut list |
| `Esc` | Close the panel |
| `Alt+Shift+P` | Process the current PDF (change it at `chrome://extensions/shortcuts`) |

Drag the panel by its title bar to move it; double-click the title bar to put it back in the corner.

## Important limitation

Chrome's built-in PDF viewer is a sandboxed page and does not expose the PDF text directly to extensions. This project works around that by fetching the current PDF URL into the extension, parsing it locally with a bundled PDF parser, and then rendering the sentence panel in the active tab. If that path fails, the extension falls back to extracting visible text from the current page (without page numbers). Scanned, image-based, or access-restricted PDFs may still fail to produce usable text.

## Installation

1. Clone or download this project.
2. Run `npm install` in the project folder so the bundled PDF parser dependency is installed and synced into `vendor/pdfjs`.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable "Developer mode".
5. Click "Load unpacked" and select this project folder.

## Usage

1. Open a PDF document in Chrome.
2. Click the extension icon and press "Process current PDF", or press `Alt+Shift+P`.
3. Navigate with the shortcuts above. If the shortcut fails, a red `!` badge on the extension icon explains why.

## Project structure

- `manifest.json` — Manifest V3 configuration
- `background.js` — Service worker that fetches and parses the current PDF and handles the keyboard command
- `content.js` — Small content-script loader that dynamically imports `content-main.js` (content scripts cannot use static imports)
- `content-main.js` — Navigation state, shortcuts, playback, bookmarks and the DOM-text fallback
- `popup.html` / `popup.js` — Extension popup UI
- `vendor/pdfjs/` — Bundled PDF.js runtime files
- `scripts/`
  - `sync-pdfjs.mjs` — Syncs vendored PDF.js files from `node_modules`
  - `check-syntax.mjs` — Runs `node --check` on every project script
- `modules/`
  - `text-utils.js` — Sentence splitting, page tagging, word counts and reading-time helpers
  - `sentence-overlay.js` — The navigation panel UI
  - `overlay-styles.js` — Scoped panel CSS and themes
  - `shortcuts.js` — Keyboard shortcut map
  - `search.js` — Search matching and highlighting helpers
  - `navigation.js` — Index and bookmark helpers
  - `storage.js` — Per-PDF saved state (position, bookmarks)
  - `settings.js` — Global preferences (theme, text size, panel layout)
  - `layout.js` — Keeps the panel on screen
  - `speech.js` — Text-to-speech wrapper
  - `clipboard.js` — Copy-to-clipboard helper
  - `export.js` — Markdown export of bookmarks
- `tests/` — Unit tests for every pure module (run with `node --test`)

## Privacy

- PDF text is processed locally in the browser after fetching the current PDF source.
- Remote PDFs may be requested again from their original URL so they can be parsed locally.
- Reading positions, bookmarks and settings are stored only in `chrome.storage.local` on your machine.
- No PDF content is sent to third-party services.

## Development

- `npm run verify` runs syntax checks and all unit tests. GitHub Actions runs it on every push and pull request.
- `npm run sync:pdfjs` refreshes the vendored PDF.js files after updating `pdfjs-dist`.

## Testing checklist

- Load the extension in Chrome and open a local or remote PDF.
- Process the page from the popup and with `Alt+Shift+P`.
- Confirm that the panel opens with page numbers and the first (or last saved) sentence highlighted.
- Try navigation, search, go-to, bookmarks and export.
- Try auto-play (`Space`) and read-aloud (`R`).
- Switch theme and text size, drag and minimize the panel, then reload the PDF and confirm everything was remembered.
- Press `Esc` and confirm the panel closes cleanly.
