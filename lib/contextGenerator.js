/**
 * Context Generator Module
 * 
 * Core functionality for generating context files from source code.
 * This module scans directories, processes files, and creates comprehensive
 * context files that can be used with AI tools.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { platform } = require('os');
const { dirTree } = require('./directoryTree');
const { getOutputFilePath } = require('./pathUtils');
const { encode } = require('gpt-3-encoder');
const { configManager } = require('./configManager');
const chalk = require('chalk');
const { findFiles } = require('./fileUtils');
const { MAX_FILE_SIZE_MB } = require('./constants');
const ora = require('ora');
const clipboardy = require('clipboardy');

// Constants
const CONTEXT_DIR = './context';

/**
 * Creates a copy of the latest context file
 * @param {string} contextFilePath - Path to the context file
 */
function createLatestFile(contextFilePath) {
    try {
        // Create a copy of the latest context file in the same directory
        const dir = path.dirname(contextFilePath);
        const latestPath = path.join(dir, 'latest-context.txt');
        fs.copyFileSync(contextFilePath, latestPath);
        
        // Also create a copy in the root context directory for backward compatibility
        // This is important because some tests rely on this file being in the root
        const rootLatestPath = path.join(CONTEXT_DIR, 'latest-context.txt');
        fs.copyFileSync(contextFilePath, rootLatestPath);
    } catch (error) {
        console.error('Error creating latest context file:', error.message);
    }
}

/**
 * Safely count tokens with fallback to character estimation
 * @param {string} content - The text content to encode
 * @returns {number} - The token count
 */
function countTokens(content) {
    try {
        return encode(content).length;
    } catch (error) {
        // Fallback to simple character-based estimation if encoding fails
        return Math.round(content.length / 4);
    }
}

/**
 * Generates a context file with file contents from a given directory
 * @param {Object} options - Configuration options
 * @param {string} options.cwd - Current working directory
 * @param {boolean} options.snapshot - Whether this is a snapshot
 * @param {string} options.message - Optional message for the context file
 * @param {string[]} options.ignorePaths - Paths to ignore
 * @param {string[]} options.ignorePatterns - Patterns to ignore
 * @param {string[]} options.includePatterns - Patterns to include
 * @param {number} options.maxFiles - Maximum number of files to include
 * @param {number} options.maxLines - Maximum number of lines to include per file
 * @param {number} options.maxDepth - Maximum directory depth
 * @param {boolean} options.verbose - Whether to show verbose logging
 * @param {number} options.timeoutMs - Maximum time in milliseconds before timeout
 * @param {number} options.maxFileSizeMb - Maximum file size in MB (default: MAX_FILE_SIZE_MB from constants)
 * @param {boolean} options.skipClipboard - Whether to skip clipboard operations
 * @returns {string} - Path to the generated context file
 */
