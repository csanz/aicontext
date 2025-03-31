const fs = require('fs');
const path = require('path');
const { configManager } = require('./configManager');
const { IGNORED_DIRS, BINARY_EXTENSIONS, IGNORED_FILES } = require('./constants');
const { getExclusions } = require('./configHandler');
const minimatch = require('minimatch');

/**
 * Generates a text-based directory tree structure
 * 
 * @param {string} dirPath - The directory path to start from
 * @param {number} maxDepth - Maximum depth to traverse
 * @param {string} prefix - Prefix for the current line (used in recursion)
 * @param {number} depth - Current depth (used in recursion)
 * @returns {string} - Formatted directory tree representation
 */
function dirTree(dirPath, maxDepth = 4, prefix = '', depth = 0) {
    if (depth > maxDepth) {
        return prefix + '...\n';
    }

    // Get the config for ignored paths
    const config = configManager.getConfig();
    const ignorePaths = config.ignorePaths || [];
    const ignorePatterns = config.ignorePatterns || [];
    
    // Get user-defined exclusion patterns
    const exclusions = getExclusions();
    const userPatterns = exclusions.patterns || [];

    // Get directory name for display
    const dirName = path.basename(dirPath);
    let tree = prefix + dirName + '/\n';

    try {
        // Read directory contents
        const files = fs.readdirSync(dirPath);
        
        // Filter and sort items (directories first, then files)
        const items = files
            .filter(file => {
                const filePath = path.join(dirPath, file);
                const relativePath = path.relative(process.cwd(), filePath);
                const stat = fs.statSync(filePath);
                const ext = path.extname(file).toLowerCase();
                
                // Skip hidden files and directories
                if (file.startsWith('.')) return false;
                
                // Directory-specific exclusions
                if (stat.isDirectory()) {
                    // Skip directories in IGNORED_DIRS
                    if (IGNORED_DIRS.includes(file)) return false;
                } 
                // File-specific exclusions
                else {
                    // Skip binary files
                    if (BINARY_EXTENSIONS.includes(ext)) return false;
                    
                    // Skip ignored files
                    if (IGNORED_FILES.includes(file)) return false;
                }
                
                // Skip files/directories that match ignore paths
                for (const ignorePath of ignorePaths) {
                    if (filePath.includes(ignorePath)) return false;
                }
                
                // Skip files/directories that match ignore patterns
                for (const pattern of ignorePatterns) {
                    if (minimatchPattern(file, pattern)) return false;
                }
                
                // Handle user-defined exclusion patterns using minimatch
                for (const pattern of userPatterns) {
                    // Handle exact path matches
                    if (pattern === relativePath || pattern === file) return false;
                    
                    // Handle directory patterns (ending with /**)
                    if (pattern.endsWith('/**') && relativePath.startsWith(pattern.slice(0, -3))) {
                        return false;
                    }
                    
                    // Handle directory patterns without trailing slash
                    if (stat.isDirectory() && (pattern === file || pattern === `./${file}` || pattern === relativePath)) {
                        return false;
                    }
                    
                    // Use minimatch for glob pattern matching
                    if (minimatch(relativePath, pattern, { matchBase: true })) {
                        return false;
                    }
                    
                    // Check parent directories
                    const normalizedPattern = pattern.replace(/^\.\//, '');
                    if (stat.isDirectory() && file === normalizedPattern) {
                        return false;
                    }
                }
                
                return true;
            })
            .sort((a, b) => {
                const aPath = path.join(dirPath, a);
                const bPath = path.join(dirPath, b);
                const aIsDir = fs.statSync(aPath).isDirectory();
                const bIsDir = fs.statSync(bPath).isDirectory();
                
                // Sort directories first
                if (aIsDir && !bIsDir) return -1;
                if (!aIsDir && bIsDir) return 1;
                
                // Then sort alphabetically
                return a.localeCompare(b);
            });
        
        // Process items
        items.forEach((file, index) => {
            const filePath = path.join(dirPath, file);
            const isLast = index === items.length - 1;
            const stat = fs.statSync(filePath);
            
            // Create new prefix for children
            const newPrefix = prefix + (isLast ? '└── ' : '├── ');
            const childPrefix = prefix + (isLast ? '    ' : '│   ');
            
            if (stat.isDirectory()) {
                // Recursively process directories
                tree += dirTree(filePath, maxDepth, newPrefix, depth + 1);
            } else {
                // Add files
                tree += newPrefix + file + '\n';
            }
        });
        
        return tree;
    } catch (error) {
        return tree + prefix + 'Error reading directory: ' + error.message + '\n';
    }
}

/**
 * Simple pattern matching function
 * 
 * @param {string} filePath - Path to check
 * @param {string} pattern - Pattern to match against
 * @returns {boolean} - Whether the path matches the pattern
 */
function minimatchPattern(filePath, pattern) {
    // Simple wildcard matching for common patterns
    if (pattern.startsWith('*') && pattern.endsWith('*')) {
        // *text*
        const text = pattern.slice(1, -1);
        return filePath.includes(text);
    } else if (pattern.startsWith('*')) {
        // *text
        const text = pattern.slice(1);
        return filePath.endsWith(text);
    } else if (pattern.endsWith('*')) {
        // text*
        const text = pattern.slice(0, -1);
        return filePath.startsWith(text);
    } else {
        // exact match
        return filePath === pattern;
    }
}

module.exports = {
    dirTree
}; 