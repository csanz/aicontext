/**
 * Constants Module
 * 
 * Defines constants and configuration values used throughout the application.
 * This includes lists of ignored directories, included file extensions,
 * and utility functions for file processing.
 */

const fs = require('fs');
const path = require('path');

// Attempt to load exclusions from external config file
let customExclusions = {
    alwaysExcludedDirectories: [],
    alwaysExcludedFiles: []
};

try {
    const configPath = path.join(process.cwd(), 'aictx-exclusions.json');
    if (fs.existsSync(configPath)) {
        customExclusions = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('Loaded custom exclusions from aictx-exclusions.json');
    }
} catch (error) {
    console.warn('Failed to load custom exclusions:', error.message);
}

/**
 * Maximum file size in MB
 * Files larger than this limit will be excluded from context generation
 * Most code files are under 1MB, so 2MB is a reasonable limit that will exclude
 * large binary files, datasets, and other non-code files while still allowing
 * for reasonably large source files
 */
const MAX_FILE_SIZE_MB = 2;

/**
 * Directories to ignore when scanning for files
 * These are typically build artifacts, dependencies, or system directories
 * 
 * CRITICAL: These directories must always be excluded regardless of any user settings
 */
const IGNORED_DIRS = [
    'node_modules',   // Dependencies - always exclude
    'dist',           // Build artifacts
    'build',          // Build artifacts
    'coverage',       // Test coverage reports
    '.git',           // Git repository data
    '.idea',          // JetBrains IDE settings
    '.vscode',        // VSCode settings
    '__tests__',      // Test directories
    '__mocks__',      // Mock directories
    '.next',          // Next.js build directory
    '.cache',         // Cache directories
    'context',        // Context directory
    'target'          // Rust/Java build directory
];

// Now merge with any custom exclusions if the file exists
if (customExclusions && customExclusions.alwaysExcludedDirectories) {
    customExclusions.alwaysExcludedDirectories.forEach(dir => {
        if (!IGNORED_DIRS.includes(dir)) {
            IGNORED_DIRS.push(dir);
        }
    });
}

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
    // Executable & System Files
    '.exe', '.dll', '.bin', '.so', '.dylib', '.sys', '.msi', '.com', '.bat',
    
    // Compiled Code & Object Files
    '.o', '.obj', '.a', '.lib', '.pyd', '.class', '.jar', '.war',
    '.rlib', '.rmeta', '.rcgu.o', '.rcu.o', '.pyc', '.pyo',
    
    // Disk & Firmware Images
    '.iso', '.img', '.vmdk', '.qcow2', '.vdi', '.rom', '.dmg',
    
    // Multimedia (Audio & Video)
    '.mp3', '.wav', '.flac', '.aac', '.ogg', '.mp4', '.avi', '.mov', '.mkv',
    '.m4a', '.m4v', '.3gp', '.webm', '.vob', '.swf', '.mpg', '.mpeg',
    
    // Graphics & Images
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.ico', '.webp',
    '.svg', '.psd', '.ai', '.heic', '.heif', '.raw', '.cr2', '.nef', '.arw',
    '.dng', '.exr', '.hdr',
    
    // Fonts
    '.ttf', '.otf', '.woff', '.woff2', '.eot',
    
    // Database & Data Storage
    '.db', '.sqlite', '.sqlite3', '.mdb', '.dat', '.idx',
    '.accdb', '.frm', '.dbf', '.db-journal',
    
    // Compressed & Archive Files
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
    '.iso', '.dmg', '.tgz', '.pkg', '.deb', '.rpm',
    
    // 3D & CAD Files
    '.glb', '.gltf', '.stl', '.obj', '.fbx', '.dwg', '.3ds', '.dae', '.ply',
    '.usd', '.usdz', '.blend', '.max', '.ma', '.mb', '.c4d', '.nif', '.x3d',
    '.step', '.stp', '.iges', '.igs', '.skp', '.dxf',
    
    // 3D Texture Formats
    '.ktx', '.ktx2', '.dds', '.pvr',
    
    // Firmware & Embedded Systems
    '.hex', '.elf', '.s19', '.srec', '.bin',
    
    // Network & Web Data
    '.pcap', '.pem', '.crt', '.key', '.der', '.pfx', '.p12',
    
    // Scientific & Specialized Data Formats
    '.fits', '.hdf', '.hdf5', '.mat', '.dcm', '.dicom',
    
    // Documents (binary formats)
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.pages', '.numbers', '.key', '.odt', '.ods', '.odp',
    
    // Game & Virtual Reality Assets
    '.pak', '.wad', '.asset', '.unity3d', '.unitypackage', '.mesh', '.navmesh',
    
    // Other binaries
    '.out', '.app', '.deb', '.rpm', '.dat',
    '.pack', '.whl', '.node', '.min.js', '.min.css',
    
    // Dependency files
    '.d',
    
    // Temporary and system files
    '.tmp', '.temp', '.swp', '.swo', '.DS_Store', 'Thumbs.db',
    '.cache', '.bak'
];

/**
 * Files to ignore when scanning directories
 * These are typically lock files, system files, or common documentation
 * 
 * CRITICAL: These files must always be excluded regardless of any user settings
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

// Now merge with any custom exclusions if the file exists
if (customExclusions && customExclusions.alwaysExcludedFiles) {
    customExclusions.alwaysExcludedFiles.forEach(file => {
        if (!IGNORED_FILES.includes(file)) {
            IGNORED_FILES.push(file);
        }
    });
}

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
    MAX_FILE_SIZE_MB,
    shouldProcessFile
};