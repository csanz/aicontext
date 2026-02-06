/**
 * Help text and yargs configuration for the cx CLI (options, commands, examples).
 * configureParser wires commands to configure/show/ignore; handleHelp/showHelp print basic or detailed help.
 */

import chalk from 'chalk';
import columnify from 'columnify';
import { addExclusion, removeExclusionByPattern, showExclusions, clearExclusions, testExclusions, addInclusion, removeInclusionByPattern, showInclusions, clearInclusions } from './configHandler.js';

/** Format an options object (key: description) as columnified text for help output. */
function formatOptions(options) {
  return columnify(options, {
    columnSplitter: '  ',
    showHeaders: false,
    config: {
      description: {
        align: 'left'
      }
    }
  });
}

export const BASIC_OPTIONS = {
  '-h, --help': 'Show help information',
  '-h --more': 'Show this detailed help',
  '-v, --version': 'Show version number',
  '-o': 'Output to screen',
  '-s, --snap': 'Create a snapshot',
  '-m, --message <msg>': 'Add message to file name',
  '-t, --tree': 'Display directory tree only',
  '-f, --format <fmt>': 'Output format: text, md, json, xml (default: text)',
  '--load-cursor-rules': 'Load and import cursor rules'
};

export const DETAILED_OPTIONS = {
  '-h, --help': 'Show help information',
  '-h --more': 'Show this detailed help',
  '-v, --version': 'Show version number',
  '-o': 'Output to screen',
  '-s, --snap': 'Create a snapshot',
  '-m, --message <msg>': 'Add message to file name',
  '-t, --tree': 'Display directory tree only',
  '-f, --format <fmt>': 'Output format: text, md, json, xml (default: text)',
  '--since <time>': 'Only files changed since time (e.g., 2h, 1d, 2024-01-15)',
  '--git-diff <ref>': 'Only files changed vs git ref (e.g., main, HEAD~5)',
  '--changed': 'Only files changed since last cx run',
  '--verbose': 'Show detailed progress',
  '--timeout <sec>': 'Custom timeout in seconds (default: 10s)',
  '--max-size <mb>': 'Max file size in MB (default: 10)',
  '--no-clipboard': "Don't copy to clipboard",
  '--load-cursor-rules': 'Load and import cursor rules'
};

const IGNORE_OPTIONS = {
  '-i, --ignore': 'Shorthand for ignore commands:',
  '-i <pattern>': 'Add ignore pattern (use quotes: "*.log")',
  '-i rm <pattern>': 'Remove an ignore pattern',
  '-i show': 'Show current patterns',
  '-i clear': 'Remove all patterns',
  '-i test': 'Test patterns against directory',
  '--configure-ignore': 'Configure ignore settings'
};

const EXAMPLES = {
  '$ cx': 'Process current directory',
  '$ cx ./src': 'Process specific directory',
  '$ cx ./lib ./src/main.js ./docs': 'Process multiple paths',
  '$ cx -t': 'Show directory tree only',
  '$ cx -o': 'Output to screen',
  '$ cx -s': 'Create a snapshot',
  '$ cx -m "new feature"': 'Generate context-new-feature.txt',
  '$ cx -f md': 'Output as Markdown (.md)',
  '$ cx -f json': 'Output as JSON (.json)',
  '$ cx --since 2h': 'Files changed in last 2 hours',
  '$ cx --git-diff main': 'Files changed vs main branch',
  '$ cx --changed': 'Files changed since last cx run',
  '$ cx ignore "*.log"': 'Exclude all log files',
  '$ cx ignore show': 'Show ignore patterns',
  '$ cx include "src/**/*.ts"': 'Only include TypeScript in src/',
  '$ cx include show': 'Show include patterns',
  '$ cx configure': 'Configure settings',
  '$ cx show': 'Show current configuration'
};

const BASIC_HELP = `
${chalk.bold('AI Context Manager')}

${chalk.dim('Usage:')}
  cx <path1> [path2...] [options]

${chalk.dim('Commands:')}
  cx configure                     Configure settings
  cx show                         Show current configuration
  cx ignore <pattern>             Add an ignore pattern (exclude files)
  cx include <pattern>            Add an include pattern (whitelist files)

${chalk.dim('Basic Commands:')}
  cx                              Process current directory
  cx ./src                        Process specific directory
  cx -t                           Display directory tree only
  cx -o                           Output to screen
  cx -s                           Create a snapshot
  cx -m "msg"                     Add message to file name

${chalk.dim('Common Options:')}
${formatOptions(BASIC_OPTIONS)}

For more options, use: ${chalk.blue('cx -h --more')}
Full documentation: ${chalk.blue('https://github.com/csanz/aicontext/blob/main/COMMANDS.md')}
`;

