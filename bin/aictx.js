#!/usr/bin/env node

const generateContext = require('../lib/contextGenerator');
const checkGitIgnore = require('../lib/gitignoreHandler');
const { getConfig, showConfig, configure, CONFIG_DIR } = require('../lib/configHandler');
const { clearContextFiles } = require('../lib/cleanupUtils');
const { compressFile } = require('../lib/compressionHandler');
const clipboardy = require('clipboardy');
const fs = require('fs');
const path = require('path');

// Define TEMPLATES_DIR using CONFIG_DIR
const TEMPLATES_DIR = path.join(CONFIG_DIR, 'templates');

function showHelp() {
  console.log(`
Usage: cx <directory> [options]

Options:
  -h, --help       Show help
  --no-minimize    Override config to generate uncompressed output
  --min           Force generate a minimized version (in addition to current output)
  -s, --snap      Create a snapshot in context/snap (not affected by --clear)
  --template      Create a template in context/template (not affected by --clear)
  --configure      Set up configuration
  --show          Show current configuration
  --clear         Remove all generated context files

Note: It is recommended to add the 'context' folder to your .gitignore file.
  `);
}

async function showMainMenu() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\nWhat would you like to do?\n');
  console.log('1. Configure');
  console.log('2. Show Configuration');
  console.log('3. Show Help');
  console.log('4. View Templates\n');

  const answer = await new Promise(resolve => {
    readline.question('Choose an option (1-4): ', resolve);
  });

  switch(answer) {
    case '1':
      readline.close();
      configure();
      break;
    case '2':
      readline.close();
      showConfig();
      break;
    case '3':
      readline.close();
      showHelp();
      break;
    case '4':
      await showTemplates(readline);
      break;
    default:
      console.log('Invalid option');
      readline.close();
  }
}

async function showTemplates(rl) {
  const templates = fs.readdirSync(TEMPLATES_DIR)
    .filter(file => file.endsWith('.txt'))
    .map(file => file.replace(/\.txt$/, ''));

  if (templates.length === 0) {
    console.log('\nNo templates found.');
    rl.close();
    return;
  }

  console.log('\nAvailable templates:\n');
  templates.forEach((template, index) => {
    console.log(`${index + 1}. ${template}`);
  });

  const answer = await new Promise(resolve => {
    rl.question('\nChoose a template to load (or press Enter to cancel): ', resolve);
  });

  if (answer && templates[answer - 1]) {
    const templateName = templates[answer - 1];
    const sourcePath = path.join(TEMPLATES_DIR, `${templateName}.txt`);
    const destDir = './context/template';
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(sourcePath, path.join(destDir, `${templateName}.txt`));
    console.log(`✅ Template '${templateName}' loaded successfully!`);
  }

  rl.close();
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await showMainMenu();
    return;
  }

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Check for --clear anywhere in the arguments
  if (args.includes('--clear')) {
    clearContextFiles();
    process.exit(0);
  }

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: cx <directory> [options]

Options:
  -h, --help       Show help
  --no-minimize    Override config to generate uncompressed output
  --min           Force generate a minimized version (in addition to current output)
  -s, --snap      Create a snapshot in context/snap (not affected by --clear)
  --template      Create a template in context/template (not affected by --clear)
  --configure      Set up configuration
  --show          Show current configuration
  --clear         Remove all generated context files

Note: It is recommended to add the 'context' folder to your .gitignore file.
    `);
    process.exit(0);
  }

  if (args.includes('--configure')) {
    configure();
    return;
  }

  if (args.includes('--show')) {
    showConfig();
    return;
  }

  const dir = args[0];
  if (!dir) {
    console.error("❌ Error: Please provide a directory path");
    process.exit(1);
  }

  const isSnapshot = args.includes('-s') || args.includes('--snap');
  const isTemplate = args.includes('--template');
  
  // Get template name if provided
  let templateName = '';
  if (isTemplate) {
    const templateIndex = args.indexOf('--template');
    templateName = args[templateIndex + 1];
    if (!templateName) {
      console.error("❌ Error: Please provide a name for the template");
      process.exit(1);
    }
  }

  const config = getConfig();
  const options = {
    minimize: config.minimize && !args.includes('--no-minimize'),
    snapshot: isSnapshot,
    template: isTemplate,
    templateName
  };

  // Check and update .gitignore - now properly awaited
  await checkGitIgnore();

  console.log(`🔍 Scanning directory: ${dir}`);
  const result = generateContext(dir, options);

  // Handle --min flag to force generate a minimized version
  if (args.includes('--min') && !options.minimize) {
    console.log('📦 Generating additional minimized version...');
    const minStats = compressFile(result.outputFile);
    console.log(`✅ Minimized version created: ${minStats.compressedFile}`);
    console.log(`   Compression ratio: ${minStats.compressionRatio}%`);
    result.outputFile = minStats.compressedFile;
  }

  // Skip clipboard for snapshots and templates
  if (config.autoClipboard && !isSnapshot && !isTemplate) {
    try {
      const content = fs.readFileSync(result.outputFile, 'utf8');
      clipboardy.write(content).then(() => {
        console.log('📋 Content copied to clipboard!');
      }).catch(error => {
        console.error('❌ Failed to copy to clipboard:', error.message);
      });
    } catch (error) {
      console.error('❌ Failed to read file:', error.message);
    }
  }
}

// Properly handle the async main function
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});