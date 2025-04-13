import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { formatFileSize } from './fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generates the content for a context file
 * @param {Object} options - Options for content generation
 * @param {string} options.directoryStructure - Directory tree structure (optional)
 * @param {Array<Object>} options.files - Array of processed files
 * @param {Array<string>} options.inputPaths - Array of input paths
 * @param {Object} options.skippedFiles - Information about skipped files
 * @param {Array<Object>} options.fileStats - Statistics about processed files
 * @returns {string} Generated content
 */
export function generateContextContent({ directoryStructure, files, inputPaths, skippedFiles, fileStats }) {
    // Load both templates
    const contextHeaderTemplate = fs.readFileSync(path.join(__dirname, '../templates/context-header.txt'), 'utf8');
    const fileHeaderTemplate = fs.readFileSync(path.join(__dirname, '../templates/context-file-header.txt'), 'utf8');
    
    // Generate top 5 files summary from sorted file stats
    const top5Files = fileStats.slice(0, 5).map(file => 
        `- ${file.path}: ${file.chars.toLocaleString()} characters, ${file.tokens.toLocaleString()} tokens`
    ).join('\n');

    // Group binary files by extension
    const binaryFilesByExt = {};
    if (skippedFiles && skippedFiles.binaryFiles) {
        skippedFiles.binaryFiles.forEach(file => {
            const ext = path.extname(file.path || file).toLowerCase();
            if (!binaryFilesByExt[ext]) {
                binaryFilesByExt[ext] = [];
            }
            binaryFilesByExt[ext].push(file.path || file);
        });
    }

    // Format binary files summary
    const binaryFilesSummary = Object.entries(binaryFilesByExt)
        .map(([ext, files]) => 
            `- ${ext}: ${files.length} file(s)\n  - ${files.join('\n  - ')}`
        ).join('\n') || 'None';

    // Process all files
    const filesContent = files.map(file => {
        // Get file stats
        let lastModified = 'N/A';
        let fileSize = 'N/A';
        
        try {
            const stats = fs.statSync(file.path);
            lastModified = stats.mtime.toLocaleString();
            fileSize = formatFileSize(stats.size);
        } catch (error) {
            // File might not exist or be inaccessible
            console.warn(`Warning: Could not get stats for ${file.path}`);
        }

        // Create the file header
        const header = fileHeaderTemplate
            .replace('{{FilePathName}}', file.path)
            .replace('{{NumberOfLines}}', file.lines)
            .replace('{{NumberOfTokens}}', file.tokens)
            .replace('{{Extension}}', file.extension ? `.${file.extension}` : 'none')
            .replace('{{Purpose}}', file.purpose || 'N/A')
            .replace('{{LastModified}}', lastModified)
            .replace('{{FileSize}}', fileSize);

        // Split content at the summary section and only use the part before it
        const contentParts = file.content.split(/\n+## Summary\n/);
        const cleanContent = contentParts[0].trim();

        // Add the file content with proper code block formatting
        const languageExt = file.extension || 'text';
        return `${header}\n\`\`\`${languageExt}\n${cleanContent}\n\`\`\`\n`;
    }).join('\n');

    // Create a map of all replacements
    const replacements = {
        '{{FilesOrFolders}}': inputPaths,
        '{{DirectoryStructure}}': directoryStructure || '',
        '{{AllFiles}}': filesContent,
        '{{TopFilesBySize}}': top5Files,
        '{{FilesExcluded}}': binaryFilesSummary,
        '{{NumberOfFiles}}': files.length.toLocaleString(),
        '{{NumberOfTokens}}': files.reduce((sum, file) => sum + file.tokens, 0).toLocaleString(),
        '{{SizeInMB}}': (files.reduce((sum, file) => {
            try {
                const stats = fs.statSync(file.path);
                return sum + stats.size;
            } catch (error) {
                return sum;
            }
        }, 0) / (1024 * 1024)).toFixed(2)
    };

    // Replace all placeholders in the template
    let content = contextHeaderTemplate;
    for (const [placeholder, value] of Object.entries(replacements)) {
        content = content.split(placeholder).join(value);
    }

    return content;
} 