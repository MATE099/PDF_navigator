import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'node_modules', 'pdfjs-dist', 'legacy', 'build');
const targetDir = path.join(projectRoot, 'vendor', 'pdfjs');

async function main() {
  await mkdir(targetDir, { recursive: true });
  await cp(path.join(sourceDir, 'pdf.mjs'), path.join(targetDir, 'pdf.mjs'), { force: true });
  await cp(path.join(sourceDir, 'pdf.worker.mjs'), path.join(targetDir, 'pdf.worker.mjs'), { force: true });
  console.log('Synced PDF.js assets to vendor/pdfjs.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
