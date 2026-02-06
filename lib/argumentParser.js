/**
 * CLI argument parsing with yargs: defines commands (configure, show, clear, ignore, load-cursor-rules),
 * options (snap, message, verbose, timeout, max-size, no-clipboard, tree), and validates paths/switches.
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { MAX_FILE_SIZE_MB } from './constants.js';
import { configure, showConfig } from './configHandler.js';
import { clearContextFiles } from './cleanupUtils.js';
import { loadCursorRules } from './cursorRulesHandler.js';

/** All known option names (including aliases) for invalid-switch detection. */
const knownOptions = [
    // Commands
    'configure', 'show', 'clear', 'clear-all', 'ignore', 'include', 'load-cursor-rules',
    // Ignore/include subcommands
    'add', 'pattern', 'rm', 'remove',
    // Basic options and their aliases
    'h', 'help', '?',
    'V', 'version',
    's', 'snap',
    'm', 'message',
    'v', 'verbose',
    'timeout',
    'max-size',
    'no-clipboard',
    'o',
    't', 'tree',
    'f', 'format',
    // Incremental/delta options
    'since',
    'git-diff',
    'changed',
    // Additional options
    'more',  // For detailed help
    'dry-run',  // For validation only
    // Double-dash options
    'clear',
    'clear-all',
    'version',
    'help',
    'snap',
    'message',
    'verbose',
    'timeout',
    'max-size',
    'no-clipboard',
    'tree',
    'format',
    'since',
    'git-diff',
    'changed',
    'configure',
    'show',
    'ignore',
    'load-cursor-rules'
];

/**
 * Check if an argument is a valid option
 * @param {string} arg - The argument to check
 * @param {string[]} args - All command line arguments for context
 * @returns {boolean} - True if the argument is invalid
 */
export function isInvalidOption(arg, args) {
    if (arg.startsWith('-')) {
        // Remove leading dashes
        const option = arg.replace(/^-+/, '');
        
        // Skip if it's a negative number
        if (!isNaN(option)) return false;
        
        // Skip if it's a value for a previous option that takes values
        const prevArg = args[args.indexOf(arg) - 1];
        if (prevArg && (prevArg === '-m' || prevArg === '--message' || 
                       prevArg === '--timeout' || prevArg === '--max-size')) {
            return false;
        }

        // Handle double-dash options (e.g., --version)
        if (arg.startsWith('--')) {
            return !knownOptions.includes(option);
        }
        
        // Handle combined single-dash options (e.g., -sm)
        if (option.length > 1) {
            return !option.split('').every(char => knownOptions.includes(char));
        }
        
        // Handle single options (e.g., -s)
        return !knownOptions.includes(option);
    }
    return false;
}

/**
 * Find the first invalid switch in the arguments
 * @param {string[]} args - The command line arguments
 * @returns {string|null} - The invalid switch or null if all are valid
 */
export function findInvalidSwitch(args) {
    return args.find(arg => isInvalidOption(arg, args));
}

/**
 * Configure and parse command line arguments
 * @param {Object} config - Configuration object from configHandler
 * @returns {Object} Parsed arguments
 */
export function parseArguments(config) {
    // Check raw arguments for unknown options
    const args = process.argv.slice(2);
    const unknownOption = findInvalidSwitch(args);

    if (unknownOption) {
        console.error(chalk.red('Error: Invalid switch detected'));
        console.error(chalk.yellow('Run \'cx -h\' to learn more about valid switches and options'));
        process.exit(1);
    }

    const parser = yargs(hideBin(process.argv))
        .usage('Usage: $0 <path1> [path2...] [options]')
        .example('$0 ./lib ./src/file.js', 'Generate context from multiple paths')
        .example('$0 ./docs -m "documentation update"', 'Generate context with a message')
        .example('$0 . -s', 'Create a snapshot of the current directory')
        
        // Commands
        .command('configure', 'Set up configuration', {}, () => {
            configure();
            process.exit(0);
        })
        .command('show', 'Show current configuration', {}, () => {
            showConfig();
            process.exit(0);
        })
        .command('clear', 'Remove generated context files', {}, (argv) => {
            clearContextFiles({ includeSnapshots: argv.s });
            process.exit(0);
        })
        .command('clear-all', 'Remove all context files and directories', {}, () => {
            clearContextFiles({ all: true });
            process.exit(0);
        })
        .command('ignore', 'Manage ignore patterns', (yargs) => {
            return yargs
                .command({
                    command: 'add <pattern>',
                    desc: 'Add a new exclusion pattern',
                    builder: (yargs) => {
                        return yargs.positional('pattern', {
                            type: 'string',
                            describe: 'Pattern to ignore (e.g., "*.log", "build/**")'
                        });
                    }
                })
                .command('show', 'Show current exclusion patterns')
                .command('clear', 'Remove all exclusion patterns')
                .command('test', 'Test current exclusions with directory tree');
        })
        .command('load-cursor-rules', 'Load and import cursor rules', {}, async () => {
            await loadCursorRules(process.cwd());
            process.exit(0);
        })
        
        // Options
        .option('s', {
            alias: 'snap',
            type: 'boolean',
            description: 'Create a snapshot'
        })
        .option('m', {
            alias: 'message',
            type: 'string',
            description: 'Add a message to the context file'
        })
        .option('v', {
            alias: 'verbose',
            type: 'boolean',
            description: 'Show detailed progress during execution'
        })
        .option('timeout', {
            type: 'number',
            description: 'Set a custom timeout for file search (in seconds)',
            default: config.defaultTimeoutSec || 30
        })
        .option('max-size', {
            type: 'number',
            description: 'Set a custom maximum file size (in MB)',
            default: config.defaultMaxFileSizeMb || MAX_FILE_SIZE_MB
        })
        .option('no-clipboard', {
            type: 'boolean',
            description: 'Skip copying content to clipboard'
        })
        .option('o', {
            type: 'boolean',
            description: 'Output results directly to screen'
        })
        .option('t', {
            alias: 'tree',
            type: 'boolean',
            description: 'Display directory tree only'
        })
        
        // Version and Help
        .alias('V', 'version')
        .help('h')
        .alias('h', 'help')
        
        // Positional arguments for paths
        .positional('paths', {
            type: 'string',
            describe: 'Files and/or directories to process',
            array: true
        })
        
        // Validation
        .check((argv) => {
            // If no paths provided and no command specified, show help
            if (!argv._.length && !argv.$0) {
                yargs.showHelp();
                process.exit(1);
            }
            
            // Validate paths
            const validatedPaths = [];
            for (const inputPath of argv._) {
                const absolutePath = path.resolve(process.cwd(), inputPath);
                if (!fs.existsSync(absolutePath)) {
                    throw new Error(`Path does not exist: ${inputPath}`);
                }
                validatedPaths.push(absolutePath);
            }
            argv.validatedPaths = validatedPaths;
            
            return true;
        })
        .fail((msg, err) => {
            if (err) {
                console.error(chalk.red(err.message));
            } else {
                console.error(chalk.red(msg));
            }
            process.exit(1);
        });

    return parser.parse();
}

export { knownOptions }; 