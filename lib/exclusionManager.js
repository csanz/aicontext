import fs from 'fs';
import path from 'path';
import { minimatch } from 'minimatch';
import { getConfig, getExclusions } from './configHandler.js';
import { getGitignorePatterns } from './gitignoreHandler.js';
import { BINARY_EXTENSIONS, IGNORED_DIRS, IGNORED_FILES } from './constants.js';
import chalk from 'chalk';

// Global verbose flag
let verbose = false;

/**
 * Sets the verbose flag for the exclusion manager
 * @param {boolean} isVerbose - Whether to enable verbose logging
 */
export function setVerbose(isVerbose) {
  verbose = isVerbose;
}

/**
 * Manages file and directory exclusions from multiple sources:
 * - System exclusions (node_modules, .git, binary files, etc.)
 * - Gitignore patterns
 * - User configuration exclusions
 */
export class ExclusionManager {
  constructor(basePath, isVerbose = false) {
    this.basePath = path.resolve(basePath);
    this.verbose = isVerbose || verbose; // Use either instance or global verbose setting
    this.patterns = new Set();
    this.negationPatterns = new Set();
    this.gitignorePatterns = new Set(); // Keep gitignore patterns separate
    this.configPatterns = new Set(); // Keep config patterns separate
    this.cache = new Map();
    this.initialized = false;
    this.systemPatterns = new Set();
    
    // Add default system patterns
    this.addPatterns(IGNORED_DIRS.map(dir => `**/${dir}/**`), 'system');
    this.addPatterns(IGNORED_FILES, 'system');
    
    this.initialize(); // Initialize immediately in constructor
  }

  log(message) {
    if (this.verbose) {
      console.log(chalk.gray(`[ExclusionManager] ${message}`));
    }
  }

  dumpPatterns() {
    console.log('\nExclusion Patterns:');
    console.log('Config patterns:', [...this.configPatterns].join(', '));
    console.log('Gitignore patterns:', [...this.gitignorePatterns].join(', '));
    console.log('System patterns:', [...this.systemPatterns].join(', '));
    console.log('Negation patterns:', [...this.negationPatterns].join(', '));
    console.log('All patterns:', [...this.patterns].join(', '));
  }

  /**
   * Add patterns to the exclusion set
   * @param {string[]} patterns - Array of patterns to add
   * @param {string} source - Source of the patterns ('system', 'gitignore', 'config')
   */
  addPatterns(patterns, source = 'system') {
    if (!patterns || !Array.isArray(patterns)) return;

    for (const pattern of patterns) {
      if (typeof pattern !== 'string') continue;
      
      if (pattern.startsWith('!')) {
        this.negationPatterns.add(pattern.substring(1));
      } else {
        this.patterns.add(pattern);
        
        // Add to specific pattern sets for better control
        if (source === 'gitignore') {
          this.gitignorePatterns.add(pattern);
        } else if (source === 'config') {
          this.configPatterns.add(pattern);
        } else if (source === 'system') {
          this.systemPatterns.add(pattern);
        }
      }
    }
  }

  initialize() {
    if (this.initialized) return;

    this.log('Starting initialization...');
    this.log(`Initial patterns - System: ${this.systemPatterns.size}, Config: ${this.configPatterns.size}, Gitignore: ${this.gitignorePatterns.size}`);

    // Add legacy context folder exclusion (IGNORED_DIRS already added in constructor)
    this.addPatterns(['**/context/**'], 'system');

    // Add binary file patterns
    this.addPatterns(BINARY_EXTENSIONS.map(ext => `**/*${ext}`), 'system');

    // Add gitignore patterns
    const gitignorePatterns = getGitignorePatterns();
    if (gitignorePatterns.length > 0) {
      this.log(`Adding ${gitignorePatterns.length} gitignore patterns: ${gitignorePatterns.join(', ')}`);
      this.addPatterns(gitignorePatterns, 'gitignore');
    }

    // Add user config patterns - these should have highest priority
    const { patterns: configExclusions } = getExclusions();
    this.log(`Config exclusions loaded: ${JSON.stringify(configExclusions)}`);
    
    if (configExclusions.length > 0) {
      this.addPatterns(configExclusions, 'config');
      
      // Log the loaded patterns for debugging
      this.log(`Loaded user-defined patterns: ${configExclusions.join(', ')}`);
      this.log(`Config patterns after loading: ${[...this.configPatterns].join(', ')}`);
    } else {
      this.log('No user-defined patterns found in config.');
    }

    this.initialized = true;
    this.log(`Initialization complete. Total patterns: ${this.patterns.size}, Negation patterns: ${this.negationPatterns.size}`);
    this.log(`Gitignore patterns: ${this.gitignorePatterns.size}, Config patterns: ${this.configPatterns.size}`);
    this.log(`All config patterns: ${[...this.configPatterns].join(', ')}`);
  }

