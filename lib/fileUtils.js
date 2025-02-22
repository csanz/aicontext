const fs = require('fs');
const path = require('path');
const { IGNORED_DIRS, INCLUDED_EXTENSIONS, IGNORED_FILES } = require('./constants');

function shouldProcessFile(filePath) {
    // Check if file is in ignored directory
    if (IGNORED_DIRS.some(dir => filePath.includes(`/${dir}/`))) {
        return false;
    }

    const basename = path.basename(filePath);
    
    // Check if file is in ignored files list
    if (IGNORED_FILES.includes(basename)) {
        return false;
    }

    // Check file extension
    const ext = path.extname(filePath);

    // Special handling for config files and dot files
    if (basename.startsWith('.') || basename.includes('.config.') || basename.includes('.rc')) {
        return true;
    }

    return INCLUDED_EXTENSIONS.includes(ext);
}

function findFiles(dir) {
    const files = [];
    const traverse = (currentDir) => {
        fs.readdirSync(currentDir).forEach(file => {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Skip ignored directories
                if (!IGNORED_DIRS.includes(file)) {
                    traverse(filePath);
                }
            } else if (shouldProcessFile(filePath)) {
                files.push(filePath);
            }
        });
    };

    traverse(dir);
    return files;
}

module.exports = {
    findFiles,
    shouldProcessFile
}; 