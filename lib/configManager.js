/**
 * Configuration manager module
 * Provides a simplified interface to the configuration system
 */

const { getConfig } = require('./configHandler');

/**
 * Configuration manager singleton
 * Provides methods for accessing configuration settings
 */
const configManager = {
    /**
     * Gets the current configuration
     * @returns {Object} The configuration object
     */
    getConfig() {
        return getConfig();
    }
};

module.exports = {
    configManager
}; 