/**
 * Configuration manager module
 * Provides a simplified interface to the configuration system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ConfigManager {
  constructor() {
    this.config = {
      maxFiles: 100,
      maxLinesPerFile: 300,
      maxDepth: 4,
      defaultTimeoutSec: 30,
      defaultMaxFileSizeMb: 10,
      autoClipboard: true,
      ignorePaths: [],
      ignorePatterns: [],
      includePatterns: []
    };
    this.configPath = path.join(process.cwd(), '.aicontext', 'config', 'config.json');
    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const savedConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.error('Error loading config:', error.message);
    }
  }

  saveConfig() {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error.message);
    }
  }

  getConfig() {
    return this.config;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }
}

export const configManager = new ConfigManager();

export default configManager; 