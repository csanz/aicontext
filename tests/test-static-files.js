#!/usr/bin/env node

/**
 * Test static files showing in tree command
 * This test verifies that files in the static directory appear correctly in tree output
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirTree, formatTree } from '../lib/directoryTree.js';
import { ExclusionManager } from '../lib/exclusionManager.js';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Test function
async function testStaticFiles() {
    console.log(chalk.blue('\n🧪 Running Static Files Test'));
    console.log(chalk.blue('=========================='));
    
    // Step 1: Verify that static directory contains files
    const staticDir = path.join(projectRoot, 'static');
    const staticFiles = fs.readdirSync(staticDir);
    
    console.log(chalk.cyan('\n1. Files in static directory:'));
    staticFiles.forEach(file => {
        console.log(`   - ${file}`);
    });
    
    if (staticFiles.length === 0) {
        console.error(chalk.red('Error: No files found in static directory!'));
        process.exit(1);
    }
    
    // Step 2: Test ExclusionManager directly
    console.log(chalk.cyan('\n2. Testing ExclusionManager:'));
    const exclusionManager = new ExclusionManager(projectRoot, true);
    
    for (const file of staticFiles) {
        const filePath = path.join(staticDir, file);
        const shouldExcludeForTree = exclusionManager.shouldExcludeFile(filePath, 'tree');
        const shouldExcludeForContent = exclusionManager.shouldExcludeFile(filePath, 'content');
        
        console.log(`   - ${file}: excluded for tree: ${shouldExcludeForTree}, excluded for content: ${shouldExcludeForContent}`);
        
        // Files should NOT be excluded for tree visualization
        if (shouldExcludeForTree) {
            console.error(chalk.red(`   Error: File ${file} is being excluded for tree visualization!`));
        }
    }
    
    // Step 3: Test dirTree function
    console.log(chalk.cyan('\n3. Testing dirTree function:'));
    const tree = dirTree(staticDir, 1, true, false, null, 'tree');
    
    if (!tree || !tree.children || tree.children.length === 0) {
        console.error(chalk.red('   Error: dirTree returned empty tree for static directory!'));
    } else {
        console.log(`   Found ${tree.children.length} files in tree result`);
        
        // Compare with actual files
        const treeFiles = new Set(tree.children.map(child => child.name));
        const actualFiles = new Set(staticFiles.filter(file => !file.startsWith('.')));
        
        // Check for missing files
        for (const file of actualFiles) {
            if (!treeFiles.has(file)) {
                console.error(chalk.red(`   Error: File ${file} is missing from tree output!`));
            }
        }
        
        // Format and print the tree
        const formattedTree = formatTree(tree, 0, true, '');
        console.log(chalk.green('\nTree output:'));
        console.log(formattedTree);
    }
    
    console.log(chalk.green('\n✅ Static files test completed'));
}

// Run the test
testStaticFiles().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});

function dirname(filename) {
    return path.dirname(filename);
} 