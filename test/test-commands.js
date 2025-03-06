#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const os = require('os');
const clipboardy = require('clipboardy');

// Test configuration
const TEST_DIR = './test/fixtures';
const CONTEXT_DIR = './context';
const TEMPLATES_DIR = path.join(os.homedir(), '.aictx/templates');
const CLI_COMMAND = 'node ./bin/aictx.js';

// Function to update TESTS.md with results
function updateTestsFile(results) {
    const packageJson = require('../package.json');
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

    const passedTests = results
        .filter(r => r.status === 'passed')
        .map(r => `- ✅ ${r.name}`)
        .join('\n');

    const failedTests = results
        .filter(r => r.status === 'failed')
        .map(r => `- ❌ ${r.name}\n  Error: ${r.error}`)
        .join('\n');

    // Calculate test statistics
    const passedCount = results.filter(r => r.status === 'passed').length;
    const totalTests = results.length;
    const coverage = Math.round((passedCount / totalTests) * 100);

    // Create test status badge section
    const testStatusSection = `## Test Status 🧪

[![Test Status](https://img.shields.io/badge/tests-${passedCount}%20passed-${passedCount === totalTests ? 'brightgreen' : 'yellow'}.svg)](TESTS.md)
[![Coverage](https://img.shields.io/badge/coverage-${coverage}%25-${coverage === 100 ? 'brightgreen' : 'yellow'}.svg)](TESTS.md)

Last tested: ${readableDateStr}`;

    // Update TESTS.md
    try {
        const testsTemplate = fs.readFileSync(path.join(__dirname, 'TESTS.template.md'), 'utf8');
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
                          `## Test Status 🧪\n\n` +
                          `[![Test Status](https://img.shields.io/badge/tests-${passedCount}%20passed-${passedCount === totalTests ? 'brightgreen' : 'yellow'}.svg)](TESTS.md)\n` +
                          `[![Coverage](https://img.shields.io/badge/coverage-${coverage}%25-${coverage === 100 ? 'brightgreen' : 'yellow'}.svg)](TESTS.md)\n\n` +
                          `Last tested: ${readableDateStr}\n\n` +
                          remainingContent;
        } else {
            // If section doesn't exist, add it after the first badge
            const firstBadgeEnd = readmeContent.indexOf('\n\n', readmeContent.indexOf('[!['));
            readmeContent = readmeContent.slice(0, firstBadgeEnd + 2) +
                          `## Test Status 🧪\n\n` +
                          `[![Test Status](https://img.shields.io/badge/tests-${passedCount}%20passed-${passedCount === totalTests ? 'brightgreen' : 'yellow'}.svg)](TESTS.md)\n` +
                          `[![Coverage](https://img.shields.io/badge/coverage-${coverage}%25-${coverage === 100 ? 'brightgreen' : 'yellow'}.svg)](TESTS.md)\n\n` +
                          `Last tested: ${readableDateStr}\n\n` +
                          readmeContent.slice(firstBadgeEnd + 2);
        }

        // Update the last updated timestamp at the bottom
        if (readmeContent.includes('*Last updated:')) {
            readmeContent = readmeContent.replace(
                /\*Last updated:.*\*/,
                `*Last updated: ${readableDateStr}*`
            );
        } else {
            readmeContent = readmeContent.trim() + `\n\n---\n*Last updated: ${readableDateStr}*\n`;
        }

        fs.writeFileSync(readmePath, readmeContent);
        console.log('✅ Updated README.md');
    } catch (error) {
        console.error('❌ Failed to update README.md:', error.message);
    }
}

