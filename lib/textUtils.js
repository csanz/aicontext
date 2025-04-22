/**
 * Text utilities for the AI Context Generator.
 * Handles text output formatting and verbose output.
 */

let isVerbose = false;

/**
 * Set the verbose mode
 * @param {boolean} value - Whether verbose mode is enabled
 */
export function setVerbose(value) {
  isVerbose = !!value;
}

/**
 * Output message when in verbose mode
 * @param {string} message - The message to output
 */
export function verboseOutput(message) {
  if (isVerbose) {
    console.log(`[DEBUG] ${message}`);
  }
}

/**
 * Format text with color
 * @param {string} text - Text to format
 * @param {string} color - Color code
 * @returns {string} - Formatted text
 */
export function colorText(text, color) {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };

  return `${colors[color] || ''}${text}${colors.reset}`;
}

/**
 * Format success messages
 * @param {string} message - The success message
 * @returns {string} - Formatted success message
 */
export function formatSuccess(message) {
  return colorText(`✓ ${message}`, 'green');
}

/**
 * Format error messages
 * @param {string} message - The error message
 * @returns {string} - Formatted error message
 */
export function formatError(message) {
  return colorText(`✗ ${message}`, 'red');
}

/**
 * Format warning messages
 * @param {string} message - The warning message
 * @returns {string} - Formatted warning message
 */
export function formatWarning(message) {
  return colorText(`⚠ ${message}`, 'yellow');
}

/**
 * Format info messages
 * @param {string} message - The info message
 * @returns {string} - Formatted info message
 */
export function formatInfo(message) {
  return colorText(`ℹ ${message}`, 'blue');
} 