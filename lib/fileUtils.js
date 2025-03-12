const fs = require('fs');
const path = require('path');
const { IGNORED_DIRS, INCLUDED_EXTENSIONS, IGNORED_FILES, BINARY_EXTENSIONS } = require('./constants');
const { getExclusions } = require('./configHandler');
const minimatch = require('minimatch');

/**
 * Determines whether a file should be processed based on various exclusion criteria
 * 
 * This function implements a multi-layered approach to file filtering:
 * 1. Explicit checks for build directories like 'target'
 * 2. Checks against the IGNORED_DIRS list
 * 3. Checks against the IGNORED_FILES list
 * 4. Checks for binary file extensions
 * 5. Checks against user-defined exclusion patterns
 * 6. Special handling for config files and dot files
 * 
 * @param {string} filePath - The absolute path of the file to check
 * @returns {boolean} - True if the file should be processed, false if it should be excluded
 */
function shouldProcessFile(filePath) {
    // CRITICAL: Explicitly check for target directory which contains Rust build artifacts
    // This is a common source of binary files that should never be included
    if (filePath.includes('/target/') || filePath.includes('\\target\\')) {
        return false;
    }

    // Check if file is in any ignored directory
    // Uses both forward and backslash patterns to work cross-platform
    if (IGNORED_DIRS.some(dir => filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`))) {
        return false;
    }

    const basename = path.basename(filePath);
    const ext = path.extname(filePath);
    
    // Check if file is in the ignored files list (like package-lock.json, etc.)
    if (IGNORED_FILES.includes(basename)) {
        return false;
    }
    
    // Check if file is a binary file by extension
    // IMPORTANT: We explicitly check for common binary extensions like .o, .d
    // and Rust-specific patterns like .rcgu.o which are build artifacts
    if (BINARY_EXTENSIONS.includes(ext) || ext === '.o' || ext === '.d' || basename.includes('.rcgu.o')) {
        return false;
    }
    
    // Check against user-defined custom exclusion patterns
    const exclusions = getExclusions();
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Additional aggressive pattern matching for binary files and build directories
    // This ensures we catch any binary files that might have slipped through
    // the previous checks, especially in language-specific build directories
    if (relativePath.includes('target/') || 
        relativePath.includes('\\target\\') || 
        relativePath.endsWith('.o') || 
        relativePath.endsWith('.d') ||
        relativePath.includes('.rcgu.o')) {
        return false;
    }
    
    // Apply user-defined exclusion patterns using minimatch for glob pattern matching
    if (exclusions.patterns.some(pattern => minimatch(relativePath, pattern))) {
        return false;
    }

    // Special handling for config files and dot files
    // These are often important for context even if they don't match the included extensions
    if (basename.startsWith('.') || basename.includes('.config.') || basename.includes('.rc')) {
        return true;
    }

    // Finally, check if the file extension is in our list of included extensions
    return INCLUDED_EXTENSIONS.includes(ext);
}

/**
 * Recursively finds all files in a directory that should be processed
 * 
 * This function implements directory traversal with multiple exclusion checks:
 * 1. Skips the target directory entirely to avoid processing any build artifacts
 * 2. Skips files with binary extensions like .o and .d
 * 3. Uses shouldProcessFile for comprehensive filtering
 * 4. Includes error handling to gracefully skip inaccessible files/directories
 * 
 * @param {string} dir - The directory to scan
 * @returns {string[]} - Array of absolute file paths that should be processed
 */
function findFiles(dir) {
    const files = [];
    const traverse = (currentDir) => {
        // CRITICAL: Skip target directory entirely to avoid processing any build artifacts
        // This is especially important for Rust projects where the target directory
        // can contain many binary files
        if (currentDir.includes('/target/') || 
            currentDir.includes('\\target\\') || 
            path.basename(currentDir) === 'target') {
            return;
        }
        
        try {
            fs.readdirSync(currentDir).forEach(file => {
                // Skip target directory and binary files explicitly at the filename level
                // This provides an additional layer of filtering before we even stat the file
                if (file === 'target' || file.endsWith('.o') || file.endsWith('.d')) {
                    return;
                }
                
                const filePath = path.join(currentDir, file);
                
                try {
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isDirectory()) {
                        // Skip ignored directories
                        const dirName = path.basename(filePath);
                        // Double-check for target directory to ensure it's never traversed
                        if (!IGNORED_DIRS.includes(dirName) && dirName !== 'target') {
                            traverse(filePath);
                        }
                    } else if (shouldProcessFile(filePath)) {
                        files.push(filePath);
                    }
                } catch (err) {
                    // Skip files that can't be accessed
                    // This prevents the process from crashing on permission errors
                    console.error(`Error accessing ${filePath}: ${err.message}`);
                }
            });
        } catch (err) {
            console.error(`Error reading directory ${currentDir}: ${err.message}`);
        }
    };

    traverse(dir);
    return files;
}

module.exports = {
    findFiles,
    shouldProcessFile
}; 