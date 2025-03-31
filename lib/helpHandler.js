const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Define categories and their help information directly in the code
const helpCategories = {
  "basic": {
    "description": "Basic commands for general operation",
    "commands": {
      "-h, --help": "Show help information",
      "--configure": "Set up configuration",
      "--show": "Show current configuration",
      "--clear": "Remove all generated context files",
      "--load-cursor-rules": "Load and import cursor rules to .cursor/rules/"
    },
    "examples": [
      "cx -h                   # Show general help",
      "cx -h basic            # Show help for basic commands",
      "cx --configure         # Start configuration wizard",
      "cx --show             # Display current settings",
      "cx --load-cursor-rules # Load cursor rules"
    ],
    "notes": [
      "Use -h followed by a category name for detailed help",
      "Configuration is stored in ~/.aicontext/config.json"
    ]
  },
  "output": {
    "description": "Control how the output files are generated",
    "commands": {
      "--no-minimize": "Override config to generate uncompressed output",
      "--min": "Force generate a minimized version"
    },
    "examples": [
      "cx ./src --no-minimize  # Generate full output",
      "cx ./src --min         # Force minimized version",
      "cx ./src --min --no-minimize  # Generate both versions"
    ],
    "notes": [
      "Minimized files have .min extension",
      "Compression removes unnecessary whitespace and comments"
    ]
  },
  "snapshots": {
    "description": "Create and manage snapshot versions of your context",
    "commands": {
      "-s, --snap": "Create a snapshot in context/snap",
      "-sm \"message\"": "Create a snapshot with a message",
      "-s -m \"message\"": "Alternative way to create a snapshot with a message"
    },
    "examples": [
      "cx ./src -s            # Create snapshot with timestamp",
      "cx ./src -sm \"v1.0\"   # Create named snapshot",
      "cx ./src -s -m \"v1.0\" # Same as above",
      "cx --clear -s         # Clear all snapshots"
    ],
    "notes": [
      "Snapshots are stored in ./context/snap/",
      "Snapshots include timestamps for versioning",
      "Use messages to make snapshots more identifiable"
    ]
  },
  "ignore": {
    "description": "Manage file and directory exclusion patterns",
    "commands": {
      "--ignore add <pattern>": "Add a glob pattern to exclude files/directories",
      "--ignore show": "Show current exclusion patterns",
      "--ignore clear": "Remove all exclusion patterns",
      "--ignore test": "Test current exclusions with directory tree"
    },
    "examples": [
      "cx --ignore add \"*.log\"         # Exclude all log files",
      "cx --ignore add \"build\"        # Exclude the build directory",
      "cx --ignore add \"./ecs\"        # Exclude specific directory by path",
      "cx --ignore show      # Show all current exclusion patterns",
      "cx --ignore test      # View directory tree with current exclusions",
      "cx --ignore clear     # Clear all exclusion patterns"
    ],
    "notes": [
      "Exclusion patterns are stored in .aicontext/ignore.json in your project directory",
      "Patterns follow glob syntax similar to .gitignore",
      "Directory exclusions work by specifying just the directory name or path",
      "Critical paths like node_modules are always excluded regardless of settings",
      "Each directory can have its own ignore patterns"
    ]
  }
};

function showCategoryHelp(category) {
  const categoryData = helpCategories[category];
  
  if (!categoryData) {
    console.log(`\n❌ Unknown category: ${category}`);
    console.log('\nAvailable categories:');
    Object.keys(helpCategories).forEach(cat => {
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

  console.log('Available Categories:');
  console.log('  basic               Basic commands for general operation');
  console.log('  output              Control how output files are generated');
  console.log('  snapshots           Create and manage snapshot versions');
  console.log('  ignore              Manage file and directory exclusion patterns\n');

  console.log('Options:');
  console.log('  -h, --help           Show help information');
  console.log('  --version            Show current version');
  console.log('  --configure          Set up configuration');
  console.log('  --show               Show current configuration');
  console.log('  --load-cursor-rules  Load and import cursor rules to .cursor/rules/');
  console.log('  --clear              Remove all generated context files insid ./code folder');
  console.log('  -s, --snap           Create a snapshot in context/snap');
  console.log('  -m "message"         Add a message to the context file');
  console.log('  -i, --ignore <pattern> Add a glob pattern to exclude files/directories (stored in .aicontext/ignore.json)');
  console.log('  --show-ignore        Show current exclusion patterns\n');

  console.log('Examples:');
  console.log('    cx ./ -m "hello world"  # Will generate context files and add "hello-world" to the name');
  console.log('    cx -i "target/**"       # Exclude Rust target directory from current working directory');
  console.log('    cx ./ -s -m "before refactor"  # Create a snapshot with a message');
  console.log('    cx --clear-all          # Remove all context files and directories\n');
}

module.exports = {
  showHelp
}; 