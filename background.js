import { getDocument, GlobalWorkerOptions } from './vendor/pdfjs/pdf.mjs';
import { splitIntoSentences, sanitizeSentence } from './modules/text-utils.js';

GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdfjs/pdf.worker.mjs');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'request-process-pdf') {
    processCurrentPdf(message.tabId)
      .then((result) => {
        if (!result?.ok) {
          sendResponse({ ok: false, error: result?.error || 'Processing failed.' });
          return;
        }

        sendResponse({ ok: true, count: result.count });
      })
      .catch((error) => {
        chrome.runtime.sendMessage({ type: 'pdf-processing-failed', message: error?.message || 'Processing failed.' });
        sendResponse({ ok: false, error: error?.message || 'Processing failed.' });
      });
    return true;
  }

  return false;
});

function getTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'Failed to query the current tab.'));
        return;
      }

      if (!tab?.id) {
        reject(new Error('No active tab was found.'));
        return;
      }

      resolve(tab);
    });
  });
}

function getActiveTabId() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'Failed to query active tab.'));
        return;
      }

      if (!tabs || !tabs.length || !tabs[0].id) {
        reject(new Error('No active tab was found.'));
        return;
      }

      resolve(tabs[0].id);
    });
  });
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'The current tab did not respond to the request.'));
        return;
      }

      resolve(response);
    });
  });
}

function isLikelyPdfUrl(url) {
  return /\.pdf($|[?#])/i.test(url || '');
}

async function fetchPdfBytes(url) {
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    throw new Error(`Failed to fetch the PDF (${response.status}).`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/pdf') && !isLikelyPdfUrl(url)) {
    throw new Error('The current tab does not point to a PDF file.');
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function extractPdfTextFromBytes(pdfBytes) {
  const loadingTask = getDocument({ data: pdfBytes });

  try {
    const pdfDocument = await loadingTask.promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const textFragments = [];

      textContent.items.forEach((item) => {
        if (!('str' in item) || !item.str) {
          return;
        }

        textFragments.push(item.str);

        if ('hasEOL' in item && item.hasEOL) {
          textFragments.push('\n');
        } else {
          textFragments.push(' ');
        }
      });

      pages.push(textFragments.join('').trim());
    }

    return pages.join('\n');
  } finally {
    if (typeof loadingTask.destroy === 'function') {
      await loadingTask.destroy();
    }
  }
}

function buildSentences(rawText) {
  return splitIntoSentences(rawText)
    .map(sanitizeSentence)
    .filter(Boolean);
}

async function processPdfViaBackground(tabId) {
  const tab = await getTab(tabId);
  const url = tab.url;

  if (!url) {
    throw new Error('The active tab does not have a readable URL.');
  }

  const pdfBytes = await fetchPdfBytes(url);
  const rawText = await extractPdfTextFromBytes(pdfBytes);
  const sentences = buildSentences(rawText);

  if (!sentences.length) {
    throw new Error('No sentences were found in the loaded PDF.');
  }

  const renderResult = await sendMessageToTab(tabId, { type: 'render-pdf-sentences', sentences });
  if (!renderResult?.ok) {
    throw new Error(renderResult?.error || 'The PDF text was extracted, but the page could not render it.');
  }

  chrome.runtime.sendMessage({ type: 'pdf-processing-complete', count: sentences.length });
  return { ok: true, count: sentences.length };
}

async function processPdfViaContentScript(tabId, originalError) {
  try {
    const response = await sendMessageToTab(tabId, { type: 'process-pdf' });

    if (!response?.ok) {
      return { ok: false, error: response?.error || originalError?.message || 'Processing failed.' };
    }

    return response;
  } catch (fallbackError) {
    return {
      ok: false,
      error: originalError?.message || fallbackError?.message || 'Processing failed.'
    };
  }
}

async function processCurrentPdf(tabId) {
  const targetTabId = tabId || await getActiveTabId();

  if (!targetTabId) {
    throw new Error('No active tab was supplied.');
  }

  try {
    return await processPdfViaBackground(targetTabId);
  } catch (error) {
    return processPdfViaContentScript(targetTabId, error);
  }
}
