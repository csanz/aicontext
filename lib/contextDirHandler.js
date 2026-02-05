/**
 * Context directory layout: .aicontext/code and .aicontext/snapshots.
 * Ensures directories exist and returns paths by type.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root folder for all context output (relative to cwd). */
export const CONTEXT_ROOT = '.aicontext';

export const FOLDERS = {
    CODE: 'code',
    SNAPSHOTS: 'snapshots'
};

/**
 * Ensure all required context directories exist
 * @param {boolean} verbose - Whether to show verbose logging
 */
export function ensureContextDirs(verbose = false) {
    const rootDir = path.join(process.cwd(), CONTEXT_ROOT);
    
    // Create root directory if it doesn't exist
    if (!fs.existsSync(rootDir)) {
        fs.mkdirSync(rootDir);
        if (verbose) console.log(`Created root directory: ${rootDir}`);
    }
    
    // Create subdirectories
    Object.values(FOLDERS).forEach(folder => {
        const folderPath = path.join(rootDir, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
            if (verbose) console.log(`Created directory: ${folderPath}`);
        }
    });
}

/**
 * Get the path for a specific context type
 * @param {string} type - The type of context (CODE or SNAPSHOTS)
 * @returns {string} The full path to the context directory
 */
export function getContextPath(type) {
    if (!FOLDERS[type]) {
        throw new Error(`Invalid context type: ${type}`);
    }
    return path.join(process.cwd(), CONTEXT_ROOT, FOLDERS[type]);
} 