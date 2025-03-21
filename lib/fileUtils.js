const fs = require('fs');
const path = require('path');
const { IGNORED_DIRS, INCLUDED_EXTENSIONS, IGNORED_FILES, BINARY_EXTENSIONS, MAX_FILE_SIZE_MB } = require('./constants');
const { getExclusions } = require('./configHandler');
const minimatch = require('minimatch');

/**
 * Determines whether a file should be processed based on various exclusion criteria
 * 
 * This function implements a multi-layered approach to file filtering:
 * 1. Checks for binary file extensions
 * 2. Checks for build directories like 'target'
 * 3. Checks against the IGNORED_DIRS list
 * 4. Checks against the IGNORED_FILES list
 * 5. Checks against user-defined exclusion patterns
 * 6. Special handling for config files and dot files
 * 
 * @param {string} filePath - The absolute path of the file to check
 * @param {Object} options - Filtering options
 * @param {string[]} options.ignorePaths - Paths to ignore
 * @param {string[]} options.ignorePatterns - Patterns to ignore
 * @param {string[]} options.includePatterns - Patterns to include
 * @returns {boolean} - True if the file should be processed, false if it should be excluded
 */
function shouldProcessFile(filePath, options = {}) {
    const {
        ignorePaths = [],
        ignorePatterns = [],
        includePatterns = []
    } = options;
    
    // Get file information
    const basename = path.basename(filePath);
    const ext = path.extname(filePath);
    
    // CRITICAL: Explicitly check for binary file extensions first
    // This is the most important check to prevent binary files from being included
    if (BINARY_EXTENSIONS.includes(ext)) {
        return false;
    }
    
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
    
    // Check if file is in the ignored files list (like package-lock.json, etc.)
    if (IGNORED_FILES.includes(basename)) {
        return false;
    }
    
    // Check against user-defined custom exclusion patterns
    const exclusions = getExclusions();
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Apply user-defined exclusion patterns using minimatch for glob pattern matching
    const patternsToCheck = [...exclusions.patterns, ...ignorePatterns];
    for (const pattern of patternsToCheck) {
        // Handle exact file matches
        if (pattern === relativePath) {
            return false;
        }
        
        // Handle directory patterns (ending with /**)
        if (pattern.endsWith('/**') && relativePath.startsWith(pattern.slice(0, -3))) {
            return false;
        }
        
        // Use minimatch for glob pattern matching
        // Use matchBase: true to match patterns like "index-*.js" against full paths
        if (minimatch(relativePath, pattern, { matchBase: true })) {
            return false;
        }
    }

    // Special handling for config files and dot files
    // These are often important for context even if they don't match the included extensions
    if (basename.startsWith('.') || basename.includes('.config.') || basename.includes('.rc')) {
        return true;
    }

    // Check include patterns if they exist
    if (includePatterns && includePatterns.length > 0) {
        for (const pattern of includePatterns) {
            if (minimatch(relativePath, pattern, { matchBase: true })) {
                return true;
            }
        }
        // If include patterns exist but none matched, exclude the file
        return false;
    }

    // Finally, check if the file extension is in our list of included extensions
    return INCLUDED_EXTENSIONS.includes(ext);
}

/**
 * Recursively finds all files in a directory that should be processed
 * 
 * This function implements directory traversal with multiple exclusion checks:
 * 1. Skips the target directory entirely to avoid processing any build artifacts
 * 2. Uses shouldProcessFile for comprehensive filtering
 * 3. Includes error handling to gracefully skip inaccessible files/directories
 * 4. Implements a timeout to prevent hanging on large directories
 * 5. Skips files larger than MAX_FILE_SIZE_MB (configurable)
 * 
 * @param {Object} options - Options for finding files
 * @param {string} options.dir - The directory to scan
 * @param {string[]} options.ignorePaths - Paths to ignore
 * @param {string[]} options.ignorePatterns - Patterns to ignore
 * @param {string[]} options.includePatterns - Patterns to include
 * @param {number} options.maxDepth - Maximum directory depth to traverse
 * @param {boolean} options.verbose - Whether to show verbose logging
 * @param {number} options.timeoutMs - Maximum time in milliseconds before timeout (default: 30000)
 * @param {number} options.maxFileSizeMb - Maximum file size in MB to process (default: MAX_FILE_SIZE_MB from constants)
 * @returns {Promise<Object>} - Object containing array of file paths and stats about skipped files
 */
