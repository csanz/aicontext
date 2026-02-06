/**
 * Include Commands Module
 *
 * Handles the `cx include` command and its subcommands for managing
 * include patterns (positive file matching).
 */

import chalk from 'chalk';
import { getInclusions, addInclusion, removeInclusionByPattern, showInclusions, clearInclusions } from './configHandler.js';

/**
 * Handle the include command and its subcommands
 * @param {Object} argv - Command line arguments object
 */
export async function handleIncludeCommand(argv) {
    const command = argv.command || argv._[1];

    if (!command) {
        showIncludeHelp();
        process.exit(0);
    }

    switch (command) {
        case 'show':
            showInclusions();
            break;
        case 'clear':
            clearInclusions();
            break;
        case 'add':
            let pattern = argv._[2];
            if (!pattern) {
                console.error(chalk.red('Error: No pattern provided'));
                showAddHelp();
                process.exit(1);
            }
            pattern = pattern.replace(/^["']|["']$/g, '');
            addInclusion(pattern);
            break;
        case 'rm':
        case 'remove':
            let rmPattern = argv.pattern || argv._[2];
            if (!rmPattern) {
                console.error(chalk.red('Error: No pattern provided'));
                process.exit(1);
            }
            rmPattern = rmPattern.replace(/^["']|["']$/g, '');
            removeInclusionByPattern(rmPattern);
            break;
        default:
            // Treat any non-command argument as a pattern to add
            addInclusion(command);
            break;
    }
    process.exit(0);
}

/** Print usage for `cx include` and subcommands. */
function showIncludeHelp() {
    console.log(chalk.bold('\nInclude Pattern Management\n'));
    console.log('Usage: cx include <pattern>     Add a pattern');
    console.log('       cx include <command>\n');
    console.log(chalk.dim('Description:'));
    console.log('  Include patterns act as a whitelist. When defined, ONLY files');
    console.log('  matching at least one include pattern will be processed.\n');
    console.log(chalk.dim('Commands:'));
    console.log('  <pattern>        Add an include pattern (default action)');
    console.log('  rm <pattern>     Remove an include pattern');
    console.log('  show             List current include patterns');
    console.log('  clear            Remove all include patterns\n');
    console.log(chalk.dim('Examples:'));
    console.log('  cx include "src/**/*.ts"      Only TypeScript files in src/');
    console.log('  cx include "*.js"             Only JavaScript files');
    console.log('  cx include "lib/**"           Only files in lib directory');
    console.log('  cx include rm "*.js"          Remove the *.js pattern\n');
    console.log(chalk.dim('Tips:'));
    console.log('  - Include patterns work alongside ignore patterns');
    console.log('  - Files must match include AND not match ignore to be processed');
    console.log('  - Clear all patterns with `cx include clear` to include all files\n');
}

/** Print usage for `cx include add <pattern>`. */
function showAddHelp() {
    console.log(chalk.bold('\nAdd Include Pattern\n'));
    console.log('Usage: cx include add <pattern>\n');
    console.log(chalk.dim('Pattern Syntax (glob/minimatch):'));
    console.log('  *            Match any characters (except /)');
    console.log('  **           Match any characters (including /)');
    console.log('  ?            Match single character');
    console.log('  {a,b}        Match a or b');
    console.log('  [abc]        Match any of a, b, or c\n');
    console.log(chalk.dim('Examples:'));
    console.log('  cx include "src/**/*.ts"      Only TypeScript files in src/');
    console.log('  cx include "**/*.{js,ts}"     All JS and TS files');
    console.log('  cx include "lib/**"           All files in lib/');
    console.log('  cx include "*.md"             All markdown files\n');
}

export default {
    handleIncludeCommand
};