  /**
   * Generate a cache key for a path
   * @param {string} type - Type of path ('file' or 'dir') or purpose-specific type like 'file:tree'
   * @param {string} filepath - Path to generate key for
   * @returns {string} - Cache key
   */
  getCacheKey(type, filepath) {
    return `${type}:${filepath}`;
  }

  /**
   * Check if this is a media file that should be included in tree view
   * @param {string} filepath - File path to check
   * @param {string} purpose - Purpose of the operation
   * @returns {boolean} - True if this is a media file in tree view
   */
  isMediaInTreeView(filepath, purpose) {
    return purpose === 'tree' && this.isMediaFile(filepath);
  }

  /**
   * Check if a path matches any config pattern (wildcard, relative, or trailing slash)
   * @param {string} relativePath - Relative path to check
   * @param {boolean} isDirectory - True if checking a directory path
   * @returns {boolean} - True if matches any pattern
   */
  matchesConfigPattern(relativePath, isDirectory = false) {
    for (const pattern of this.configPatterns) {
      // Handle wildcard patterns like "docs/*" or "docs/**"
      if (pattern.includes('*')) {
        const directoryPart = pattern.split('*')[0].replace(/\/+$/, '');
        if (!directoryPart) {
          if (minimatch(relativePath, pattern, { dot: true })) return true;
          continue;
        }
        if (relativePath === directoryPart || relativePath.startsWith(directoryPart + '/')) {
          if (minimatch(relativePath, pattern, { dot: true })) return true;
        }
        continue;
      }

      // Handle relative path patterns (starting with "./")
      if (pattern.startsWith('./')) {
        const patternWithoutPrefix = pattern.substring(2);
        if (relativePath === patternWithoutPrefix ||
            relativePath.startsWith(`${patternWithoutPrefix}/`)) {
          return true;
        }
        const pathParts = relativePath.split('/');
        if (!isDirectory) pathParts.pop(); // Remove filename for files
        if (pathParts.includes(patternWithoutPrefix)) return true;
        continue;
      }

      // Handle directory patterns with trailing slashes
      if (pattern.endsWith('/') || pattern.endsWith('\\')) {
        const patternWithoutSlash = pattern.slice(0, -1);
        if (relativePath === patternWithoutSlash ||
            relativePath.startsWith(`${patternWithoutSlash}/`)) return true;
        const pathParts = relativePath.split('/');
        if (!isDirectory) pathParts.pop(); // Remove filename for files
        if (pathParts.includes(patternWithoutSlash)) return true;
      }
    }
    return false;
  }