async function findFiles(options) {
    const {
        dir = '.',
        ignorePaths = [],
        ignorePatterns = [],
        includePatterns = [],
        maxDepth = 4,
        verbose = false,
        timeoutMs = 30000,  // Default timeout of 30 seconds
        maxFileSizeMb = MAX_FILE_SIZE_MB  // Use the constant by default
    } = options;
    
    // Helper function for verbose logging
    const verboseLog = (message) => {
        if (verbose) {
            console.log(`[FILE] ${message}`);
        }
    };
    
    verboseLog(`Starting file search in ${dir} with max depth ${maxDepth}`);
    verboseLog(`Timeout set to ${timeoutMs}ms, max file size set to ${maxFileSizeMb}MB`);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`File search timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    
    // Create the file search promise
    const searchPromise = new Promise(resolve => {
        const files = [];
        const startTime = Date.now();
        const skippedFiles = {
            largeFiles: [],
            timedOutDirectories: [],
            binaryFiles: [],
            totalSkipped: 0
        };
        let largeFilesSkipped = 0;
        let timedOutDirectories = 0;
        
        const traverse = (currentDir, currentDepth = 0) => {
            // Check if we're taking too long
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime > timeoutMs * 0.9) {
                verboseLog(`Search is taking too long (${elapsedTime}ms), returning partial results`);
                skippedFiles.timedOutDirectories.push({
                    path: currentDir,
                    elapsedTime: elapsedTime
                });
                timedOutDirectories++;
                return;
            }
            
            // Check maximum depth
            if (currentDepth > maxDepth) {
                verboseLog(`Max depth reached (${maxDepth}) for ${currentDir}`);
                return;
            }
            
            // CRITICAL: Skip target directory entirely to avoid processing any build artifacts
            // This is especially important for Rust projects where the target directory
            // can contain many binary files
            if (currentDir.includes('/target/') || 
                currentDir.includes('\\target\\') || 
                path.basename(currentDir) === 'target') {
                verboseLog(`Skipping target directory: ${currentDir}`);
                return;
            }
            
            // Check if the current directory is in the ignore paths
            for (const ignorePath of ignorePaths) {
                if (currentDir.includes(ignorePath)) {
                    verboseLog(`Skipping ignored path: ${currentDir} (matches ${ignorePath})`);
                    return;
                }
            }
            
            // Check if the current directory should be excluded based on user patterns
            const relativeDirPath = path.relative(process.cwd(), currentDir);
            const exclusions = getExclusions();
            
            verboseLog(`Checking directory: ${relativeDirPath} (depth: ${currentDepth})`);
            
            // Skip directories that match exclusion patterns
            const patternsToCheck = [...exclusions.patterns, ...ignorePatterns];
            for (const pattern of patternsToCheck) {
                // Handle directory patterns (ending with /**)
                if (pattern.endsWith('/**') && relativeDirPath === pattern.slice(0, -3)) {
                    verboseLog(`Skipping due to pattern match: ${relativeDirPath} (matches ${pattern})`);
                    return;
                }
                
                // Use minimatch for glob pattern matching with matchBase option
                if (minimatch(relativeDirPath, pattern, { matchBase: true })) {
                    verboseLog(`Skipping due to glob match: ${relativeDirPath} (matches ${pattern})`);
                    return;
                }
            }
            
            try {
                const entries = fs.readdirSync(currentDir);
                verboseLog(`Directory ${currentDir} has ${entries.length} entries`);
                
                entries.forEach(file => {
                    const filePath = path.join(currentDir, file);
                    
                    try {
                        const stat = fs.statSync(filePath);
                        
                        if (stat.isDirectory()) {
                            // Skip ignored directories
                            const dirName = path.basename(filePath);
                            // Double-check for target directory to ensure it's never traversed
                            if (!IGNORED_DIRS.includes(dirName) && dirName !== 'target') {
                                verboseLog(`Traversing subdirectory: ${dirName}`);
                                traverse(filePath, currentDepth + 1);
                            } else {
                                verboseLog(`Skipping ignored directory: ${dirName}`);
                            }
                        } else {
                            // Check for binary files FIRST and track them
                            const ext = path.extname(filePath).toLowerCase();
                            if (BINARY_EXTENSIONS.includes(ext)) {
                                skippedFiles.binaryFiles.push({
                                    path: filePath,
                                    extension: ext
                                });
                                verboseLog(`Skipping binary file: ${filePath} (${ext})`);
                                skippedFiles.totalSkipped++;
                                return;
                            }
                            
                            // Only check file size for non-binary files
                            const fileSizeMb = stat.size / (1024 * 1024);
                            if (fileSizeMb > maxFileSizeMb) {
                                largeFilesSkipped++;
                                skippedFiles.largeFiles.push({
                                    path: filePath,
                                    sizeMb: fileSizeMb.toFixed(2)
                                });
                                verboseLog(`Skipping large file: ${filePath} (${fileSizeMb.toFixed(2)}MB > ${maxFileSizeMb}MB)`);
                                skippedFiles.totalSkipped++;
                                return;
                            }
                            
                            if (shouldProcessFile(filePath, { ignorePaths, ignorePatterns, includePatterns })) {
                                verboseLog(`Including file: ${filePath}`);
                                files.push(filePath);
                            } else {
                                verboseLog(`Excluding file: ${filePath}`);
                                skippedFiles.totalSkipped++;
                            }
                        }
                    } catch (err) {
                        // Skip files that can't be accessed
                        // This prevents the process from crashing on permission errors
                        verboseLog(`Error accessing ${filePath}: ${err.message}`);
                        console.error(`Error accessing ${filePath}: ${err.message}`);
                    }
                });
            } catch (err) {
                verboseLog(`Error reading directory ${currentDir}: ${err.message}`);
                console.error(`Error reading directory ${currentDir}: ${err.message}`);
            }
        };

        traverse(dir);
        const executionTime = Date.now() - startTime;
        
        // Log skipped file information - move this logging to be handled by the caller
        // to prevent interference with spinner
        const skippedInfo = {
            largeFiles: skippedFiles.largeFiles,
            largeFilesCount: skippedFiles.largeFiles.length,
            timedOutDirectories: skippedFiles.timedOutDirectories,
            binaryFiles: skippedFiles.binaryFiles,
            totalSkipped: skippedFiles.totalSkipped
        };
        
        if (timedOutDirectories > 0) {
            console.log(`⚠️ ${timedOutDirectories} directories took too long to process and were skipped`);
        }
        
        verboseLog(`File search complete. Found ${files.length} files in ${executionTime}ms`);
        resolve({
            files,
            skippedFiles,
            executionTime
        });
    });
    
    // Race the file search against the timeout
    try {
        return await Promise.race([searchPromise, timeoutPromise]);
    } catch (error) {
        verboseLog(`Error during file search: ${error.message}`);
        console.error(`Error during file search: ${error.message}`);
        throw error;
    }
}

module.exports = {
    findFiles,
    shouldProcessFile
}; 