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
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.json',
    '.yaml',
    '.yml',
    '.xml',
    '.txt',
    '.env',
    '.rc'
];

const IGNORED_FILES = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.DS_Store',
    'Thumbs.db',
    '.env.local',
    '.env.development.local',
    '.env.test.local',
    '.env.production.local',
    '.gitignore',
    'README.md',
    'CHANGELOG.md',
    'LICENSE.md',
    'CONTRIBUTING.md'
];

module.exports = {
    IGNORED_DIRS,
    INCLUDED_EXTENSIONS,
    IGNORED_FILES
};