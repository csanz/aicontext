import fs from 'fs';
import path from 'path';
import { minimatch } from 'minimatch';
import { getConfig } from './configHandler.js';
import { getGitignorePatterns } from './gitignoreHandler.js';
import { BINARY_EXTENSIONS, IGNORED_DIRS, IGNORED_FILES } from './constants.js';
import chalk from 'chalk';

/**
 * Manages file and directory exclusions from multiple sources:
 * - System exclusions (node_modules, .git, binary files, etc.)
 * - Gitignore patterns
 * - User configuration exclusions
 */
export class ExclusionManager {
  constructor(basePath, verbose = false) {
    this.basePath = path.resolve(basePath);
    this.verbose = verbose;
    this.patterns = new Set();
    this.negationPatterns = new Set();
    this.cache = new Map();
    this.initialized = false;
    this.initialize(); // Initialize immediately in constructor
  }

  log(message) {
    if (this.verbose) {
      console.log(chalk.gray('[debug]'), message);
    }
  }

  addPatterns(patterns) {
    if (!Array.isArray(patterns)) {
      patterns = [patterns];
    }
    
    patterns.forEach(pattern => {
      if (pattern.startsWith('!')) {
        this.negationPatterns.add(pattern.slice(1));
      } else {
        this.patterns.add(pattern);
      }
    });
  }

  initialize() {
    if (this.initialized) return;

    // Add system exclusions
    this.addPatterns(IGNORED_DIRS.map(dir => `**/${dir}/**`));
    
    // Add legacy context folder exclusion
    this.addPatterns(['**/context/**']);

    // Add binary file patterns
    this.addPatterns(BINARY_EXTENSIONS.map(ext => `**/*${ext}`));

    // Add gitignore patterns
    const gitignorePatterns = getGitignorePatterns();
    if (gitignorePatterns.length > 0) {
      this.addPatterns(gitignorePatterns);
    }

    // Add user config patterns
    const configExclusions = getConfig().ignore || [];
    if (configExclusions.length > 0) {
      this.addPatterns(configExclusions);
    }

    this.initialized = true;
    this.log(`Initialization complete. Total patterns: ${this.patterns.size}, Negation patterns: ${this.negationPatterns.size}`);
  }

  /**
   * Check if a file should be excluded based on its extension
   */
  isBinaryFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    // Special handling for .js files - only exclude .min.js files
    if (ext === '.js') {
      return filePath.toLowerCase().endsWith('.min.js');
    }
    
    return BINARY_EXTENSIONS.includes(ext);
  }

  /**
   * Check if a path matches any gitignore patterns
   */
  matchesGitignore(relativePath) {
    return Array.from(this.patterns).some(pattern => 
      minimatch(relativePath, pattern, { dot: true, matchBase: true })
    );
  }

  /**
   * Check if a path matches any config exclusions
   */
  matchesConfigExclusions(relativePath) {
    return Array.from(this.patterns).some(pattern =>
      minimatch(relativePath, pattern, { dot: true, matchBase: true })
    );
  }

  /**
   * Check if a path should be excluded
   */
  shouldExclude(itemPath) {
    const relativePath = path.relative(this.basePath, itemPath);
    const cacheKey = relativePath;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check if it's a binary file
    const isBinary = this.isBinaryFile(itemPath);
    
    // Check if it's a media file
    const isMedia = this.isMediaFile(itemPath);

    // Check against all patterns
    const isExcluded = Array.from(this.patterns).some(pattern => {
      const matches = minimatch(relativePath, pattern, { dot: true });
      if (matches && this.verbose) {
        this.log(`Excluded ${relativePath} due to pattern: ${pattern}`);
      }
      return matches;
    });

    // Check negation patterns that can override exclusions
    const isNegated = Array.from(this.negationPatterns).some(pattern =>
      minimatch(relativePath, pattern, { dot: true })
    );

    // Media files should be excluded
    const result = (isExcluded && !isNegated) || isBinary || isMedia;
    this.cache.set(cacheKey, result);
    return result;
  }

  isMediaFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico'];
    return mediaExtensions.includes(ext);
  }

  clearCache() {
    this.cache.clear();
    this.log('Cache cleared');
  }
} 