/**
 * Change Tracker Module
 *
 * Tracks file changes for incremental context generation.
 * Supports time-based filtering (--since) and git-based filtering (--git-diff).
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { CONTEXT_ROOT } from './contextDirHandler.js';

/** Path to the last run timestamp file */
const LAST_RUN_FILE = '.last-run';

/**
 * Parse a time expression into a Date object
 * Supports: "2h", "30m", "1d", "1w", or ISO date strings
 * @param {string} timeExpr - Time expression (e.g., "2h", "1d", "2024-01-15")
 * @returns {Date} - The parsed date
 */
export function parseTimeExpression(timeExpr) {
    if (!timeExpr) return null;

    // Check if it's a relative time expression
    const relativeMatch = timeExpr.match(/^(\d+)(m|h|d|w)$/i);
    if (relativeMatch) {
        const amount = parseInt(relativeMatch[1], 10);
        const unit = relativeMatch[2].toLowerCase();
        const now = new Date();

        switch (unit) {
            case 'm': // minutes
                return new Date(now.getTime() - amount * 60 * 1000);
            case 'h': // hours
                return new Date(now.getTime() - amount * 60 * 60 * 1000);
            case 'd': // days
                return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
            case 'w': // weeks
                return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
            default:
                return null;
        }
    }

    // Try parsing as a date string
    const parsed = new Date(timeExpr);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }

    return null;
}

/**
 * Format a relative time for display
 * @param {Date} date - The date to format
 * @returns {string} - Human-readable relative time
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

/**
 * Get the last run timestamp
 * @returns {Date|null} - The last run date or null if never run
 */
export function getLastRunTime() {
    const lastRunPath = path.join(process.cwd(), CONTEXT_ROOT, LAST_RUN_FILE);

    try {
        if (fs.existsSync(lastRunPath)) {
            const timestamp = fs.readFileSync(lastRunPath, 'utf8').trim();
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    } catch (error) {
        // Ignore errors
    }

    return null;
}

/**
 * Save the current run timestamp
 */
export function saveRunTime() {
    const lastRunPath = path.join(process.cwd(), CONTEXT_ROOT, LAST_RUN_FILE);

    try {
        // Ensure directory exists
        const dir = path.dirname(lastRunPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(lastRunPath, new Date().toISOString());
    } catch (error) {
        // Ignore errors - non-critical
    }
}

/**
 * Check if a file was modified after a given date
 * @param {string} filePath - Path to the file
 * @param {Date} sinceDate - The cutoff date
 * @returns {boolean} - True if file was modified after sinceDate
 */
export function isFileModifiedSince(filePath, sinceDate) {
    try {
        const stats = fs.statSync(filePath);
        return stats.mtime > sinceDate;
    } catch (error) {
        return false;
    }
}

/**
 * Check if git is available in the current directory
 * @returns {boolean} - True if git is available
 */
export function isGitAvailable() {
    try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get files changed compared to a git ref (branch, commit, tag)
 * @param {string} gitRef - Git reference (e.g., "main", "HEAD~5", "v1.0.0")
 * @returns {Set<string>} - Set of changed file paths (absolute)
 */
export function getGitChangedFiles(gitRef) {
    const changedFiles = new Set();

    if (!isGitAvailable()) {
        console.warn('Warning: Not a git repository. --git-diff ignored.');
        return changedFiles;
    }

    try {
        // Get the merge base to handle diverged branches
        let baseRef = gitRef;
        try {
            // Try to get merge-base for branches
            const mergeBase = execSync(`git merge-base HEAD ${gitRef}`, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore']
            }).trim();
            if (mergeBase) {
                baseRef = mergeBase;
            }
        } catch {
            // If merge-base fails, use the ref directly (might be a commit SHA)
        }

        // Get changed files (modified, added, renamed)
        const output = execSync(`git diff --name-only ${baseRef}`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        });

        const cwd = process.cwd();
        output.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .forEach(relativePath => {
                const absolutePath = path.resolve(cwd, relativePath);
                // Only include files that still exist
                if (fs.existsSync(absolutePath)) {
                    changedFiles.add(absolutePath);
                }
            });

        // Also include untracked files (new files not yet committed)
        const untrackedOutput = execSync('git ls-files --others --exclude-standard', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        });

        untrackedOutput.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .forEach(relativePath => {
                const absolutePath = path.resolve(cwd, relativePath);
                if (fs.existsSync(absolutePath)) {
                    changedFiles.add(absolutePath);
                }
            });

    } catch (error) {
        console.warn(`Warning: Could not get git diff for "${gitRef}": ${error.message}`);
    }

    return changedFiles;
}

