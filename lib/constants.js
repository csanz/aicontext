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
 * Binary file extensions to explicitly exclude
 * These files should never be included in context generation
 * 
 * IMPORTANT: This list is critical for preventing binary files from being included
 * in context generation. Binary files can bloat context files, cause encoding issues,
 * and are not useful for AI context.
 * 
 * When adding new extensions, consider:
 * 1. Common build artifacts for various languages
 * 2. Compiled binaries and object files
 * 3. Media files (images, audio, video)
 * 4. Compressed archives
 * 5. Database files
 * 6. Language-specific binary formats
 */
const BINARY_EXTENSIONS = [
    // Compiled binaries and object files
    '.o', '.obj', '.a', '.lib', '.so', '.dll', '.dylib', '.exe',
    '.out', '.app', '.bin', '.deb', '.rpm',
    
    // Build artifacts
    '.d', // Dependency files
    
    // Rust specific
    '.rlib', '.rmeta', '.rcgu.o', '.rcu.o',
    
    // Java/JVM
    '.class', '.jar', '.war', '.ear', '.jnilib',
    
    // .NET
    '.dll', '.pdb', '.exe', '.resources',
    
    // Python
    '.pyc', '.pyo', '.pyd', '.pyw', '.whl',
    
    // Node.js
    '.node', '.min.js', '.min.css',
    
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.webp', '.svg',
    '.tiff', '.psd', '.ai', '.heic', '.heif', '.raw',
    
    // Audio/Video
    '.mp3', '.mp4', '.wav', '.avi', '.mov', '.flv', '.ogg',
    '.mkv', '.webm', '.m4a', '.m4v', '.3gp', '.aac', '.flac',
    
    // Archives and compressed files
    '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2', '.xz',
    '.iso', '.dmg', '.tgz',
    
    // Documents (binary formats)
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.pages', '.numbers', '.key', '.odt', '.ods', '.odp',
    
    // Database
    '.db', '.sqlite', '.sqlite3', '.mdb', '.accdb', '.frm',
    
    // Other binaries
    '.bin', '.dat', '.bak', '.cache', '.idx', '.pack',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    
    // Temporary and system files
    '.tmp', '.temp', '.swp', '.swo', '.DS_Store', 'Thumbs.db'
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
    const ext = path.extname(filePath);
    
    // Explicitly exclude binary files
    if (BINARY_EXTENSIONS.includes(ext)) return false;
    
    // Handle all .env* files (like .env.local, .env.development, etc)
    if (basename.match(/^\.env(.+)?$/)) return true;
    
    // Handle config files
    if (basename.includes('.config.') || basename.includes('.conf.')) return true;
    
    // Check extensions
    return INCLUDED_EXTENSIONS.includes(ext);
}

module.exports = {
    IGNORED_DIRS,
    INCLUDED_EXTENSIONS,
    BINARY_EXTENSIONS,
    IGNORED_FILES,
    shouldProcessFile
};