const DETAILED_HELP = `
${chalk.bold('AI Context Manager - Detailed Help')}

${chalk.dim('Usage:')}
  cx <path1> [path2...] [options]

${chalk.dim('Note: Paths can be files or directories. If no path is specified, current directory is used.')}

${chalk.dim('Commands:')}
  cx configure                     Configure settings
  cx show                         Show current configuration

${chalk.dim('Ignore Patterns (exclude files):')}
  cx ignore <pattern>             Add an ignore pattern
  cx ignore rm <pattern>          Remove an ignore pattern
  cx ignore show                  Show current patterns
  cx ignore clear                 Remove all patterns
  cx ignore test                  Test patterns against directory

${chalk.dim('Include Patterns (whitelist files):')}
  cx include <pattern>            Add an include pattern
  cx include rm <pattern>         Remove an include pattern
  cx include show                 Show current patterns
  cx include clear                Remove all patterns

${chalk.dim('All Available Options:')}
${formatOptions(DETAILED_OPTIONS)}

${chalk.dim('Examples:')}
${formatOptions(EXAMPLES)}

${chalk.dim('Notes:')}
  - Include patterns act as a whitelist (only matching files processed)
  - Files must match include AND not match ignore to be processed
  - Snapshots are stored in .aicontext/snapshots directory

Full documentation: ${chalk.blue('https://github.com/csanz/aicontext/blob/main/COMMANDS.md')}
`;

/**
 * Configure yargs with all options and commands
 */
