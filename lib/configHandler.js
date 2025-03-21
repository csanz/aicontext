/**
 * Configuration Handler Module
 * 
 * Manages user configuration for the AICTX tool.
 * Handles reading, writing, and displaying configuration settings.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { MAX_FILE_SIZE_MB } = require('./constants');

// Configuration paths
const CONFIG_DIR = path.join(os.homedir(), '.aictx');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const TEMPLATES_DIR = path.join(CONFIG_DIR, 'templates');
const EXCLUDE_FILE = path.join(CONFIG_DIR, 'exclude.json');

/**
 * Default configuration settings
 * Used when no configuration file exists or as fallback for missing settings
 */
const defaultConfig = {
    autoClipboard: false,
    defaultTimeoutSec: 30,   // Default timeout in seconds
    defaultMaxFileSizeMb: MAX_FILE_SIZE_MB  // Default max file size in MB
};

/**
 * Default exclusion patterns
 * Used when no exclusion file exists
 */
const defaultExclusions = {
    patterns: []
};

/**
 * Ensures that the configuration directory and file exist
 * Creates them with default values if they don't
 */
function ensureConfigExists() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }
    if (!fs.existsSync(EXCLUDE_FILE)) {
        fs.writeFileSync(EXCLUDE_FILE, JSON.stringify(defaultExclusions, null, 2));
    }
}

/**
 * Gets the current configuration, merging with defaults if needed
 * 
 * @returns {Object} The current configuration
 */
function getConfig() {
    ensureConfigExists();
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        return { ...defaultConfig, ...config };
    } catch (error) {
        return defaultConfig;
    }
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
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const config = getConfig();

    // Start the configuration process by asking about clipboard
    readline.question('Would you like to automatically copy context to clipboard? (y/N): ', (answer) => {
        const autoClipboard = answer.toLowerCase() === 'y';
        
        readline.question(`Set default timeout in seconds (current: ${config.defaultTimeoutSec}): `, (timeoutAnswer) => {
            const timeoutSec = parseInt(timeoutAnswer, 10);
            const defaultTimeoutSec = !isNaN(timeoutSec) && timeoutSec > 0 ? timeoutSec : config.defaultTimeoutSec;
            
            readline.question(`Set default max file size in MB (current: ${config.defaultMaxFileSizeMb}): `, (sizeAnswer) => {
                const maxSize = parseInt(sizeAnswer, 10);
                const defaultMaxFileSizeMb = !isNaN(maxSize) && maxSize > 0 ? maxSize : config.defaultMaxFileSizeMb;
                
                const newConfig = {
                    autoClipboard,
                    defaultTimeoutSec,
                    defaultMaxFileSizeMb
                };
                
                fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
                console.log('\n✅ Configuration updated successfully!');
                showConfig();
                readline.close();
            });
        });
    });
}

/**
 * Gets the current exclusion patterns
 * 
 * @returns {Object} The current exclusion patterns
 */
function getExclusions() {
    ensureConfigExists();
    try {
        const exclusions = JSON.parse(fs.readFileSync(EXCLUDE_FILE, 'utf8'));
        return { ...defaultExclusions, ...exclusions };
    } catch (error) {
        return defaultExclusions;
    }
}

/**
 * Adds a new exclusion pattern
 * 
 * @param {string} pattern - The pattern to exclude
 * @returns {Object} The updated exclusions
 */
function addExclusion(pattern) {
    const exclusions = getExclusions();
    if (!exclusions.patterns.includes(pattern)) {
        // Check if the pattern is a directory and ensure it ends with /**
        if (fs.existsSync(pattern) && fs.statSync(pattern).isDirectory() && !pattern.endsWith('/**')) {
            pattern = pattern.endsWith('/') ? `${pattern}**` : `${pattern}/**`;
        }
        exclusions.patterns.push(pattern);
        fs.writeFileSync(EXCLUDE_FILE, JSON.stringify(exclusions, null, 2));
        console.log(`✅ Added exclusion pattern: ${pattern}`);
    } else {
        console.log(`ℹ️ Pattern already exists: ${pattern}`);
    }
    return exclusions;
}

/**
 * Removes an exclusion pattern
 * 
 * @param {number} index - The index of the pattern to remove (1-based)
 * @returns {Object} The updated exclusions
 */
function removeExclusion(index) {
    const exclusions = getExclusions();
    const actualIndex = index - 1; // Convert from 1-based to 0-based
    
    if (actualIndex >= 0 && actualIndex < exclusions.patterns.length) {
        const removedPattern = exclusions.patterns[actualIndex];
        exclusions.patterns.splice(actualIndex, 1);
        fs.writeFileSync(EXCLUDE_FILE, JSON.stringify(exclusions, null, 2));
        console.log(`✅ Removed exclusion pattern: ${removedPattern}`);
    } else {
        console.log(`❌ Invalid index: ${index}`);
    }
    return exclusions;
}

/**
 * Displays the current exclusion patterns to the console
 */
function showExclusions() {
    const exclusions = getExclusions();
    console.log('\nCurrent Exclusion Patterns:');
    console.log('-------------------------');
    if (exclusions.patterns.length === 0) {
        console.log('No custom exclusion patterns defined.');
    } else {
        exclusions.patterns.forEach((pattern, index) => {
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
    if (exclusions.patterns.length === 0) {
        console.log('No patterns to remove. Add patterns using: cx -i "pattern"');
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

module.exports = {
    getConfig,
    showConfig,
    configure,
    CONFIG_DIR,
    getExclusions,
    addExclusion,
    removeExclusion,
    showExclusions,
    configureIgnore
}; 