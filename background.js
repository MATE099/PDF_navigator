chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'request-process-pdf') {
    processCurrentPdf(message.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        chrome.runtime.sendMessage({ type: 'pdf-processing-failed', message: error?.message || 'Processing failed.' });
        sendResponse({ ok: false, error: error?.message || 'Processing failed.' });
      });
    return true;
  }

  return false;
});

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

async function processCurrentPdf(tabId) {
  const targetTabId = tabId || await getActiveTabId();

  if (!targetTabId) {
    throw new Error('No active tab was supplied.');
  }

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(targetTabId, { type: 'process-pdf' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'The current tab did not respond to the request.'));
        return;
      }
      resolve(response);
    });
  });
}