export function configureParser(yargs, { configure, showConfig, handleIgnoreCommand }) {
  return yargs
    .usage('Usage: $0 <path1> [path2...] [options]')
    .example('$0 ./src', 'Process single directory')
    .example('$0 ./lib ./src/main.js ./docs', 'Process multiple paths')
    .example('$0 . -s -m "feature"', 'Create snapshot with message')
    .help(false)  // Disable default help
    .check((argv) => {
      // Get all the keys that start with -
      const invalidSwitches = Object.keys(argv)
        .filter(key => key.startsWith('-') && !['--', '_', '$0'].includes(key));
      
      if (invalidSwitches.length > 0) {
        throw new Error(`Invalid switch detected: ${invalidSwitches[0]}\nRun 'cx -h' to learn more about valid switches and options`);
      }
      return true;
    })
    .fail((msg, err, yargs) => {
      if (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    })
    .option('h', {
      alias: ['help', '?'],
      type: 'boolean',
      description: 'Show help information'
    })
    .option('more', {
      type: 'boolean',
      description: 'Show detailed help'
    })
    .option('v', {
      alias: 'version',
      type: 'boolean',
      description: 'Show version number',
      group: 'General:',
      requiresArg: false
    })
    .option('t', {
      alias: 'tree',
      type: 'boolean',
      description: 'Display directory tree only',
      group: 'Options:',
      requiresArg: false
    })
    // Commands
    .command({
      command: 'configure',
      desc: 'Configure settings',
      builder: (yargs) => yargs,
      handler: async (argv) => {
        await new Promise((resolve) => {
          configure();
          // Don't exit - let the readline interface handle it
        });
      }
    })
    .command({
      command: 'show',
      desc: 'Show current configuration',
      builder: (yargs) => yargs,
      handler: (argv) => {
        showConfig();
        process.exit(0);
      }
    })
    .command({
      command: 'ignore [command]',
      desc: 'Manage ignore patterns',
      builder: (yargs) => {
        return yargs
          .command({
            command: 'add <pattern>',
            desc: 'Add new ignore pattern',
            builder: (yargs) => {
              return yargs
                .positional('pattern', {
                  describe: 'Pattern to ignore (e.g., "*.log", "build/**")',
                  type: 'string',
                  demandOption: true
                })
                .example('cx ignore add "*.log"', 'Exclude all log files')
                .example('cx ignore add "build/**"', 'Exclude build directory')
                .example('cx ignore add "*.{jpg,png}"', 'Exclude multiple extensions')
                .version(false)
                .help('help')
                .alias('help', 'h');
            },
            handler: (argv) => {
              const pattern = argv.pattern.replace(/^["']|["']$/g, '');
              addExclusion(pattern);
              process.exit(0);
            }
          })
          .command({
            command: 'rm <pattern>',
            aliases: ['remove'],
            desc: 'Remove an ignore pattern',
            builder: (yargs) => {
              return yargs
                .positional('pattern', {
                  describe: 'Pattern to remove',
                  type: 'string',
                  demandOption: true
                })
                .example('cx ignore rm "*.log"', 'Remove the *.log pattern')
                .version(false)
                .help('help')
                .alias('help', 'h');
            },
            handler: (argv) => {
              const pattern = argv.pattern.replace(/^["']|["']$/g, '');
              removeExclusionByPattern(pattern);
              process.exit(0);
            }
          })
          .command({
            command: 'show',
            desc: 'Show current patterns',
            handler: () => {
              showExclusions();
              process.exit(0);
            }
          })
          .command({
            command: 'clear',
            desc: 'Remove all patterns',
            handler: () => {
              clearExclusions();
              process.exit(0);
            }
          })
          .command({
            command: 'test',
            desc: 'Test patterns against directory',
            handler: () => {
              testExclusions();
              process.exit(0);
            }
          })
          .example('cx ignore "*.log"', 'Add an ignore pattern')
          .example('cx ignore rm "*.log"', 'Remove an ignore pattern')
          .example('cx ignore show', 'Show all ignore patterns')
          .example('cx ignore clear', 'Remove all patterns');
      },
      handler: (argv) => {
        handleIgnoreCommand(argv);
      }
    })
    .command({
      command: 'include [command]',
      desc: 'Manage include patterns (whitelist)',
      builder: (yargs) => {
        return yargs
          .command({
            command: 'add <pattern>',
            desc: 'Add new include pattern',
            builder: (yargs) => {
              return yargs
                .positional('pattern', {
                  describe: 'Pattern to include (e.g., "src/**/*.ts")',
                  type: 'string',
                  demandOption: true
                })
                .example('cx include add "src/**/*.ts"', 'Only TypeScript in src/')
                .example('cx include add "*.js"', 'Only JavaScript files')
                .version(false)
                .help('help')
                .alias('help', 'h');
            },
            handler: (argv) => {
              const pattern = argv.pattern.replace(/^["']|["']$/g, '');
              addInclusion(pattern);
              process.exit(0);
            }
          })
          .command({
            command: 'rm <pattern>',
            aliases: ['remove'],
            desc: 'Remove an include pattern',
            builder: (yargs) => {
              return yargs
                .positional('pattern', {
                  describe: 'Pattern to remove',
                  type: 'string',
                  demandOption: true
                })
                .example('cx include rm "*.ts"', 'Remove the *.ts pattern')
                .version(false)
                .help('help')
                .alias('help', 'h');
            },
            handler: (argv) => {
              const pattern = argv.pattern.replace(/^["']|["']$/g, '');
              removeInclusionByPattern(pattern);
              process.exit(0);
            }
          })
          .command({
            command: 'show',
            desc: 'Show current include patterns',
            handler: () => {
              showInclusions();
              process.exit(0);
            }
          })
          .command({
            command: 'clear',
            desc: 'Remove all include patterns',
            handler: () => {
              clearInclusions();
              process.exit(0);
            }
          })
          .example('cx include "src/**/*.ts"', 'Add an include pattern')
          .example('cx include rm "*.ts"', 'Remove an include pattern')
          .example('cx include show', 'Show all include patterns')
          .example('cx include clear', 'Remove all patterns');
      },
      handler: (argv) => {
        // Import dynamically to avoid circular dependency
        import('./includeCommands.js').then(({ handleIncludeCommand }) => {
          handleIncludeCommand(argv);
        });
      }
    })
    // Options
    .option('s', {
      alias: 'snap',
      type: 'boolean',
      description: 'Create a snapshot',
      group: 'Options:',
      requiresArg: false
    })
    .option('m', {
      alias: 'message',
      type: 'string',
      description: 'Add message to file name',
      group: 'Options:',
      requiresArg: true,
      nargs: 1
    })
    .option('o', {
      type: 'boolean',
      description: 'Output to screen',
      group: 'Options:',
      requiresArg: false
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Show detailed progress',
      group: 'Options:',
      requiresArg: false
    })
    .option('timeout', {
      type: 'number',
      description: 'Custom timeout in seconds',
      default: 10,
      group: 'Options:',
      requiresArg: true,
      nargs: 1
    })
    .option('max-size', {
      type: 'number',
      description: 'Max file size in MB',
      default: 10,
      group: 'Options:',
      requiresArg: true,
      nargs: 1
    })
    .option('no-clipboard', {
      type: 'boolean',
      description: "Don't copy to clipboard",
      group: 'Options:',
      requiresArg: false
    })
    .option('f', {
      alias: 'format',
      type: 'string',
      description: 'Output format: text, md, json, xml',
      default: 'text',
      choices: ['text', 'md', 'json', 'xml'],
      group: 'Options:',
      requiresArg: true,
      nargs: 1
    })
    .option('since', {
      type: 'string',
      description: 'Only include files changed since time (e.g., 2h, 1d, 2024-01-15)',
      group: 'Incremental:',
      requiresArg: true,
      nargs: 1
    })
    .option('git-diff', {
      type: 'string',
      description: 'Only include files changed vs git ref (e.g., main, HEAD~5)',
      group: 'Incremental:',
      requiresArg: true,
      nargs: 1
    })
    .option('changed', {
      type: 'boolean',
      description: 'Only include files changed since last cx run',
      group: 'Incremental:',
      requiresArg: false
    })
    .option('load-cursor-rules', {
      type: 'boolean',
      description: 'Load and import cursor rules',
      group: 'Options:',
      requiresArg: false
    })
    .group(['help', 'version'], 'General:')
    .wrap(null)
    .epilogue('For more information, visit: https://github.com/csanz/aicontext');
}

/**
 * Handle help request based on argv
 */
export function handleHelp(argv) {
  if (argv.h || argv.help || argv['?']) {
    if (argv.more) {
      console.log(DETAILED_HELP);
    } else {
      console.log(BASIC_HELP);
    }
    process.exit(0);
    return true;
  }
  return false;
}

/**
 * Show help based on args
 */
export function showHelp(args = []) {
  if (args.includes('--more')) {
    console.log(DETAILED_HELP);
  } else {
    console.log(BASIC_HELP);
  }
}

export { IGNORE_OPTIONS }; 