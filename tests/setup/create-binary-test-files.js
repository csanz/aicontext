#!/usr/bin/env node

/**
 * This script creates zero-byte test files for each binary extension
 * defined in the BINARY_EXTENSIONS array. These files are used to verify
 * that our file exclusion logic correctly excludes binary files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { BINARY_EXTENSIONS } from '../../lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create test directory
const testDir = path.join(__dirname, 'binary-test-files');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

console.log(`Creating zero-byte test files in ${testDir}...`);

// Create a few sample text files that should be included
const sampleTextExtensions = ['.js', '.txt', '.md', '.html', '.css'];
sampleTextExtensions.forEach(ext => {
  const filePath = path.join(testDir, `sample-text-file${ext}`);
  fs.writeFileSync(filePath, `This is a sample text file with extension ${ext} that should be included.`);
  console.log(`Created sample text file: ${path.basename(filePath)}`);
});

// Create a test log file
const logFilePath = path.join(testDir, 'test.log');
fs.writeFileSync(logFilePath, 'This is a log file that should be excluded.\n2024-03-19 12:34:56 [INFO] Test log entry');
console.log('Created test log file: test.log');

// Create zero-byte files for each binary extension
BINARY_EXTENSIONS.forEach(ext => {
  const fileName = `test-file${ext}`;
  const filePath = path.join(testDir, fileName);
  fs.writeFileSync(filePath, '');
  console.log(`Created zero-byte binary test file: ${fileName}`);
});

// Create a larger non-binary file to test size-based exclusion
const largeFilePath = path.join(testDir, 'large-text-file.txt');
const largeSizeBytes = 1.01 * 1024 * 1024; // 1.01MB - just barely above the 1MB threshold
const largeContent = 'A'.repeat(largeSizeBytes);
fs.writeFileSync(largeFilePath, largeContent);
console.log(`Created large text file: large-text-file.txt (${(largeSizeBytes / (1024 * 1024)).toFixed(2)}MB)`);

console.log('\nTest files created successfully!');
console.log('\nTo test exclusion logic, run:');
console.log('node bin/cx.js test/binary-test-files -v'); 