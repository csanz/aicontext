/**
 * Context file content generation: merges directory structure, file list, and stats
 * into the context-header and context-file-header templates.
 * Supports multiple output formats: text, markdown, json, xml.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { formatFileSize } from './fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Supported output formats */
export const OUTPUT_FORMATS = ['text', 'md', 'json', 'xml'];

/** File extensions for each format */
export const FORMAT_EXTENSIONS = {
    text: '.txt',
    md: '.md',
    json: '.json',
    xml: '.xml'
};

/**
 * Generates the content for a context file
 * @param {Object} options - Options for content generation
 * @param {string} options.directoryStructure - Directory tree structure (optional)
 * @param {Array<Object>} options.files - Array of processed files
 * @param {Array<string>} options.inputPaths - Array of input paths
 * @param {Object} options.skippedFiles - Information about skipped files
 * @param {Array<Object>} options.fileStats - Statistics about processed files
 * @param {string} options.format - Output format: text, md, json, xml (default: text)
 * @returns {string} Generated content
 */
export function generateContextContent({ directoryStructure, files, inputPaths, skippedFiles, fileStats, format = 'text' }) {
    // Route to appropriate format generator
    switch (format) {
        case 'md':
            return generateMarkdownContent({ directoryStructure, files, inputPaths, skippedFiles, fileStats });
        case 'json':
            return generateJsonContent({ directoryStructure, files, inputPaths, skippedFiles, fileStats });
        case 'xml':
            return generateXmlContent({ directoryStructure, files, inputPaths, skippedFiles, fileStats });
        case 'text':
        default:
            return generateTextContent({ directoryStructure, files, inputPaths, skippedFiles, fileStats });
    }
}

/**
 * Generates text format content (original format)
 */