  /**
   * Check if a file should be excluded
   * @param {string} filepath - File path to check
   * @param {string} purpose - Purpose of the operation ('content', 'tree', or 'ignore-aware-tree')
   * @returns {boolean} - True if the file should be excluded
   */
  shouldExcludeFile(filepath, purpose = 'content') {
    if (!filepath) return true;
    
    const cacheKey = this.getCacheKey(`file:${purpose}`, filepath);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Extract file information
    const fileName = path.basename(filepath);
    const fileExt = path.extname(filepath);
    const dirPath = path.dirname(filepath);
    const normalizedPath = path.normalize(filepath);
    let relativePath = path.relative(this.basePath, normalizedPath);
    // Normalize path separators for cross-platform compatibility
    relativePath = relativePath.replace(/\\/g, '/');
    
    // For tree visualization, include media files and static directory files
    if (this.isMediaInTreeView(filepath, purpose)) {
      this.log(`Including media file for tree visualization: ${filepath}`);
      this.cache.set(cacheKey, false);
      return false;
    }

    if (purpose === 'tree' && (filepath.includes('/static/') || filepath.includes('\\static\\'))) {
      this.log(`Including file in static directory for tree visualization: ${filepath}`);
      this.cache.set(cacheKey, false);
      return false;
    }

    // Check if file's directory should be excluded (but still include media in tree view)
    if (this.shouldExcludeDirectory(dirPath, purpose)) {
      if (this.isMediaInTreeView(filepath, purpose)) {
        this.log(`Including media file despite excluded directory: ${filepath}`);
        this.cache.set(cacheKey, false);
        return false;
      }
      this.log(`Excluding file because its directory is excluded: ${filepath}`);
      this.cache.set(cacheKey, true);
      return true;
    }
    
    // Check config patterns (skip for media files in tree view)
    if (!this.isMediaInTreeView(filepath, purpose) && this.matchesConfigPattern(relativePath, false)) {
      this.log(`Excluding file by config pattern: ${filepath}`);
      this.cache.set(cacheKey, true);
      return true;
    }

    // Check user-defined patterns
    if (!this.isMediaInTreeView(filepath, purpose) &&
        this.matchesUserDefinedPatterns(filepath, purpose)) {
      this.log(`Excluding file by user-defined pattern: ${filepath}`);
      this.cache.set(cacheKey, true);
      return true;
    }
    
    // Special handling for 'ignore-aware-tree' purpose
    if (purpose === 'ignore-aware-tree') {
      // For ignore-aware tree visualization, strictly respect all ignore patterns
      // including user-defined, gitignore and system patterns
      if (this.matchesGitignoreOrConfig(filepath)) {
        this.log(`Excluding file by gitignore/config for ignore-aware-tree: ${filepath}`);
        this.cache.set(cacheKey, true);
        return true;
      }
    }
    
    // Exclude compiled object files
    if (fileExt === '.o' || fileName.endsWith('.o')) {
      this.log(`Excluding .o file: ${filepath}`);
      this.cache.set(cacheKey, true);
      return true;
    }
    
    // Check for binary files - these should be excluded from content but may be shown in tree
    if (purpose === 'content' && this.isBinaryFile(filepath)) {
      this.log(`Excluding binary file from content: ${filepath}`);
      this.cache.set(cacheKey, true);
      return true;
    }
    
    // Check for system files
    if (this.isSystemFile(filepath)) {
      this.log(`Excluding system file: ${filepath}`);
      this.cache.set(cacheKey, true);
      return true;
    }
    
    // For content purpose, exclude files matched by gitignore
    if (purpose === 'content' && this.matchesGitignoreOrConfig(filepath)) {
      this.log(`Excluding file by ignored pattern: ${filepath}`);
      this.cache.set(cacheKey, true);
      return true;
    }
    
    // Check if it's explicitly on the ignore list
    if (!(purpose === 'tree' && this.isMediaFile(filepath)) &&
        this.isExplicitlyIgnored(filepath)) {
      this.log(`Excluding explicitly ignored file: ${filepath}`);
      this.cache.set(cacheKey, true);
      return true;
    }
    
    // For content extraction, exclude media files
    if (purpose === 'content' && this.isMediaFile(filepath)) {
      this.log(`Excluding media file from content: ${filepath}`);
      this.cache.set(cacheKey, true);
      return true;
    }
    
    // Not excluded
    this.cache.set(cacheKey, false);
    return false;
  }

  /**
   * Check if a path matches any patterns in the given set
   * @param {string} relativePath - Relative path to check
   * @param {Set<string>} patternSet - Set of patterns to check against
   * @returns {boolean} - True if path matches any pattern, false otherwise
   */
  matchesPattern(relativePath, patternSet) {
    return Array.from(patternSet).some(pattern => 
      minimatch(relativePath, pattern, { dot: true, matchBase: true })
    );
  }

