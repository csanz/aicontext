const fs = require('fs');
const path = require('path');

function clearContextFiles() {
    const contextDir = './context/code';
    
    try {
        // First check if directory exists
        if (!fs.existsSync(contextDir)) {
            console.log('ℹ️ No context files found to clear.');
            return;
        }

        // Get all files in the directory
        const files = fs.readdirSync(contextDir);
        
        // Remove each file
        for (const file of files) {
            const filePath = path.join(contextDir, file);
            fs.unlinkSync(filePath);
            console.log(`🗑️  Removed: ${file}`);
        }

        // Remove the directories - only if they exist and are empty
        try {
            fs.rmdirSync(contextDir);
            // Only try to remove parent if it exists and is empty
            if (fs.existsSync('./context') && fs.readdirSync('./context').length === 0) {
                fs.rmdirSync('./context');
            }
            console.log('✅ Successfully cleared all context files and directories.');
        } catch (error) {
            // If we can't remove directories, that's okay - files are cleaned
            console.log('✅ Successfully cleared all context files.');
        }

    } catch (error) {
        console.error('❌ Error while clearing files:', error.message);
        process.exit(1);
    }
}

module.exports = {
    clearContextFiles
}; 