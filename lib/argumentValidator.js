/**
 * Argument Validator
 * Validates CLI switches against a fixed set of allowed options (legacy/alternate validator).
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const VALID_SWITCHES = new Set([
  'init',
  '--configure', '-c',
  '--show', '-s',
  '--clear',
  '--load-rules',
  '--help', '-h',
  '--version', '-v'
]);

/**
 * Check if the provided arguments contain valid switches only
 * @param {string[]} args - Command line arguments
 * @returns {boolean} - Whether all switches are valid
 */
export function hasValidSwitches(args) {
  if (!args || args.length === 0) {
    return false;
  }

  // Check if all provided arguments are valid
  return args.every(arg => VALID_SWITCHES.has(arg));
}

/**
 * Return the first valid command (switch) from the argument list.
 * @param {string[]} args - Command line arguments
 * @returns {string|null} - First valid switch or null
 */
export function getCommand(args) {
  if (!args || args.length === 0) {
    return null;
  }
  return args.find(arg => VALID_SWITCHES.has(arg)) || null;
}

export default {
  hasValidSwitches,
  getCommand
}; 