  /**
   * Check if a path matches any of the ignored patterns
   * @param {string} filePath - Path to check
   * @returns {boolean} - True if path matches any ignored pattern, false otherwise
   */
  matchesIgnoredPatterns(filePath) {
    const normalizedPath = path.normalize(filePath);
    const relativePath = path.relative(this.basePath, normalizedPath);
    
    // Check against all patterns
    return this.matchesPattern(relativePath, this.patterns);
  }

  /**
   * Check if a path matches any user-defined patterns from config
   * @param {string} filePath - Path to check
   * @param {string} purpose - Purpose of the operation ('content', 'tree', or 'ignore-aware-tree')
   * @returns {boolean} - True if path matches any user-defined pattern, false otherwise
   */
  matchesUserDefinedPatterns(filePath, purpose = 'content') {
    if (this.configPatterns.size === 0) return false;

    const normalizedPath = path.normalize(filePath);
    let relativePath = path.relative(this.basePath, normalizedPath);
    relativePath = relativePath.replace(/\\/g, '/');
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath);

    // For 'ignore-aware-tree', check extension patterns with case-insensitivity
    if (purpose === 'ignore-aware-tree' && fileExt) {
      const extensionPattern = `*.${fileExt.substring(1)}`;
      for (const pattern of this.configPatterns) {
        if (pattern.toLowerCase() === extensionPattern.toLowerCase()) {
          this.log(`Extension pattern match: ${pattern}`);
          return true;
        }
      }
    }

    // Check basic config patterns (wildcard, relative, trailing slash)
    if (this.matchesConfigPattern(relativePath, false)) {
      return true;
    }

