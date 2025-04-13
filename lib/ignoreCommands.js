import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getExclusions, addExclusion, showExclusions, clearExclusions, testExclusions, configureIgnore } from './configHandler.js';

/**
 * Handle the ignore command and its subcommands
 * @param {Object} argv - Command line arguments object
 */
export async function handleIgnoreCommand(argv) {
    const command = argv._[1];  // Get the subcommand after 'ignore'
    
    if (!command) {
        showIgnoreHelp();
        process.exit(0);
    }
    
    switch (command) {
        case 'show':
            showExclusions();
            break;
        case 'clear':
            clearExclusions();
            break;
        case 'test':
            testExclusions();
            break;
        case 'add':
            // Get pattern from either the positional argument or the pattern option
            let pattern = argv._[2];
            if (!pattern) {
                console.log(chalk.red('Error: No pattern provided'));
                showAddHelp();
                process.exit(1);
            }
            // Remove any surrounding quotes that might have been preserved
            pattern = pattern.replace(/^["']|["']$/g, '');
            addExclusion(pattern);
            break;
        default:
            console.log(chalk.red(`Unknown command: ${command}`));
            showIgnoreHelp();
            process.exit(1);
    }
    process.exit(0);
}

function showIgnoreHelp() {
    console.log(chalk.bold('\nIgnore Pattern Management\n'));
    console.log('Usage: cx ignore <command>\n');
    console.log(chalk.dim('Commands:'));
    console.log('  add <pattern>    Add a new exclusion pattern');
    console.log('  show             List current exclusion patterns');
    console.log('  clear            Remove all exclusion patterns');
    console.log('  test             Preview what will be excluded\n');
    console.log(chalk.dim('Examples:'));
    console.log('  cx ignore add "*.log"         Exclude all log files');
    console.log('  cx ignore add "build/**"      Exclude build directory and contents');
    console.log('  cx ignore add "**/*.min.js"   Exclude all minified JS files\n');
    console.log(chalk.dim('Pattern Types:'));
    console.log('  Simple patterns:   *.log, *.tmp');
    console.log('  Directory paths:   build/**, temp/*');
    console.log('  Multiple types:    *.{jpg,png,gif}\n');
    console.log('For more information, use: cx -h --more');
}

function showAddHelp() {
    console.log(chalk.bold('\nAdd Ignore Pattern\n'));
    console.log('Usage: cx ignore add <pattern>\n');
    console.log(chalk.dim('Examples:'));
    console.log('  cx ignore add "*.log"         Exclude all log files');
    console.log('  cx ignore add "build/**"      Exclude build directory and contents');
    console.log('  cx ignore add "./tests/**"    Exclude tests directory');
    console.log('  cx ignore add "*.{jpg,png}"   Exclude specific file types\n');
    console.log(chalk.dim('Tips:'));
    console.log('  - Use quotes around patterns with special characters');
    console.log('  - Use ** for recursive matching');
    console.log('  - Patterns are case-sensitive\n');
    console.log('To see current patterns: cx ignore show');
}

// Legacy command support
export async function handleLegacyIgnoreCommands(args) {
    // Handle --show-ignore
    if (args.includes('--show-ignore')) {
        showExclusions();
        return true;
    }

    // Handle --configure-ignore
    if (args.includes('--configure-ignore')) {
        configureIgnore();
        return true;
    }

    // Handle -i pattern (old style)
    const ignoreIndex = args.findIndex(arg => arg === '-i');
    if (ignoreIndex !== -1 && args[ignoreIndex + 1]) {
        addExclusion(args[ignoreIndex + 1]);
        return true;
    }

    return false;
} 