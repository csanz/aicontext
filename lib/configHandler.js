/**
 * Configuration Handler Module
 * 
 * Manages user configuration for the AICTX tool.
 * Handles reading, writing, and displaying configuration settings.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { MAX_FILE_SIZE_MB } from './constants.js';
import readline from 'readline';
import chalk from 'chalk';
import { dirTree, formatTree } from './directoryTree.js';

// Configuration paths
const LEGACY_CONFIG_DIR = path.join(os.homedir(), '.aictx');
const CONFIG_DIR = path.join(os.homedir(), '.aicontext');

// Legacy paths for migration
const LEGACY_CONFIG_FILE = path.join(LEGACY_CONFIG_DIR, 'config.json');
const LEGACY_TEMPLATES_DIR = path.join(LEGACY_CONFIG_DIR, 'templates');
const LEGACY_EXCLUDE_FILE = path.join(LEGACY_CONFIG_DIR, 'exclude.json');

// New relative configuration paths
const RELATIVE_CONFIG_DIR = '.aicontext';
const RELATIVE_CONFIG_FILE = 'config.json';
const RELATIVE_IGNORE_FILE = 'ignore.json';

/**
 * Default configuration settings
 * Used when no configuration file exists or as fallback for missing settings
 */
const defaultConfig = {
    autoClipboard: false,
    defaultTimeoutSec: 30,   // Default timeout in seconds
    defaultMaxFileSizeMb: MAX_FILE_SIZE_MB,  // Default max file size in MB
};

/**
 * Default exclusion patterns
 * Used when no exclusion file exists
 */
const defaultExclusions = {
    ignore: []
};

/**
 * Migrates configuration from legacy .aictx directory to new .aicontext directory if needed
 */
function migrateFromLegacyConfig() {
    // Check if legacy config exists and new config doesn't
    if (fs.existsSync(LEGACY_CONFIG_DIR) && !fs.existsSync(CONFIG_DIR)) {
        console.log('Migrating configuration from ~/.aictx to ~/.aicontext...');
        
        try {
            // Create new config directory
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
            
            // Migrate config file if it exists
            if (fs.existsSync(LEGACY_CONFIG_FILE)) {
                fs.copyFileSync(LEGACY_CONFIG_FILE, path.join(CONFIG_DIR, 'config.json'));
            }
            
            // Migrate exclude file if it exists
            if (fs.existsSync(LEGACY_EXCLUDE_FILE)) {
                fs.copyFileSync(LEGACY_EXCLUDE_FILE, path.join(CONFIG_DIR, 'exclude.json'));
            }
            
            // Migrate templates directory if it exists
            if (fs.existsSync(LEGACY_TEMPLATES_DIR)) {
                const newTemplatesDir = path.join(CONFIG_DIR, 'templates');
                if (!fs.existsSync(newTemplatesDir)) {
                    fs.mkdirSync(newTemplatesDir, { recursive: true });
                }
                
                // Copy all template files
                const templateFiles = fs.readdirSync(LEGACY_TEMPLATES_DIR);
                templateFiles.forEach(file => {
                    const srcPath = path.join(LEGACY_TEMPLATES_DIR, file);
                    const destPath = path.join(newTemplatesDir, file);
                    if (fs.statSync(srcPath).isFile()) {
                        fs.copyFileSync(srcPath, destPath);
                    }
                });
            }
            
            console.log('✅ Configuration successfully migrated to ~/.aicontext');
            return true;
        } catch (error) {
            console.warn(`⚠️ Error migrating configuration: ${error.message}`);
            console.warn('Falling back to legacy configuration directory');
            return false;
        }
    }
    
    // If we're here, either migration wasn't needed or new config already exists
    return fs.existsSync(CONFIG_DIR);
}

/**
 * Ensures that the configuration directory and file exist
 * Creates them with default values if they don't
 */
