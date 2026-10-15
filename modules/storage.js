// Thin async wrapper around chrome.storage.local.
// Every PDF gets one record ({ position, ... }) keyed by its URL without the #hash.

const DEFAULT_DOCUMENT_STATE = { position: 0 };

export function getDocumentKey(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return `doc:${parsed.href}`;
  } catch {
    return `doc:${url}`;
  }
}

function getStorageArea() {
  return globalThis.chrome?.storage?.local || null;
}

export async function readValue(key, fallback) {
  const area = getStorageArea();
  if (!area) {
    return fallback;
  }

  try {
    const result = await area.get(key);
    return result?.[key] ?? fallback;
  } catch (error) {
    console.warn('PDF Sentence Navigator could not read storage:', error);
    return fallback;
  }
}

export async function writeValue(key, value) {
  const area = getStorageArea();
  if (!area) {
    return;
  }

  try {
    await area.set({ [key]: value });
  } catch (error) {
    console.warn('PDF Sentence Navigator could not write storage:', error);
  }
}

export async function loadDocumentState(url) {
  const saved = await readValue(getDocumentKey(url), {});
  return { ...DEFAULT_DOCUMENT_STATE, ...saved };
}

// Saves run one after another so two quick saves can't overwrite each other's changes.
let saveQueue = Promise.resolve();

// Merges `changes` into the saved record so callers only send what changed.
export function saveDocumentState(url, changes) {
  const task = saveQueue.then(async () => {
    const current = await loadDocumentState(url);
    const next = { ...current, ...changes, updatedAt: Date.now() };
    await writeValue(getDocumentKey(url), next);
    return next;
  });

  saveQueue = task.catch(() => {});
  return task;
}
