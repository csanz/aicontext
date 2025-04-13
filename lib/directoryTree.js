import fs from 'fs';
import path from 'path';
import { IGNORED_DIRS } from './constants.js';
import { minimatch } from 'minimatch';
import { getExclusions } from './configHandler.js';

/**
 * Checks if a file or directory should be excluded based on patterns
 * @param {string} name - Name of file or directory
 * @param {string[]} patterns - Array of glob patterns to match against
 * @returns {boolean} True if should be excluded
 */
function shouldExclude(name, patterns) {
    return patterns.some(pattern => {
        // Remove any quotes from the pattern
        pattern = pattern.replace(/^["']|["']$/g, '');
        return minimatch(name, pattern, { matchBase: true });
    });
}

/**
 * Generate a tree representation of a directory structure
 * @param {string} dir - The directory to process
 * @param {number} maxDepth - Maximum depth to traverse
 * @param {number} [currentDepth=0] - Current depth in the traversal
 * @param {string} [prefix=''] - Prefix for the current line
 * @returns {string} The directory tree as a string
 */
export function dirTree(dir, maxDepth, currentDepth = 0, prefix = '') {
  if (currentDepth > maxDepth) {
    return '';
  }

  let output = '';
  const relativePath = path.relative(process.cwd(), dir);
  
  if (currentDepth === 0) {
    output += `${relativePath}/\n`;
  }

  try {
    // Get ignore patterns from configuration
    const { patterns } = getExclusions();

    const items = fs.readdirSync(dir)
      .filter(item => {
        // Skip items that start with . or are in IGNORED_DIRS
        if (item.startsWith('.') || IGNORED_DIRS.includes(item)) {
          return false;
        }
        // Check against ignore patterns
        if (patterns && patterns.length > 0 && shouldExclude(item, patterns)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Directories first, then files
        const aStats = fs.statSync(path.join(dir, a));
        const bStats = fs.statSync(path.join(dir, b));
        if (aStats.isDirectory() && !bStats.isDirectory()) return -1;
        if (!aStats.isDirectory() && bStats.isDirectory()) return 1;
        return a.localeCompare(b);
      });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemPath = path.join(dir, item);
      const isLast = i === items.length - 1;
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        output += `${prefix}${isLast ? '└── ' : '├── '}${item}/\n`;
        output += dirTree(
          itemPath,
          maxDepth,
          currentDepth + 1,
          `${prefix}${isLast ? '    ' : '│   '}`
        );
      } else {
        output += `${prefix}${isLast ? '└── ' : '├── '}${item}\n`;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return output;
}

export default {
  dirTree
}; 