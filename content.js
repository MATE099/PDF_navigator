// Chrome loads content scripts as classic scripts, so static `import` statements fail.
// This loader pulls in the real ES module (content-main.js) with a dynamic import instead.
(async () => {
  try {
    await import(chrome.runtime.getURL('content-main.js'));
  } catch (error) {
    console.error('PDF Sentence Navigator failed to load:', error);
  }
})();
