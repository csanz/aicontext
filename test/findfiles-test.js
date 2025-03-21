const { findFiles } = require('../lib/fileUtils');
const path = require('path');

async function testFindFiles() {
  console.time('Find files');
  const absolutePath = path.resolve('.');
  
  const result = await findFiles({
    dir: absolutePath,
    verbose: true,
    maxFileSizeMb: 1
  });
  
  console.timeEnd('Find files');
  console.log(`Found ${result.files.length} files`);
  console.log(`Total execution time: ${result.executionTime}ms`);
  console.log(`Skipped ${result.skippedFiles.totalSkipped} files`);

  // Test if there's a delay at program exit
  console.log('\nPerforming cleanup and exiting...');
  console.time('Exit delay before process.exit');
  
  // Force immediate exit to avoid hanging
  setTimeout(() => {
    console.timeEnd('Exit delay before process.exit');
    console.log('Forcing exit with process.exit(0)');
    process.exit(0);
  }, 100);
}

testFindFiles().catch(error => {
  console.error(error);
  process.exit(1);
}); 