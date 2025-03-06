const { getConfig, showConfig } = require('./configHandler');
const { clearContextFiles } = require('./cleanupUtils');
const { compressFile } = require('./compressionHandler');
const { handleTemplate } = require('./templateHandler');
const generateContext = require('./contextGenerator');
const checkGitIgnore = require('./gitignoreHandler');
const clipboardy = require('clipboardy');
const fs = require('fs');
const path = require('path');

function getExampleForFlag(flag) {
    const examples = {
        '-s': "cx ./src -s",
        '--snap': "cx ./src --snap",
        '-sm': "cx ./src -sm 'snapshot message'",
        '-t': "cx ./src -t",
        '--template': "cx ./src --template",
        '-tm': "cx ./src -tm 'template name'",
        '-m': "cx ./src -m 'my message'",
        'default': "cx ./src -m 'my message'"
    };

    return examples[flag] || examples.default;
}

async function handleDirectoryCommand(dir, args) {
    // Handle configuration commands first (no directory needed)
    if (args.includes('--show')) {
        showConfig();
        return;
    }

    if (args.includes('--configure')) {
        configure();
        return;
    }

    if (args.includes('--clear')) {
        clearContextFiles();
        return;
    }

    // For all other commands, validate directory
    if (!dir || dir.startsWith('-')) {
        const flag = args.find(arg => arg.startsWith('-'));
        const example = getExampleForFlag(flag);
        console.error("❌ Error: Please provide a directory path before any flags");
        console.log(`Example: ${example}`);
        process.exit(1);
    }

    const config = getConfig();
    
    // Check for instruction flag and clipboard flag
    const instructionIndex = args.findIndex(arg => 
        arg === '-i' || 
        arg === '--instruction'
    );
    const hasInstruction = instructionIndex !== -1;
    const instruction = hasInstruction ? args[instructionIndex + 1] : '';

    const hasClipboard = args.includes('--clip') || args.includes('-ic');

    // Check for message
    const messageIndex = args.findIndex(arg => 
        arg === '-m' || 
        arg === '-sm' || 
        arg === '-tm' ||
        arg.startsWith('--message')
    );
    const message = messageIndex !== -1 ? args[messageIndex + 1] : '';

    if (hasInstruction) {
        const options = {
            instruction: true,
            instructionText: instruction,
            message: message || 'instruction' // Default name if no message provided
        };

        await checkGitIgnore();
        const result = generateContext(dir, options);

        // Handle clipboard if requested
        if (hasClipboard) {
            try {
                // Read all instruction files and combine them
                const instructionDir = './context/instruction';
                if (fs.existsSync(instructionDir)) {
                    const files = fs.readdirSync(instructionDir)
                        .filter(file => file.endsWith('.txt'))
                        .sort((a, b) => {
                            // Sort by date in filename (YYYY-MM-DD)
                            const dateA = a.match(/\d{4}-\d{2}-\d{2}/)[0];
                            const dateB = b.match(/\d{4}-\d{2}-\d{2}/)[0];
                            return dateB.localeCompare(dateA);
                        });

                    const instructions = files.map(file => {
                        const content = fs.readFileSync(path.join(instructionDir, file), 'utf8');
                        const name = file.replace(/-\d{4}-\d{2}-\d{2}(-\d+)?\.txt$/, '');
                        return `## ${name}\n${content}\n`;
                    }).join('\n---\n\n');

                    await clipboardy.write(instructions);
                    console.log('📋 All instructions copied to clipboard!');
                }
            } catch (error) {
                console.error('❌ Failed to copy to clipboard:', error.message);
            }
        }

        return result;
    }

    // Check for template flags and combined -tm flag
    const hasTmFlag = args.includes('-tm');
    const hasTemplateFlag = args.includes('-t') || args.includes('--template') || hasTmFlag;

    // If it's a template command (including -tm) and we have a message, use the message as the template name
    if ((hasTemplateFlag || hasTmFlag) && message) {
        await handleTemplate(dir, message);
        return;
    }

    const hasSnapshot = args.some(arg => 
        arg === '-s' || 
        arg === '-sm' || 
        arg === '--snap'
    );

    const options = {
        minimize: config.minimize && !args.includes('--no-minimize'),
        snapshot: hasSnapshot,
        template: hasTemplateFlag,
        templateName: message,
        message: message
    };

    await checkGitIgnore();
    const result = generateContext(dir, options);

    if (args.includes('--min') && !options.minimize) {
        console.log('📦 Generating additional minimized version...');
        const minStats = compressFile(result.outputFile);
        console.log(`✅ Minimized version created: ${minStats.compressedFile}`);
        result.outputFile = minStats.compressedFile;
    }

    if (config.autoClipboard && !options.snapshot) {
        try {
            const content = fs.readFileSync(result.outputFile, 'utf8');
            await clipboardy.write(content);
            console.log('📋 Content copied to clipboard!');
        } catch (error) {
            console.error('❌ Failed to copy to clipboard:', error.message);
        }
    }

    return result;
}

module.exports = {
    handleDirectoryCommand
}; 