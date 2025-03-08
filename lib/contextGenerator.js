/**
 * Context Generator Module
 * 
 * Core functionality for generating context files from source code.
 * This module scans directories, processes files, and creates comprehensive
 * context files that can be used with AI tools.
 */

const fs = require('fs');
const { execSync } = require('child_process');
const { getOutputFilePath } = require('./pathUtils');
const { findFiles } = require('./fileUtils');
const { compressFile } = require('./compressionHandler');
const { IGNORED_DIRS, IGNORED_FILES } = require('./constants');
const path = require('path');

/**
 * Creates a copy of the latest context file at ./context/latest-context.txt
 * 
 * @param {string} sourceFile - Path to the source context file
 */
function createLatestFile(sourceFile) {
    // Ensure the context directory exists
    const contextDir = './context';
    fs.mkdirSync(contextDir, { recursive: true });
    
    const latestFilePath = path.join(contextDir, 'latest-context.txt');
    
    try {
        // Read the content from the source file
        const content = fs.readFileSync(sourceFile, 'utf8');
        
        // Write the content to latest-context.txt
        fs.writeFileSync(latestFilePath, content);
        console.log(`📌 Latest context also available at: ${latestFilePath}`);
    } catch (error) {
        console.error(`❌ Error creating latest-context.txt: ${error.message}`);
    }
}

/**
 * Generates a context file from the specified directory
 * 
 * @param {string} dir - The directory to scan for files
 * @param {Object} options - Configuration options
 * @param {boolean} options.minimize - Whether to minimize the output
 * @param {boolean} options.snapshot - Whether to create a snapshot
 * @param {boolean} options.template - Whether to create a template
 * @param {string} options.message - Optional message to include in the filename
 * @returns {Object} Result object with outputFile, fileCount, and totalLines
 */
function generateContext(dir, options = { minimize: true, snapshot: false, template: false, message: '' }) {
    // Get the output file path based on options
    let finalOutputFile = getOutputFilePath(dir, options.snapshot, options.template, options.message);
    console.log(`📝 Output will be written to: ${finalOutputFile}`);

    // Initialize the output file with header
    const header = `# Code Context

A comprehensive view of all relevant files in the \`${dir}\` directory, including directory structure and file contents.

`;

    fs.writeFileSync(finalOutputFile, header);

    // Create tree command with ignore patterns for both dirs and files
    const ignorePattern = IGNORED_DIRS.map(dir => `-I ${dir}`).join(' ');
    const ignoreFiles = IGNORED_FILES.map(file => `-I "${file}"`).join(' ');
    const treeCommand = `tree ${dir} ${ignorePattern} ${ignoreFiles}`;

    // Try to generate directory structure using tree command
    try {
        const treeOutput = execSync(treeCommand).toString();
        fs.appendFileSync(finalOutputFile, '### Directory Structure:\n');
        fs.appendFileSync(finalOutputFile, treeOutput);
        fs.appendFileSync(finalOutputFile, '\n');
    } catch (error) {
        console.warn('⚠️  Warning: Could not generate tree structure. Continuing without it.');
        fs.appendFileSync(finalOutputFile, 'Could not generate directory structure.\n\n');
    }

    // Get all files first
    const files = findFiles(dir);
    
    // Process files and collect statistics
    let fileCount = 0;
    let totalLines = 0;
    const fileTypes = new Set();

    console.log('🔎 Finding and processing files...');
    files.forEach(file => {
        console.log(`📄 Processing: ${file}`);
        const relativePath = path.relative(process.cwd(), file);
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length;
        totalLines += lines;
        fileTypes.add(path.extname(file));
        
        // Append each file's content to the context file
        fs.appendFileSync(finalOutputFile, `File: ${relativePath}\n`);
        fs.appendFileSync(finalOutputFile, `Lines: ${lines}\n`);
        fs.appendFileSync(finalOutputFile, '----------------------------------------\n');
        fs.appendFileSync(finalOutputFile, content);
        fs.appendFileSync(finalOutputFile, '\n\n');
        
        fileCount++;
    });

    // Add statistics at the end of the context file
    const stats = `
### Project Statistics
- Total files processed: ${fileCount}
- Total lines of code: ${totalLines}
- File types included: ${Array.from(fileTypes).join(', ')}
`;
    fs.appendFileSync(finalOutputFile, stats);

    // Store the original uncompressed file path
    const originalFile = finalOutputFile;

    // Apply compression if needed based on options
    if (options.minimize) {
        const stats = compressFile(finalOutputFile);
        fs.unlinkSync(finalOutputFile); // Remove the uncompressed file
        finalOutputFile = stats.compressedFile;
    }

    // Create latest-context.txt file if not a template (templates are stored in a different location)
    if (!options.template) {
        createLatestFile(finalOutputFile);
    }

    // Log summary information
    console.log(`✅ Done! Processed files have been written to ${finalOutputFile}`);
    console.log(`📊 Summary:`);
    console.log(`   - Directory: ${dir}`);
    console.log(`   - Output file: ${finalOutputFile}`);
    console.log(`   - Files processed: ${fileCount}`);
    console.log(`   - Total lines: ${totalLines}`);

    if (options.snapshot) {
        console.log('📸 Snapshot created successfully!');
    }

    if (options.template) {
        console.log('📦 Template created successfully!');
    }

    return { outputFile: finalOutputFile, fileCount, totalLines };
}

module.exports = generateContext; 