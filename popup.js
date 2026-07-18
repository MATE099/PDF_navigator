const button = document.getElementById('processButton');
const status = document.getElementById('status');
let isProcessing = false;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function setProcessingState(nextValue) {
  isProcessing = nextValue;
  button.disabled = nextValue;
  button.textContent = nextValue ? 'Processing PDF…' : 'Process current PDF';
}

function isRestrictedUrl(url) {
  return /^(chrome|edge|about|chrome-extension):/i.test(url || '');
}

function queryActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'Failed to query the active tab.'));
        return;
      }

      resolve(tabs?.[0] || null);
    });
  });
}

async function refreshPopupState() {
  try {
    const tab = await queryActiveTab();
    if (!tab?.id) {
      setStatus('No active tab was found.', true);
      button.disabled = true;
      return;
    }

    if (isRestrictedUrl(tab.url)) {
      setStatus('Chrome internal pages cannot be processed. Open a PDF in a normal tab.', true);
      button.disabled = true;
      return;
    }

    button.disabled = false;
    setStatus('Ready to process the active tab.');
  } catch (error) {
    setStatus(error.message || 'Failed to inspect the active tab.', true);
    button.disabled = true;
  }
}

button.addEventListener('click', async () => {
  if (isProcessing) {
    return;
  }

  setProcessingState(true);
  setStatus('Inspecting the active tab…');

  try {
    const tab = await queryActiveTab();
    if (!tab?.id) {
      setStatus('No active tab was found.', true);
      return;
    }

    if (isRestrictedUrl(tab.url)) {
      setStatus('Chrome internal pages cannot be processed. Open a PDF in a normal tab.', true);
      return;
    }

    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'request-process-pdf', tabId: tab.id }, (nextResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || 'The extension could not send the request.'));
          return;
        }

        resolve(nextResponse);
      });
    });

    if (response?.ok) {
      setStatus('Rendering the sentence navigator…');
    } else {
      setStatus(response?.error || 'Processing failed.', true);
    }
  } catch (error) {
    setStatus(error.message || 'Processing failed.', true);
  } finally {
    setProcessingState(false);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'pdf-processing-complete') {
    setProcessingState(false);
    setStatus(`Processed ${message.count} sentence${message.count === 1 ? '' : 's'}.`);
  }

  if (message?.type === 'pdf-processing-failed') {
    setProcessingState(false);
    setStatus(message.message || 'The extension could not extract text from this PDF.', true);
  }
});

refreshPopupState();
