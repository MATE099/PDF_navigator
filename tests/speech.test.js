import test from 'node:test';
import assert from 'node:assert/strict';

import { isSpeechSupported, speak, stopSpeaking } from '../modules/speech.js';

// Fake Web Speech API that just records what would have been spoken.
function installFakeSpeech() {
  const spoken = [];
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  globalThis.speechSynthesis = {
    cancel() {},
    speak(utterance) {
      spoken.push(utterance);
    }
  };
  return spoken;
}

function removeFakeSpeech() {
  delete globalThis.SpeechSynthesisUtterance;
  delete globalThis.speechSynthesis;
}

test('reports missing speech support and calls onError', () => {
  removeFakeSpeech();
  let error = null;

  assert.equal(isSpeechSupported(), false);
  speak('Hello', { onError: (value) => { error = value; } });
  assert.match(error.message, /not supported/);
});

test('speaks text with the requested rate', () => {
  const spoken = installFakeSpeech();
  speak('Hello there', { rate: 1.5 });

  assert.equal(spoken[0].text, 'Hello there');
  assert.equal(spoken[0].rate, 1.5);
  removeFakeSpeech();
});

test('ignores the end event of an utterance that was replaced', () => {
  const spoken = installFakeSpeech();
  const ended = [];

  speak('first', { onEnd: () => ended.push('first') });
  speak('second', { onEnd: () => ended.push('second') });
  spoken[0].onend();
  spoken[1].onend();

  assert.deepEqual(ended, ['second']);
  removeFakeSpeech();
});

test('ignores callbacks after stopSpeaking', () => {
  const spoken = installFakeSpeech();
  let ended = false;

  speak('text', { onEnd: () => { ended = true; } });
  stopSpeaking();
  spoken[0].onend();

  assert.equal(ended, false);
  removeFakeSpeech();
});

test('treats interruptions as normal but reports real errors', () => {
  const spoken = installFakeSpeech();
  const errors = [];

  speak('text', { onError: (error) => errors.push(error.message) });
  spoken[0].onerror({ error: 'interrupted' });
  spoken[0].onerror({ error: 'synthesis-failed' });

  assert.deepEqual(errors, ['synthesis-failed']);
  removeFakeSpeech();
});