function generateTextContent({ directoryStructure, files, inputPaths, skippedFiles, fileStats }) {
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

/**
 * Generates Markdown format content
 */
function generateMarkdownContent({ directoryStructure, files, inputPaths, skippedFiles, fileStats }) {
    const timestamp = new Date().toLocaleString();

    // Calculate totals
    const totalFiles = files.length;
    const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
    const totalChars = files.reduce((sum, f) => sum + f.chars, 0);
    const totalTokens = files.reduce((sum, f) => sum + f.tokens, 0);
    const totalSizeBytes = files.reduce((sum, file) => {
        try {
            const stats = fs.statSync(file.path);
            return sum + stats.size;
        } catch (error) {
            return sum;
        }
    }, 0);

    // Group binary files by extension
    const binaryFilesByExt = {};
    if (skippedFiles && skippedFiles.binaryFiles) {
        skippedFiles.binaryFiles.forEach(file => {
            const ext = path.extname(file.path || file).toLowerCase() || '(no ext)';
            if (!binaryFilesByExt[ext]) {
                binaryFilesByExt[ext] = [];
            }
            binaryFilesByExt[ext].push(file.path || file);
        });
    }

    const top5 = fileStats.slice(0, 5).map((file, i) =>
        (i + 1) + '. **' + file.path + '** - ' + file.chars.toLocaleString() + ' chars, ' + file.tokens.toLocaleString() + ' tokens'
    ).join('\n');

    let md = '# Project Context\n\n';
    md += '> Generated: ' + timestamp + '\n';
    md += '> Source: ' + (typeof inputPaths === 'string' ? inputPaths : inputPaths) + '\n\n';
    md += '## Summary\n\n';
    md += '| Metric | Value |\n';
    md += '|--------|-------|\n';
    md += '| Files | ' + totalFiles.toLocaleString() + ' |\n';
    md += '| Lines | ' + totalLines.toLocaleString() + ' |\n';
    md += '| Characters | ' + totalChars.toLocaleString() + ' |\n';
    md += '| Tokens | ' + totalTokens.toLocaleString() + ' |\n';
    md += '| Size | ' + (totalSizeBytes / (1024 * 1024)).toFixed(2) + ' MB |\n\n';
    md += '## Top 5 Files by Size\n\n';
    md += top5 + '\n\n';
    md += '## Directory Structure\n\n';
    md += '```\n';
    md += (directoryStructure || '(not available)') + '\n';
    md += '```\n\n';
    md += '## Files\n\n';

    // Add each file
    for (const file of files) {
        let lastModified = 'N/A';
        let fileSize = 'N/A';

        try {
            const stats = fs.statSync(file.path);
            lastModified = stats.mtime.toLocaleString();
            fileSize = formatFileSize(stats.size);
        } catch (error) {
            // File might not exist or be inaccessible
        }

        const contentParts = file.content.split(/\n+## Summary\n/);
        const cleanContent = contentParts[0].trim();
        const languageExt = file.extension || 'text';
        const extensionDisplay = file.extension ? '.' + file.extension : 'none';

        md += '### ' + file.path + '\n\n';
        md += '| Property | Value |\n';
        md += '|----------|-------|\n';
        md += '| Lines | ' + file.lines + ' |\n';
        md += '| Tokens | ' + file.tokens.toLocaleString() + ' |\n';
        md += '| Extension | ' + extensionDisplay + ' |\n';
        md += '| Size | ' + fileSize + ' |\n';
        md += '| Modified | ' + lastModified + ' |\n\n';
        md += '```' + languageExt + '\n';
        md += cleanContent + '\n';
        md += '```\n\n';
        md += '---\n\n';
    }

    // Add excluded files section
    if (Object.keys(binaryFilesByExt).length > 0) {
        md += `## Excluded Files

`;
        for (const [ext, extFiles] of Object.entries(binaryFilesByExt)) {
            md += `- **${ext}**: ${extFiles.length} file(s)\n`;
        }
    }

    md += `
---
*Generated by [AIContext](https://github.com/csanz/aicontext)*
`;

    return md;
}

/**
 * Generates JSON format content
 */
function generateJsonContent({ directoryStructure, files, inputPaths, skippedFiles, fileStats }) {
    const timestamp = new Date().toISOString();

    // Calculate totals
    const totalSizeBytes = files.reduce((sum, file) => {
        try {
            const stats = fs.statSync(file.path);
            return sum + stats.size;
        } catch (error) {
            return sum;
        }
    }, 0);

    // Group binary files by extension
    const excludedByType = {};
    if (skippedFiles && skippedFiles.binaryFiles) {
        skippedFiles.binaryFiles.forEach(file => {
            const ext = path.extname(file.path || file).toLowerCase() || '(no ext)';
            if (!excludedByType[ext]) {
                excludedByType[ext] = [];
            }
            excludedByType[ext].push(file.path || file);
        });
    }

    const output = {
        metadata: {
            generator: 'AIContext',
            version: '1.5.1',
            generated: timestamp,
            source: typeof inputPaths === 'string' ? inputPaths : inputPaths
        },
        stats: {
            totalFiles: files.length,
            totalLines: files.reduce((sum, f) => sum + f.lines, 0),
            totalCharacters: files.reduce((sum, f) => sum + f.chars, 0),
            totalTokens: files.reduce((sum, f) => sum + f.tokens, 0),
            totalSizeBytes: totalSizeBytes,
            totalSizeMB: parseFloat((totalSizeBytes / (1024 * 1024)).toFixed(2))
        },
        topFilesBySize: fileStats.slice(0, 5).map(file => ({
            path: file.path,
            characters: file.chars,
            tokens: file.tokens,
            lines: file.lines
        })),
        directoryStructure: directoryStructure ? directoryStructure.split('\n') : [],
        files: files.map(file => {
            let lastModified = null;
            let sizeBytes = 0;

            try {
                const stats = fs.statSync(file.path);
                lastModified = stats.mtime.toISOString();
                sizeBytes = stats.size;
            } catch (error) {
                // File might not exist or be inaccessible
            }

            const contentParts = file.content.split(/\n+## Summary\n/);
            const cleanContent = contentParts[0].trim();

            return {
                path: file.path,
                extension: file.extension || null,
                lines: file.lines,
                characters: file.chars,
                tokens: file.tokens,
                sizeBytes: sizeBytes,
                lastModified: lastModified,
                content: cleanContent
            };
        }),
        excluded: {
            totalCount: skippedFiles ? skippedFiles.totalSkipped : 0,
            byType: excludedByType,
            largeFiles: skippedFiles ? skippedFiles.largeFiles : [],
            timedOut: skippedFiles ? skippedFiles.timedOutDirectories : []
        }
    };

    return JSON.stringify(output, null, 2);
}

/**
 * Generates XML format content
 */
function generateXmlContent({ directoryStructure, files, inputPaths, skippedFiles, fileStats }) {
    const timestamp = new Date().toISOString();

    // Calculate totals
    const totalSizeBytes = files.reduce((sum, file) => {
        try {
            const stats = fs.statSync(file.path);
            return sum + stats.size;
        } catch (error) {
            return sum;
        }
    }, 0);

    // Helper to escape XML special characters
    const escapeXml = (str) => {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    // Group binary files by extension
    const excludedByType = {};
    if (skippedFiles && skippedFiles.binaryFiles) {
        skippedFiles.binaryFiles.forEach(file => {
            const ext = path.extname(file.path || file).toLowerCase() || 'no-ext';
            if (!excludedByType[ext]) {
                excludedByType[ext] = [];
            }
            excludedByType[ext].push(file.path || file);
        });
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<context>
  <metadata>
    <generator>AIContext</generator>
    <version>1.5.1</version>
    <generated>${timestamp}</generated>
    <source>${escapeXml(typeof inputPaths === 'string' ? inputPaths : inputPaths)}</source>
  </metadata>

  <stats>
    <totalFiles>${files.length}</totalFiles>
    <totalLines>${files.reduce((sum, f) => sum + f.lines, 0)}</totalLines>
    <totalCharacters>${files.reduce((sum, f) => sum + f.chars, 0)}</totalCharacters>
    <totalTokens>${files.reduce((sum, f) => sum + f.tokens, 0)}</totalTokens>
    <totalSizeBytes>${totalSizeBytes}</totalSizeBytes>
    <totalSizeMB>${(totalSizeBytes / (1024 * 1024)).toFixed(2)}</totalSizeMB>
  </stats>

  <topFilesBySize>
${fileStats.slice(0, 5).map(file => `    <file>
      <path>${escapeXml(file.path)}</path>
      <characters>${file.chars}</characters>
      <tokens>${file.tokens}</tokens>
      <lines>${file.lines}</lines>
    </file>`).join('\n')}
  </topFilesBySize>

  <directoryStructure><![CDATA[
${directoryStructure || '(not available)'}
]]></directoryStructure>

  <files>
`;

    // Add each file
    for (const file of files) {
        let lastModified = '';
        let sizeBytes = 0;

        try {
            const stats = fs.statSync(file.path);
            lastModified = stats.mtime.toISOString();
            sizeBytes = stats.size;
        } catch (error) {
            // File might not exist or be inaccessible
        }

        const contentParts = file.content.split(/\n+## Summary\n/);
        const cleanContent = contentParts[0].trim();

        xml += `    <file>
      <path>${escapeXml(file.path)}</path>
      <extension>${escapeXml(file.extension || '')}</extension>
      <lines>${file.lines}</lines>
      <characters>${file.chars}</characters>
      <tokens>${file.tokens}</tokens>
      <sizeBytes>${sizeBytes}</sizeBytes>
      <lastModified>${lastModified}</lastModified>
      <content><![CDATA[
${cleanContent}
]]></content>
    </file>
`;
    }

    xml += `  </files>

  <excluded>
    <totalCount>${skippedFiles ? skippedFiles.totalSkipped : 0}</totalCount>
    <byType>
`;

    for (const [ext, extFiles] of Object.entries(excludedByType)) {
        xml += `      <type extension="${escapeXml(ext)}" count="${extFiles.length}">
${extFiles.map(f => `        <file>${escapeXml(f)}</file>`).join('\n')}
      </type>
`;
    }

    xml += `    </byType>
  </excluded>
</context>
`;

    return xml;
} 