const fs = require('fs');
const path = require('path');
const switches = require('./switches.json');
const readline = require('readline');

function showCategoryHelp(category) {
  const categoryData = switches.categories[category];
  
  if (!categoryData) {
    console.log(`\n❌ Unknown category: ${category}`);
    console.log('\nAvailable categories:');
    Object.keys(switches.categories).forEach(cat => {
      console.log(`  - ${cat}`);
    });
    return;
  }
  
  console.log(`\n${category.toUpperCase()} Commands`);
  console.log('='.repeat(category.length + 9));
  console.log(`\n${categoryData.description}\n`);
  
  console.log('Commands:');
  console.log('---------');
  Object.entries(categoryData.commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(20)} ${desc}`);
  });

  console.log('\nExamples:');
  console.log('---------');
  categoryData.examples.forEach(example => {
    console.log(`  ${example}`);
  });
  
  console.log('\nNotes:');
  console.log('------');
  categoryData.notes.forEach(note => {
    console.log(`  • ${note}`);
  });
  console.log('');
}

function showHelp(category = null) {
  if (category) {
    showCategoryHelp(category);
    return;
  }

  console.log('\nUsage: cx <directory> [options]');
  console.log('\nQuick Help:');
  console.log('  cx -h <category>     Show help for specific category\n');

  console.log('Options:');
  console.log('  -h, --help           Show help information');
  console.log('  --version            Show current version');
  console.log('  --configure          Set up configuration');
  console.log('  --show               Show current configuration');
  console.log('  --load-cursor-rules  Load and import cursor rules to .cursor/rules/');
  console.log('  --clear              Remove all generated context files insid ./code folder');
  console.log('  -s, --snap           Create a snapshot in context/snap');
  console.log('  -m "message"         Add a message to the context file');
  console.log('  -i, --ignore <pattern> Add a glob pattern to exclude files/directories');
  console.log('  --show-ignore        Show current exclusion patterns\n');

  console.log('Examples:');
  console.log('    cx ./ -m "hello world"  # Will generate context files and add "hello-world" to the name');
  console.log('    cx -i "target/**"       # Exclude Rust target directory');
  console.log('    cx ./ -s -m "before refactor"  # Create a snapshot with a message');
  console.log('    cx --clear-all          # Remove all context files and directories\n');
}

module.exports = {
  showHelp
}; 