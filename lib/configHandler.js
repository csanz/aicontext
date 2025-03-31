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
const LEGACY_CONFIG_DIR = path.join(os.homedir(), '.aictx');
const CONFIG_DIR = path.join(os.homedir(), '.aicontext');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const TEMPLATES_DIR = path.join(CONFIG_DIR, 'templates');
const EXCLUDE_FILE = path.join(CONFIG_DIR, 'exclude.json');

// Legacy paths for migration
const LEGACY_CONFIG_FILE = path.join(LEGACY_CONFIG_DIR, 'config.json');
const LEGACY_TEMPLATES_DIR = path.join(LEGACY_CONFIG_DIR, 'templates');
const LEGACY_EXCLUDE_FILE = path.join(LEGACY_CONFIG_DIR, 'exclude.json');

// New relative configuration paths
const RELATIVE_CONFIG_DIR = '.aicontext';
const RELATIVE_IGNORE_FILE = 'ignore.json';

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
                fs.copyFileSync(LEGACY_CONFIG_FILE, CONFIG_FILE);
            }
            
            // Migrate exclude file if it exists
            if (fs.existsSync(LEGACY_EXCLUDE_FILE)) {
                fs.copyFileSync(LEGACY_EXCLUDE_FILE, EXCLUDE_FILE);
            }
            
            // Migrate templates directory if it exists
            if (fs.existsSync(LEGACY_TEMPLATES_DIR)) {
                if (!fs.existsSync(TEMPLATES_DIR)) {
                    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
                }
                
                // Copy all template files
                const templateFiles = fs.readdirSync(LEGACY_TEMPLATES_DIR);
                templateFiles.forEach(file => {
                    const srcPath = path.join(LEGACY_TEMPLATES_DIR, file);
                    const destPath = path.join(TEMPLATES_DIR, file);
                    if (fs.statSync(srcPath).isFile()) {
                        fs.copyFileSync(srcPath, destPath);
                    }
                });
            }
            
            console.log('✅ Configuration successfully migrated to ~/.aicontext');
        } catch (error) {
            console.warn(`⚠️ Error migrating configuration: ${error.message}`);
            console.warn('Falling back to legacy configuration directory');
            return false;
        }
    }
    
    return true;
}

/**
 * Ensures that the configuration directory and file exist
 * Creates them with default values if they don't
 */
function ensureConfigExists() {
    // Try to migrate from legacy config first
    const migrationSuccessful = migrateFromLegacyConfig();
    
    // Use legacy config dir if migration failed
    const configDir = migrationSuccessful ? CONFIG_DIR : LEGACY_CONFIG_DIR;
    const configFile = migrationSuccessful ? CONFIG_FILE : LEGACY_CONFIG_FILE;
    const excludeFile = migrationSuccessful ? EXCLUDE_FILE : LEGACY_EXCLUDE_FILE;
    
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    if (!fs.existsSync(configFile)) {
        fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
    }
    if (!fs.existsSync(excludeFile)) {
        fs.writeFileSync(excludeFile, JSON.stringify(defaultExclusions, null, 2));
    }
}

/**
 * Ensures that the relative configuration directory and ignore file exist
 * Creates them with default values if they don't
 * 
 * @returns {String} The path to the ignore file
 */
function ensureRelativeConfigExists() {
    const relativeConfigDir = path.join(process.cwd(), RELATIVE_CONFIG_DIR);
    const relativeIgnoreFile = path.join(relativeConfigDir, RELATIVE_IGNORE_FILE);
    
    if (!fs.existsSync(relativeConfigDir)) {
        fs.mkdirSync(relativeConfigDir, { recursive: true });
    }
    if (!fs.existsSync(relativeIgnoreFile)) {
        fs.writeFileSync(relativeIgnoreFile, JSON.stringify(defaultExclusions, null, 2));
    }
    
    return relativeIgnoreFile;
}

/**
 * Gets the current configuration, merging with defaults if needed
 * 
 * @returns {Object} The current configuration
 */
