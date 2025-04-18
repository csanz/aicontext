import fs from 'fs';
import path from 'path';
import { IGNORED_DIRS, BINARY_EXTENSIONS } from './constants.js';
import { minimatch } from 'minimatch';
import { getExclusions } from './configHandler.js';
import { getGitignorePatterns } from './gitignoreHandler.js';
import chalk from 'chalk';
import { ExclusionManager } from './exclusionManager.js';

let isVerbose = false;

export function setVerbose(verbose) {
  isVerbose = verbose;
}

function log(...args) {
  if (isVerbose) {
    console.log(chalk.gray('[debug]'), ...args);
  }
}

/**
 * Generate a tree representation of a directory structure
 * @param {string} dir - The directory to process
 * @param {number} maxDepth - Maximum depth to traverse
 * @param {number} [currentDepth=0] - Current depth in the traversal
 * @param {string} [prefix=''] - Prefix for the current line
 * @returns {string} The directory tree as a string
 */
export function dirTree(dir, maxDepth = Infinity, currentDepth = 0, prefix = '', exclusionManager = null, isVerbose = false) {
  if (!exclusionManager) {
    exclusionManager = new ExclusionManager(dir, isVerbose);
  }

  if (currentDepth > maxDepth) {
    return '';
  }

  let output = '';
  let items;

  try {
    items = fs.readdirSync(dir);
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
    return '';
  }

  // Sort items: directories first, then files
  items.sort((a, b) => {
    const aPath = path.join(dir, a);
    const bPath = path.join(dir, b);
    const aIsDir = fs.statSync(aPath).isDirectory();
    const bIsDir = fs.statSync(bPath).isDirectory();
    
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  items.forEach((item, index) => {
    const itemPath = path.join(dir, item);
    const isLast = index === items.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const newPrefix = prefix + (isLast ? '    ' : '│   ');

    try {
      const stats = fs.statSync(itemPath);
      const isDir = stats.isDirectory();

      // Check if the item should be excluded
      const shouldExclude = exclusionManager.shouldExclude(itemPath);
      const isMedia = exclusionManager.isMediaFile(itemPath);

      // Skip excluded items, including media files
      if (shouldExclude) {
        if (isVerbose) {
          console.log(`Skipping excluded item: ${itemPath}`);
        }
        return;
      }

      // Add item to tree
      if (isDir) {
        output += `${prefix}${connector}${item}/\n`;
        output += dirTree(itemPath, maxDepth, currentDepth + 1, newPrefix, exclusionManager, isVerbose);
      } else {
        output += `${prefix}${connector}${item}\n`;
      }
    } catch (err) {
      console.error(`Error processing ${itemPath}: ${err.message}`);
    }
  });

  return output;
}

/**
 * Format a directory tree for display
 */
export function formatTree(node, prefix = '', isLast = true, isRoot = true) {
  if (!node) return '';

  let result = '';
  
  if (!isRoot) {
    result += prefix;
    result += isLast ? '└── ' : '├── ';
    result += node.name + '\n';
  } else {
    result += node.name + '\n';
  }

  if (node.children) {
    const newPrefix = prefix + (isLast ? '    ' : '│   ');
    node.children.forEach((child, index) => {
      result += formatTree(
        child,
        newPrefix,
        index === node.children.length - 1,
        false
      );
    });
  }

  return result;
}

export default {
  dirTree,
  setVerbose
};