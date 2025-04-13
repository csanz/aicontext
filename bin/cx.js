#!/usr/bin/env node

/**
 * AICTX - AI Context Generator
 * Main executable file that handles CLI commands and orchestrates the context generation process.
 * This file serves as the entry point for the 'cx' command.
 */

import { generateContext } from '../lib/contextGenerator.js';
import { checkGitIgnore } from '../lib/gitignoreHandler.js';
import { getConfig, showConfig, configure, getExclusions } from '../lib/configHandler.js';
import { clearContextFiles } from '../lib/cleanupUtils.js';
import { showHelp, handleHelp, configureParser } from '../lib/helpHandler.js';
import { handleIgnoreCommand } from '../lib/ignoreCommands.js';
import { MAX_FILE_SIZE_MB, IGNORED_DIRS, IGNORED_FILES } from '../lib/constants.js';
import { dirTree } from '../lib/directoryTree.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parseArguments, findInvalidSwitch } from '../lib/argumentParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Format directory tree into a string with proper indentation
 */
function formatTree(node, prefix = '', isLast = true) {
  let result = prefix + (isLast ? '└──' : '├──') + ' ' + node.name + '\n';
  
  if (node.children) {
    node.children.forEach((child, index) => {
      const isLastChild = index === node.children.length - 1;
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      result += formatTree(child, newPrefix, isLastChild);
    });
  }
  
  return result;
}

/**
 * Validate and resolve input paths
 */
function validatePaths(paths) {
  const validPaths = [];
  const errors = [];

  for (const p of paths) {
    if (!fs.existsSync(p)) {
      errors.push(`Path does not exist: ${p}`);
      continue;
    }
    validPaths.push(path.resolve(p));
  }

  return { validPaths, errors };
}

/**
 * Handle the tree command
 */
async function handleTree(inputPaths) {
  const { validPaths } = validatePaths(inputPaths);
  if (validPaths.length === 0) {
    console.error(chalk.red('Error: No valid paths provided'));
    process.exit(1);
  }

  console.log('\nDirectory Tree:\n');
  for (const path of validPaths) {
    const stats = fs.statSync(path);
    if (stats.isFile()) {
      // For individual files, just print them directly
      console.log(`${path}`);
    } else {
      // For directories, use dirTree
      const tree = dirTree(path, 10);
      if (tree) {
        console.log(tree);
      }
    }
  }
  process.exit(0);
}

async function main() {
  // Handle clear commands first, before yargs processing
  const args = process.argv.slice(2);

  //TODO: here you should check if the user is using a valid command before continuing
  // Check for invalid arguments
  const invalidArg = findInvalidSwitch(args);
  if (invalidArg) {
    console.error(chalk.red('Error: Invalid switch detected'));
    console.error(chalk.yellow('Run \'cx -h\' to learn more about valid switches and options'));
    process.exit(1);
  }

  // If --dry-run is present, just validate and exit
  if (args.includes('--dry-run')) {
    console.log(chalk.green('Valid command'));
    process.exit(0);
  }

  if (args.includes('--clear')) {
    const includeSnapshots = args.includes('-s') || args.includes('--snap');
    clearContextFiles({ includeSnapshots });
    process.exit(0);
  }

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
      process.exit(0);
    });
    return;
  }

  const config = getConfig();

  try {
    const parser = configureParser(
      yargs(hideBin(process.argv))
        .scriptName('cx')
        .version(false)
        .usage('Usage: $0 <command> [options]')
        .command('ignore <command> [pattern]', 'Manage ignore patterns', (yargs) => {
          yargs
            .positional('command', {
              describe: 'Command to execute (add, show, clear, test)',
              type: 'string',
              choices: ['add', 'show', 'clear', 'test']
            })
            .positional('pattern', {
              describe: 'Pattern to ignore (for add command)',
              type: 'string'
            });
        }), 
      { configure, showConfig, handleIgnoreCommand }
    );

    const argv = await parser.parse();

    // Handle help
    if (handleHelp(argv)) {
      return;
    }

    // Handle version flag
    if (argv.version || argv.v) {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
      console.log(packageJson.version);
      process.exit(0);
    }

    // Get input paths (either from positional args or current directory)
    let inputPaths = argv._.length > 0 ? argv._ : ['.'];
    
    // Filter out any args that are actually commands or options
    inputPaths = inputPaths.filter(arg => !arg.startsWith('-') && !['ignore', 'configure', 'show', 'clear', 'clear-all'].includes(arg));
    
    // If no valid paths remain, use current directory
    if (inputPaths.length === 0) {
      inputPaths = ['.'];
    }

    // Handle tree command
    if (argv.tree || argv.t) {
      await handleTree(inputPaths);
      return;
    }

    // Generate context
    try {
      // Check and update .gitignore before generating context
      await checkGitIgnore();

      await generateContext({
        inputPaths,
        snapshot: argv.s || argv.snap,
        message: argv.m || argv.message || '',
        verbose: argv.v || argv.verbose,
        timeoutMs: (argv.timeout || 30) * 1000,
        maxFileSizeMb: argv['max-size'],
        skipClipboard: argv['no-clipboard'],
        screenOutput: argv.o
      });
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});