    // Check extension patterns and minimatch fallback
    for (const pattern of this.configPatterns) {
      // Extension patterns like *.md
      if (pattern.startsWith('*.') && fileExt) {
        const patternExt = pattern.substring(1);
        if (fileExt.toLowerCase() === patternExt.toLowerCase()) {
          this.log(`Extension match: ${fileExt} matches ${pattern}`);
          return true;
        }
        continue;
      }

      // Skip patterns already handled by matchesConfigPattern
      if (pattern.includes('*') || pattern.startsWith('./') ||
          pattern.endsWith('/') || pattern.endsWith('\\')) {
        continue;
      }

      // Minimatch fallback for other patterns
      if (minimatch(relativePath, pattern, { dot: true, matchBase: true }) ||
          minimatch(fileName, pattern, { dot: true, matchBase: true })) {
        this.log(`Pattern match: ${pattern}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a file is explicitly ignored by pattern matching
   * @param {string} filePath - Path to the file
   * @returns {boolean} - True if the file is explicitly ignored, false otherwise
   */
  isExplicitlyIgnored(filePath) {
    const normalizedPath = path.normalize(filePath);
    const relativePath = path.relative(this.basePath, normalizedPath);
    const fileName = path.basename(filePath);
    
    // Check explicit ignore patterns
    for (const pattern of this.patterns) {
      if (minimatch(relativePath, pattern, { dot: true, matchBase: true }) ||
          minimatch(fileName, pattern, { dot: true, matchBase: true })) {
        return true;
      }
    }
    
    // Check if there's a negation pattern that explicitly includes this file
    for (const pattern of this.negationPatterns) {
      if (minimatch(relativePath, pattern, { dot: true, matchBase: true }) ||
          minimatch(fileName, pattern, { dot: true, matchBase: true })) {
        return false;
      }
    }
    
    return false;
  }

  /**
   * Check if a path matches only gitignore or config patterns
   * @param {string} filePath - Path to check
   * @returns {boolean} - True if path matches gitignore or config patterns, false otherwise
   */
  matchesGitignoreOrConfig(filePath) {
    const normalizedPath = path.normalize(filePath);
    const relativePath = path.relative(this.basePath, normalizedPath);
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath);
    
    // Check against gitignore patterns
    for (const pattern of this.gitignorePatterns) {
      // For extension-specific patterns like '*.md', match only files with that extension
      if (pattern.startsWith('*.') && pattern.substring(2) === fileExt.substring(1)) {
        this.log(`Excluding ${relativePath} due to extension pattern: ${pattern}`);
        return true;
      }

      // For normal patterns, use standard matching
      if (minimatch(relativePath, pattern, { dot: true, matchBase: true })) {
        this.log(`Excluding ${relativePath} due to gitignore pattern: ${pattern}`);
        return true;
      }
    }
    
    // Check against config patterns
    for (const pattern of this.configPatterns) {
      // For extension-specific patterns like '*.md', match only files with that extension
      if (pattern.startsWith('*.') && pattern.substring(2) === fileExt.substring(1)) {
        this.log(`Excluding ${relativePath} due to extension pattern: ${pattern}`);
        return true;
      }

      // For normal patterns, use standard matching
      if (minimatch(relativePath, pattern, { dot: true, matchBase: true })) {
        this.log(`Excluding ${relativePath} due to config pattern: ${pattern}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a file is a binary file
   * @param {string} filePath - Path to the file
   * @returns {boolean} - True if the file is a binary file, false otherwise
   */
  isBinaryFile(filePath) {
    const fileExt = path.extname(filePath);
    return BINARY_EXTENSIONS.includes(fileExt);
  }

  /**
   * Check if a file is a system file
   * @param {string} filePath - Path to the file
   * @returns {boolean} - True if the file is a system file, false otherwise
   */
  isSystemFile(filePath) {
    const fileName = path.basename(filePath);
    return IGNORED_FILES.includes(fileName);
  }

  /**
   * Check if a directory should be excluded
   * @param {string} dirPath - Directory path to check
   * @param {string} purpose - Purpose of the operation ('content', 'tree', or 'ignore-aware-tree')
   * @returns {boolean} - True if the directory should be excluded
   */
  shouldExcludeDirectory(dirPath, purpose = 'content') {
    if (!dirPath) return true;
    
    const cacheKey = this.getCacheKey(`dir:${purpose}`, dirPath);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Normalize the path for consistent matching
    const normalizedPath = path.normalize(dirPath);
    let relativePath = path.relative(this.basePath, normalizedPath);
    // Normalize path separators for cross-platform compatibility
    relativePath = relativePath.replace(/\\/g, '/');
    
    // Get the directory name
    const dirName = path.basename(dirPath);
    
    // Special case: Always include static directory for tree display
    if (purpose === 'tree' && dirName === 'static') {
      this.log(`Always including static directory: ${dirPath}`);
      this.cache.set(cacheKey, false);
      return false;
    }
    
    // Check if this directory matches a system ignored directory
    if (IGNORED_DIRS.includes(dirName)) {
      this.log(`Excluding system-ignored directory: ${dirPath}`);
      this.cache.set(cacheKey, true);
      return true;
    }

    // Check config patterns (wildcard, relative, trailing slash)
    if (this.matchesConfigPattern(relativePath, true)) {
      this.log(`Directory matches config pattern: ${dirPath}`);
      this.cache.set(cacheKey, true);
      return true;
    }

    // Check against user-defined patterns
    if (this.matchesUserDefinedPatterns(dirPath, purpose)) {
      this.log(`Directory matches user-defined pattern: ${dirPath}`);
      this.cache.set(cacheKey, true);
      return true;
    }
    
    // Special handling for 'ignore-aware-tree' purpose
    if (purpose === 'ignore-aware-tree') {
      if (this.matchesGitignoreOrConfig(dirPath)) {
        this.log(`Directory matches gitignore/config for ignore-aware-tree: ${dirPath}`);
        this.cache.set(cacheKey, true);
        return true;
      }
    }
    
    // Not excluded
    this.cache.set(cacheKey, false);
    return false;
  }

  /**
   * Check if a file is a media file
   * @param {string} filePath - Path to the file
   * @returns {boolean} - True if the file is a media file, false otherwise
   */
  isMediaFile(filePath) {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Common media file extensions
    const mediaExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp',
      '.mp3', '.wav', '.ogg', '.mp4', '.mov', '.avi', '.wmv', '.webm',
      '.pdf', '.svg', '.ico'
    ];
    
    return mediaExtensions.includes(fileExt);
  }
}