/**
 * Get files changed since a specific date using git log
 * @param {Date} sinceDate - The cutoff date
 * @returns {Set<string>} - Set of changed file paths (absolute)
 */
export function getGitFilesSince(sinceDate) {
    const changedFiles = new Set();

    if (!isGitAvailable()) {
        return changedFiles;
    }

    try {
        const isoDate = sinceDate.toISOString();
        const output = execSync(`git log --since="${isoDate}" --name-only --pretty=format:`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        });

        const cwd = process.cwd();
        output.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .forEach(relativePath => {
                const absolutePath = path.resolve(cwd, relativePath);
                if (fs.existsSync(absolutePath)) {
                    changedFiles.add(absolutePath);
                }
            });

    } catch (error) {
        // Fall back to file system mtime if git fails
    }

    return changedFiles;
}

/**
 * Filter files based on change criteria
 * @param {string[]} files - Array of file paths to filter
 * @param {Object} options - Filter options
 * @param {string} options.since - Time expression for --since
 * @param {string} options.gitDiff - Git ref for --git-diff
 * @param {boolean} options.changed - Use last run time for --changed
 * @returns {Object} - { filteredFiles: string[], filterInfo: Object }
 */
export function filterChangedFiles(files, options = {}) {
    const { since, gitDiff, changed } = options;

    // If no filter options, return all files
    if (!since && !gitDiff && !changed) {
        return {
            filteredFiles: files,
            filterInfo: null
        };
    }

    let sinceDate = null;
    let gitChangedSet = null;
    let filterDescription = '';

    // Handle --changed (since last run)
    if (changed) {
        sinceDate = getLastRunTime();
        if (!sinceDate) {
            // First run - include all files
            return {
                filteredFiles: files,
                filterInfo: {
                    type: 'changed',
                    description: 'first run - all files included',
                    totalFiles: files.length,
                    filteredCount: files.length
                }
            };
        }
        filterDescription = `since last run (${formatRelativeTime(sinceDate)})`;
    }

    // Handle --since time expression
    if (since) {
        sinceDate = parseTimeExpression(since);
        if (!sinceDate) {
            console.warn(`Warning: Could not parse time expression "${since}". Including all files.`);
            return {
                filteredFiles: files,
                filterInfo: null
            };
        }
        filterDescription = `since ${formatRelativeTime(sinceDate)}`;
    }

    // Handle --git-diff
    if (gitDiff) {
        gitChangedSet = getGitChangedFiles(gitDiff);
        filterDescription = `changed vs ${gitDiff}`;
    }

    // Apply filters
    let filteredFiles = files;

    if (sinceDate) {
        // Use git to find changed files if available, otherwise use mtime
        const gitFilesSince = getGitFilesSince(sinceDate);

        filteredFiles = filteredFiles.filter(file => {
            // Check git first
            if (gitFilesSince.size > 0 && gitFilesSince.has(file)) {
                return true;
            }
            // Fall back to file system mtime
            return isFileModifiedSince(file, sinceDate);
        });
    }

    if (gitChangedSet) {
        filteredFiles = filteredFiles.filter(file => gitChangedSet.has(file));
    }

    return {
        filteredFiles,
        filterInfo: {
            type: gitDiff ? 'git-diff' : (changed ? 'changed' : 'since'),
            description: filterDescription,
            sinceDate,
            gitRef: gitDiff,
            totalFiles: files.length,
            filteredCount: filteredFiles.length
        }
    };
}

export default {
    parseTimeExpression,
    formatRelativeTime,
    getLastRunTime,
    saveRunTime,
    isFileModifiedSince,
    isGitAvailable,
    getGitChangedFiles,
    getGitFilesSince,
    filterChangedFiles
};