function ensureConfigExists() {
    // Try to migrate from legacy config first
    const migrationSuccessful = migrateFromLegacyConfig();
    
    // Use correct config paths based on migration success
    const configDir = migrationSuccessful ? CONFIG_DIR : LEGACY_CONFIG_DIR;
    const configFile = migrationSuccessful ? path.join(CONFIG_DIR, 'config.json') : LEGACY_CONFIG_FILE;
    const excludeFile = migrationSuccessful ? path.join(CONFIG_DIR, 'exclude.json') : LEGACY_EXCLUDE_FILE;
    
    try {
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        if (!fs.existsSync(configFile)) {
            fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
        }
        if (!fs.existsSync(excludeFile)) {
            fs.writeFileSync(excludeFile, JSON.stringify(defaultExclusions, null, 2));
        }
    } catch (error) {
        console.warn(`Warning: Could not create or access config files: ${error.message}`);
        console.warn('Using default configuration...');
    }
}

/**
 * Ensures that the relative configuration directory and files exist
 * Creates them with default values if they don't
 * 
 * @returns {Object} The paths to the config files
 */
function ensureRelativeConfigExists() {
    const relativeConfigDir = path.join(process.cwd(), RELATIVE_CONFIG_DIR);
    const relativeConfigFile = path.join(relativeConfigDir, RELATIVE_CONFIG_FILE);
    const relativeIgnoreFile = path.join(relativeConfigDir, RELATIVE_IGNORE_FILE);
    
    if (!fs.existsSync(relativeConfigDir)) {
        fs.mkdirSync(relativeConfigDir, { recursive: true });
    }
    if (!fs.existsSync(relativeConfigFile)) {
        fs.writeFileSync(relativeConfigFile, JSON.stringify(defaultConfig, null, 2));
    }
    if (!fs.existsSync(relativeIgnoreFile)) {
        fs.writeFileSync(relativeIgnoreFile, JSON.stringify(defaultExclusions, null, 2));
    }
    
    return { configFile: relativeConfigFile, ignoreFile: relativeIgnoreFile };
}

/**
 * Gets the current configuration, merging with defaults if needed
 * 
 * @returns {Object} The current configuration
 */
function getConfig() {
    try {
        ensureConfigExists();
        
        // Try new config file first
        const configPath = fs.existsSync(path.join(CONFIG_DIR, 'config.json')) 
            ? path.join(CONFIG_DIR, 'config.json') 
            : LEGACY_CONFIG_FILE;
            
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                return { ...defaultConfig, ...config };
            } catch (error) {
                console.warn(`Error reading ${configPath}: ${error.message}`);
                console.warn('Using default configuration...');
            }
        }
    } catch (error) {
        console.warn(`Error accessing configuration: ${error.message}`);
        console.warn('Using default configuration...');
    }
    
    return defaultConfig;
}

/**
 * Displays the current configuration settings to the console
 */
function showConfig() {
    const config = getConfig();
    console.log('\nCurrent Configuration:');
    console.log('---------------------');
    console.log('Auto-copy to clipboard:', config.autoClipboard ? 'Enabled' : 'Disabled');
    console.log('Default timeout:', config.defaultTimeoutSec, 'seconds');
    console.log('Default max file size:', config.defaultMaxFileSizeMb, 'MB');
    console.log('---------------------\n');
}

/**
 * Interactive configuration setup
 * Prompts the user for configuration options and saves them
 */
