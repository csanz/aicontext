import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { showHelp } from './helpHandler.js';
import { generateContext } from './contextGenerator.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const { version } = packageJson;

const spinner = ora({
  text: 'Processing...',
  spinner: 'dots12',
  interval: 50
});

export async function processCommand(command, args) {
  try {
    switch (command) {
      case 'init':
        await handleInit(args);
        break;
      case '--help':
      case '-h':
        showHelp();
        break;
      case '--version':
      case '-v':
        console.log(version);
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

// For backwards compatibility
export const handleCommand = processCommand;

async function handleInit(args) {
  const targetPath = args[0];
  if (!targetPath) {
    throw new Error('No target path specified');
  }

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Path '${targetPath}' does not exist`);
  }

  if (!fs.statSync(targetPath).isDirectory()) {
    throw new Error(`Path '${targetPath}' is not a directory`);
  }

  spinner.start('Initializing context generation...');
  await generateContext({ inputPaths: [targetPath] });
  spinner.succeed('Context generation complete!');
} 