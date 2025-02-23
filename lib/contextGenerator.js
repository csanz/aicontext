const fs = require('fs');
const { execSync } = require('child_process');
const { getOutputFilePath, findFiles } = require('./fileHandler');
const { compressFile } = require('./compressionHandler');
const { IGNORED_DIRS, IGNORED_FILES } = require('./constants');
const path = require('path');

function generateContext(dir, options = { minimize: true, snapshot: false, template: false, templateName: '' }) {
    let finalOutputFile = getOutputFilePath(dir, options.snapshot, options.template, options.templateName);
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
    
    // Process files
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
        
        // Append each file's content
        fs.appendFileSync(finalOutputFile, `File: ${relativePath}\n`);
        fs.appendFileSync(finalOutputFile, `Lines: ${lines}\n`);
        fs.appendFileSync(finalOutputFile, '----------------------------------------\n');
        fs.appendFileSync(finalOutputFile, content);
        fs.appendFileSync(finalOutputFile, '\n\n');
        
        fileCount++;
    });

    // Add statistics at the end
    const stats = `
### Project Statistics
- Total files processed: ${fileCount}
- Total lines of code: ${totalLines}
- File types included: ${Array.from(fileTypes).join(', ')}
`;
    fs.appendFileSync(finalOutputFile, stats);

    // Apply compression if needed
    if (options.minimize) {
        const stats = compressFile(finalOutputFile);
        fs.unlinkSync(finalOutputFile); // Remove the uncompressed file
        finalOutputFile = stats.compressedFile;
    }

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