function runCommand(command) {
    console.log(`\n📝 Running: ${CLI_COMMAND} ${command}`);
    try {
        return execSync(`${CLI_COMMAND} ${command}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
    } catch (error) {
        // Don't handle the error, let it bubble up
        console.error('Command output:', error.output.join('\n'));
        throw error;
    }
}

function createTestFiles() {
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, 'test.js'), 'console.log("test");');
}

function cleanDirectories() {
    if (fs.existsSync(CONTEXT_DIR)) {
        fs.rmSync(CONTEXT_DIR, { recursive: true, force: true });
    }
}

// Main test runner
async function runTests() {
    const results = [];
    console.log('\n🧪 Starting tests...');

    try {
        cleanDirectories();
        createTestFiles();

        // Test 1: Basic context generation
        try {
            runCommand(TEST_DIR);
            assert(fs.existsSync(path.join(CONTEXT_DIR, 'code')), 'Context directory should be created');
            results.push({
                name: 'Basic context generation',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Basic context generation',
                status: 'failed',
                error: error.message
            });
        }

        // Test 2: Message flag
        try {
            const output = runCommand(`${TEST_DIR} -m "test message"`);
            const files = fs.readdirSync(path.join(CONTEXT_DIR, 'code'));
            assert(files.some(f => f.startsWith('test-message')), 'File should start with message');
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

        // Test 3: Snapshot with message (combined flag)
        try {
            const output = runCommand(`${TEST_DIR} -sm "test snapshot"`);
            const files = fs.readdirSync(path.join(CONTEXT_DIR, 'snap'));
            assert(files.some(f => f.startsWith('snap-test-snapshot')), 'Snapshot file should have correct format');
            results.push({
                name: 'Snapshot with message (combined flag)',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Snapshot with message (combined flag)',
                status: 'failed',
                error: error.message
            });
        }

        // Test 4: Snapshot with message (separate flags)
        try {
            const output = runCommand(`${TEST_DIR} -s -m "test snapshot separate"`);
            const files = fs.readdirSync(path.join(CONTEXT_DIR, 'snap'));
            assert(files.some(f => f.startsWith('snap-test-snapshot-separate')), 'Snapshot file should have correct format');
            results.push({
                name: 'Snapshot with message (separate flags)',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Snapshot with message (separate flags)',
                status: 'failed',
                error: error.message
            });
        }

        // Test 5: Template with message (combined flag)
        try {
            const output = runCommand(`${TEST_DIR} -tm "test template"`);
            const files = fs.readdirSync(TEMPLATES_DIR);
            assert(files.some(f => f.startsWith('test-template')), 'Template file should have correct format');
            results.push({
                name: 'Template with message (combined flag)',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Template with message (combined flag)',
                status: 'failed',
                error: error.message
            });
        }

        // Test 6: Template with message (separate flags)
        try {
            const output = runCommand(`${TEST_DIR} -t -m "test template separate"`);
            const files = fs.readdirSync(TEMPLATES_DIR);
            assert(files.some(f => f.startsWith('test-template-separate')), 'Template file should have correct format');
            results.push({
                name: 'Template with message (separate flags)',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Template with message (separate flags)',
                status: 'failed',
                error: error.message
            });
        }

        // Test 7: Clear context only
        try {
            runCommand('--clear');
            assert(!fs.existsSync(path.join(CONTEXT_DIR, 'code')), 'Context directory should be cleared');
            assert(fs.existsSync(path.join(CONTEXT_DIR, 'snap')), 'Snap directory should remain');
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

        // Test 8: Clear with snapshots
        try {
            runCommand('--clear -s');
            assert(!fs.existsSync(path.join(CONTEXT_DIR, 'snap')), 'Snap directory should be cleared');
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

        // Test 9: Help system
        try {
            const output = runCommand('-h');
            assert(output.includes('Usage:'), 'Help should show usage');
            assert(output.includes('--more'), 'Help should mention interactive help');
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

        // Test 10: Category help
        try {
            const output = runCommand('-h snapshots');
            assert(output.includes('SNAPSHOTS Commands'), 'Category help should show specific category');
            results.push({
                name: 'Category help',
                status: 'passed'
            });
        } catch (error) {
            results.push({
                name: 'Category help',
                status: 'failed',
                error: error.message
            });
        }

        // Test 11: Version flag
        try {
            const packageJson = require('../package.json');
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

    } finally {
        // Display results
        console.log('\n📊 Test Summary');
        console.log('=============');
        console.log(`Total: ${results.length}`);
        console.log(`Passed: ${results.filter(r => r.status === 'passed').length} ✅`);
        console.log(`Failed: ${results.filter(r => r.status === 'failed').length} ❌`);

        if (results.some(r => r.status === 'failed')) {
            console.log('\nFailed Tests:');
            results
                .filter(r => r.status === 'failed')
                .forEach(result => {
                    console.log(`\n❌ ${result.name}`);
                    console.log(`   Error: ${result.error}`);
                });
        }

        // Update TESTS.md with results
        try {
            updateTestsFile(results);
            console.log('\n📝 Updated TESTS.md with latest results');
        } catch (error) {
            console.error('\n❌ Failed to update TESTS.md:', error.message);
        }

        // Cleanup
        cleanDirectories();
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, { recursive: true, force: true });
        }

        process.exit(results.some(r => r.status === 'failed') ? 1 : 0);
    }
}

// Run tests
runTests().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});