#!/usr/bin/env node

/**
 * AICTX - AI Context Generator
 * Main executable file that handles CLI commands and orchestrates the context generation process.
 * This file serves as the entry point for the 'cx' command.
 */

const { generateContext } = require('../lib/contextGenerator');
const checkGitIgnore = require('../lib/gitignoreHandler');
const { getConfig, showConfig, configure, CONFIG_DIR, addExclusion, showExclusions, configureIgnore } = require('../lib/configHandler');
const { clearContextFiles } = require('../lib/cleanupUtils');
const { showHelp } = require('../lib/helpHandler');
const { MAX_FILE_SIZE_MB } = require('../lib/constants');
const clipboardy = require('clipboardy');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');

/**
 * Main function that processes command line arguments and executes the appropriate action
 * Handles all CLI commands including context generation, snapshots, and configuration
 */
async function main() {
  const args = process.argv.slice(2);

  // Check for version flag first
  if (args.includes('--version')) {
    const packageJson = require('../package.json');
    console.log(packageJson.version);
    process.exit(0);
  }

  // Handle exclusion patterns
  const ignoreIndex = args.findIndex(arg => arg === '-i' || arg === '--ignore');
  if (ignoreIndex !== -1 && args[ignoreIndex + 1]) {
    const pattern = args[ignoreIndex + 1];
    addExclusion(pattern);
    return;
  }

  // Show exclusion patterns and prompt to remove them
  if (args.includes('--show-ignore')) {
    configureIgnore();  // This function shows patterns and prompts to remove them
    return;
  }

  // Configure ignore patterns
  if (args.includes('--configure-ignore')) {
    configureIgnore();
    return;
  }

  // Handle help commands
  if (args.includes('--help') || args.includes('-h')) {
    const helpIndex = args.indexOf('--help') !== -1 
      ? args.indexOf('--help') 
      : args.indexOf('-h');
    
    const category = args[helpIndex + 1];
    
    if (!category) {
      console.log(`
Usage: cx [directory] [options]

Quick Help:
  cx -h <category>     Show help for specific category

Options:
  -h, --help           Show help information
  --configure          Set up configuration
  --show               Show current configuration
  --clear              Remove all generated context files insid ./code folder
  -s, --snap           Create a snapshot in context/snap
  -m "message"         Add a message to the context file
  -sm "message"        Create a snapshot with a message (combined flag)
  -i, --ignore <pattern> Add a glob pattern to exclude files/directories
  --show-ignore        Show current exclusion patterns
  -v, --verbose        Show detailed progress during execution (helpful for debugging)
  --timeout <seconds>  Set a custom timeout for file search (default: 30 seconds)
  --max-size <MB>      Set a custom maximum file size (default: ${MAX_FILE_SIZE_MB} MB)
  --no-clipboard       Skip copying content to clipboard (faster execution)

Examples:
    cx ./ -m "hello world"  # Will generate context files and add "hello-world" to the name
    cx -i "target/**"       # Exclude Rust target directory
    cx ./ -sm "before refactor"  # Create a snapshot with a message
    cx --clear-all          # Remove all context files and directories
    cx ./ --verbose         # Show detailed progress for debugging
    cx ./ --timeout 10      # Set a shorter timeout of 10 seconds for large projects
    cx ./ --max-size 20     # Set a custom maximum file size of 20 MB
    cx ./ --no-clipboard    # Skip clipboard operations for faster execution
      `);
    } else {
      showHelp(category);
    }
    return;
  }

  // Show the current configuration
  if (args.includes('--show')) {
    showConfig();
    return;
  }

  // Handle configuration setup
  if (args.includes('--configure')) {
    configure();
    return;
  }

  // Handle clear command
  if (args.includes('--clear')) {
    // Check for snapshot flag
    const includeSnapshots = args.includes('-s') || args.includes('--snap');
    clearContextFiles({ includeSnapshots });
    return;
  }

  // Handle clear-all command
  if (args.includes('--clear-all')) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('⚠️ This will remove ALL context directory files. Are you sure? (y/n): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'y') {
        clearContextFiles({ all: true });
      } else {
        console.log('Operation cancelled.');
      }
    });
    return;
  }

  // Default directory is current directory if none provided
  let dir = './';
  let message = '';
  let messageIndex = -1;
  
  // Check for verbose flag
  const isVerbose = args.includes('--verbose') || args.includes('-v');
  
  // Get configuration
  const config = getConfig();
  
  // Check for timeout flag (in seconds)
  let timeoutSec = config.defaultTimeoutSec || 30; // Use config value with fallback
  const timeoutIndex = args.findIndex(arg => arg === '--timeout');
  if (timeoutIndex !== -1 && args[timeoutIndex + 1]) {
    const value = parseInt(args[timeoutIndex + 1], 10);
    if (!isNaN(value) && value > 0) {
      timeoutSec = value;
    }
  }
  
  // Check for max file size flag (in MB)
  let maxFileSizeMb = config.defaultMaxFileSizeMb || MAX_FILE_SIZE_MB; // Use config value with fallback
  const maxSizeIndex = args.findIndex(arg => arg === '--max-size');
  if (maxSizeIndex !== -1 && args[maxSizeIndex + 1]) {
    const value = parseInt(args[maxSizeIndex + 1], 10);
    if (!isNaN(value) && value > 0) {
      maxFileSizeMb = value;
    }
  }

  // Check for non-flag arguments which would be the directory
  const nonFlagArgs = args.filter((arg, index) => {
    // Handle message flags (-m, --message, -sm)
    if (arg === '-m' || arg === '--message' || arg === '-sm') {
      messageIndex = index;
      return false;
    }
    // Skip the --timeout argument and its value
    if (arg === '--timeout' && index === timeoutIndex) {
      return false;
    }
    if (index === timeoutIndex + 1 && timeoutIndex !== -1) {
      return false;
    }
    // Skip the --max-size argument and its value
    if (arg === '--max-size' && index === maxSizeIndex) {
      return false;
    }
    if (index === maxSizeIndex + 1 && maxSizeIndex !== -1) {
      return false;
    }
    return !arg.startsWith('-');
  });
  
  if (nonFlagArgs.length > 0) {
    dir = nonFlagArgs[0];
  }
  
  // Check for message flag
  if (messageIndex !== -1 && args[messageIndex + 1]) {
    message = args[messageIndex + 1];
  }

  // Determine if we're creating a snapshot
  const isSnapshot = args.includes('-s') || args.includes('--snap') || args.includes('-sm');

  // Add a new option for disabling clipboard
  const skipClipboard = args.includes('--no-clipboard');

  try {
    // Generate context with the new API
    const outputFile = await generateContext({
      cwd: dir,
      snapshot: isSnapshot,
      message: message,
      verbose: isVerbose,
      timeoutMs: timeoutSec * 1000, // Convert seconds to milliseconds
      maxFileSizeMb: maxFileSizeMb, // Use the custom max file size
      skipClipboard: skipClipboard, // Added new option
      // Pass additional config from the config file
      ignorePaths: config.ignorePaths,
      ignorePatterns: config.ignorePatterns,
      includePatterns: config.includePatterns,
      maxFiles: config.maxFiles,
      maxLines: config.maxLinesPerFile,
      maxDepth: config.maxDepth
    });

    // Add explicit process exit to avoid hanging
    // This is necessary because some of the dependencies (possibly encoder or minimatch)
    // may have pending handles or timers that prevent Node from exiting cleanly
    // The process.exit() ensures immediate termination without waiting for event loop to drain
    process.exit(0);

  } catch (error) {
    console.error(chalk.red(`❌ Error generating context: ${error.message}`));
    process.exit(1);
  }
}

// Properly handle the async main function
main().catch(error => {
  console.error(chalk.red(`❌ Error: ${error.message}`));
  process.exit(1);
});