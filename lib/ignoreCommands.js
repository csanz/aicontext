import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getExclusions, addExclusion, removeExclusionByPattern, showExclusions, clearExclusions, testExclusions, configureIgnore } from './configHandler.js';

/**
 * Handle the ignore command and its subcommands
 * @param {Object} argv - Command line arguments object
 */
export async function handleIgnoreCommand(argv) {
    // Get the subcommand from either argv.command (yargs positional) or argv._[1]
    const command = argv.command || argv._[1];

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
        case 'rm':
        case 'remove':
            let rmPattern = argv.pattern || argv._[2];
            if (!rmPattern) {
                console.log(chalk.red('Error: No pattern provided'));
                process.exit(1);
            }
            rmPattern = rmPattern.replace(/^["']|["']$/g, '');
            removeExclusionByPattern(rmPattern);
            break;
        default:
            // Treat any non-command argument as a pattern to add
            addExclusion(command);
            break;
    }
    process.exit(0);
}

/** Print usage for `cx ignore` and subcommands. */
function showIgnoreHelp() {
    console.log(chalk.bold('\nIgnore Pattern Management\n'));
    console.log('Usage: cx ignore <pattern>     Add a pattern');
    console.log('       cx ignore <command>\n');
    console.log(chalk.dim('Commands:'));
    console.log('  <pattern>        Add an exclusion pattern (default action)');
    console.log('  rm <pattern>     Remove an exclusion pattern');
    console.log('  show             List current exclusion patterns');
    console.log('  clear            Remove all exclusion patterns');
    console.log('  test             Preview what will be excluded\n');
    console.log(chalk.dim('Examples:'));
    console.log('  cx ignore "*.log"            Exclude all log files');
    console.log('  cx ignore "tmp/**"           Exclude tmp directory');
    console.log('  cx ignore "**/node_modules"  Exclude node_modules anywhere');
    console.log('  cx ignore rm "*.log"         Remove the *.log pattern\n');
}

/** Print usage for `cx ignore add <pattern>`. */
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