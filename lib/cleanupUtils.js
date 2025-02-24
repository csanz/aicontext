const fs = require('fs');
const path = require('path');

function clearContextFiles() {
    const dirsToClean = [
        './context/code',
        './context/template'  // Added templates directory
    ];
    
    try {
        // Check and clean each directory
        dirsToClean.forEach(dir => {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                
                // Remove each file
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    fs.unlinkSync(filePath);
                    console.log(`🗑️  Removed: ${dir}/${file}`);
                });

                // Remove the empty directory
                fs.rmdirSync(dir);
                console.log(`📁 Removed directory: ${dir}`);
            }
        });

        // Only remove parent context directory if it's empty (preserves snap directory)
        if (fs.existsSync('./context') && fs.readdirSync('./context').length === 0) {
            fs.rmdirSync('./context');
            console.log('📁 Removed empty context directory');
        }
        
        console.log('✅ Successfully cleared context files (snapshots preserved).');

    } catch (error) {
        console.error('❌ Error while clearing files:', error.message);
        process.exit(1);
    }
}

module.exports = {
    clearContextFiles
}; 