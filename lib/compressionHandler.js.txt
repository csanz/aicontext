const fs = require('fs');

function compressFile(inputFile) {
    const compressedOutputFile = `${inputFile}.min`;
    const content = fs.readFileSync(inputFile, 'utf8');

    // Text-specific optimizations while keeping content AI-readable
    const compressed = content
        // Remove multiple empty lines, replace with single newline
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Remove all console.log statements
        .replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '')
        // Remove comments that start with // (keeping JSDoc and important comments)
        .replace(/^\s*\/\/(?!\*)[^\n]*$/gm, '')
        // Remove empty lines with only whitespace
        .replace(/^\s+$/gm, '')
        // Trim trailing whitespace
        .replace(/[ \t]+$/gm, '')
        // Compact requires
        .replace(/const\s+(\w+)\s*=\s*require\s*\(\s*(['"].*?['"])\s*\)\s*;?/g, 'const $1=require($2);')
        // Compact object/array literals
        .replace(/{\s*\n\s*/g, '{')
        .replace(/\s*\n\s*}/g, '}')
        .replace(/\[\s*\n\s*/g, '[')
        .replace(/\s*\n\s*\]/g, ']')
        // Compact function declarations
        .replace(/function\s+(\w+)\s*\(\s*/g, 'function $1(')
        .replace(/\)\s*{\s*\n/g, '){')
        // Remove spaces around operators
        .replace(/\s*([=+\-*/<>!&|,])\s*/g, '$1')
        // Compact module.exports
        .replace(/module\.exports\s*=\s*/g, 'module.exports=')
        // Compact destructuring
        .replace(/{\s*(\w+)\s*}/g, '{$1}')
        // Keep one newline after statements
        .replace(/;\s*\n\s*\n/g, ';\n')
        // Compact if statements
        .replace(/if\s*\(\s*/g, 'if(')
        .replace(/\)\s*{\s*\n/g, '){')
        // Compact try-catch
        .replace(/try\s*{\s*\n/g, 'try{')
        .replace(/}\s*catch\s*\(\s*/g, '}catch(')
        // Keep important whitespace for readability
        .replace(/([{([])\n/g, '$1')
        .replace(/\n([})\]])/g, '$1')
        // Ensure clean line breaks between files
        .replace(/\n{3,}/g, '\n\n');

    // Add a header to explain the compression
    const header = `# Compressed Context File
# Note: This file has been compressed for AI consumption while maintaining readability.
# Original file: ${inputFile}\n\n`;

    const finalContent = header + compressed;
    fs.writeFileSync(compressedOutputFile, finalContent);

    const originalSize = Buffer.byteLength(content, 'utf8');
    const compressedSize = Buffer.byteLength(finalContent, 'utf8');
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    return {
        compressedFile: compressedOutputFile,
        originalSize,
        compressedSize,
        compressionRatio
    };
}

module.exports = {
    compressFile
}; 