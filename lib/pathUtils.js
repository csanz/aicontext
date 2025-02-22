const fs = require('fs');
const path = require('path');

function getOutputFilePath(dir, isSnapshot = false) {
    // Use different directory for snapshots
    const contextDir = isSnapshot ? './context/snap' : './context/code';
    fs.mkdirSync(contextDir, { recursive: true });

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