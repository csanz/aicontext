const path = require('path');

/**
 * Performs a basic security check on file paths
 * 
 * @param {string[]} filePaths - Array of file paths to check
 * @returns {Object} - Security check results
 */
function checkSecurity(filePaths) {
    const issues = [];
    
    // List of potentially suspicious file extensions
    const suspiciousExtensions = [
        '.exe', '.dll', '.sh', '.bat', '.ps1', '.py', '.php', '.jar', '.apk'
    ];
    
    // List of potentially suspicious file names
    const suspiciousFileNames = [
        'password', 'token', 'secret', 'credential', 'key', '.env', 'config'
    ];
    
    // Check each file
    for (const filePath of filePaths) {
        const fileName = path.basename(filePath).toLowerCase();
        const extension = path.extname(filePath).toLowerCase();
        
        // Check for suspicious extensions
        if (suspiciousExtensions.includes(extension)) {
            issues.push(`Potentially executable file: ${filePath}`);
        }
        
        // Check for suspicious file names
        for (const suspiciousName of suspiciousFileNames) {
            if (fileName.includes(suspiciousName)) {
                issues.push(`Potentially sensitive file: ${filePath}`);
                break;
            }
        }
    }
    
    return {
        issues,
        isSecure: issues.length === 0
    };
}

module.exports = {
    checkSecurity
}; 