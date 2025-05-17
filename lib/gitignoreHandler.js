import fs from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';

let verbose = false;

export function setVerbose(value) {
  verbose = value;
}

function log(...args) {
  if (verbose) {
    console.log(chalk.gray('[GitignoreHandler]'), ...args);
  }
}

/**
 * Get patterns from .gitignore file
 * @returns {string[]} Array of gitignore patterns
 */
export function getGitignorePatterns() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const patterns = readGitignore(gitignorePath);
  
  log(`Loaded ${patterns.length} gitignore patterns:`, patterns);
  
  // Debug output to help diagnose test failures
  if (patterns.includes('*.md')) {
    log('Found *.md pattern in gitignore!');
  }
  
  return patterns;
}

export async function checkGitIgnore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const contextPattern = '.aicontext/';
  const commentPattern = '\n# AI context files\n';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignoreContent.includes(contextPattern)) {
        console.log(`⚠ .gitignore missing '${contextPattern}'`);
        const answer = await new Promise(resolve => {
          rl.question('Press Enter to continue (or "n" to cancel): ', resolve);
        });

        if (answer.toLowerCase() !== 'n') {
          // Ensure we add a newline before our comment if the file doesn't end with one
          const newline = gitignoreContent.endsWith('\n') ? '' : '\n';
          fs.appendFileSync(gitignorePath, `${newline}${commentPattern}${contextPattern}\n`);
          console.log(`✅ Added '${contextPattern}' to .gitignore`);
        }
      }
    } else {
      console.log(`⚠ .gitignore not found`);
      const answer = await new Promise(resolve => {
        rl.question('Press Enter to continue (or "n" to cancel): ', resolve);
      });

      if (answer.toLowerCase() !== 'n') {
        fs.writeFileSync(gitignorePath, `# AI context files\n${contextPattern}\n`);
        console.log(`✅ Created .gitignore with '${contextPattern}'`);
      }
    }
  } finally {
    rl.close();
  }
}

function readGitignore(gitignorePath) {
  try {
    if (!fs.existsSync(gitignorePath)) {
      log(`No gitignore file found at ${gitignorePath}`);
      return [];
    }

    const content = fs.readFileSync(gitignorePath, 'utf8');
    
    // Parse content line by line
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => 
        // Skip empty lines and comments
        line && !line.startsWith('#')
      );
  } catch (error) {
    log(`Error reading gitignore file: ${error.message}`);
    return [];
  }
} 