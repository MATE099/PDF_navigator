// Wrapper around the browser's built-in text-to-speech (Web Speech API).

// Every speak/stop call bumps this token, so callbacks from an older, cancelled
// utterance can tell they are stale and do nothing.
let speechToken = 0;

export function isSpeechSupported() {
  return typeof globalThis.speechSynthesis !== 'undefined' && typeof globalThis.SpeechSynthesisUtterance === 'function';
}

export function speak(text, { rate = 1, onEnd, onError } = {}) {
  if (!isSpeechSupported()) {
    onError?.(new Error('Text-to-speech is not supported in this browser.'));
    return;
  }

  const token = ++speechToken;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;

  utterance.onend = () => {
    if (token === speechToken) {
      onEnd?.();
    }
  };

  utterance.onerror = (event) => {
    // "interrupted"/"canceled" happen whenever we stop speech on purpose.
    if (token === speechToken && event.error !== 'interrupted' && event.error !== 'canceled') {
      onError?.(new Error(event.error || 'Speech failed.'));
    }
  };

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  speechToken += 1;
  if (isSpeechSupported()) {
    speechSynthesis.cancel();
  }
}
