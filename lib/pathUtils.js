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

/**
 * Gets the output file path based on provided options
 * @param {Object} options - Configuration options
 * @param {string} options.cwd - Current working directory (defaults to ".")
 * @param {boolean} options.snapshot - Whether this is a snapshot (default: false)
 * @param {string} options.message - Optional message to add to filename (default: "")
 * @returns {string} - Path to the output file
 */
function getOutputFilePath(options = {}) {
    // Support both new object format and legacy format for backward compatibility
    let dir = '.';
    let isSnapshot = false;
    let message = '';
    
    if (typeof options === 'string') {
        // Legacy format: dir, isSnapshot, message
        dir = options;
        isSnapshot = arguments[1] || false;
        message = arguments[2] || '';
    } else {
        // New object format
        dir = options.cwd || '.';
        isSnapshot = options.snapshot || false;
        message = options.message || '';
    }

    // Clean up the message
    const cleanMessage = message
        ? message.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        : '';

    // Set up base directory
    const contextDir = isSnapshot ? './context/snap' : './context/code';
    fs.mkdirSync(contextDir, { recursive: true });

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