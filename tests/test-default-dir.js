#!/usr/bin/env node

// Verify running cx with no arguments uses the current directory
// and writes a context file with expected summary lines.

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const contextDir = path.join(projectRoot, '.aicontext');
const codeDir = path.join(contextDir, 'code');

function cleanup() {
  if (fs.existsSync(contextDir)) {
    fs.rmSync(contextDir, { recursive: true, force: true });
  }
}

function getLatestContextFile() {
  if (!fs.existsSync(codeDir)) return null;
  const files = fs
    .readdirSync(codeDir)
    .filter(f => /^context-.*\.txt$/.test(f))
    .sort();
  return files.length > 0 ? path.join(codeDir, files[files.length - 1]) : null;
}

function run() {
  cleanup();

  try {
    execSync('node ./bin/cx.js', { cwd: projectRoot, stdio: 'pipe' });

    assert(fs.existsSync(codeDir), 'code directory not created');

    const contextFile = getLatestContextFile();
    assert(contextFile, 'context file was not created');

    const content = fs.readFileSync(contextFile, 'utf8');
    assert(content.includes('## Summary'), 'missing summary header');
    assert(content.includes('Number of files:'), 'missing file count');
    assert(content.includes('Number of tokens:'), 'missing token count');

    console.log('✅ Default directory behavior test passed');
  } catch (error) {
    console.error('❌ Default directory behavior test failed:', error.message);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

run();
