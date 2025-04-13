import fs from 'fs';
import path from 'path';
import os from 'os';
import { CONTEXT_ROOT, FOLDERS } from './contextDirHandler.js';

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
 * Generates a unique output file path for the context file
 * @param {Object} options - Options for path generation
 * @param {string} options.cwd - Current working directory
 * @param {boolean} options.snapshot - Whether this is a snapshot
 * @param {string} options.message - Optional message to include in filename
 * @returns {string} - The generated filename (not full path)
 */
export function getOutputFilePath({ cwd, snapshot = false, message = '' }) {
    // Clean up message for filename
    const cleanMessage = message.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // Get the next available file number
    let fileNumber = 1;
    let fileName;

    do {
        fileName = cleanMessage
            ? `context-${fileNumber}-${cleanMessage}.txt`
            : `context-${fileNumber}.txt`;
        fileNumber++;
    } while (fileExists(fileName));

    return fileName;
}

/**
 * Check if a file exists in either the code or snapshots directory
 * @param {string} fileName - The file name to check
 * @returns {boolean} - Whether the file exists
 */
function fileExists(fileName) {
    const codePath = path.join(process.cwd(), CONTEXT_ROOT, FOLDERS.CODE, fileName);
    const snapshotPath = path.join(process.cwd(), CONTEXT_ROOT, FOLDERS.SNAPSHOTS, fileName);
    return fs.existsSync(codePath) || fs.existsSync(snapshotPath);
} 