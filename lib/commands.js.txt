const path = require('path');
const { generateContext } = require('./core');
const { handleInstructions } = require('./instructions');

async function handleCommand(args) {
    try {
        // Parse flags and directory
        const flags = parseFlags(args);
        const dir = args.find(arg => !arg.startsWith('-')) || './';

        // Handle instructions separately
        if (flags.instruction) {
            return handleInstructions(dir, flags);
        }

        // Handle regular context generation
        return generateContext(dir, flags);

    } catch (error) {
        console.error('Command failed:', error.message);
        throw error;
    }
}

function parseFlags(args) {
    const flags = {
        message: '',
        snapshot: false,
        template: false,
        instruction: '',
        useClipboard: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];

        switch (arg) {
            case '-m':
                flags.message = nextArg;
                i++;
                break;
            case '-s':
                flags.snapshot = true;
                break;
            case '-t':
                flags.template = true;
                break;
            case '-i':
                flags.instruction = nextArg;
                i++;
                break;
            case '--clip':
                flags.useClipboard = true;
                break;
        }
    }

    return flags;
}

module.exports = {
    handleCommand
}; 