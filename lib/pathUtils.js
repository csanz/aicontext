const fs = require('fs');
const path = require('path');

function getOutputFilePath(dir, isSnapshot = false, isTemplate = false, templateName = '') {
    // Use different directory based on type
    let contextDir;
    if (isTemplate) {
        contextDir = './context/template';
    } else if (isSnapshot) {
        contextDir = './context/snap';
    } else {
        contextDir = './context/code';
    }
    
    fs.mkdirSync(contextDir, { recursive: true });

    if (isTemplate) {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        return path.join(contextDir, `${templateName}-${timestamp}.txt`);
    }

    const timestamp = isSnapshot ? `-${new Date().toISOString().replace(/[:.]/g, '-')}` : '';
    const dirSlug = dir.replace(/^\.\//, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    let seq = 1;
    
    while (fs.existsSync(path.join(contextDir, `${dirSlug}${timestamp}-context-${seq}.txt`))) {
        seq++;
    }

    return path.join(contextDir, `${dirSlug}${timestamp}-context-${seq}.txt`);
}

module.exports = {
    getOutputFilePath
}; 