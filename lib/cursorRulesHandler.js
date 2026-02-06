/**
 * Cursor rules loader: scans a directory for text rules files and saves a rules manifest.
 * Used by the load-cursor-rules command.
 */

import fs from 'fs';
import path from 'path';
import * as spinnerHandler from './spinnerHandler.js';

// Configuration file paths
const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.aicontext');
const RULES_FILE = path.join(CONFIG_DIR, 'rules.json');

/** Returns true if the file extension is considered a text/source file. */
const isTextFile = (filePath) => {
  const textExtensions = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.json', '.yml', '.yaml', '.html', '.css', '.scss', '.less', '.vue', '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h', '.hpp', '.rs', '.go', '.swift'];
  return textExtensions.includes(path.extname(filePath).toLowerCase());
};

/**
 * Save rules to the rules.json file
 * @param {Array} rules - Array of rule objects
 */
async function saveRules(rules) {
  // Ensure config directory exists
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(RULES_FILE, JSON.stringify({ rules }, null, 2));
}

/** Scan targetDir for files, filter to text files, return rule metadata (file, size, lastModified). */
async function processFiles(files, targetDir) {
  const rules = [];

  for (const file of files) {
    const filePath = path.join(targetDir, file);
    try {
      const stats = await fs.promises.stat(filePath);

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

/** Load cursor rules from targetDir: scan files, build rules list, save to rules.json. */
export async function loadCursorRules(targetDir) {
  return spinnerHandler.wrap(
    async () => {
      // Read directory contents
      spinnerHandler.updateText('Scanning directory...');
      const files = await fs.promises.readdir(targetDir);

      // Process files in chunks to avoid blocking
      spinnerHandler.updateText('Processing files...');
      const rules = await processFiles(files, targetDir);

      // Save rules to file
      spinnerHandler.updateText('Saving configuration...');
      await saveRules(rules);

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
export function getCurrentRules() {
  try {
    if (fs.existsSync(RULES_FILE)) {
      return JSON.parse(fs.readFileSync(RULES_FILE, 'utf8'));
    }
    return null;
  } catch (error) {
    console.error(`Error reading cursor rules: ${error.message}`);
    return null;
  }
}

export default {
  loadCursorRules,
  getCurrentRules
};
