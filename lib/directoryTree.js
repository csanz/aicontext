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
export function dirTree(dir, maxDepth, currentDepth = 0, prefix = '', exclusionManager = null) {
  // Initialize exclusion manager if not provided
  if (!exclusionManager) {
    const baseDir = path.resolve(dir);
    exclusionManager = new ExclusionManager(baseDir, isVerbose);
    exclusionManager.initialize();
  }

  if (currentDepth > maxDepth) {
    return '';
  }

  let output = '';
  const absolutePath = path.resolve(dir);
  const relativePath = path.relative(process.cwd(), dir);
  
  log('Processing directory:', {
    input: dir,
    absolute: absolutePath,
    relative: relativePath,
    cwd: process.cwd(),
    depth: currentDepth,
    baseDir: exclusionManager.baseDir
  });

  // Check if this directory should be excluded
  if (exclusionManager.shouldExclude(absolutePath)) {
    log(`Skipping excluded directory: ${absolutePath}`);
    return '';
  }
  
  if (currentDepth === 0) {
    output += `${relativePath || '.'}/\n`;
  }

  try {
    if (!fs.existsSync(absolutePath)) {
      log('Directory does not exist:', absolutePath);
      return '';
    }

    const items = fs.readdirSync(absolutePath)
      .filter(item => {
        const itemPath = path.join(absolutePath, item);
        const shouldExclude = exclusionManager.shouldExclude(itemPath);
        if (shouldExclude) {
          log(`Filtered out: ${itemPath}`);
        }
        return !shouldExclude;
      })
      .sort((a, b) => {
        // Directories first, then files
        const aStats = fs.statSync(path.join(absolutePath, a));
        const bStats = fs.statSync(path.join(absolutePath, b));
        if (aStats.isDirectory() && !bStats.isDirectory()) return -1;
        if (!aStats.isDirectory() && bStats.isDirectory()) return 1;
        return a.localeCompare(b);
      });

    log('Filtered items:', items);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemPath = path.join(absolutePath, item);
      const isLast = i === items.length - 1;
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        output += `${prefix}${isLast ? '└── ' : '├── '}${item}/\n`;
        output += dirTree(
          itemPath,
          maxDepth,
          currentDepth + 1,
          `${prefix}${isLast ? '    ' : '│   '}`,
          exclusionManager
        );
      } else {
        output += `${prefix}${isLast ? '└── ' : '├── '}${item}\n`;
      }
    }
  } catch (error) {
    log('Error processing directory:', {
      dir: absolutePath,
      error: error.message,
      stack: error.stack
    });
    console.error(chalk.red(`Error reading directory ${dir}:`), error.message);
  }

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