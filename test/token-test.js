const fs = require('fs');
const { encode } = require('gpt-3-encoder');
const path = require('path');

// Read a large file
console.time('Read file');
const largePath = path.join(__dirname, 'test-commands.js');
const content = fs.readFileSync(largePath, 'utf8');
console.timeEnd('Read file');

// Test encoding speed
console.time('Encode all at once');
const tokens = encode(content);
console.timeEnd('Encode all at once');
console.log(`Total tokens: ${tokens.length}`);

// Test encoding in smaller chunks
console.time('Encode in chunks');
const lines = content.split('\n');
let totalTokens = 0;
for (const line of lines) {
  totalTokens += encode(line).length;
}
console.timeEnd('Encode in chunks');
console.log(`Total tokens (chunks): ${totalTokens}`);

// Dummy test to simulate the end of program delay
console.time('End delay');
setTimeout(() => {
  console.timeEnd('End delay');
  console.log('Done');
}, 500); 