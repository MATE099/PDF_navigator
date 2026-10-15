// Builds and downloads a Markdown file of bookmarked sentences.

// "https://site.com/papers/My%20Paper.pdf?x=1" -> "My Paper"
export function getDocumentName(url) {
  try {
    const lastSegment = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
    const name = decodeURIComponent(lastSegment).replace(/\.pdf$/i, '').trim();
    return name || 'document';
  } catch {
    return 'document';
  }
}

// Keeps file names safe on Windows, macOS and Linux.
export function getExportFileName(url) {
  const safeName = getDocumentName(url)
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${safeName || 'document'}-bookmarks.md`;
}

export function buildBookmarksMarkdown({ url, sentences, pages = [], bookmarks, exportedAt = new Date() }) {
  const lines = [
    `# Bookmarks: ${getDocumentName(url)}`,
    '',
    `- Source: ${url}`,
    `- Exported: ${exportedAt.toISOString().slice(0, 10)}`,
    `- Bookmarks: ${bookmarks.length}`,
    ''
  ];

  bookmarks.forEach((index) => {
    const page = pages[index];
    const location = page ? `Page ${page}, sentence ${index + 1}` : `Sentence ${index + 1}`;
    lines.push(`## ${location}`, '', `> ${sentences[index]}`, '');
  });

  return lines.join('\n');
}

export function downloadTextFile(fileName, content, mimeType = 'text/markdown') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Give the browser a moment to start the download before freeing the blob.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
