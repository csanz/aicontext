/**
 * Directory tree builder and formatter. Walks a path and returns a tree object
 * (name, type, children) respecting exclusions and max depth; formatTree renders it as text.
 */

import path from 'path';
import fs from 'fs';
import util from 'util';
import { ExclusionManager } from './exclusionManager.js';
import { IGNORED_DIRS, BINARY_EXTENSIONS, IGNORED_FILES } from './constants.js';

// Define the missing constants
const SYSTEM_FILES = ['.DS_Store', 'Thumbs.db'];
const MEDIA_EXT = [
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff',
  '.mp3', '.wav', '.flac', '.aac', '.ogg', '.mp4', '.avi', '.mov', '.mkv',
  '.m4a', '.m4v', '.3gp', '.webm'
];

let verbose = false;

/** Enable or disable verbose logging for this module. */
function setVerbose(isVerbose) {
  verbose = isVerbose;
}

/** Log only when verbose is true. */
function log(...args) {
  if (verbose) {
    console.log(...args);
  }
}

/**
 * Build a directory tree object (name, type, path, children) for the given path.
 * @param {string} filepath - Absolute path to file or directory
 * @param {number} maxDepth - Max recursion depth (0 = no subdirs)
 * @param {boolean} [verbose] - Verbose logging
 * @param {boolean} [debug] - Debug output
 * @param {ExclusionManager|null} [exclusionManager] - Optional shared exclusion manager
 * @param {string} [purpose='tree'] - 'tree' | 'ignore-aware-tree' (affects exclusion behavior)
 * @returns {Object|null} Tree node or null on error
 */
function dirTree(filepath, maxDepth, verbose = false, debug = false, exclusionManager, purpose = 'tree') {
  setVerbose(verbose);

  try {
    let stats = fs.statSync(filepath);
    let item = {
      name: path.basename(filepath),
      path: filepath
    };

    if (stats.isDirectory()) {
      item.type = 'directory';
      item.children = [];

      // Create exclusion manager if not provided
      if (!exclusionManager) {
        exclusionManager = new ExclusionManager(filepath, verbose);
        if (verbose) {
          console.log("Created new exclusion manager");
          exclusionManager.dumpPatterns(); // Add diagnostic output
        }
      }


      let items;
      try {
        items = fs.readdirSync(filepath);
        if (verbose) {
          console.log(`Read ${items.length} items from ${filepath}`);
        }
      } catch (err) {
        console.error(`Error reading directory: ${filepath}`, err);
        return null;
      }

      // Sort items: directories first, then files alphabetically
      items.sort((a, b) => {
        const aPath = path.join(filepath, a);
        const bPath = path.join(filepath, b);
        
        // Try to get stats for both items
        try {
          const aStats = fs.statSync(aPath);
          const bStats = fs.statSync(bPath);
          
          // If one is a directory and the other is not, the directory comes first
          if (aStats.isDirectory() && !bStats.isDirectory()) return -1;
          if (!aStats.isDirectory() && bStats.isDirectory()) return 1;
          
          // Otherwise, sort alphabetically
          return a.localeCompare(b);
        } catch (err) {
          console.error(`Error getting stats for ${aPath} or ${bPath}:`, err);
          // If there's an error getting stats, just sort alphabetically
          return a.localeCompare(b);
        }
      });

      // Debug: print the items we're about to process
      if (verbose) {
        console.log(`Directory items in ${filepath}:`, items);
      }

      // Process each item in the directory
      for (const itemName of items) {
        // Skip system files
        if (itemName === '.DS_Store' || itemName === 'Thumbs.db') {
          log(`Skipping system file: ${itemName}`);
          continue;
        }

        const itemPath = path.join(filepath, itemName);
        let itemStats;
        
        try {
          itemStats = fs.statSync(itemPath);
        } catch (err) {
          console.error(`Error getting stats for ${itemPath}:`, err);
          continue;
        }
        
        // Skip hidden directories
        if (itemStats.isDirectory() && itemName.startsWith('.')) {
          log(`Skipping hidden directory: ${itemPath}`);
          continue;
        }

        // Check max depth for recursive traversal
        if (maxDepth !== undefined && maxDepth <= 0 && itemStats.isDirectory()) {
          log(`Max depth reached, skipping directory: ${itemPath}`);
          continue;
        }

        // Get file extension
        const fileExt = path.extname(itemPath).toLowerCase();

        // Check if item should be excluded
        const shouldSkip = itemStats.isDirectory() 
          ? exclusionManager.shouldExcludeDirectory(itemPath, purpose)
          : exclusionManager.shouldExcludeFile(itemPath, purpose);

        if (shouldSkip) {
          if (debug || verbose) {
            console.log(`Skipping excluded item: ${itemPath}`);
          }
          continue;
        }

        // Recursively process subdirectories or add files
        if (itemStats.isDirectory()) {
          const childItem = dirTree(
            itemPath, 
            maxDepth !== undefined ? maxDepth - 1 : undefined,
            verbose,
            debug,
            exclusionManager,
            purpose
          );
          
          if (childItem) {
            item.children.push(childItem);
          }
        } else {
          // It's a file that wasn't excluded, add it to the tree
          const childItem = {
            name: itemName,
            path: itemPath,
            type: 'file',
            extension: fileExt
          };
          
          item.children.push(childItem);
        }
      }

      // Debug: print the children after processing
      if (verbose) {
        console.log(`Children for ${filepath}:`, item.children.map(c => c.name));
      }
    } else {
      // Handle file
      item.type = 'file';
      item.extension = path.extname(filepath).toLowerCase();
    }

    return item;
  } catch (err) {
    console.error(`Error processing ${filepath}:`, err);
    return null;
  }
}

/**
 * Format a tree node (from dirTree) into a string using box-drawing characters (├──, └──).
 * @param {Object} tree - Tree node from dirTree
 * @param {number} [level=0] - Current depth
 * @param {boolean} [isLast=true] - Whether this node is the last sibling
 * @param {string} [prefix=''] - Accumulated prefix for indentation
 * @returns {string} Formatted tree string
 */
function formatTree(tree, level = 0, isLast = true, prefix = '') {
  if (!tree) return '';

  let result = '';
  
  // Adding tree characters
  if (level > 0) {
    result += prefix;
    if (isLast) {
      result += '└── ';
      prefix += '    ';
    } else {
      result += '├── ';
      prefix += '│   ';
    }
  }

  result += tree.name + (tree.type === 'directory' ? '/' : '') + '\n';

  if (tree.children) {
    const lastIndex = tree.children.length - 1;
    tree.children.forEach((child, i) => {
      result += formatTree(child, level + 1, i === lastIndex, prefix);
    });
  }

  return result;
}

// Export as ES modules
export {
  dirTree,
  formatTree,
  setVerbose
};