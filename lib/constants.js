/**
 * Constants Module
 * 
 * Defines constants and configuration values used throughout the application.
 * This includes lists of ignored directories, included file extensions,
 * and utility functions for file processing.
 */

import fs from 'fs';
import path from 'path';

// Attempt to load exclusions from local .aicontext/ignore.json first, then fall back to global config
let customExclusions = {
    alwaysExcludedDirectories: [],
    alwaysExcludedFiles: []
};

try {
    // First try to load from .aicontext/ignore.json in current directory
    const localConfigDir = path.join(process.cwd(), '.aicontext');
    const localConfigPath = path.join(localConfigDir, 'ignore.json');
    
    if (fs.existsSync(localConfigPath)) {
        customExclusions = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
    } 
    // Fall back to legacy config file if local doesn't exist
    else {
        const legacyConfigPath = path.join(process.cwd(), 'aictx-exclusions.json');
        if (fs.existsSync(legacyConfigPath)) {
            customExclusions = JSON.parse(fs.readFileSync(legacyConfigPath, 'utf8'));
        }
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
export const MAX_FILE_SIZE_MB = 10;

/**
 * Directories to ignore when scanning for files
 * These are typically build artifacts, dependencies, or system directories
 * 
 * CRITICAL: These directories must always be excluded regardless of any user settings
 */
export const IGNORED_DIRS = [
    'node_modules',   // Dependencies - always exclude
    'dist',           // Build artifacts
    'build',          // Build artifacts
    'coverage',       // Test coverage reports
    '.git',           // Git repository data
    '.svn',          // SVN repository data
    '.hg',           // Mercurial repository data
    '.idea',          // JetBrains IDE settings
    '.vscode',        // VSCode settings
    '__tests__',      // Test directories
    '__mocks__',      // Mock directories
    '.next',          // Next.js build directory
    '.cache',         // Cache directories
    'target',         // Rust/Java build directory
    '.DS_Store',      // macOS system files
    '__pycache__',    // Python cache directories
    'venv',           // Python virtual environments
    '.env',           // Environment variables
    '.venv',          // Python virtual environments
    '.env.local',     // Local environment variables
    '.env.development', // Development environment variables
    '.env.test',      // Test environment variables
    '.env.production', // Production environment variables
    '.aicontext/code', // AI Context code directory
    '.aicontext/snapshots' // AI Context snapshots directory
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
export const INCLUDED_EXTENSIONS = [
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
    
    // Shader Files
    '.glsl', '.vert', '.frag', '.comp', '.geom', '.tesc', '.tese',
    
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
    '.sql', '.prisma', '.graphql',
    
    // XML & Environment Variables
    '.env.example'
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
export const BINARY_EXTENSIONS = [
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
 * Files to ignore when scanning
 * These are typically configuration files, lock files, and other non-code files
 */
export const IGNORED_FILES = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'Gemfile.lock',
    'poetry.lock',
    'Cargo.lock',
    '.gitignore',
    '.npmignore',
    '.dockerignore',
    '.eslintignore',
    '.prettierignore',
    '.env',
    '.env.local',
    '.env.development',
    '.env.test',
    '.env.production',
    'LICENSE',
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    'CODE_OF_CONDUCT.md',
    'SECURITY.md',
    'CODEOWNERS',
    'robots.txt',
    'sitemap.xml',
    '.htaccess'
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
export function shouldProcessFile(filePath) {
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