function configure() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const config = getConfig();

    // Promisify readline for better flow control
    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    // Start the configuration process
    (async () => {
        try {
            // Ask about clipboard
            const clipboardAnswer = await question('Would you like to automatically copy context to clipboard? (y/N): ');
            config.autoClipboard = clipboardAnswer.toLowerCase().startsWith('y');

            // Ask about timeout
            const timeoutAnswer = await question(`Enter default timeout in seconds (current: ${config.defaultTimeoutSec}): `);
            if (timeoutAnswer.trim()) {
                const timeout = parseInt(timeoutAnswer);
                if (!isNaN(timeout) && timeout > 0) {
                    config.defaultTimeoutSec = timeout;
                }
            }

            // Ask about max file size
            const sizeAnswer = await question(`Enter default max file size in MB (current: ${config.defaultMaxFileSizeMb}): `);
            if (sizeAnswer.trim()) {
                const size = parseInt(sizeAnswer);
                if (!isNaN(size) && size > 0) {
                    config.defaultMaxFileSizeMb = size;
                }
            }

            // Save the configuration
            fs.writeFileSync(LEGACY_CONFIG_FILE, JSON.stringify(config, null, 2));
            console.log('\nConfiguration saved successfully!\n');

            // Show the new configuration
            showConfig();
        } catch (error) {
            console.error('Error during configuration:', error);
        } finally {
            rl.close();
            process.exit(0);
        }
    })();
}

/**
 * Gets the current exclusion patterns from the relative .aicontext/ignore.json file
 * 
 * @returns {Object} The current exclusion patterns
 */
function getExclusions() {
    const configFile = ensureRelativeConfigExists();
    try {
        const config = JSON.parse(fs.readFileSync(configFile.ignoreFile, 'utf8'));
        // Ensure we have a valid array of patterns
        const patterns = Array.isArray(config.ignore) ? config.ignore : [];
        // Filter out any invalid patterns
        const validPatterns = patterns.filter(pattern => typeof pattern === 'string' && pattern.trim().length > 0);
        return { patterns: validPatterns };
    } catch (error) {
        console.warn(`Error reading ${configFile.ignoreFile}: ${error.message}`);
        // Create a new ignore file with default exclusions
        fs.writeFileSync(configFile.ignoreFile, JSON.stringify(defaultExclusions, null, 2));
        return { patterns: [] };
    }
}

/**
 * Adds a new exclusion pattern to the relative .aicontext/ignore.json file
 * 
 * @param {string} pattern - The pattern to exclude
 */
