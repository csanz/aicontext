/**
 * This test is designed to identify the cause of the delay when exiting the process.
 * It will test various configurations of the program to see which aspects cause slowdown.
 */

const chalk = require('chalk');
const minimatch = require('minimatch');
const { encode } = require('gpt-3-encoder');

// Test 1: Basic Node.js exit
function testBasicExit() {
  console.log(chalk.blue('Test 1: Basic Node.js exit'));
  console.time('Exit delay');
  setTimeout(() => {
    console.timeEnd('Exit delay');
    console.log('Done with Test 1');
    
    // Move to next test
    testWithChalk();
  }, 100);
}

// Test 2: Exit with chalk module loaded
function testWithChalk() {
  console.log(chalk.blue('Test 2: Exit with chalk module loaded'));
  // Use chalk to see if it's causing any issues
  console.log(chalk.green('Testing chalk'));
  console.log(chalk.red('Testing chalk'));
  console.log(chalk.yellow('Testing chalk'));
  
  console.time('Exit delay with chalk');
  setTimeout(() => {
    console.timeEnd('Exit delay with chalk');
    console.log('Done with Test 2');
    
    // Move to next test
    testWithMinimatch();
  }, 100);
}

// Test 3: Exit with minimatch module loaded
function testWithMinimatch() {
  console.log(chalk.blue('Test 3: Exit with minimatch module loaded'));
  // Use minimatch to see if it's causing any issues
  const result1 = minimatch('test.js', '*.js');
  const result2 = minimatch('test.txt', '*.js');
  console.log(`Minimatch results: ${result1}, ${result2}`);
  
  console.time('Exit delay with minimatch');
  setTimeout(() => {
    console.timeEnd('Exit delay with minimatch');
    console.log('Done with Test 3');
    
    // Move to next test
    testWithEncoder();
  }, 100);
}

// Test 4: Exit with encoder module loaded
function testWithEncoder() {
  console.log(chalk.blue('Test 4: Exit with encoder module loaded'));
  // Use the encoder to see if it's causing any issues
  const tokens = encode('This is a test string');
  console.log(`Encoder result: ${tokens.length} tokens`);
  
  console.time('Exit delay with encoder');
  setTimeout(() => {
    console.timeEnd('Exit delay with encoder');
    console.log('Done with Test 4');
    
    // Move to next test
    testWithAllModules();
  }, 100);
}

// Test 5: Exit with all modules loaded and used
function testWithAllModules() {
  console.log(chalk.blue('Test 5: Exit with all modules loaded and used'));
  // Use all modules
  console.log(chalk.green('Testing with all modules'));
  const matchResult = minimatch('test.js', '*.js');
  const tokenCount = encode('This is a test with all modules').length;
  
  console.log(`Minimatch: ${matchResult}, Tokens: ${tokenCount}`);
  
  console.time('Exit delay with all modules');
  setTimeout(() => {
    console.timeEnd('Exit delay with all modules');
    console.log('Done with Test 5');
    
    console.log(chalk.green('\nAll tests completed'));
  }, 100);
}

// Start the tests
testBasicExit(); 