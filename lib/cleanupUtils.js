const fs = require('fs');
const path = require('path');

function clearContextFiles({ includeSnapshots = false, all = false } = {}) {
    try {
        // Define directories to clean based on flags
        let dirsToClean = ['./context/code'];
        
        if (includeSnapshots || all) {
            dirsToClean.push('./context/snap');
            console.log('🗑️  Including snapshots in cleanup...');
        }
        
        // Check and clean each directory
        dirsToClean.forEach(dir => {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                
                // Remove each file
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    fs.unlinkSync(filePath);
                    console.log(`🗑️  Removed: ${file}`);
                });

                // Remove the empty directory
                fs.rmdirSync(dir);
                console.log(`📁 Removed directory: ${dir}`);
            }
        });

        // Remove parent context directory if it's empty and we're cleaning everything
        if (all) {
            if (fs.existsSync('./context') && fs.readdirSync('./context').length === 0) {
                fs.rmdirSync('./context');
                console.log('📁 Removed empty context directory');
            }
        }
        
        console.log('✅ Successfully cleared files.');
        if (!includeSnapshots && !all) {
            console.log('ℹ️  Snapshots preserved.');
        }

    } catch (error) {
        console.error('❌ Error while clearing files:', error.message);
        process.exit(1);
    }
}

module.exports = {
    clearContextFiles
}; 