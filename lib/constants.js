/**
 * Constants Module
 * 
 * Defines constants and configuration values used throughout the application.
 * This includes lists of ignored directories, included file extensions,
 * and utility functions for file processing.
 */

/**
 * Directories to ignore when scanning for files
 * These are typically build artifacts, dependencies, or system directories
 */
const IGNORED_DIRS = [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.git',
    '.idea',
    '.vscode',
    '__tests__',
    '__mocks__',
    '.next',
    '.cache',
    'context'
];

/**
 * File extensions to include when scanning for files
 * Organized by category for better maintainability
 */
const INCLUDED_EXTENSIONS = [
    // Web & JavaScript
    '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
    '.html', '.css', '.scss', '.sass', '.less',
    
    // Backend
    '.php', '.rb', '.py', '.java', '.go', '.rs',
    '.cs', '.cpp', '.c', '.h', '.hpp',
    '.scala', '.kt', '.kts', '.groovy',
    
    // Configuration & Data
    '.json', '.yaml', '.yml', '.toml', '.xml',
    '.ini', '.conf', '.config', '.rc',
    '.env', '.properties',
    
    // Shell & Scripts
    '.sh', '.bash', '.zsh', '.fish',
    '.bat', '.cmd', '.ps1',
    
    // Documentation & Text
    '.md', '.txt', '.rst', '.adoc',
    
    // Other Languages
    '.swift', '.m', '.mm', 
    '.pl', '.pm', // Perl
    '.ex', '.exs', // Elixir
    '.erl', '.hrl', // Erlang
    '.clj', '.cljs', // Clojure
    '.hs', '.lhs', // Haskell
    '.lua',
    '.r', '.R',
    '.dart',
    '.f90', '.f95', '.f03', // Fortran
    '.sql', '.prisma', '.graphql'
];

/**
 * Files to ignore when scanning directories
 * These are typically lock files, system files, or common documentation
 */
const IGNORED_FILES = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.DS_Store',
    'Thumbs.db',
    'README.md',
    'CHANGELOG.md',
    'LICENSE.md',
    'CONTRIBUTING.md'
];

/**
 * Determines whether a file should be processed based on its extension and name
 * Special handling for config files and environment files
 * 
 * @param {string} filePath - The path of the file to check
 * @returns {boolean} Whether the file should be processed
 */
function shouldProcessFile(filePath) {
    const basename = path.basename(filePath);
    
    // Handle all .env* files (like .env.local, .env.development, etc)
    if (basename.match(/^\.env(.+)?$/)) return true;
    
    // Handle config files
    if (basename.includes('.config.') || basename.includes('.conf.')) return true;
    
    // Check extensions
    return INCLUDED_EXTENSIONS.includes(path.extname(filePath));
}

module.exports = {
    IGNORED_DIRS,
    INCLUDED_EXTENSIONS,
    IGNORED_FILES,
    shouldProcessFile
};