#!/usr/bin/env node

/**
 * AICTX - AI Context Generator
 * Main executable file that handles CLI commands and orchestrates the context generation process.
 * This file serves as the entry point for the 'cx' command.
 */

const generateContext = require('../lib/contextGenerator');
const checkGitIgnore = require('../lib/gitignoreHandler');
const { getConfig, showConfig, configure, CONFIG_DIR, addExclusion, showExclusions } = require('../lib/configHandler');
const { clearContextFiles } = require('../lib/cleanupUtils');
const { compressFile } = require('../lib/compressionHandler');
const { handleTemplate } = require('../lib/templateHandler');
const { showMainMenu, showTemplates } = require('../lib/menuHandler');
const { showHelp, showInteractiveHelp } = require('../lib/helpHandler');
const { getOutputFilePath } = require('../lib/pathUtils');
const { handleLoadCommand } = require('../lib/templateLoader');
const clipboardy = require('clipboardy');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Define TEMPLATES_DIR using CONFIG_DIR
const TEMPLATES_DIR = path.join(CONFIG_DIR, 'templates');

/**
 * Main function that processes command line arguments and executes the appropriate action
 * Handles all CLI commands including context generation, snapshots, templates, and configuration
 */
async function main() {
  const args = process.argv.slice(2);

  // Check for version flag first
  if (args.includes('--version')) {
    const packageJson = require('../package.json');
    console.log(packageJson.version);
    process.exit(0);
  }

  // Handle interactive help
  if (args.includes('--more')) {
    await showInteractiveHelp();
    return;
  }

  // Handle template loading
  if (args.includes('--load')) {
    await handleLoadCommand();
    return;
  }

  // Handle exclusion patterns
  const ignoreIndex = args.findIndex(arg => arg === '-i' || arg === '--ignore');
  if (ignoreIndex !== -1 && args[ignoreIndex + 1]) {
    const pattern = args[ignoreIndex + 1];
    addExclusion(pattern);
    return;
  }

  // Show exclusion patterns
  if (args.includes('--show-ignore')) {
    showExclusions();
    return;
  }

  if (args.length === 0) {
    await showMainMenu();
    return;
  }

  // Handle help commands
  if (args.includes('--help') || args.includes('-h')) {
    const helpIndex = args.indexOf('--help') !== -1 
      ? args.indexOf('--help') 
      : args.indexOf('-h');
    
    const category = args[helpIndex + 1];
    showHelp(category);
    process.exit(0);
  }

  // Check for --clear anywhere in the arguments
  if (args.includes('--clear')) {
    const clearSnapshots = args.includes('-s') || args.includes('--snap');
    const clearTemplates = args.includes('-t') || args.includes('--template');
    clearContextFiles(clearSnapshots, clearTemplates);
    process.exit(0);
  }

  // Handle --clear-all command
  if (args.includes('--clear-all')) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\nThis will remove the following directories and their contents:');
    console.log('  - context/code');
    console.log('  - context/snap');
    console.log('  - context/template');
    console.log('  - context (if empty)\n');

    rl.question('Are you sure you want to proceed? (y/N): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        clearContextFiles(true, true);
        console.log('✅ All context files and directories have been cleared.');
      } else {
        console.log('❌ Operation cancelled. No files were removed.');
      }
      rl.close();
      process.exit(0);
    });
    return;
  }

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: cx <directory> [options]

Quick Help:
  cx -h <category>     Show help for specific category
  cx --more            Interactive help menu

Options:
  -h, --help           Show help information
  --configure          Set up configuration
  --show               Show current configuration
  --clear              Remove all generated context files insid ./code folder
  --load               Load and import templates (like cursor rules)
  -s, --snap           Create a snapshot in context/snap
  -m "message"         Add a message to the context file
  -i, --ignore <pattern> Add a glob pattern to exclude files/directories
  --show-ignore        Show current exclusion patterns
  --more               This will expand into more details 

Examples:
    cx ./ -m "hello world"  # Will generate context files and add "hello-world" to the name
    cx -i "target/**"       # Exclude Rust target directory
    cx ./ -s -m "before refactor"  # Create a snapshot with a message
    cx --clear-all          # Remove all context files and directories
  `);
    process.exit(0);
  }

  // Handle configuration commands
  if (args.includes('--configure')) {
    configure();
    return;
  }

  if (args.includes('--show')) {
    showConfig();
    return;
  }

  // Get the target directory from arguments
  const dir = args[0];
  if (!dir) {
    console.error("❌ Error: Please provide a directory path");
    process.exit(1);
  }

  // Parse flags more comprehensively
  const isSnapshot = args.includes('-s') || args.includes('--snap') || args.includes('-sm');
  const isTemplate = args.includes('-t') || args.includes('--template') || args.includes('-tm');
  
  // Get message if provided, checking both combined and separate flags
  let message = '';
  const messageFlags = ['-m', '-sm', '-tm'];
  for (const flag of messageFlags) {
    const index = args.indexOf(flag);
    if (index !== -1 && args[index + 1]) {
      message = args[index + 1];
      break;
    }
  }

  // If no message found with combined flags, check separate flags
  if (!message) {
    const messageIndex = args.indexOf('-m');
    if (messageIndex !== -1 && args[messageIndex + 1]) {
      message = args[messageIndex + 1];
    }
  }

  // Get template name if provided
  let templateName = '';
  if (isTemplate) {
    const templateIndex = args.indexOf('--template');
    templateName = args[templateIndex + 1] || message; // Use message as template name if no explicit name
    if (!templateName) {
      console.error("❌ Error: Please provide a name for the template");
      process.exit(1);
    }
  }

  // Load user configuration
  const config = getConfig();
  const options = {
    snapshot: isSnapshot,
    template: isTemplate,
    templateName,
    message
  };

  // Check and update .gitignore - now properly awaited
  await checkGitIgnore();

  console.log(`🔍 Scanning directory: ${dir}`);
  const result = generateContext(dir, options);

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