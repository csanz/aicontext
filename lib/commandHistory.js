/**
 * Command History Manager
 * 
 * Handles saving, listing, and retrieving command history for the AICTX tool.
 * This allows users to run previous commands using 'cx run' or 'cx run <index>'.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { getConfig } from './configHandler.js';

const CONFIG_DIR = path.join(os.homedir(), '.aicontext');
const HISTORY_FILE = path.join(CONFIG_DIR, 'command_history.json');

// Default structure for command history
const DEFAULT_HISTORY = {
  commands: []
};

/**
 * Ensures that the history file exists
 * Creates it with default values if it doesn't
 */
function ensureHistoryFileExists() {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    if (!fs.existsSync(HISTORY_FILE)) {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(DEFAULT_HISTORY, null, 2));
    }
  } catch (error) {
    console.warn(`Warning: Could not create or access history file: ${error.message}`);
  }
}

/**
 * Gets the current command history
 * 
 * @returns {Object} The command history object
 */
export function getCommandHistory() {
  ensureHistoryFileExists();
  
  try {
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    return history;
  } catch (error) {
    console.warn(`Error reading history file: ${error.message}`);
    return DEFAULT_HISTORY;
  }
}

/**
 * Saves a command to the history
 * 
 * @param {Array} paths - Array of path arguments
 * @param {Object} options - Command options
 */
export function saveCommand(paths, options) {
  const history = getCommandHistory();
  
  // Create a command entry with paths and relevant options
  const commandEntry = {
    timestamp: new Date().toISOString(),
    paths,
    options: {
      // Only include relevant options that should be reused
      snapshot: options.snap || options.s || false,
      message: options.message || options.m || '',
      maxSize: options.maxSize || options['max-size'],
      timeout: options.timeout,
      verbose: options.verbose || options.v || false,
      noClipboard: options.noClipboard || options['no-clipboard'] || false,
      output: options.o || false,
      tree: options.tree || options.t || false
    }
  };
  
  // Add to history
  history.commands.unshift(commandEntry);
  
  // Keep only the last 50 commands
  if (history.commands.length > 50) {
    history.commands = history.commands.slice(0, 50);
  }
  
  // Save updated history
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.warn(`Error saving command history: ${error.message}`);
  }
}

/**
 * Lists the command history
 * 
 * @returns {Array} Formatted array of command history entries
 */
export function listCommandHistory() {
  const history = getCommandHistory();
  
  if (history.commands.length === 0) {
    return ["No command history found."];
  }
  
  return history.commands.map((cmd, index) => {
    const date = new Date(cmd.timestamp);
    const formattedDate = date.toLocaleString();
    
    // Format the command as it would appear on the command line
    let commandString = cmd.paths.join(' ');
    
    // Add options
    if (cmd.options.snapshot) commandString += ' -s';
    if (cmd.options.message) commandString += ` -m "${cmd.options.message}"`;
    if (cmd.options.verbose) commandString += ' -v';
    if (cmd.options.timeout) commandString += ` --timeout ${cmd.options.timeout}`;
    if (cmd.options.maxSize) commandString += ` --max-size ${cmd.options.maxSize}`;
    if (cmd.options.noClipboard) commandString += ' --no-clipboard';
    if (cmd.options.output) commandString += ' -o';
    if (cmd.options.tree) commandString += ' -t';
    
    return `${index + 1}) ${commandString} [${formattedDate}]`;
  });
}

/**
 * Gets a specific command by index
 * 
 * @param {number} index - The 1-based index of the command
 * @returns {Object|null} The command entry or null if not found
 */
export function getCommandByIndex(index) {
  const history = getCommandHistory();
  
  // Convert to 0-based index
  const zeroBasedIndex = index - 1;
  
  if (zeroBasedIndex < 0 || zeroBasedIndex >= history.commands.length) {
    return null;
  }
  
  return history.commands[zeroBasedIndex];
} 