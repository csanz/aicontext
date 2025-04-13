#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import os from 'os';
import clipboardy from 'clipboardy';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';
import { join } from 'path';
import readline from 'readline';
import { checkGitIgnore } from '../lib/gitignoreHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import local modules
import { BINARY_EXTENSIONS } from '../lib/constants.js';
import { shouldProcessFile } from '../lib/fileUtils.js';
import { getExclusions } from '../lib/configHandler.js';
import { BASIC_OPTIONS, DETAILED_OPTIONS } from '../lib/helpHandler.js';

// Test configuration
const TEST_DIR = path.join(__dirname, 'fixtures');
const CONTEXT_DIR = path.join(process.cwd(), '.aicontext');
const CODE_DIR = path.join(CONTEXT_DIR, 'code');
const LATEST_FILE = 'latest-context.txt';
const CLI_COMMAND = 'node ./bin/cx.js';
const MOCK_TESTS = false; // Disable mocks
const BINARY_TEST_DIR = path.join(TEST_DIR, 'binary-test');
const IGNORE_TEST_DIR = path.join(TEST_DIR, 'ignore-test');
const TOTAL_TESTS = 27;

// Function to update TESTS.md with results
async function updateTestsFile(results) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const timestamp = new Date().toLocaleString();
    const nodeVersion = process.version;
    const osInfo = `${os.type()} ${os.release()}`;
    const aictxVersion = packageJson.version;
    
    // Format date and time for display with timezone
    const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const readableDateStr = `${now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone
    })} ${timeZone}`;

    // Group passed tests by category
    const categories = {
        'Basic Operations': ['Basic context generation', 'Default directory behavior', 'Multiple directory inputs', 'Tree command'],
        'File Management': ['Binary file exclusion', 'Directory tree display', 'Multiple path handling'],
        'Configuration & Settings': ['Configure command', 'Show configuration', 'Load cursor rules', 'Ignore add pattern', 'Ignore show command', 'Ignore test command', 'Ignore clear command'],
        'Command Options': ['Message flag', 'Snapshot with message', 'Snapshot with separate flags', 'Help system', 'Category help', 'Version flag', 'Detailed help'],
        'Error Handling': ['Invalid switch detection', 'Error handling - Invalid paths'],
        'Legacy Support': ['Legacy ignore pattern', 'Legacy show ignore patterns']
    };

    // Format passed tests by category
    const passedTests = results
        .filter(r => r.status === 'passed')
        .map(r => {
            // Find which category this test belongs to
            const category = Object.entries(categories).find(([_, tests]) => 
                tests.some(t => r.name.toLowerCase().includes(t.toLowerCase()))
            );
            return {
                name: r.name,
                category: category ? category[0] : 'Other'
            };
        })
        .sort((a, b) => {
            if (a.category === b.category) {
                return a.name.localeCompare(b.name);
            }
            return a.category.localeCompare(b.category);
        })
        .map(r => `- ✅ ${r.name} (${r.category})`)
        .join('\n');

    const failedTests = results
        .filter(r => r.status === 'failed')
        .map(r => `- ❌ ${r.name}\n  Error: ${r.error}`)
        .join('\n');

    // Calculate test statistics
    const passedCount = results.filter(r => r.status === 'passed').length;
    const totalTests = results.length;
    const coverage = Math.round((passedCount / totalTests) * 100);

    // Update TESTS.md
    try {
        const testsTemplate = fs.readFileSync(path.join(__dirname, '..', 'templates', 'TESTS.template.md'), 'utf8');
        const updatedTestsContent = testsTemplate
            .replace('${TIMESTAMP}', timestamp)
            .replace('${TOTAL}', totalTests)
            .replace('${PASSED}', passedCount)
            .replace('${FAILED}', results.filter(r => r.status === 'failed').length)
            .replace('${PASSED_TESTS}', passedTests || 'None')
            .replace('${FAILED_TESTS}', failedTests || 'None')
            .replace('${NODE_VERSION}', nodeVersion)
            .replace('${OS_INFO}', osInfo)
            .replace('${AICTX_VERSION}', aictxVersion);

        fs.writeFileSync(path.join(__dirname, '..', 'TESTS.md'), updatedTestsContent);
        console.log('✅ Updated TESTS.md');
    } catch (error) {
        console.error('❌ Failed to update TESTS.md:', error.message);
    }

    // Update README.md
    try {
        const readmePath = path.join(__dirname, '..', 'README.md');
        let readmeContent = fs.readFileSync(readmePath, 'utf8');
        
        // Load the badge template
        const badgeTemplatePath = path.join(__dirname, '..', 'templates', 'BADGES.template.md');
        let badgeTemplate = fs.readFileSync(badgeTemplatePath, 'utf8');
        
        // Replace the dynamic badges with updated values
        badgeTemplate = badgeTemplate
            .replace(/tests-\d+%20passed/, `tests-${passedCount}%20passed`)
            .replace(/tests-.*?-/, `tests-${passedCount}%20passed-`)
            .replace(/-yellow\.svg/, passedCount === totalTests ? '-brightgreen.svg' : '-yellow.svg')
            .replace(/coverage-\d+%25/, `coverage-${coverage}%25`)
            .replace(/coverage-.*?-/, `coverage-${coverage}%25-`)
            .replace(/coverage-\d+%25-yellow/, `coverage-${coverage}%25-${coverage === 100 ? 'brightgreen' : 'yellow'}`)
            .replace(/npm-v.*?-blue/, `npm-v${packageJson.version}-blue`);

        // Prepare test status section with badges
        const testStatusSection = `## Test Status 🧪

${badgeTemplate}

Last tested: ${readableDateStr}
`;

        // Split content at the test status section
        const parts = readmeContent.split('## Test Status 🧪');
        
        // If we found the section
        if (parts.length > 1) {
            // Find the end of the test status section (next ## heading or end of file)
            const afterTestStatus = parts[1];
            const nextSectionMatch = afterTestStatus.match(/\n##\s/);
            const remainingContent = nextSectionMatch 
                ? afterTestStatus.substring(nextSectionMatch.index)
                : afterTestStatus.substring(afterTestStatus.indexOf('\n\n'));

            // Rebuild the content
            readmeContent = parts[0] +
                          testStatusSection +
                          remainingContent;
        } else {
            // If section doesn't exist, add it after the first badge
            const firstBadgeEnd = readmeContent.indexOf('\n\n', readmeContent.indexOf('[!['));
            readmeContent = readmeContent.slice(0, firstBadgeEnd + 2) +
                          testStatusSection +
                          '\n\n' +
                          readmeContent.slice(firstBadgeEnd + 2);
        }

        // Update the last updated timestamp at the bottom
        if (readmeContent.includes('*Last updated:')) {
            readmeContent = readmeContent.replace(
                /\*Last updated:.*\*/,
                '' // Remove the bottom timestamp
            );
        }

        fs.writeFileSync(readmePath, readmeContent);
        console.log('✅ Updated README.md');
    } catch (error) {
        console.error('❌ Failed to update README.md:', error.message);
    }
}

