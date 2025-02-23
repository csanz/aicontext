const IGNORED_DIRS = [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.git',
    '.idea',
    '.vscode',
    'public',
    'assets',
    'images',
    'img',
    'fonts',
    'videos',
    'docs',
    '__tests__',
    '__mocks__',
    '.next',
    '.cache',
    'context'
];

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

// Update shouldProcessFile to properly handle all .env* files
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