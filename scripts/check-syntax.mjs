// Runs `node --check` on every project JavaScript file (skipping vendored and installed code).
import { readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IGNORED_DIRS = new Set(['node_modules', 'vendor', '.git']);

async function findScripts(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name)) {
      files.push(...await findScripts(fullPath));
    } else if (/\.(m?js)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const files = await findScripts(projectRoot);
  let failed = false;

  for (const file of files) {
    try {
      await run(process.execPath, ['--check', file]);
    } catch (error) {
      failed = true;
      console.error(`Syntax error in ${path.relative(projectRoot, file)}:\n${error.stderr}`);
    }
  }

  console.log(`Checked ${files.length} files.`);
  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
