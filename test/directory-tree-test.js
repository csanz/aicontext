const { dirTree } = require('../lib/directoryTree');
const path = require('path');

// Test directory tree generation performance
console.time('Generate directory tree');
const absolutePath = path.resolve('.');
const tree = dirTree(absolutePath, 4);
console.timeEnd('Generate directory tree');

// Log the size of the generated tree
console.log(`Tree string length: ${tree.length}`);

// Test if there's a delay at the end
console.time('End delay');
setTimeout(() => {
  console.timeEnd('End delay');
  console.log('Done');
}, 500); 