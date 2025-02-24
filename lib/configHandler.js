const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.aictx');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const TEMPLATES_DIR = path.join(CONFIG_DIR, 'templates');

const defaultConfig = {
    autoClipboard: false,
    minimize: true  // by default, we'll minimize the output
};

function ensureConfigExists() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }
}

function getConfig() {
    ensureConfigExists();
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        return { ...defaultConfig, ...config };
    } catch (error) {
        return defaultConfig;
    }
}

function showConfig() {
    const config = getConfig();
    console.log('\nCurrent Configuration:');
    console.log('---------------------');
    console.log('Auto-copy to clipboard:', config.autoClipboard ? 'Enabled' : 'Disabled');
    console.log('Minimize output:', config.minimize ? 'Enabled' : 'Disabled');
    console.log('---------------------\n');
}

function configure() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const config = getConfig();

    const askMinimize = (callback) => {
        readline.question('Would you like to minimize the output by default? (Y/n): ', (answer) => {
            const minimize = answer.toLowerCase() !== 'n';
            callback(minimize);
        });
    };

    readline.question('Would you like to automatically copy context to clipboard? (y/N): ', (answer) => {
        const autoClipboard = answer.toLowerCase() === 'y';
        
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