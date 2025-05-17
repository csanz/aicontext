/**
 * Run Command Handler
 * 
 * Handles saving commands to history and running previously saved commands.
 * Provides functionality for 'cx --save' and 'cx run [index]' features.
 */

import { getCommandHistory, saveCommand, listCommandHistory, getCommandByIndex } from './commandHistory.js';
import readline from 'readline';
import chalk from 'chalk';
import { generateContext } from './contextGenerator.js';
import { handleTree } from './treeCommands.js';

/**
 * Handles saving a command to history
 * 
 * @param {Array} paths - Array of path arguments
 * @param {Object} options - Command options
 */
export function handleSaveCommand(paths, options) {
  saveCommand(paths, options);
  console.log(chalk.green('Command saved to history.'));
}

/**
 * Runs a command with the given arguments and options
 * 
 * @param {Array} paths - Array of path arguments
 * @param {Object} options - Command options
 */
async function runCommandWithOptions(paths, options) {
  try {
    // Convert saved options back to the format expected by the CLI
    const cliOptions = {
      _: paths,
      ...options,
      // Expand shorthand options
      s: options.snapshot,
      m: options.message,
      v: options.verbose,
      t: options.tree,
      // Add any other option mappings needed
    };

    // Handle tree command
    if (options.tree) {
      await handleTree(paths, cliOptions);
      return;
    }

    // Handle regular context generation
    await generateContext({
      inputPaths: paths,
      message: options.message,
      snapshot: options.snapshot,
      timeout: options.timeout,
      maxFileSize: options.maxSize,
      skipClipboard: options.noClipboard,
      outputToScreen: options.output,
      verbose: options.verbose
    });
  } catch (error) {
    console.error(chalk.red(`Error executing command: ${error.message}`));
  }
}

/**
 * Handles the 'run' command with interactive selection
 */
export async function handleRunCommand() {
  const history = listCommandHistory();
  
  if (history.length === 1 && history[0] === "No command history found.") {
    console.log(chalk.yellow(history[0]));
    return;
  }
  
  // Display the history
  console.log(chalk.bold('\nCommand History:'));
  history.forEach(cmd => console.log(cmd));
  
  // Setup readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Promisify readline for better flow control
  const question = (query) => new Promise((resolve) => rl.question(query, resolve));
  
  try {
    const answer = await question(chalk.bold('\nSelect a command to run (number): '));
    rl.close();
    
    const index = parseInt(answer.trim());
    
    if (isNaN(index) || index < 1 || index > history.length) {
      console.log(chalk.red('Invalid selection.'));
      return;
    }
    
    const command = getCommandByIndex(index);
    
    if (!command) {
      console.log(chalk.red('Command not found.'));
      return;
    }
    
    console.log(chalk.green(`Running command: ${history[index - 1].split(') ')[1].split(' [')[0]}`));
    await runCommandWithOptions(command.paths, command.options);
    
  } catch (error) {
    rl.close();
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

/**
 * Handles the 'run <index>' command (non-interactive)
 * 
 * @param {number} index - The 1-based index of the command to run
 */
export async function handleRunIndexCommand(index) {
  const command = getCommandByIndex(index);
  
  if (!command) {
    console.log(chalk.red(`Command with index ${index} not found.`));
    return;
  }
  
  const history = listCommandHistory();
  console.log(chalk.green(`Running command: ${history[index - 1].split(') ')[1].split(' [')[0]}`));
  await runCommandWithOptions(command.paths, command.options);
} 