function addExclusion(pattern) {
    if (!pattern || typeof pattern !== 'string' || pattern.trim().length === 0) {
        console.log(chalk.red('❌ Invalid pattern: Pattern must be a non-empty string'));
        return;
    }

    // Remove any quotes from the pattern
    pattern = pattern.replace(/^["']|["']$/g, '');
    
    const configFile = ensureRelativeConfigExists();
    
    // Read current config
    let config;
    try {
        config = JSON.parse(fs.readFileSync(configFile.ignoreFile, 'utf8'));
    } catch (error) {
        config = { ignore: [] };
    }
    
    // Initialize ignore array if it doesn't exist
    if (!Array.isArray(config.ignore)) {
        config.ignore = [];
    }
    
    // Add pattern if it's not already in the list
    if (!config.ignore.includes(pattern)) {
        config.ignore.push(pattern);
        fs.writeFileSync(configFile.ignoreFile, JSON.stringify(config, null, 2));
        console.log(chalk.green(`✅ Added exclusion pattern: ${pattern}`));
    } else {
        console.log(chalk.yellow(`⚠️ Pattern already exists: ${pattern}`));
    }
}

/**
 * Removes an exclusion pattern from the relative .aicontext/ignore.json file
 * 
 * @param {number} index - The index of the pattern to remove (1-based)
 * @returns {Object} The updated exclusions
 */
function removeExclusion(index) {
    const configFile = ensureRelativeConfigExists();
    
    // Read current config
    let config;
    try {
        config = JSON.parse(fs.readFileSync(configFile.ignoreFile, 'utf8'));
    } catch (error) {
        config = { ...defaultConfig };
    }
    
    // Initialize ignore array if it doesn't exist
    if (!config.ignore) {
        config.ignore = [];
        return { patterns: [] };
    }
    
    const actualIndex = index - 1; // Convert from 1-based to 0-based
    
    if (actualIndex >= 0 && actualIndex < config.ignore.length) {
        const removedPattern = config.ignore[actualIndex];
        config.ignore.splice(actualIndex, 1);
        fs.writeFileSync(configFile.ignoreFile, JSON.stringify(config, null, 2));
        console.log(`✅ Removed exclusion pattern: ${removedPattern}`);
        console.log(`  (Updated: ${path.relative(process.cwd(), configFile.ignoreFile)})`);
    } else {
        console.log(`❌ Invalid index: ${index}`);
    }
    return { patterns: config.ignore };
}

/**
 * Displays the current exclusion patterns to the console
 */
function showExclusions() {
    const configFile = ensureRelativeConfigExists();
    let config;
    try {
        config = JSON.parse(fs.readFileSync(configFile.ignoreFile, 'utf8'));
    } catch (error) {
        config = { ...defaultConfig };
    }
    
    const displayPath = path.relative(process.cwd(), configFile.ignoreFile);
    
    console.log('\nCurrent Exclusion Patterns:');
    console.log(`(Source: ${displayPath})`);
    console.log('-------------------------');
    if (!config.ignore || config.ignore.length === 0) {
        console.log('No custom exclusion patterns defined.');
        console.log('Add patterns using: cx ignore add "pattern"');
    } else {
        config.ignore.forEach((pattern, index) => {
            console.log(`${index + 1}. ${pattern}`);
        });
    }
    console.log('-------------------------\n');
}

/**
 * Interactive configuration for ignore patterns
 * Allows users to view and remove exclusion patterns
 */
function configureIgnore() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    showExclusions();
    
    const exclusions = getExclusions();
    if (!exclusions.patterns || exclusions.patterns.length === 0) {
        console.log('No patterns to remove. Add patterns using: cx --ignore add "pattern"');
        readline.close();
        return;
    }

    readline.question('Enter the number of the pattern to remove (or 0 to cancel): ', (answer) => {
        const index = parseInt(answer, 10);
        
        if (index === 0) {
            console.log('Operation cancelled.');
        } else if (isNaN(index) || index < 0 || index > exclusions.patterns.length) {
            console.log(`❌ Invalid input: ${answer}. Please enter a number between 0 and ${exclusions.patterns.length}.`);
        } else {
            removeExclusion(index);
            showExclusions();
        }
        
        readline.close();
    });
}

/**
 * Clears all exclusion patterns from the relative .aicontext/ignore.json file
 */
function clearExclusions() {
    const configFile = ensureRelativeConfigExists();
    let config;
    try {
        config = JSON.parse(fs.readFileSync(configFile.ignoreFile, 'utf8'));
    } catch (error) {
        config = { ...defaultConfig };
    }
    
    config.ignore = [];
    fs.writeFileSync(configFile.ignoreFile, JSON.stringify(config, null, 2));
    console.log('✅ Cleared all exclusion patterns');
    console.log(`  (Updated: ${path.relative(process.cwd(), configFile.ignoreFile)})`);
    return { patterns: [] };
}

/**
 * Tests the current exclusion patterns by showing what would be excluded
 * Uses the directoryTree function to show the result with proper formatting
 */
function testExclusions() {
    // Get the current directory
    const currentDir = process.cwd();
    const displayName = path.basename(currentDir);
    
    console.log('\nTesting exclusion patterns...');
    console.log('Current directory:', currentDir);
    console.log('\nDirectory Structure with Current Exclusions:');
    
    // Generate the tree with purpose set to 'ignore-aware-tree' to properly respect ignore patterns
    const tree = dirTree(currentDir, 10, false, false, null, 'ignore-aware-tree');
    if (tree) {
        // Format the tree for display
        const formattedTree = formatTree(tree);
        console.log(formattedTree);
    } else {
        console.log(`Could not generate tree for ${currentDir}`);
    }
    
    return true;
}

export {
    getConfig,
    showConfig,
    configure,
    CONFIG_DIR,
    getExclusions,
    addExclusion,
    removeExclusion,
    showExclusions,
    configureIgnore,
    clearExclusions,
    testExclusions,
    RELATIVE_CONFIG_DIR,
    RELATIVE_CONFIG_FILE,
    RELATIVE_IGNORE_FILE
}; 