const fs = require('fs').promises;
const path = require('path');
const { saveConfig } = require('./configHandler');
const spinnerHandler = require('./spinnerHandler');

// Configuration file paths
const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.aicontext');
const RULES_FILE = path.join(CONFIG_DIR, 'rules.json');

const isTextFile = (filePath) => {
  const textExtensions = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.json', '.yml', '.yaml', '.html', '.css', '.scss', '.less', '.vue', '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h', '.hpp', '.rs', '.go', '.swift'];
  return textExtensions.includes(path.extname(filePath).toLowerCase());
};

async function processFiles(files, targetDir) {
  const rules = [];
  
  for (const file of files) {
    const filePath = path.join(targetDir, file);
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.isFile() && isTextFile(filePath)) {
        spinnerHandler.updateText(`Processing: ${file}`);
        
        // Use setImmediate to keep the event loop responsive
        await new Promise(resolve => setImmediate(resolve));
        
        rules.push({
          file: path.relative(targetDir, filePath),
          size: stats.size,
          lastModified: stats.mtime.toISOString()
        });
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  }
  
  return rules;
}

async function loadCursorRules(targetDir) {
  return spinnerHandler.wrap(
    async () => {
      // Read directory contents
      spinnerHandler.updateText('Scanning directory...');
      const files = await fs.readdir(targetDir);
      
      // Process files in chunks to avoid blocking
      spinnerHandler.updateText('Processing files...');
      const rules = await processFiles(files, targetDir);
      
      // Save configuration
      spinnerHandler.updateText('Saving configuration...');
      await saveConfig({ rules });
      
      return rules;
    },
    {
      startText: 'Loading cursor rules...',
      successText: 'Cursor rules loaded successfully',
      failText: 'Failed to load cursor rules'
    }
  );
}

/**
 * Get the current cursor rules
 * @returns {object|null} - Current rules or null if not configured
 */
function getCurrentRules() {
  try {
    if (fs.existsSync(RULES_FILE)) {
      return JSON.parse(fs.readFileSync(RULES_FILE));
    }
    return null;
  } catch (error) {
    console.error(`Error reading cursor rules: ${error.message}`);
    return null;
  }
}

module.exports = {
  loadCursorRules,
  getCurrentRules
}; 