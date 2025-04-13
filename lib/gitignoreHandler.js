import fs from 'fs';
import path from 'path';
import readline from 'readline';

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
        console.log(`⚠️  We need to add '${contextPattern}' to your .gitignore file to prevent AI context files from being committed.`);
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
      console.log(`⚠️  We need to create a .gitignore file with '${contextPattern}' to prevent AI context files from being committed.`);
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