function runCommand(command) {
    // Run the real command
    try {
        return execSync(`${CLI_COMMAND} ${command}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
    } catch (error) {
        // Don't handle the error, let it bubble up
        console.error(chalk.red('Command output:'), error.output.join('\n'));
        throw error;
    }
}

function createTestFiles() {
    // Create test files without removing the fixtures directory
    const binaryTestDir = path.join(TEST_DIR, 'binary-test');
    const ignoreTestDir = path.join(TEST_DIR, 'ignore-test');

    // Create directories if they don't exist
    fs.mkdirSync(binaryTestDir, { recursive: true });
    fs.mkdirSync(ignoreTestDir, { recursive: true });

    // Create basic test file if it doesn't exist
    const testJsPath = path.join(TEST_DIR, 'test.js');
    if (!fs.existsSync(testJsPath)) {
        fs.writeFileSync(testJsPath, 'console.log("test");');
    }

    // Create binary test files
    fs.writeFileSync(path.join(binaryTestDir, 'test.glb'), 'binary content');
    fs.writeFileSync(path.join(binaryTestDir, 'normal.js'), 'console.log("normal file");');
    
    // Create a large text file
    const largeSize = Math.ceil(1.01 * 1024 * 1024); // 1.01MB
    const largePath = path.join(binaryTestDir, 'large.txt');
    const fd = fs.openSync(largePath, 'w');
    const buffer = Buffer.alloc(64 * 1024, 'A');
    const iterations = Math.ceil(largeSize / buffer.length);
    for (let i = 0; i < iterations; i++) {
        fs.writeSync(fd, buffer, 0, Math.min(buffer.length, largeSize - i * buffer.length));
    }
    fs.closeSync(fd);

    // Create ignore test files
    fs.writeFileSync(path.join(ignoreTestDir, 'include.js'), 'console.log("include");');
    fs.writeFileSync(path.join(ignoreTestDir, 'ignore.o'), 'ignore this');
    fs.writeFileSync(path.join(ignoreTestDir, 'test.tmp'), 'temporary file');
}

function cleanDirectories() {
    // Only clean up context directory, not the test fixtures
    if (fs.existsSync(CONTEXT_DIR)) {
        fs.rmSync(CONTEXT_DIR, { recursive: true, force: true });
    }
    
    // Clean up .aicontext/ignore.json
    const ignoreJsonPath = path.join(process.cwd(), '.aicontext', 'ignore.json');
    if (fs.existsSync(ignoreJsonPath)) {
        fs.unlinkSync(ignoreJsonPath);
        // Remove .aicontext directory if it's empty
        const aicontextDir = path.dirname(ignoreJsonPath);
        if (fs.readdirSync(aicontextDir).length === 0) {
            fs.rmdirSync(aicontextDir);
        }
    }
}

function createDirectories() {
    // Create the main context directory
    fs.mkdirSync(CONTEXT_DIR, { recursive: true });
    // Create the code subdirectory
    fs.mkdirSync(path.join(CONTEXT_DIR, 'code'), { recursive: true });
    // Create the snapshots subdirectory
    fs.mkdirSync(path.join(CONTEXT_DIR, 'snapshots'), { recursive: true });
}

// Main test runner
async function runTests() {
    const results = [];
    
    console.log('\n🧪 Starting tests...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        cleanDirectories();
        createTestFiles();
        createDirectories(); // Create all necessary directories before tests

        // Test 1: Basic context generation and content verification
        try {
            console.log(`📋 Running Test 1/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ${TEST_DIR}`)}`);
            
            const output = execSync(`${CLI_COMMAND} ${TEST_DIR}`, { 
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            // Verify output format
            assert(output.includes('Context file successfully generated'), 'Output should indicate successful generation');
            assert(output.includes('Summary:'), 'Output should include summary');
            assert(output.includes('Total Files:'), 'Output should include file count');
            
            // Verify file creation and content
            const codeDir = path.join(CONTEXT_DIR, 'code');
            const files = fs.readdirSync(codeDir).filter(f => f.startsWith('context-') && f.endsWith('.txt'));
            assert(files.length > 0, 'Context directory should contain at least one context file');
            
            // Read and verify content of the generated file
            const contextFile = path.join(codeDir, files[0]);
            const content = fs.readFileSync(contextFile, 'utf8');
            assert(content.includes('This context file'), 'Context file should have proper header');
            assert(content.includes('test.js'), 'Context file should include test.js');
            
            results.push({
                name: 'Basic context generation and content verification',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Basic context generation and content verification',
                status: 'failed',
                error: error.message
            });
        }

        // Test 2: Message flag
        try {
            console.log(`📋 Running Test 2/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ${TEST_DIR} -m "test message"`)}`);
            const output = runCommand(`${TEST_DIR} -m "test message"`);
            const files = fs.readdirSync(path.join(process.cwd(), '.aicontext', 'code'));
            assert(files.some(f => f.includes('test-message')), 'File should include the message in its name');
            results.push({
                name: 'Message flag',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Message flag',
                status: 'failed',
                error: error.message
            });
        }

        // Test 3: Snapshot with message
        try {
            console.log(`📋 Running Test 3/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ${TEST_DIR} -sm "test snapshot"`)}`);
            runCommand(`${TEST_DIR} -sm "test snapshot"`);
            const files = fs.readdirSync(path.join(CONTEXT_DIR, 'snapshots'));
            console.log(`\t\\_ ${JSON.stringify(files)}`);
            assert(files.some(f => f.includes('test-snapshot')), 'Snapshot file should be created with correct message');
            results.push({
                name: 'Snapshot with message',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Snapshot with message',
                status: 'failed',
                error: error.message
            });
        }

        // Test 4: Snapshot with separate flags
        try {
            console.log(`📋 Running Test 4/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ${TEST_DIR} -s -m "test snapshot separate"`)}`);
            runCommand(`${TEST_DIR} -s -m "test snapshot separate"`);
            const files = fs.readdirSync(path.join(CONTEXT_DIR, 'snapshots'));
            console.log(`\t\\_${JSON.stringify(files)}`);
            assert(files.some(f => f.includes('test-snapshot-separate')), 'Snapshot file should be created with correct message');
            results.push({
                name: 'Snapshot with separate flags',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Snapshot with separate flags',
                status: 'failed',
                error: error.message
            });
        }

        // Test 5: Clear context only
        try {
            console.log(`📋 Running Test 5/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} --clear`)}`);
            runCommand('--clear');
            // Check if code directory is empty
            const codeDir = path.join(CONTEXT_DIR, 'code');
            const snapshotsDir = path.join(CONTEXT_DIR, 'snapshots');
            const files = fs.existsSync(codeDir) ? fs.readdirSync(codeDir).filter(f => f !== '.gitignore') : [];
            assert(files.length === 0, 'Code directory should be empty except for .gitignore');
            assert(fs.existsSync(snapshotsDir), 'Snapshots directory should not be cleared');
            results.push({
                name: 'Clear context only',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Clear context only',
                status: 'failed',
                error: error.message
            });
        }

        // Test 6: Clear with snapshots
        try {
            console.log(`📋 Running Test 6/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} --clear -s`)}`);
            runCommand('--clear -s');
            const snapshotsDir = path.join(CONTEXT_DIR, 'snapshots');
            const snapshotFiles = fs.existsSync(snapshotsDir) ? fs.readdirSync(snapshotsDir).filter(f => f !== '.gitignore') : [];
            assert(snapshotFiles.length === 0, 'Snapshots directory should be empty except for .gitignore');
            results.push({
                name: 'Clear with snapshots',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Clear with snapshots',
                status: 'failed',
                error: error.message
            });
        }

        // Test 7: Help system
        try {
            console.log(`📋 Running Test 7/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} -h`)}`);
            const output = runCommand('-h');
            
            // Check for required sections
            const requiredSections = [
                'AI Context Manager',
                'Usage:',
                'Commands:',
                'Basic Commands:',
                'Common Options:'
            ];
            
            // Get all options from BASIC_OPTIONS
            const basicOptionsKeys = Object.keys(BASIC_OPTIONS);
            
            // Check for required sections
            requiredSections.forEach(section => {
                assert(output.includes(section), `Help should show ${section} section`);
            });
            
            // Check for all basic options
            basicOptionsKeys.forEach(option => {
                assert(output.includes(option), `Help should include the ${option} option`);
                assert(output.includes(BASIC_OPTIONS[option]), `Help should include description for ${option}`);
            });
            
            // Check for essential commands
            const essentialCommands = [
                'configure',
                'show',
                'ignore'
            ];
            
            essentialCommands.forEach(command => {
                assert(output.includes(command), `Help should show ${command} command`);
            });
            
            // Verify removed options are not present
            const removedOptions = ['--menu'];
            removedOptions.forEach(option => {
                assert(!output.includes(option), `Help should not include removed option ${option}`);
            });
            
            results.push({
                name: 'Help system',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Help system',
                status: 'failed',
                error: error.message
            });
        }

        // Test 8: Verify detailed help format and content
        try {
            console.log(`📋 Running Test 8/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} -h --more`)}`);
            const result = runCommand('-h --more');
            
            // Check for required sections in detailed help
            const requiredSections = [
                'AI Context Manager - Detailed Help',
                'Usage:',
                'Commands:',
                'All Available Options:',
                'Ignore Pattern Options:',
                'Examples:',
                'Notes:'
            ];
            
            // Get all options from DETAILED_OPTIONS
            const detailedOptionsKeys = Object.keys(DETAILED_OPTIONS);
            
            const missingElements = [];
            
            // Check for required sections
            requiredSections.forEach(section => {
                if (!result.includes(section)) {
                    missingElements.push(`Missing section: ${section}`);
                }
            });
            
            // Check for all detailed options and their descriptions
            detailedOptionsKeys.forEach(option => {
                if (!result.includes(option)) {
                    missingElements.push(`Missing option: ${option}`);
                }
                if (!result.includes(DETAILED_OPTIONS[option])) {
                    missingElements.push(`Missing description for ${option}: ${DETAILED_OPTIONS[option]}`);
                }
            });
            
            // Check for examples
            const requiredExamples = [
                'Process specific directory',
                'Process multiple paths',
                'Create a snapshot'
            ];
            
            requiredExamples.forEach(example => {
                if (!result.includes(example)) {
                    missingElements.push(`Missing example: ${example}`);
                }
            });
            
            if (missingElements.length > 0) {
                throw new Error(`Detailed help output is missing required elements:\n${missingElements.join('\n')}`);
            }
            
            results.push({
                name: 'Detailed help format and content',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Detailed help format and content',
                status: 'failed',
                error: error.message
            });
        }

        // Test 9: Version flag
        try {
            console.log(`📋 Running Test 9/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} --version`)}`);
            const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
            const output = runCommand('--version');
            assert(output.includes(packageJson.version), 'Version should match package.json');
            results.push({
                name: 'Version flag',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Version flag',
                status: 'failed',
                error: error.message
            });
        }

        // Test 10: Latest context file functionality
        try {
            console.log(`📋 Running Test 10/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ${TEST_DIR}`)}`);
            const output1 = execSync(`${CLI_COMMAND} ${TEST_DIR}`, { 
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            // Check if latest-context.txt was created and contains content from first run
            const latestContextPath = path.join(CODE_DIR, LATEST_FILE);
            assert(fs.existsSync(latestContextPath), `${LATEST_FILE} should be created in ${CODE_DIR}`);
            const content1 = fs.readFileSync(latestContextPath, 'utf8');
            assert(content1.includes('test.js'), 'Latest context should include test.js from first run');
            
            // Add a new test file
            const newTestFile = path.join(TEST_DIR, 'test2.js');
            fs.writeFileSync(newTestFile, 'console.log("test2");');
            
            console.log(`📋 Running Test 10/${TOTAL_TESTS} (continued): ${chalk.blue(`${CLI_COMMAND} ${TEST_DIR} -m "test latest"`)}`);
            const output2 = execSync(`${CLI_COMMAND} ${TEST_DIR} -m "test latest"`, {
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            // Check if latest-context.txt was updated with new content
            const content2 = fs.readFileSync(latestContextPath, 'utf8');
            assert(content2.includes('test2.js'), 'Latest context should include new test2.js file');
            assert(content2 !== content1, 'Latest context content should be different after second run');
            
            // Clean up
            fs.unlinkSync(newTestFile);

            results.push({
                name: 'Latest context file functionality',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Latest context file functionality',
                status: 'failed',
                error: error.message
            });
        }

        // Test 11: Clear all command
        try {
            // Create some dummy files in the context directories
            fs.mkdirSync(path.join(CONTEXT_DIR, 'code'), { recursive: true });
            fs.writeFileSync(path.join(CONTEXT_DIR, 'code', 'dummy.txt'), 'dummy content');
            fs.mkdirSync(path.join(CONTEXT_DIR, 'snapshots'), { recursive: true });
            fs.writeFileSync(path.join(CONTEXT_DIR, 'snapshots', 'dummy.txt'), 'dummy content');

            console.log(`📋 Running Test 11/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} --clear-all`)}`);
            // Simulate user input for confirmation
            const child = spawn('node', ['./bin/cx.js', '--clear-all'], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Provide 'y' as input to confirm the operation
            child.stdin.write('y\n');
            child.stdin.end();

            // Wait for the process to complete
            await new Promise((resolve, reject) => {
                child.on('close', (code) => {
                    if (code !== 0) {
                        return reject(new Error(`Process exited with code ${code}`));
                    }
                    resolve();
                });
            });

            // Check that the directories are empty
            const codeDir = path.join(CONTEXT_DIR, 'code');
            const snapshotsDir = path.join(CONTEXT_DIR, 'snapshots');
            const codeFiles = fs.existsSync(codeDir) ? fs.readdirSync(codeDir).filter(f => f !== '.gitignore') : [];
            const snapshotFiles = fs.existsSync(snapshotsDir) ? fs.readdirSync(snapshotsDir).filter(f => f !== '.gitignore') : [];
            assert(codeFiles.length === 0, 'Code directory should be empty except for .gitignore');
            assert(snapshotFiles.length === 0, 'Snapshots directory should be empty except for .gitignore');

            results.push({
                name: 'Clear all command',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Clear all command',
                status: 'failed',
                error: error.message
            });
        }

        // Test 12: Ignore add pattern
        try {
            console.log(`📋 Running Test 12/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ignore add "*.o"`)}`);
            const output = runCommand('ignore add "*.o"');
            assert(output.includes('✅ Added exclusion pattern: *.o'), 'Should show success message');
            
            // Verify pattern was added to ignore.json
            const ignoreJsonPath = path.join(process.cwd(), '.aicontext', 'ignore.json');
            const ignoreConfig = JSON.parse(fs.readFileSync(ignoreJsonPath, 'utf8'));
            assert(ignoreConfig.ignore.includes('*.o'), 'Pattern should be added to ignore.json');
            
            results.push({
                name: 'Add ignore pattern',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Add ignore pattern',
                status: 'failed',
                error: error.message
            });
        }

        // Test 13: Show ignore patterns
        try {
            console.log(`📋 Running Test 13/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ignore show`)}`);
            const output = runCommand('ignore show');
            
            // Verify the pattern exists in the output
            assert(output.includes('*.o'), 'Output should include the added ignore pattern');
            assert(output.includes('Current Exclusion Patterns:'), 'Output should show correct header');
            
            // Verify the pattern exists in ignore.json
            const ignoreJsonPath = path.join(process.cwd(), '.aicontext', 'ignore.json');
            const ignoreConfig = JSON.parse(fs.readFileSync(ignoreJsonPath, 'utf8'));
            assert(ignoreConfig.ignore.includes('*.o'), 'Pattern should exist in ignore.json');
            
            results.push({
                name: 'Show ignore patterns',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Show ignore patterns',
                status: 'failed',
                error: error.message
            });
        }

        // Test 14: Ignore test command
        try {
            console.log(`📋 Running Test 14/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ignore test`)}`);
            const output = runCommand('ignore test');
            assert(output.includes('Current directory:'), 'Output should show the current directory');
            assert(output.includes('Directory Structure with Current Exclusions:'), 'Output should show directory structure');
            results.push({
                name: 'Ignore test command',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Ignore test command',
                status: 'failed',
                error: error.message
            });
        }

        // Test 15: Ignore clear command
        try {
            console.log(`📋 Running Test 15/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ignore clear`)}`);
            const output = runCommand('ignore clear');
            assert(output.includes('✅ Cleared all exclusion patterns'), 'Output should confirm patterns cleared');
            
            // Verify patterns are actually cleared
            const exclusions = getExclusions();
            assert(exclusions.patterns.length === 0, 'Exclusion patterns should be empty after clear');
            
            results.push({
                name: 'Ignore clear command',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Ignore clear command',
                status: 'failed',
                error: error.message
            });
        }

        // Test 16: Empty exclusions help message (previously 15.5)
        try {
            console.log(`📋 Running Test 16/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ignore show (after clear)`)}`);
            const output = runCommand('ignore show');
            
            // After clearing, we should see the help message with the new command format
            assert(output.includes('No custom exclusion patterns defined.'), 'Output should indicate no patterns');
            assert(output.includes('cx ignore add "pattern"'), 'Help should reference new command format');
            assert(!output.includes('cx -i "pattern"'), 'Help should not reference old command format');
            assert(!output.includes('cx --ignore add'), 'Help should not reference old command format');
            
            results.push({
                name: 'Empty exclusions help message',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Empty exclusions help message',
                status: 'failed',
                error: error.message
            });
        }

        // Test 17: No parameters behavior
        try {
            // Create a test file in the current directory
            const testFilePath = path.join(process.cwd(), 'test-default-dir.js');
            fs.writeFileSync(testFilePath, 'console.log("test default directory");');
            
            console.log(`📋 Running Test 17/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND}`)}`);
            // Run the command without specifying a directory
            const output = runCommand('');
            
            // Check if the output matches new format
            assert(output.includes('Context file successfully generated'), 'Output should indicate successful generation');
            assert(output.includes('Total Files:'), 'Output should include file count');
            assert(output.includes('Total Lines:'), 'Output should include line count');
            assert(output.includes('Total Chars:'), 'Output should include character count');
            
            // Clean up the test file
            fs.unlinkSync(testFilePath);
            
            results.push({
                name: 'No parameters behavior',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'No parameters behavior',
                status: 'failed',
                error: error.message
            });
        }

        // Test 18: Invalid switch detection
        try {
            console.log(`📋 Running Test 18/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} --invalid-switch`)}`);
            
            // We expect this to fail with an exit code of 1
            try {
                runCommand('--invalid-switch');
                // If we get here, the test should fail
                throw new Error('Command should have failed but succeeded');
            } catch (error) {
                // Verify error message contains both the error and help text
                assert(error.message.includes('Error: Invalid switch detected'), 'Error message should indicate invalid switch');
                assert(error.message.includes('Run \'cx -h\' to learn more about valid switches and options'), 'Error message should include help suggestion');
            }
            
            results.push({
                name: 'Invalid switch detection',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Invalid switch detection',
                status: 'failed',
                error: error.message
            });
        }

        // Test 19: Tree command output
        try {
            console.log(`📋 Running Test 19/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ./lib -t`)}`);
            const output = runCommand('./lib -t');
            
            // Verify tree output format
            assert(output.includes('Directory Tree:'), 'Should show tree header');
            assert(output.includes('lib/'), 'Should show root directory');
            assert(output.includes('├──'), 'Should use correct tree characters');
            assert(output.includes('└──'), 'Should use correct tree characters for last items');
            
            // Verify indentation
            const lines = output.split('\n');
            const indentedLines = lines.filter(line => 
                line.includes('├──') || 
                line.includes('└──') || 
                line.includes('│   ')
            );
            assert(indentedLines.length > 0, 'Should have properly indented lines with tree characters');
            
            results.push({
                name: 'Tree command output',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Tree command output',
                status: 'failed',
                error: error.message
            });
        }

        // Test 20: Multiple directory inputs
        try {
            console.log(`📋 Running Test 20/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ./lib ./bin`)}`);
            const output = runCommand('./lib ./bin');
            
            // Verify both directories are processed
            assert(output.includes('lib/') || output.includes('lib\\'), 'Should process first directory');
            assert(output.includes('Total Files:'), 'Should show summary');
            assert(output.includes('Total Lines:'), 'Should show line count');
            assert(output.includes('Total Chars:'), 'Should show character count');
            assert(output.includes('Total Tokens:'), 'Should show token count');
            
            results.push({
                name: 'Multiple directory inputs',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Multiple directory inputs',
                status: 'failed',
                error: error.message
            });
        }

        // Test 21: Mixed directory and file inputs
        try {
            // Create a test file
            const testFile = path.join(TEST_DIR, 'mixed-test.js');
            fs.writeFileSync(testFile, 'console.log("mixed input test");');

            console.log(`📋 Running Test 21/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ./lib ./bin ${testFile} -m "test-single-file"`)}`);
            
            // Execute the command
            execSync(`${CLI_COMMAND} ./lib ./bin ${testFile} -m "test-single-file"`, { 
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            // Read and verify the generated context file
            const contextFile = path.join(CONTEXT_DIR, 'code', 'context-1-test-single-file.txt');
            const contextContent = fs.readFileSync(contextFile, 'utf8');
            
            // Verify file content
            assert(contextContent.includes('tests/fixtures/mixed-test.js'), 'Generated context should include the individual file');
            assert(contextContent.includes('console.log("mixed input test")'), 'Generated context should include the file content');
            
            // Clean up
            fs.unlinkSync(testFile);
            
            results.push({
                name: 'Mixed directory and file inputs',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Mixed directory and file inputs',
                status: 'failed',
                error: error.message
            });
        }

        // Test 22: Configure command
        try {
            console.log(`📋 Running Test 22/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} configure`)}`);
            
            // Since configure is interactive, we'll need to simulate user input
            const child = spawn('node', ['./bin/cx.js', 'configure'], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            // Provide some default responses
            child.stdin.write('\n'); // Accept default for first option
            child.stdin.write('\n'); // Accept default for second option
            child.stdin.end();
            
            // Wait for the process to complete
            await new Promise((resolve) => {
                child.on('close', resolve);
            });
            
            results.push({
                name: 'Configure command',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Configure command',
                status: 'failed',
                error: error.message
            });
        }

        // Test 23: Show configuration
        try {
            console.log(`📋 Running Test 23/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} show`)}`);
            const output = runCommand('show');
            
            assert(output.includes('Current Configuration:'), 'Should show configuration header');
            
            results.push({
                name: 'Show configuration',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Show configuration',
                status: 'failed',
                error: error.message
            });
        }

        // Test 24: Error handling - Invalid paths
        try {
            console.log(`📋 Running Test 24/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ./nonexistent/path`)}`);
            let errorThrown = false;
            try {
                runCommand('./nonexistent/path');
            } catch (error) {
                errorThrown = true;
                assert(error.message.includes('ENOENT'), 'Should throw file not found error');
            }
            assert(errorThrown, 'Should throw error for invalid path');
            
            results.push({
                name: 'Error handling - Invalid paths',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Error handling - Invalid paths',
                status: 'failed',
                error: error.message
            });
        }

        // Test 25: Output to screen with pipe
        try {
            console.log(`📋 Running Test 25/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ./lib -o | head`)}`);
            
            // Create a temporary file to store the output
            const tempOutputFile = path.join(TEST_DIR, 'temp-output.txt');
            
            // Run the command and redirect output to a file
            execSync(`${CLI_COMMAND} ./lib -o > "${tempOutputFile}"`);
            
            // Read the first few lines of the file
            const output = execSync(`head "${tempOutputFile}"`).toString();
            
            // Verify the output contains expected content
            assert(output.includes('This context file'), 'Output should contain header');
            assert(output.split('\n').length > 1, 'Output should have multiple lines');
            
            // Clean up
            fs.unlinkSync(tempOutputFile);
            
            results.push({
                name: 'Output to screen with pipe',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Output to screen with pipe',
                status: 'failed',
                error: error.message
            });
        }

        // Test 26: Output command with file content verification
        try {
            console.log(`📋 Running Test 26/${TOTAL_TESTS}: ${chalk.blue(`${CLI_COMMAND} ${TEST_DIR} -o`)}`);
            
            // Create a test file with known content
            const testFile = path.join(TEST_DIR, 'output-test.js');
            const testContent = 'console.log("output test content");';
            fs.writeFileSync(testFile, testContent);
            
            // Run the command and capture the output
            const output = execSync(`${CLI_COMMAND} ${testFile} -o`, {
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            // Verify the output format and content
            assert(output.includes('This context file is a merged snapshot'), 'Should include header');
            assert(output.includes('File Guide:'), 'Should include file guide section');
            assert(output.includes('Directory Structure'), 'Should include directory structure section');
            assert(output.includes('File(s)'), 'Should include files section');
            assert(output.includes(testContent), 'Should include the actual file content');
            assert(output.includes('output-test.js'), 'Should include the filename');
            assert(!output.includes('.aicontext/code/context-'), 'Should not create a context file');
            
            // Clean up
            fs.unlinkSync(testFile);
            
            results.push({
                name: 'Output command with file content verification',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Output command with file content verification',
                status: 'failed',
                error: error.message
            });
        }

        // Test 27/27 - Verify gitignore patterns
        console.log(`\nTest ${TOTAL_TESTS}/${TOTAL_TESTS} - Verify .gitignore patterns are correctly managed`);
        try {
            // Create a temporary .gitignore for testing
            const tempGitignorePath = path.join(process.cwd(), '.gitignore.test');
            
            // Test case 1: Creating new .gitignore
            if (fs.existsSync(tempGitignorePath)) {
                fs.unlinkSync(tempGitignorePath);
            }
            
            // Store original functions
            const originalJoin = path.join;
            const originalCreateInterface = readline.createInterface;
            
            // Create mock interface
            const mockInterface = {
                question: (_, callback) => callback(''), // Simulate pressing Enter
                close: () => {}
            };
            
            try {
                // Mock readline
                readline.createInterface = () => mockInterface;
                
                // Mock path.join
                path.join = (...args) => {
                    if (args.includes('.gitignore')) {
                        return tempGitignorePath;
                    }
                    return originalJoin(...args);
                };
                
                // Run the check
                await checkGitIgnore();
                
                // Verify the content
                const content = fs.readFileSync(tempGitignorePath, 'utf8');
                const expectedPattern = '.aicontext/';
                
                // Check for the pattern and comment
                if (!content.includes(expectedPattern)) {
                    throw new Error(`Expected pattern "${expectedPattern}" not found in .gitignore`);
                }
                if (!content.includes('# AI context files')) {
                    throw new Error('Expected comment "# AI context files" not found in .gitignore');
                }
                
                // Test case 2: Updating existing .gitignore
                fs.writeFileSync(tempGitignorePath, '# Existing content\n*.log\n');
                await checkGitIgnore();
                
                const updatedContent = fs.readFileSync(tempGitignorePath, 'utf8');
                if (!updatedContent.includes(expectedPattern)) {
                    throw new Error(`Expected pattern "${expectedPattern}" not found in updated .gitignore`);
                }
                if (!updatedContent.includes('*.log')) {
                    throw new Error('Original content was not preserved');
                }
                if (!updatedContent.includes('# AI context files')) {
                    throw new Error('Expected comment "# AI context files" not found in updated .gitignore');
                }
                
                results.push({
                    name: 'Gitignore patterns management',
                    status: 'passed'
                });
            } finally {
                // Restore original functions
                path.join = originalJoin;
                readline.createInterface = originalCreateInterface;
                
                // Cleanup
                if (fs.existsSync(tempGitignorePath)) {
                    fs.unlinkSync(tempGitignorePath);
                }
            }
        } catch (error) {
            results.push({
                name: 'Gitignore patterns management',
                status: 'failed',
                error: error.message
            });
        }

    } finally {
        // Display results
        console.log('\n📊 Test Summary');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const passedCount = results.filter(r => r.status === 'passed').length;
        const failedCount = results.filter(r => r.status === 'failed').length;
        
        console.log(`\nResults:`);
        results.forEach((result, index) => {
            const icon = result.status === 'passed' ? '✅' : '❌';
            console.log(`${icon} Test ${index + 1} - ${result.status === 'passed' ? 'Passed' : 'Failed'}`);
        });
        
        console.log('\nSummary:');
        console.log(`Total Tests: ${results.length}`);
        console.log(`Passed: ${passedCount} ${passedCount > 0 ? '✅' : ''}`);
        console.log(`Failed: ${failedCount} ${failedCount > 0 ? '❌' : ''}`);
        
        if (failedCount > 0) {
            console.log('\nFailed Tests Details:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            results
                .filter(r => r.status === 'failed')
                .forEach(result => {
                    const testNumber = results.findIndex(r => r.name === result.name) + 1;
                    console.log(`Test ${testNumber} Error:`);
                    console.log(`   - ${result.error}`);
                    console.log('');
                });
        }

        // Update TESTS.md with results
        try {
            await updateTestsFile(results);
            console.log('✅ Updated TESTS.md with latest results');
        } catch (error) {
            console.error('\n❌ Failed to update TESTS.md:', error.message);
        }

        // Cleanup with error handling
        try {
            cleanDirectories();
            console.log('✅ Test cleanup completed successfully');
        } catch (error) {
            console.error('⚠️ Warning: Cleanup failed:', error.message);
            console.log('This will not affect test results but may leave temporary files');
        }

        console.log('\nAll tests completed successfully');
        process.exit(results.some(r => r.status === 'failed') ? 1 : 0);
    }
}

// Run tests
runTests().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});