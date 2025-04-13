import fs from 'fs';
import path from 'path';
import { CONTEXT_ROOT, FOLDERS } from './contextDirHandler.js';

export function clearContextFiles({ includeSnapshots = false, all = false } = {}) {
    try {
        // Get the code directory path
        const codeDir = path.join(process.cwd(), CONTEXT_ROOT, FOLDERS.CODE);
        
        // Clear code directory contents
        if (fs.existsSync(codeDir)) {
            const files = fs.readdirSync(codeDir);
            files.forEach(file => {
                if (file !== '.gitignore') {
                    const filePath = path.join(codeDir, file);
                    fs.unlinkSync(filePath);
                    console.log(`🗑️  Removed: ${file}`);
                }
            });
        }

        // If snapshots flag is set, clear snapshots directory
        if (includeSnapshots || all) {
            const snapDir = path.join(process.cwd(), CONTEXT_ROOT, FOLDERS.SNAPSHOTS);
            console.log('🗑️  Including snapshots in cleanup...');
            if (fs.existsSync(snapDir)) {
                const files = fs.readdirSync(snapDir);
                files.forEach(file => {
                    if (file !== '.gitignore') {
                        const filePath = path.join(snapDir, file);
                        fs.unlinkSync(filePath);
                        console.log(`🗑️  Removed: ${file}`);
                    }
                });
            }
        }

        // Remove latest-context.txt from root context directory
        const rootLatestPath = path.join(process.cwd(), CONTEXT_ROOT, 'latest-context.txt');
        if (fs.existsSync(rootLatestPath)) {
            fs.unlinkSync(rootLatestPath);
            console.log('🗑️  Removed: latest-context.txt');
        }

        // If all flag is set, try to remove the entire context directory
        if (all) {
            const contextDir = path.join(process.cwd(), CONTEXT_ROOT);
            if (fs.existsSync(contextDir)) {
                const remainingFiles = fs.readdirSync(contextDir);
                if (remainingFiles.length === 0 || (remainingFiles.length === 1 && remainingFiles[0] === '.gitignore')) {
                    if (remainingFiles.length === 1) {
                        fs.unlinkSync(path.join(contextDir, '.gitignore'));
                    }
                    fs.rmdirSync(contextDir);
                    console.log('📁 Removed empty context directory');
                }
            }
        }

        console.log('✅ Successfully cleared files.');
        if (!includeSnapshots && !all) {
            console.log('ℹ️  Snapshots preserved.');
        }

    } catch (error) {
        console.error('❌ Error while clearing files:', error.message);
        process.exit(1);
    }
} 