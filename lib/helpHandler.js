const fs = require('fs');
const path = require('path');
const switches = require('./switches.json');
const readline = require('readline');

async function showInteractiveHelp() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    while (true) {
      // Clear screen
      console.clear();
      
      // Show categories
      console.log('\n📚 AICTX Help Categories');
      console.log('====================\n');
      
      const categories = Object.keys(switches.categories);
      categories.forEach((cat, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${cat.padEnd(12)} - ${switches.categories[cat].description}`);
      });
      console.log('\n 0. Exit');

      // Get user choice
      const answer = await new Promise(resolve => {
        rl.question('\nSelect a category (0-' + categories.length + '): ', resolve);
      });

      if (answer === '0') {
        console.log('\nGoodbye! 👋\n');
        break;
      }

      const selectedIndex = parseInt(answer) - 1;
      if (selectedIndex >= 0 && selectedIndex < categories.length) {
        const category = categories[selectedIndex];
        
        // Clear screen
        console.clear();
        
        // Show detailed help for selected category
        showCategoryHelp(category);
        
        // Wait for user to press enter
        await new Promise(resolve => {
          rl.question('\nPress Enter to return to menu...', resolve);
        });
      } else {
        console.log('\n❌ Invalid selection. Press Enter to try again...');
        await new Promise(resolve => rl.question('', resolve));
      }
    }
  } finally {
    rl.close();
  }
}

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
  console.log('  cx -h <category>     Show help for specific category');
  console.log('  cx --more            Interactive help menu\n');

  // Display all available options without big titles
  console.log('Options:');
  console.log('--------');
  Object.entries(switches.categories).forEach(([cat, data]) => {
    Object.entries(data.commands).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(20)} ${desc}`);
    });
  });

  console.log('\nCommon Examples:');
  console.log('--------------');
  switches.categories.basic.examples.slice(0, 2).forEach(example => {
    console.log(`  ${example}`);
  });
  
  console.log('\nBinary File Handling:');
  console.log('------------------');
  console.log('  Binary files (like .o, .exe, .dll) are automatically excluded');
  console.log('  Use -i/--ignore to add custom exclusion patterns');
  console.log('  Example: cx -i "target/**" # Exclude Rust target directory');

  console.log('\nTip: Use "cx --more" for an interactive help menu.\n');
}

module.exports = {
  showHelp,
  showInteractiveHelp
}; 