const minimatch = require('minimatch');
const path = require('path');
const fs = require('fs');

// Get all files in the test directory
console.log('Testing ignore pattern matching:');
console.log('-----------------------------');

// Set the correct path to test_ignore directory
const TEST_IGNORE_DIR = path.join(__dirname, '../../test_ignore');

// Check if the test_ignore directory exists
if (!fs.existsSync(TEST_IGNORE_DIR)) {
  console.log(`The test_ignore directory does not exist at: ${TEST_IGNORE_DIR}`);
  console.log('Creating test_ignore directory with sample files for testing...');
  
  // Create the test_ignore directory structure
  fs.mkdirSync(path.join(TEST_IGNORE_DIR, 'index'), { recursive: true });
  
  // Create sample files
  fs.writeFileSync(path.join(TEST_IGNORE_DIR, 'index', 'index-123.js'), 'console.log("test file");');
  fs.writeFileSync(path.join(TEST_IGNORE_DIR, 'index', 'index-Dq8qZWpM.js'), 'console.log("test file");');
  fs.writeFileSync(path.join(TEST_IGNORE_DIR, 'index', 'index-abcdef.js'), 'console.log("test file");');
  fs.writeFileSync(path.join(TEST_IGNORE_DIR, 'regular.js'), 'console.log("regular file");');
  
  console.log('Sample files created successfully!');
}

// Test files (using absolute paths to match exactly how they'd be processed)
const testFiles = [
  path.join(TEST_IGNORE_DIR, 'index', 'index-123.js'),
  path.join(TEST_IGNORE_DIR, 'index', 'index-Dq8qZWpM.js'),
  path.join(TEST_IGNORE_DIR, 'index', 'index-abcdef.js'),
  path.join(TEST_IGNORE_DIR, 'regular.js')
];

// Test patterns
const patterns = [
  'index-*.js',
  '**/index-*.js',
  path.join(TEST_IGNORE_DIR, 'index', 'index-*.js').replace(/\\/g, '/')
];

console.log('\nTesting pattern matching:');
patterns.forEach(pattern => {
  console.log(`\nPattern: ${pattern}`);
  testFiles.forEach(file => {
    // Convert paths to use forward slashes for consistent matching across platforms
    const normalizedFile = file.replace(/\\/g, '/');
    const isMatch = minimatch(normalizedFile, pattern);
    console.log(`  ${isMatch ? '✓' : '✗'} ${normalizedFile}`);
  });
});

// Test with different pattern styles
console.log('\nTesting with different pattern styles:');
testFiles.forEach(file => {
  const basename = path.basename(file);
  const normalizedFile = file.replace(/\\/g, '/');
  console.log(`\nFile: ${normalizedFile} (basename: ${basename})`);
  
  console.log(`  Direct basename check: ${basename.startsWith('index-') && basename.endsWith('.js')}`);
  console.log(`  Minimatch with basename: ${minimatch(basename, 'index-*.js')}`);
  console.log(`  Minimatch with full path: ${minimatch(normalizedFile, '**/index-*.js')}`);
  console.log(`  Minimatch with relative path: ${minimatch(normalizedFile, 'index-*.js', { matchBase: true })}`);
}); 