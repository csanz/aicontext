#!/usr/bin/env node

const generateContext = require('../lib/contextGenerator');
const checkGitIgnore = require('../lib/gitignoreHandler');
const { getConfig, showConfig, configure } = require('../lib/configHandler');
const { clearContextFiles } = require('../lib/cleanupUtils');
const { compressFile } = require('../lib/compressionHandler');
const clipboardy = require('clipboardy');
const fs = require('fs');

async function main() {
  const args = process.argv.slice(2);

  // Check for --clear anywhere in the arguments
  if (args.includes('--clear')) {
    clearContextFiles();
    process.exit(0);
  }

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: cx <directory> [options]

Options:
  -h, --help       Show help
  --no-minimize    Override config to generate uncompressed output
  --min           Force generate a minimized version (in addition to current output)
  -s, --snap      Create a snapshot in context/snap (not affected by --clear)
  --template      Create a template in context/template (not affected by --clear)
  --configure      Set up configuration
  --show          Show current configuration
  --clear         Remove all generated context files

Note: It is recommended to add the 'context' folder to your .gitignore file.
    `);
    process.exit(0);
  }

  if (args.includes('--configure')) {
    configure();
    return;
  }

  if (args.includes('--show')) {
    showConfig();
    return;
  }

  const dir = args[0];
  if (!dir) {
    console.error("❌ Error: Please provide a directory path");
    process.exit(1);
  }

  const isSnapshot = args.includes('-s') || args.includes('--snap');
  const isTemplate = args.includes('--template');
  
  // Get template name if provided
  let templateName = '';
  if (isTemplate) {
    const templateIndex = args.indexOf('--template');
    templateName = args[templateIndex + 1];
    if (!templateName) {
      console.error("❌ Error: Please provide a name for the template");
      process.exit(1);
    }
  }

  const config = getConfig();
  const options = {
    minimize: config.minimize && !args.includes('--no-minimize'),
    snapshot: isSnapshot,
    template: isTemplate,
    templateName
  };

  // Check and update .gitignore - now properly awaited
  await checkGitIgnore();

  console.log(`🔍 Scanning directory: ${dir}`);
  const result = generateContext(dir, options);

  // Handle --min flag to force generate a minimized version
  if (args.includes('--min') && !options.minimize) {
    console.log('📦 Generating additional minimized version...');
    const minStats = compressFile(result.outputFile);
    console.log(`✅ Minimized version created: ${minStats.compressedFile}`);
    console.log(`   Compression ratio: ${minStats.compressionRatio}%`);
    result.outputFile = minStats.compressedFile;
  }

  // Skip clipboard for snapshots and templates
  if (config.autoClipboard && !isSnapshot && !isTemplate) {
    try {
      const content = fs.readFileSync(result.outputFile, 'utf8');
      clipboardy.write(content).then(() => {
        console.log('📋 Content copied to clipboard!');
      }).catch(error => {
        console.error('❌ Failed to copy to clipboard:', error.message);
      });
    } catch (error) {
      console.error('❌ Failed to read file:', error.message);
    }
  }
}

// Properly handle the async main function
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});