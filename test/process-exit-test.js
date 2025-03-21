/**
 * This test demonstrates the impact of process.exit() on application termination
 * It will run two tests:
 * 1. Normal termination (waits for event loop to drain)
 * 2. Forced termination with process.exit()
 * 
 * Run this with: 
 * time node test/process-exit-test.js normal   # to test normal termination 
 * time node test/process-exit-test.js exit     # to test with process.exit()
 */

const { encode } = require('gpt-3-encoder');
const minimatch = require('minimatch');
const chalk = require('chalk');
const fs = require('fs');

// Use the dependencies
const tokens = encode('This is a test string to encode');
const isMatch = minimatch('test.js', '*.js');
console.log(chalk.green('Testing process exit modes:'));
console.log(`Tokens: ${tokens.length}, Match: ${isMatch}`);

// Create and read a small file
fs.writeFileSync('test-exit-temp.txt', 'Testing process exit', 'utf8');
const content = fs.readFileSync('test-exit-temp.txt', 'utf8');
console.log(`File content: ${content}`);

// Check which mode to run in
const mode = process.argv[2] || 'normal';

if (mode === 'exit') {
  console.log(chalk.yellow('Exiting immediately with process.exit(0)'));
  process.exit(0);
} else {
  console.log(chalk.blue('Letting the process terminate normally'));
  console.log('You should observe a delay before this process completes...');
}

// The process should exit once all code is done
// But there may be hanging handles from dependencies 