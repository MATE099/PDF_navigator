const button = document.getElementById('processButton');
const status = document.getElementById('status');

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

button.addEventListener('click', () => {
  setStatus('Inspecting the active tab…');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      setStatus(chrome.runtime.lastError.message || 'Failed to query the active tab.', true);
      return;
    }

    const tab = tabs?.[0];
    if (!tab?.id) {
      setStatus('No active tab was found.', true);
      return;
    }

    chrome.runtime.sendMessage({ type: 'request-process-pdf', tabId: tab.id }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus(chrome.runtime.lastError.message || 'The extension could not send the request.', true);
        return;
      }

      if (response?.ok) {
        setStatus('Processing the current PDF…');
      } else {
        setStatus(response?.error || 'Processing failed.', true);
      }
    });
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'pdf-processing-complete') {
    setStatus(`Processed ${message.count} sentence${message.count === 1 ? '' : 's'}.`);
  }

  if (message?.type === 'pdf-processing-failed') {
    setStatus(message.message || 'The extension could not extract text from this PDF.', true);
  }
});