async function generateContext(options) {
    const config = configManager.getConfig();
    const {
        cwd = '.',
        snapshot = false,
        message = '',
        ignorePaths = config.ignorePaths || [],
        ignorePatterns = config.ignorePatterns || [],
        includePatterns = config.includePatterns || [],
        maxFiles = config.maxFiles || 100,
        maxLines = config.maxLinesPerFile || 300,
        maxDepth = config.maxDepth || 4,
        verbose = false,
        timeoutMs = 30000, // Default 30 seconds
        maxFileSizeMb = MAX_FILE_SIZE_MB, // Use constant by default
        skipClipboard = false // New option to skip clipboard operations
    } = options;

    // Function for verbose logging
    const verboseLog = (message) => {
        if (verbose) {
            console.log(chalk.blue(`[INFO] ${message}`));
        }
    };

    // Create a spinner
    const spinner = ora({
        text: chalk.blue('Generating context...'),
        spinner: 'dots',
        color: 'blue'
    }).start();

    // Initialize file tracking
    let fileCount = 0;
    let totalLines = 0;
    let totalChars = 0;
    let totalTokens = 0;
    let executionTime = 0;
    const fileStats = [];
    const fileTypes = {};
    const skippedFilesInfo = {
        largeFiles: [],
        timedOutDirectories: [],
        binaryFiles: [],
        totalSkipped: 0
    };
    let totalSizeBytes = 0;

    // Get the absolute path of the directory
    const absolutePath = path.resolve(cwd);
    
    verboseLog(`Processing directory: ${absolutePath}`);
    verboseLog(`Max files: ${maxFiles}, Max lines per file: ${maxLines}, Max depth: ${maxDepth}`);
    
    // Generate the output file path
    const outputFilePath = getOutputFilePath({
        cwd,
        snapshot,
        message
    });
    
    verboseLog(`Output file: ${outputFilePath}`);

    // Create a new context file
    let fileOutput = '';
    if (message) {
        fileOutput += `# ${message}\n\n`;
    }
    
    // Add header with date and directory info
    const date = new Date().toLocaleString();
    fileOutput += `Generated on: ${date}\nDirectory: ${absolutePath}\n\n`;

    // Create directory structure visualization
    try {
        spinner.text = chalk.blue('Generating directory structure...');
        verboseLog('Generating directory structure...');
        const tree = dirTree(absolutePath, maxDepth);
        fileOutput += "## Directory Structure\n```\n" + tree + "\n```\n\n";
        verboseLog('Directory structure generated');
    } catch (error) {
        console.error('Error generating directory tree:', error.message);
        fileOutput += "## Directory Structure\nError generating directory tree\n\n";
    }
    
    try {
        // Get list of files
        spinner.text = chalk.blue('Finding files...');
        verboseLog('Finding files...');
        verboseLog(`Ignore patterns: ${ignorePatterns.join(', ') || 'none'}`);
        verboseLog(`Include patterns: ${includePatterns.join(', ') || 'none'}`);
        verboseLog(`Timeout set to ${timeoutMs}ms`);
        verboseLog(`Max file size set to ${maxFileSizeMb}MB`);
        
        const result = await findFiles({
            dir: absolutePath,
            ignorePaths,
            ignorePatterns,
            includePatterns,
            maxDepth,
            verbose,
            timeoutMs,
            maxFileSizeMb
        });
        
        // Stop the spinner temporarily to display important skip information
        spinner.stop();
        
        // Log any skipped files
        if (result.skippedFiles.largeFiles.length > 0) {
            console.log(`\nℹ️  Skipped ${result.skippedFiles.largeFiles.length} large file(s) (>${maxFileSizeMb}MB)`);
        }
        
        // Restart the spinner for the rest of the processing
        spinner.start();
        
        const files = result.files;
        skippedFilesInfo.largeFiles = result.skippedFiles.largeFiles;
        skippedFilesInfo.binaryFiles = result.skippedFiles.binaryFiles;
        skippedFilesInfo.timedOutDirectories = result.skippedFiles.timedOutDirectories;
        skippedFilesInfo.totalSkipped = result.skippedFiles.totalSkipped;
        executionTime = result.executionTime;
        
        verboseLog(`Found ${files.length} files before filtering`);
        
        // Sort files for consistent output
        files.sort();
        
        // Process only up to maxFiles
        const filesToProcess = files.slice(0, maxFiles);
        verboseLog(`Will process ${filesToProcess.length} files (max: ${maxFiles})`);
        
        // Append file sections to output
        fileOutput += "## Files\n";
        
        spinner.text = chalk.blue(`Processing ${filesToProcess.length} files...`);
        
        for (const file of filesToProcess) {
            try {
                // Update spinner with current file
                spinner.text = chalk.blue(`Processing: ${path.basename(file)}`);
                verboseLog(`Processing file: ${file}`);
                
                // Get relative path for display
                const relativePath = path.relative(absolutePath, file);
                
                // Read file content
                const content = fs.readFileSync(file, 'utf8');
                
                // Skip binary or empty files
                if (!content || /[\x00-\x08\x0E-\x1F]/.test(content)) {
                    verboseLog(`Skipping binary or empty file: ${file}`);
                    continue;
                }
                
                // Get file stats
                const lines = content.split('\n');
                const lineCount = lines.length;
                const charCount = content.length;
                const tokenCount = countTokens(content);
                
                verboseLog(`File stats: ${lineCount} lines, ${charCount} chars, ${tokenCount} tokens`);
                
                // Update totals
                fileCount++;
                totalLines += lineCount;
                totalChars += charCount;
                totalTokens += tokenCount;
                totalSizeBytes += Buffer.byteLength(content, 'utf8');
                
                // Truncate content if needed
                const truncatedLines = lines.slice(0, maxLines);
                const truncatedContent = truncatedLines.join('\n');
                const wasTruncated = lineCount > maxLines;
                
                if (wasTruncated) {
                    verboseLog(`File truncated: showing ${maxLines} of ${lineCount} lines`);
                }
                
                // Get file extension for tracking purposes
                const ext = path.extname(file).toLowerCase().substring(1) || 'no-extension';
                if (fileTypes[ext]) {
                    fileTypes[ext]++;
                } else {
                    fileTypes[ext] = 1;
                }
                
                // Add file stats to array for later sorting
                fileStats.push({
                    path: relativePath,
                    lines: lineCount,
                    chars: charCount,
                    tokens: tokenCount,
                    extension: ext
                });
                
                // Add file section to output
                fileOutput += `\n### ${relativePath}\n`;
                fileOutput += `Lines: ${lineCount}${wasTruncated ? ` (showing first ${maxLines})` : ''}\n`;
                fileOutput += "```" + (ext ? ext : '') + "\n";
                fileOutput += truncatedContent + "\n";
                fileOutput += "```\n";
                
            } catch (error) {
                verboseLog(`Error processing file ${file}: ${error.message}`);
                console.error(`Error processing file ${file}:`, error.message);
            }
        }
        
        verboseLog('Sorting files by character count...');
        
        // Sort files by character count for summary
        fileStats.sort((a, b) => b.chars - a.chars);
        
        verboseLog('Adding summary section...');
        
        // Add summary section
        fileOutput += "\n## Summary\n\n";

        // Add top files by character count
        fileOutput += "### Top 5 Files by Size\n";
        const top5 = fileStats.slice(0, 5);
        for (const file of top5) {
            fileOutput += `- ${file.path}: ${file.chars.toLocaleString()} characters, ${file.tokens.toLocaleString()} tokens\n`;
        }
        
        // Add skipped files information
        if (skippedFilesInfo.largeFiles.length > 0) {
            fileOutput += "\n### Large Files Skipped\n";
            for (const file of skippedFilesInfo.largeFiles) {
                fileOutput += `- ${path.relative(absolutePath, file.path)}: ${file.sizeMb} MB\n`;
            }
        }
        
        if (skippedFilesInfo.timedOutDirectories.length > 0) {
            fileOutput += "\n### Directories That Took Too Long\n";
            for (const dir of skippedFilesInfo.timedOutDirectories) {
                fileOutput += `- ${path.relative(absolutePath, dir.path)}: ${dir.elapsedTime}ms\n`;
            }
        }
        
        // Add binary files section if any were skipped
        if (skippedFilesInfo.binaryFiles.length > 0) {
            fileOutput += "\n### Binary Files Excluded\n";
            
            // Group binary files by extension
            const binaryExtensions = {};
            skippedFilesInfo.binaryFiles.forEach(file => {
                const ext = file.extension;
                if (!binaryExtensions[ext]) {
                    binaryExtensions[ext] = [];
                }
                binaryExtensions[ext].push(path.relative(absolutePath, file.path));
            });
            
            // Add counts for each binary file type
            for (const [ext, files] of Object.entries(binaryExtensions)) {
                fileOutput += `- ${ext}: ${files.length} file(s)\n`;
                // List up to 3 examples of each extension
                const examples = files.slice(0, 3);
                examples.forEach(file => {
                    fileOutput += `  - ${file}\n`;
                });
                if (files.length > 3) {
                    fileOutput += `  - ... and ${files.length - 3} more\n`;
                }
            }
        }
        
        // Format file types
        const fileTypesList = Object.entries(fileTypes)
            .sort((a, b) => b[1] - a[1])
            .map(([ext, count]) => `${ext}: ${count}`)
            .join(', ');
            
        verboseLog('Writing output file...');
        
        // Write output to file
        fs.writeFileSync(outputFilePath, fileOutput);
        
        verboseLog('Creating latest file copy...');
        
        // Create latest file
        createLatestFile(outputFilePath);
        
        // Make sure the spinner is completely stopped before any final output
        spinner.stop();
        verboseLog('Generation complete.');
        
        // Clear the line where the spinner was to ensure clean output
        process.stdout.write('\r\x1b[K');
        
        // Print success message in green
        console.log('');
        console.log(chalk.green('✔ Context file successfully generated'));
        
        // Print a single clean summary with only the requested information
        console.log('');
        console.log(`📄 Top 5 Files by Character Count and Token Count:`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Show top 5 files
        for (let i = 0; i < Math.min(5, top5.length); i++) {
            const file = top5[i];
            console.log(`${i+1}.  ${chalk.white(file.path)} ${chalk.gray(`(${file.chars.toLocaleString()} chars, ${file.tokens.toLocaleString()} tokens)`)}`);
        }
        
        console.log('');
        console.log(`📊 ${chalk.white.bold('Summary:')}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  ${chalk.white('Total Files:')} ${fileCount} files`);
        console.log(`  ${chalk.white('Total Lines:')} ${totalLines.toLocaleString()} lines`);
        console.log(`  ${chalk.white('Total Chars:')} ${totalChars.toLocaleString()} chars`);
        console.log(`  ${chalk.white('Total Tokens:')} ${totalTokens.toLocaleString()} tokens`);

        // Add total size display with automatic unit conversion
        let sizeDisplay = '';
        if (totalSizeBytes < 1024) {
            sizeDisplay = `${totalSizeBytes} bytes`;
        } else if (totalSizeBytes < 1024 * 1024) {
            sizeDisplay = `${(totalSizeBytes / 1024).toFixed(2)} KB`;
        } else if (totalSizeBytes < 1024 * 1024 * 1024) {
            sizeDisplay = `${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
        } else {
            sizeDisplay = `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
        console.log(`  ${chalk.white('Total Size:')} ${sizeDisplay}`);

        console.log(`  ${chalk.white('Execution Time:')} ${executionTime}ms`);
        console.log(`  ${chalk.white('Output:')} ${outputFilePath}`);
        
        // Only print information about files skipped due to constraints (not binary files which are excluded by design)
        if (skippedFilesInfo.largeFiles.length > 0 || skippedFilesInfo.timedOutDirectories.length > 0) {
            console.log('');
            console.log(`⚠️ ${chalk.yellow.bold('Files Skipped Due to Constraints:')}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            if (skippedFilesInfo.largeFiles.length > 0) {
                console.log(`  ${chalk.yellow('Large Files:')} ${skippedFilesInfo.largeFiles.length} (>${maxFileSizeMb}MB)`);
                // List the top 3 largest files that were skipped
                const topLargeFiles = [...skippedFilesInfo.largeFiles].sort((a, b) => parseFloat(b.sizeMb) - parseFloat(a.sizeMb)).slice(0, 3);
                for (const file of topLargeFiles) {
                    console.log(`    - ${chalk.gray(path.relative(absolutePath, file.path))} (${file.sizeMb}MB)`);
                }
            }
            
            if (skippedFilesInfo.timedOutDirectories.length > 0) {
                console.log(`  ${chalk.yellow('Timed-out Directories:')} ${skippedFilesInfo.timedOutDirectories.length}`);
                for (const dir of skippedFilesInfo.timedOutDirectories.slice(0, 3)) {
                    console.log(`    - ${chalk.gray(path.relative(absolutePath, dir.path))} (${dir.elapsedTime}ms)`);
                }
            }
        }
        
        console.log('');
        
        // Add completion messages
        console.log(chalk.green('✨ All Done!\n'));
        
        // Handle auto-clipboard functionality based on user configuration
        if (config.autoClipboard && !skipClipboard) {
            try {
                // Read the file directly 
                const content = fs.readFileSync(outputFilePath, 'utf8');
                
                // Write to clipboard synchronously 
                clipboardy.writeSync(content);
                
                console.log(chalk.green('✅ Content copied to clipboard!\n'));
            } catch (error) {
                console.error(chalk.red(`❌ Error copying to clipboard: ${error.message}`));
            }
        } else if (skipClipboard) {
            verboseLog('Clipboard copying skipped due to --no-clipboard option');
        }
        
        // Return the path to the generated file
        return outputFilePath;
        
    } catch (error) {
        verboseLog(`Fatal error: ${error.message}`);
        verboseLog(error.stack);
        console.error('Error generating context:', error.message);
        throw error;
    }
}

module.exports = {
    generateContext,
    createLatestFile
}; 