function getConfig() {
    ensureConfigExists();
    
    // Try new config file first
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return { ...defaultConfig, ...config };
        } catch (error) {
            console.warn(`Error reading ${CONFIG_FILE}: ${error.message}`);
            // Fall through to legacy config
        }
    }
    
    // Fall back to legacy config file
    if (fs.existsSync(LEGACY_CONFIG_FILE)) {
        try {
            const config = JSON.parse(fs.readFileSync(LEGACY_CONFIG_FILE, 'utf8'));
            return { ...defaultConfig, ...config };
        } catch (error) {
            console.warn(`Error reading ${LEGACY_CONFIG_FILE}: ${error.message}`);
        }
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
 * Gets the current exclusion patterns from the relative .aicontext/ignore.json file
 * Falls back to the global exclude.json if relative file doesn't exist
 * 
 * @returns {Object} The current exclusion patterns
 */
function getExclusions() {
    // Check for relative ignore file first
    const relativeConfigDir = path.join(process.cwd(), RELATIVE_CONFIG_DIR);
    const relativeIgnoreFile = path.join(relativeConfigDir, RELATIVE_IGNORE_FILE);
    
    if (fs.existsSync(relativeIgnoreFile)) {
        try {
            const exclusions = JSON.parse(fs.readFileSync(relativeIgnoreFile, 'utf8'));
            return { ...defaultExclusions, ...exclusions };
        } catch (error) {
            console.warn(`Error reading ${relativeIgnoreFile}: ${error.message}`);
            // Fall through to global config
        }
    }
    
    // Fall back to global config - try new location first, then legacy
    ensureConfigExists();
    
    if (fs.existsSync(EXCLUDE_FILE)) {
        try {
            const exclusions = JSON.parse(fs.readFileSync(EXCLUDE_FILE, 'utf8'));
            return { ...defaultExclusions, ...exclusions };
        } catch (error) {
            console.warn(`Error reading ${EXCLUDE_FILE}: ${error.message}`);
            // Fall through to legacy config
        }
    }
    
    if (fs.existsSync(LEGACY_EXCLUDE_FILE)) {
        try {
            const exclusions = JSON.parse(fs.readFileSync(LEGACY_EXCLUDE_FILE, 'utf8'));
            return { ...defaultExclusions, ...exclusions };
        } catch (error) {
            console.warn(`Error reading ${LEGACY_EXCLUDE_FILE}: ${error.message}`);
        }
    }
    
    return defaultExclusions;
}

/**
 * Adds a new exclusion pattern to the relative .aicontext/ignore.json file
 * 
 * @param {string} pattern - The pattern to exclude
 * @returns {Object} The updated exclusions
 */
function addExclusion(pattern) {
    // Ensure the relative config exists and get the path
    const ignoreFilePath = ensureRelativeConfigExists();
    
    // Read current exclusions
    let exclusions;
    try {
        exclusions = JSON.parse(fs.readFileSync(ignoreFilePath, 'utf8'));
    } catch (error) {
        exclusions = { ...defaultExclusions };
    }
    
    // Initialize patterns array if it doesn't exist
    if (!exclusions.patterns) {
        exclusions.patterns = [];
    }
    
    // Add pattern if it doesn't already exist
    if (!exclusions.patterns.includes(pattern)) {
        // Check if the pattern is a directory and ensure it ends with /**
        if (fs.existsSync(pattern) && fs.statSync(pattern).isDirectory() && !pattern.endsWith('/**')) {
            pattern = pattern.endsWith('/') ? `${pattern}**` : `${pattern}/**`;
        }
        exclusions.patterns.push(pattern);
        fs.writeFileSync(ignoreFilePath, JSON.stringify(exclusions, null, 2));
        console.log(`✅ Added exclusion pattern: ${pattern}`);
        console.log(`  (Stored in: ${path.relative(process.cwd(), ignoreFilePath)})`);
    } else {
        console.log(`ℹ️ Pattern already exists: ${pattern}`);
    }
    return exclusions;
}

/**
 * Removes an exclusion pattern from the relative .aicontext/ignore.json file
 * 
 * @param {number} index - The index of the pattern to remove (1-based)
 * @returns {Object} The updated exclusions
 */
function removeExclusion(index) {
    // Get the relative ignore file path
    const relativeConfigDir = path.join(process.cwd(), RELATIVE_CONFIG_DIR);
    const relativeIgnoreFile = path.join(relativeConfigDir, RELATIVE_IGNORE_FILE);
    
    // Check if the relative ignore file exists
    if (!fs.existsSync(relativeIgnoreFile)) {
        console.log(`❌ No ignore file found in the current directory.`);
        return defaultExclusions;
    }
    
    // Read current exclusions
    let exclusions;
    try {
        exclusions = JSON.parse(fs.readFileSync(relativeIgnoreFile, 'utf8'));
    } catch (error) {
        console.log(`❌ Error reading ignore file: ${error.message}`);
        return defaultExclusions;
    }
    
    // Initialize patterns array if it doesn't exist
    if (!exclusions.patterns) {
        exclusions.patterns = [];
        return exclusions;
    }
    
    const actualIndex = index - 1; // Convert from 1-based to 0-based
    
    if (actualIndex >= 0 && actualIndex < exclusions.patterns.length) {
        const removedPattern = exclusions.patterns[actualIndex];
        exclusions.patterns.splice(actualIndex, 1);
        fs.writeFileSync(relativeIgnoreFile, JSON.stringify(exclusions, null, 2));
        console.log(`✅ Removed exclusion pattern: ${removedPattern}`);
        console.log(`  (Updated: ${path.relative(process.cwd(), relativeIgnoreFile)})`);
    } else {
        console.log(`❌ Invalid index: ${index}`);
    }
    return exclusions;
}

/**
 * Displays the current exclusion patterns to the console
 * Shows patterns from the relative .aicontext/ignore.json file
 */
function showExclusions() {
    const exclusions = getExclusions();
    
    // Get the relative ignore file path for display
    const relativeConfigDir = path.join(process.cwd(), RELATIVE_CONFIG_DIR);
    const relativeIgnoreFile = path.join(relativeConfigDir, RELATIVE_IGNORE_FILE);
    const displayPath = fs.existsSync(relativeIgnoreFile) 
        ? path.relative(process.cwd(), relativeIgnoreFile)
        : 'Global Patterns';
    
    console.log('\nCurrent Exclusion Patterns:');
    console.log(`(Source: ${displayPath})`);
    console.log('-------------------------');
    if (!exclusions.patterns || exclusions.patterns.length === 0) {
        console.log('No custom exclusion patterns defined.');
        console.log('Add patterns using: cx --ignore add "pattern"');
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
 * 
 * @returns {Object} An empty exclusions object
 */
function clearExclusions() {
    // Ensure the relative config exists and get the path
    const ignoreFilePath = ensureRelativeConfigExists();
    
    // Create empty exclusions object
    const emptyExclusions = { ...defaultExclusions, patterns: [] };
    
    // Write to file
    fs.writeFileSync(ignoreFilePath, JSON.stringify(emptyExclusions, null, 2));
    console.log(`✅ Cleared all exclusion patterns`);
    console.log(`  (Updated: ${path.relative(process.cwd(), ignoreFilePath)})`);
    
    return emptyExclusions;
}

/**
 * Tests the current exclusion patterns by showing what would be excluded
 * Uses the directoryTree function to show the result
 */
function testExclusions() {
    const { dirTree } = require('./directoryTree');
    
    // Get the current directory
    const currentDir = process.cwd();
    const displayName = path.basename(currentDir);
    
    console.log('\nTesting exclusion patterns...');
    console.log('Current directory:', currentDir);
    console.log('\nDirectory Structure with Current Exclusions:');
    console.log('```');
    console.log(dirTree(currentDir));
    console.log('```');
    
    return true;
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
    configureIgnore,
    clearExclusions,
    testExclusions,
    RELATIVE_CONFIG_DIR,
    RELATIVE_IGNORE_FILE
}; 