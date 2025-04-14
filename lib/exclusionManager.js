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
  }

  log(message) {
    if (this.verbose) {
      console.log(chalk.gray('[debug]'), message);
    }
  }

  initialize() {
    if (this.initialized) return;

    // Add patterns from IGNORED_DIRS
    IGNORED_DIRS.forEach(dir => {
      // Add both the directory itself and its contents
      this.patterns.add(`**/${dir}`);
      this.patterns.add(`**/${dir}/**`);
    });
    this.log(`Added ignored directory patterns: ${Array.from(this.patterns).join(', ')}`);

    // Add patterns from IGNORED_FILES
    IGNORED_FILES.forEach(file => {
      this.patterns.add(`**/${file}`);
    });
    this.log(`Added ignored file patterns: ${Array.from(this.patterns).join(', ')}`);

    // Add binary file patterns
    BINARY_EXTENSIONS.forEach(ext => {
      const pattern = `**/*${ext}`;
      this.patterns.add(pattern);
    });
    this.log(`Added binary patterns for extensions: ${BINARY_EXTENSIONS.join(', ')}`);

    // Add gitignore patterns
    const gitignorePatterns = getGitignorePatterns();
    gitignorePatterns.forEach(pattern => {
      if (pattern.startsWith('!')) {
        // Store negation patterns separately
        this.negationPatterns.add(pattern.slice(1));
        this.log(`Added negation pattern: ${pattern}`);
      } else {
        this.patterns.add(pattern);
      }
    });
    this.log(`Added gitignore patterns: ${gitignorePatterns.join(', ')}`);

    // Add user config patterns
    const config = getConfig();
    if (config.ignorePatterns) {
      config.ignorePatterns.forEach(pattern => {
        if (pattern.startsWith('!')) {
          this.negationPatterns.add(pattern.slice(1));
        } else {
          this.patterns.add(pattern);
        }
      });
      this.log(`Added user config patterns: ${config.ignorePatterns.join(', ')}`);
    }

    this.initialized = true;
    this.log(`Initialization complete. Total patterns: ${this.patterns.size}, Negation patterns: ${this.negationPatterns.size}`);
  }

  /**
   * Check if a file should be excluded based on its extension
   */
  isBinaryFile(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return BINARY_EXTENSIONS.includes(ext);
  }

  /**
   * Check if a path matches any gitignore patterns
   */
  matchesGitignore(relativePath) {
    return this.patterns.some(pattern => 
      minimatch(relativePath, pattern, { dot: true, matchBase: true })
    );
  }

  /**
   * Check if a path matches any config exclusions
   */
  matchesConfigExclusions(relativePath) {
    return this.patterns.some(pattern =>
      minimatch(relativePath, pattern, { dot: true, matchBase: true })
    );
  }

  /**
   * Check if a path should be excluded
   */
  shouldExclude(filePath) {
    if (!this.initialized) {
      this.initialize();
    }

    // Normalize and make path absolute
    const absolutePath = path.resolve(filePath);
    
    // Check cache first
    if (this.cache.has(absolutePath)) {
      const cached = this.cache.get(absolutePath);
      this.log(`Cache hit for ${absolutePath}: ${cached ? 'excluded' : 'included'}`);
      return cached;
    }

    // Get path relative to base directory
    const relativePath = path.relative(this.basePath, absolutePath);

    // First check if the path matches any negation patterns
    for (const pattern of this.negationPatterns) {
      if (minimatch(relativePath, pattern, { dot: true, matchBase: true })) {
        this.log(`Including ${relativePath} (matched negation pattern: ${pattern})`);
        this.cache.set(absolutePath, false);
        return false;
      }
    }
    
    // Then check exclusion patterns
    for (const pattern of this.patterns) {
      if (minimatch(relativePath, pattern, { dot: true, matchBase: true })) {
        this.log(`Excluding ${relativePath} (matched pattern: ${pattern})`);
        this.cache.set(absolutePath, true);
        return true;
      }
    }

    // Check if it's a binary file
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      const ext = path.extname(absolutePath).toLowerCase();
      if (BINARY_EXTENSIONS.some(binaryExt => ext === `.${binaryExt}`)) {
        this.log(`Excluding binary file: ${absolutePath}`);
        this.cache.set(absolutePath, true);
        return true;
      }
    }

    // Check if it's a hidden file/directory (starts with .)
    const basename = path.basename(absolutePath);
    if (basename.startsWith('.') && !basename.startsWith('.git')) {
      this.log(`Excluding hidden file/directory: ${absolutePath}`);
      this.cache.set(absolutePath, true);
      return true;
    }

    this.log(`Including: ${relativePath}`);
    this.cache.set(absolutePath, false);
    return false;
  }

  clearCache() {
    this.cache.clear();
    this.log('Cache cleared');
  }
} 