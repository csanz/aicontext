/**
 * Configuration Handler Module
 * 
 * Manages user configuration for the AICTX tool.
 * Handles reading, writing, and displaying configuration settings.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration paths
const CONFIG_DIR = path.join(os.homedir(), '.aictx');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const TEMPLATES_DIR = path.join(CONFIG_DIR, 'templates');

/**
 * Default configuration settings
 * Used when no configuration file exists or as fallback for missing settings
 */
const defaultConfig = {
    autoClipboard: false,
    minimize: true  // by default, we'll minimize the output
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
    console.log('Minimize output:', config.minimize ? 'Enabled' : 'Disabled');
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

    /**
     * Asks the user whether to minimize output by default
     * 
     * @param {Function} callback - Function to call with the result
     */
    const askMinimize = (callback) => {
        readline.question('Would you like to minimize the output by default? (Y/n): ', (answer) => {
            const minimize = answer.toLowerCase() !== 'n';
            callback(minimize);
        });
    };

    // Start the configuration process by asking about clipboard
    readline.question('Would you like to automatically copy context to clipboard? (y/N): ', (answer) => {
        const autoClipboard = answer.toLowerCase() === 'y';
        
        // Then ask about minimization
        askMinimize((minimize) => {
            const newConfig = {
                autoClipboard,
                minimize
            };
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
            console.log('\n✅ Configuration updated successfully!');
            showConfig();
            readline.close();
        });
    });
}

module.exports = {
    getConfig,
    showConfig,
    configure,
    CONFIG_DIR
}; 