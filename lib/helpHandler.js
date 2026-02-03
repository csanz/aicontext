/**
 * Help text and yargs configuration for the cx CLI (options, commands, examples).
 * configureParser wires commands to configure/show/ignore; handleHelp/showHelp print basic or detailed help.
 */

import chalk from 'chalk';
import columnify from 'columnify';
import { addExclusion, removeExclusionByPattern, showExclusions, clearExclusions, testExclusions } from './configHandler.js';

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
  '--verbose': 'Show detailed progress',
  '--timeout <sec>': 'Custom timeout in seconds (default: 10s)',
  '--max-size <mb>': 'Max file size in MB (default: 1)',
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
  '$ cx -t ./src ./lib': 'Show trees for multiple paths',
  '$ cx -o': 'Output to screen',
  '$ cx -s': 'Create a snapshot',
  '$ cx -m "new feature"': 'Generate context-new-feature.txt',
  '$ cx -s -m "before refactor"': 'Generate snap-before-refactor.txt',
  '$ cx configure': 'Configure settings',
  '$ cx show': 'Show current configuration',
  '$ cx ignore "*.log"': 'Add ignore pattern',
  '$ cx ignore rm "*.log"': 'Remove ignore pattern',
  '$ cx ignore show': 'Show all patterns',
  '$ cx ignore clear': 'Remove all patterns'
};

const BASIC_HELP = `
${chalk.bold('AI Context Manager')}

${chalk.dim('Usage:')}
  cx <path1> [path2...] [options]

${chalk.dim('Commands:')}
  cx configure                     Configure settings
  cx show                         Show current configuration
  cx ignore <pattern>             Add an ignore pattern
  cx ignore rm <pattern>          Remove an ignore pattern
  cx ignore show                  Show current patterns
  cx ignore clear                 Remove all patterns
  cx ignore test                  Test patterns against directory

${chalk.dim('Basic Commands:')}
  cx                              Process current directory
  cx ./src                        Process specific directory
  cx ./lib ./src/main.js ./docs   Process multiple paths
  cx -t                           Display directory tree only
  cx -o                           Output to screen
  cx -s                           Create a snapshot
  cx -m "msg"                     Add message to file name (generates context-msg.txt)

${chalk.dim('Common Options:')}
${formatOptions(BASIC_OPTIONS)}

For more options, use: ${chalk.blue('cx -h --more')}
`;

const DETAILED_HELP = `
${chalk.bold('AI Context Manager - Detailed Help')}

${chalk.dim('Usage:')}
  cx <path1> [path2...] [options]
  
${chalk.dim('Note: Paths can be files or directories. If no path is specified, current directory is used.')}

${chalk.dim('Commands:')}
  cx configure                     Configure settings
  cx show                         Show current configuration
  cx ignore <pattern>             Add an ignore pattern
  cx ignore rm <pattern>          Remove an ignore pattern
  cx ignore show                  Show current patterns
  cx ignore clear                 Remove all patterns
  cx ignore test                  Test patterns against directory

${chalk.dim('All Available Options:')}
${formatOptions(DETAILED_OPTIONS)}
  
${chalk.dim('Ignore Pattern Options:')}
${formatOptions(IGNORE_OPTIONS)}

${chalk.dim('Examples:')}
${formatOptions(EXAMPLES)}

${chalk.dim('Notes:')}
  - Multiple paths can be specified (files and/or directories)
  - Paths default to current directory if not specified
  - Directories are processed recursively
  - Binary files and ignored paths are automatically excluded
  - Use -v for verbose output during processing
  - Snapshots are stored in .aicontext/snapshots directory
  - Screen output (-o) bypasses file creation

For more information, visit: ${chalk.blue('https://github.com/csanz/aicontext')}
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
      default: 1,
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