const fs = require('fs');
const path = require('path');
const os = require('os');

function formatDate() {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit',
        year: 'numeric'
    }).toLowerCase().replace(/[\s,]+/g, '-');
    
    return `${formattedDate}-${formattedHours}-${formattedMinutes}-${ampm}`;
}

function getNextSequenceNumber(dir, basename) {
    let seq = 1;
    while (fs.existsSync(path.join(dir, seq === 1 ? basename : basename.replace('.txt', `-${seq}.txt`)))) {
        seq++;
    }
    return seq;
}

function getOutputFilePath(dir, isSnapshot = false, isTemplate = false, message = '') {
    // Clean up the message
    const cleanMessage = message
        ? message.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        : '';

    // Set up base directory
    const contextDir = isSnapshot ? './context/snap' : './context/code';
    fs.mkdirSync(contextDir, { recursive: true });

    // Handle templates
    if (isTemplate) {
        const templateDir = path.join(os.homedir(), '.aictx', 'templates');
        fs.mkdirSync(templateDir, { recursive: true });
        const basename = cleanMessage 
            ? `${cleanMessage}-${formatDate()}.txt`
            : `template-${formatDate()}.txt`;
        const seq = getNextSequenceNumber(templateDir, basename);
        return path.join(templateDir, seq === 1 ? basename : basename.replace('.txt', `-${seq}.txt`));
    }

    // Handle regular files and snapshots
    let basename;
    if (cleanMessage && !isSnapshot) {
        basename = `${cleanMessage}-context.txt`;
    } else if (isSnapshot && cleanMessage) {
        basename = `snap-${cleanMessage}-${formatDate()}.txt`;
    } else if (isSnapshot) {
        basename = `snap-${formatDate()}.txt`;
    } else {
        basename = 'context.txt';
    }

    const seq = getNextSequenceNumber(contextDir, basename);
    return path.join(contextDir, seq === 1 ? basename : basename.replace('.txt', `-${seq}.txt`));
}

module.exports = {
    getOutputFilePath
}; 