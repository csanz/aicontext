/**
 * File discovery and filtering: findFiles recursively collects files in a directory
 * with depth/timeout/size limits; formatFileSize and shouldProcessFile are shared helpers.
 */

import fs from 'fs';
import path from 'path';
import {
    IGNORED_DIRS,
    INCLUDED_EXTENSIONS,
    IGNORED_FILES,
    BINARY_EXTENSIONS,
    MAX_FILE_SIZE_MB
} from './constants.js';
import { ExclusionManager } from './exclusionManager.js';

/**
 * Format file size into human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size with units
 */
export function formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Check if a file should be processed based on its extension and name
 * @param {string} filePath - Path to the file
 * @param {string} purpose - Purpose of processing ('content' or 'tree')
 * @returns {boolean} Whether the file should be processed
 */
export function shouldProcessFile(filePath, purpose = 'content') {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);

    // Skip binary files
    if (BINARY_EXTENSIONS.includes(ext)) {
        return false;
    }

    // Skip ignored files
    if (IGNORED_FILES.includes(basename)) {
        return false;
    }

    // For tree visualization, include media files
    if (purpose === 'tree') {
        const MEDIA_EXTENSIONS = [
            '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff',
            '.mp3', '.wav', '.flac', '.aac', '.ogg', '.mp4', '.avi', '.mov', '.mkv',
            '.m4a', '.m4v', '.3gp', '.webm'
        ];
        
        if (MEDIA_EXTENSIONS.includes(ext)) return true;
    }

    // Only process files with included extensions
    // If no extensions are specified, process all non-binary files
    if (INCLUDED_EXTENSIONS.length > 0 && !INCLUDED_EXTENSIONS.includes(ext)) {
        return false;
    }

    return true;
}

/**
 * Find all files in a directory recursively
 * @param {Object} options - Options for file finding
 * @param {string} options.dir - Directory to search in
 * @param {string[]} options.ignorePaths - Paths to ignore
 * @param {string[]} options.ignorePatterns - Patterns to ignore
 * @param {string[]} options.includePatterns - Patterns to include
 * @param {number} options.maxDepth - Maximum directory depth
 * @param {boolean} options.verbose - Whether to show verbose logging
 * @param {number} options.timeoutMs - Maximum time in milliseconds before timeout
 * @param {number} options.maxFileSizeMb - Maximum file size in MB
 * @param {Function} options.onProgress - Progress callback
 * @param {string} options.purpose - Purpose of file finding ('content' or 'tree')
 * @returns {Promise<Object>} Object containing files and skipped files
 */
export async function findFiles(options) {
    const {
        dir,
        ignorePaths = [],
        ignorePatterns = [],
        includePatterns = [],
        maxDepth = 4,
        verbose = false,
        timeoutMs = 30000,
        maxFileSizeMb = 10,
        onProgress = () => {},
        purpose = 'content'
    } = options;

    const startTime = Date.now();
    const files = [];
    const skippedFiles = {
        largeFiles: [],
        timedOutDirectories: [],
        binaryFiles: [],
        symlinkLoops: [],
        totalSkipped: 0
    };

    // Track visited directories (by real path) to prevent symlink loops
    const visitedDirs = new Set();

    // Create exclusion manager for user-defined patterns
    // Use cwd as base path so patterns like "test_tmp/**" work from any input path
    const exclusionManager = new ExclusionManager(process.cwd(), verbose);

    /**
     * Process a directory recursively
     * @param {string} currentDir - Current directory being processed
     * @param {number} depth - Current depth
     */
    async function processDirectory(currentDir, depth = 0) {
        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
            skippedFiles.timedOutDirectories.push({
                path: currentDir,
                elapsedTime: Date.now() - startTime
            });
            return;
        }

        // Check depth limit
        if (depth > maxDepth) {
            return;
        }

        // Check for symlink loops by resolving to real path
        try {
            const realPath = await fs.promises.realpath(currentDir);
            if (visitedDirs.has(realPath)) {
                skippedFiles.symlinkLoops.push(currentDir);
                return; // Already visited this directory (symlink loop)
            }
            visitedDirs.add(realPath);
        } catch (err) {
            // Directory may have been deleted, skip it
            return;
        }

        // Update progress
        onProgress(currentDir);

        try {
            const items = await fs.promises.readdir(currentDir);

            for (const item of items) {
                const itemPath = path.join(currentDir, item);

                // Get file stats, skip if file was deleted
                let stats;
                try {
                    stats = await fs.promises.stat(itemPath);
                } catch (err) {
                    // File was deleted or became inaccessible, skip it
                    continue;
                }

                // Skip ignored paths
                if (ignorePaths.some(p => itemPath.includes(p))) {
                    continue;
                }

                // Skip ignored patterns
                if (ignorePatterns.some(pattern => {
                    try {
                        return new RegExp(pattern).test(itemPath);
                    } catch (error) {
                        return false;
                    }
                })) {
                    continue;
                }

                if (stats.isDirectory()) {
                    // Skip ignored directories
                    if (IGNORED_DIRS.includes(item) || item.startsWith('.')) {
                        continue;
                    }

                    // Check user-defined exclusion patterns for directories
                    if (exclusionManager.shouldExcludeDirectory(itemPath, purpose)) {
                        continue;
                    }

                    // Process subdirectory
                    await processDirectory(itemPath, depth + 1);
                } else {
                    // Skip large files
                    const fileSizeMb = stats.size / (1024 * 1024);
                    if (fileSizeMb > maxFileSizeMb) {
                        skippedFiles.largeFiles.push({
                            path: itemPath,
                            sizeMb: fileSizeMb.toFixed(2)
                        });
                        skippedFiles.totalSkipped++;
                        continue;
                    }

                    // Skip binary files
                    if (!shouldProcessFile(itemPath, purpose)) {
                        skippedFiles.binaryFiles.push(itemPath);
                        skippedFiles.totalSkipped++;
                        continue;
                    }

                    // Check user-defined exclusion patterns for files
                    if (exclusionManager.shouldExcludeFile(itemPath, purpose)) {
                        skippedFiles.binaryFiles.push(itemPath);
                        skippedFiles.totalSkipped++;
                        continue;
                    }

                    // Check include patterns
                    if (includePatterns.length > 0) {
                        const shouldInclude = includePatterns.some(pattern => {
                            try {
                                return new RegExp(pattern).test(itemPath);
                            } catch (error) {
                                return false;
                            }
                        });

                        if (!shouldInclude) {
                            continue;
                        }
                    }

                    files.push(itemPath);
                }
            }
        } catch (error) {
            console.error(`Error processing directory ${currentDir}:`, error.message);
        }
    }

    await processDirectory(dir);

    return {
        files,
        skippedFiles
    };
} 