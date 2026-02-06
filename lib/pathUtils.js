/**
 * Path and filename utilities for context output: unique filenames (context-N[-message].ext)
 * and existence checks in .aicontext/code and .aicontext/snapshots.
 * Supports multiple output formats: text (.txt), markdown (.md), json (.json), xml (.xml).
 */

import fs from 'fs';
import path from 'path';
import { CONTEXT_ROOT, FOLDERS } from './contextDirHandler.js';

/** File extensions for each output format */
const FORMAT_EXTENSIONS = {
    text: '.txt',
    md: '.md',
    json: '.json',
    xml: '.xml'
};

/**
 * Generates a unique output file path for the context file
 * @param {Object} options - Options for path generation
 * @param {string} options.cwd - Current working directory
 * @param {boolean} options.snapshot - Whether this is a snapshot
 * @param {string} options.message - Optional message to include in filename
 * @param {string} options.format - Output format: text, md, json, xml (default: text)
 * @returns {string} - The generated filename (not full path)
 */
export function getOutputFilePath({ cwd, snapshot = false, message = '', format = 'text' }) {
    // Clean up message for filename
    const cleanMessage = message.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // Get the correct file extension based on format
    const extension = FORMAT_EXTENSIONS[format] || FORMAT_EXTENSIONS.text;

    // Get the next available file number
    let fileNumber = 1;
    let fileName;

    do {
        fileName = cleanMessage
            ? `context-${fileNumber}-${cleanMessage}${extension}`
            : `context-${fileNumber}${extension}`;
        fileNumber++;
    } while (fileExists(fileName, format));

    return fileName;
}

/** Check if fileName exists in .aicontext/code or .aicontext/snapshots. */
function fileExists(fileName, format = 'text') {
    const codePath = path.join(process.cwd(), CONTEXT_ROOT, FOLDERS.CODE, fileName);
    const snapshotPath = path.join(process.cwd(), CONTEXT_ROOT, FOLDERS.SNAPSHOTS, fileName);
    return fs.existsSync(codePath) || fs.existsSync(snapshotPath);
}

/**
 * Get the file extension for a given format
 * @param {string} format - Output format: text, md, json, xml
 * @returns {string} - File extension including the dot
 */
export function getFormatExtension(format = 'text') {
    return FORMAT_EXTENSIONS[format] || FORMAT_EXTENSIONS.text;
} 