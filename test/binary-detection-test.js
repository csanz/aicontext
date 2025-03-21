const { BINARY_EXTENSIONS } = require('../lib/constants');
const path = require('path');
const fs = require('fs');

// Test checking large number of binary extensions for performance impact
console.time('Binary detection test');

// Create a dummy path with each binary extension
const dummyFiles = BINARY_EXTENSIONS.map(ext => `/path/to/test${ext}`);

// Run detection 1000 times to see if it's causing the delay
for (let i = 0; i < 1000; i++) {
  for (const file of dummyFiles) {
    const ext = path.extname(file);
    const result = BINARY_EXTENSIONS.includes(ext);
  }
}

console.timeEnd('Binary detection test');

// Test if checking binary content is slow (using regex)
console.time('Binary content detection');
const testDir = path.join(__dirname, 'binary-test-files');
const files = fs.readdirSync(testDir).slice(0, 10); // Get first 10 files

for (let i = 0; i < 100; i++) {
  for (const file of files) {
    const filePath = path.join(testDir, file);
    try {
      // Skip directories
      if (fs.statSync(filePath).isDirectory()) continue;
      
      // Check if file is too large
      const size = fs.statSync(filePath).size;
      if (size > 1024 * 50) continue; // Skip files larger than 50 KB
      
      // Read file
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for binary content using regex
      const isBinary = /[\x00-\x08\x0E-\x1F]/.test(content);
    } catch (error) {
      // Ignore errors
    }
  }
}
console.timeEnd('Binary content detection');

console.time('Exit delay');
setTimeout(() => {
  console.timeEnd('Exit delay');
  console.log('Done');
}, 500); 