const fs = require('fs');
const path = require('path');
const { shouldProcessFile } = require('../../lib/fileUtils');

// Get all files in the test directory
console.log('Testing file exclusion logic on test_ignore directory:');
console.log('----------------------------------------------------');

// Set the correct path to test_ignore directory
const TEST_IGNORE_DIR = path.join(__dirname, '../../test_ignore');

// List all files in the test directory recursively
function getAllFiles(dir) {
  const files = [];
  const traverse = (currentDir) => {
    fs.readdirSync(currentDir).forEach(file => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        traverse(filePath);
      } else {
        files.push(filePath);
      }
    });
  };
  
  traverse(dir);
  return files;
}

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
  fs.writeFileSync(path.join(TEST_IGNORE_DIR, 'file.o'), 'binary content');
  fs.writeFileSync(path.join(TEST_IGNORE_DIR, 'file.d'), 'binary content');
  fs.writeFileSync(path.join(TEST_IGNORE_DIR, 'file.obj'), 'binary content');
  fs.writeFileSync(path.join(TEST_IGNORE_DIR, 'file.rcgu.o'), 'binary content');
  
  console.log('Sample files created successfully!');
}

// Get all files
const allFiles = getAllFiles(TEST_IGNORE_DIR);

// Check each file individually
console.log('File exclusion results:');
console.log('---------------------');
allFiles.forEach(file => {
  const shouldProcess = shouldProcessFile(file);
  const relativePath = path.relative(process.cwd(), file);
  console.log(`${shouldProcess ? '✓ INCLUDE' : '✗ EXCLUDE'} ${relativePath}`);
});

// Summary
const includedFiles = allFiles.filter(file => shouldProcessFile(file));
const excludedFiles = allFiles.filter(file => !shouldProcessFile(file));

console.log('\nSummary:');
console.log('--------');
console.log(`Total files: ${allFiles.length}`);
console.log(`Files included: ${includedFiles.length}`);
console.log(`Files excluded: ${excludedFiles.length}`);

// Check specific patterns
console.log('\nPattern checks:');
console.log('--------------');
const binaryFiles = allFiles.filter(file => path.extname(file) === '.o' || 
                                           path.extname(file) === '.d' || 
                                           path.extname(file) === '.obj' ||
                                           file.includes('.rcgu.o'));
const indexFiles = allFiles.filter(file => path.basename(file).startsWith('index-') && 
                                          path.basename(file).endsWith('.js'));

console.log(`Binary files (should all be excluded): ${binaryFiles.length}`);
const allBinaryExcluded = binaryFiles.every(file => !shouldProcessFile(file));
console.log(`All binary files excluded: ${allBinaryExcluded ? 'YES ✓' : 'NO ✗'}`);

console.log(`Index-*.js files (should all be excluded): ${indexFiles.length}`);
const allIndexExcluded = indexFiles.every(file => !shouldProcessFile(file));
console.log(`All index-*.js files excluded: ${allIndexExcluded ? 'YES ✓' : 'NO ✗'}`);

// Check if regular.js is included (it should be)
const regularJsFile = allFiles.find(file => path.basename(file) === 'regular.js');
if (regularJsFile) {
  const isIncluded = shouldProcessFile(regularJsFile);
  console.log(`Regular JS file included: ${isIncluded ? 'YES ✓' : 'NO ✗'}`);
} 