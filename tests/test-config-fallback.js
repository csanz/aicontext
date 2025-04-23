#!/usr/bin/env node

/**
 * Test config fallback
 * This test verifies that the application can run even when config files don't exist
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { getConfig } from '../lib/configHandler.js';
import chalk from 'chalk';

// Configuration paths
const LEGACY_CONFIG_DIR = path.join(os.homedir(), '.aictx');
const CONFIG_DIR = path.join(os.homedir(), '.aicontext');

async function testConfigFallback() {
    console.log(chalk.blue('\n🧪 Running Config Fallback Test'));
    console.log(chalk.blue('=============================='));
    
    // Backup existing config directories
    const backupLegacyDir = path.join(os.tmpdir(), '.aictx-backup');
    const backupNewDir = path.join(os.tmpdir(), '.aicontext-backup');
    
    try {
        // Step 1: Backup existing config if it exists
        console.log(chalk.cyan('\n1. Backing up existing configuration:'));
        
        if (fs.existsSync(LEGACY_CONFIG_DIR)) {
            console.log(`   - Backing up ${LEGACY_CONFIG_DIR} to ${backupLegacyDir}`);
            fs.cpSync(LEGACY_CONFIG_DIR, backupLegacyDir, { recursive: true });
            fs.rmSync(LEGACY_CONFIG_DIR, { recursive: true, force: true });
        }
        
        if (fs.existsSync(CONFIG_DIR)) {
            console.log(`   - Backing up ${CONFIG_DIR} to ${backupNewDir}`);
            fs.cpSync(CONFIG_DIR, backupNewDir, { recursive: true });
            fs.rmSync(CONFIG_DIR, { recursive: true, force: true });
        }
        
        // Step 2: Ensure both config directories don't exist
        console.log(chalk.cyan('\n2. Verifying config directories are removed:'));
        console.log(`   - Legacy config exists: ${fs.existsSync(LEGACY_CONFIG_DIR)}`);
        console.log(`   - New config exists: ${fs.existsSync(CONFIG_DIR)}`);
        
        // Step 3: Test getConfig() function
        console.log(chalk.cyan('\n3. Testing getConfig() function:'));
        const config = getConfig();
        console.log('   - Config retrieved:', config);
        
        if (config) {
            console.log(chalk.green('   ✅ Test PASSED: Config was returned even with no directories'));
        } else {
            console.log(chalk.red('   ❌ Test FAILED: No config was returned'));
        }
        
        // Step 4: Check if config directories were created
        console.log(chalk.cyan('\n4. Checking if config directories were created:'));
        console.log(`   - Legacy config exists: ${fs.existsSync(LEGACY_CONFIG_DIR)}`);
        console.log(`   - New config exists: ${fs.existsSync(CONFIG_DIR)}`);
        
        if (fs.existsSync(CONFIG_DIR)) {
            console.log(chalk.green('   ✅ Test PASSED: Config directory was created automatically'));
        } else if (fs.existsSync(LEGACY_CONFIG_DIR)) {
            console.log(chalk.green('   ✅ Test PASSED: Legacy config directory was created automatically'));
        } else {
            console.log(chalk.red('   ❌ Test FAILED: No config directory was created'));
        }
        
        console.log(chalk.green('\n✅ Config fallback test completed'));
    } catch (error) {
        console.error(chalk.red(`\nTest failed: ${error.message}`));
    } finally {
        // Step 5: Restore original config
        console.log(chalk.cyan('\n5. Restoring original configuration:'));
        
        // Remove any created config
        if (fs.existsSync(LEGACY_CONFIG_DIR)) {
            fs.rmSync(LEGACY_CONFIG_DIR, { recursive: true, force: true });
        }
        
        if (fs.existsSync(CONFIG_DIR)) {
            fs.rmSync(CONFIG_DIR, { recursive: true, force: true });
        }
        
        // Restore from backup
        if (fs.existsSync(backupLegacyDir)) {
            console.log(`   - Restoring legacy config from ${backupLegacyDir}`);
            fs.cpSync(backupLegacyDir, LEGACY_CONFIG_DIR, { recursive: true });
            fs.rmSync(backupLegacyDir, { recursive: true, force: true });
        }
        
        if (fs.existsSync(backupNewDir)) {
            console.log(`   - Restoring new config from ${backupNewDir}`);
            fs.cpSync(backupNewDir, CONFIG_DIR, { recursive: true });
            fs.rmSync(backupNewDir, { recursive: true, force: true });
        }
    }
}

// Run the test
testConfigFallback().catch(err => {
    console.error('Test execution failed:', err);
}); 