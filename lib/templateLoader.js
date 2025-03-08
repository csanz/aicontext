/**
 * Template Loader Module
 * 
 * Handles loading and importing templates into user projects,
 * particularly for cursor rules.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Available template categories
 */
const TEMPLATE_CATEGORIES = {
    'cursor rules': ['general']
};

/**
 * Creates a readline interface for user interaction
 * 
 * @returns {readline.Interface} The readline interface
 */
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Displays a menu of available template categories
 * 
 * @param {readline.Interface} rl - The readline interface
 * @returns {Promise<string>} The selected category
 */
async function showCategoryMenu(rl) {
    console.log('\nAvailable template categories:');
    
    const categories = Object.keys(TEMPLATE_CATEGORIES);
    categories.forEach((category, index) => {
        console.log(`${index + 1}) ${category}`);
    });
    
    return new Promise((resolve) => {
        rl.question('\nSelect a category (number): ', (answer) => {
            const index = parseInt(answer) - 1;
            if (index >= 0 && index < categories.length) {
                resolve(categories[index]);
            } else {
                console.log('Invalid selection. Please try again.');
                resolve(showCategoryMenu(rl));
            }
        });
    });
}

/**
 * Displays a menu of available templates within a category
 * 
 * @param {readline.Interface} rl - The readline interface
 * @param {string} category - The selected category
 * @returns {Promise<string>} The selected template
 */
async function showTemplateMenu(rl, category) {
    console.log(`\nAvailable ${category}:`);
    
    const templates = TEMPLATE_CATEGORIES[category];
    templates.forEach((template, index) => {
        console.log(`${index + 1}) ${template}`);
    });
    
    return new Promise((resolve) => {
        rl.question('\nSelect the rules you wish to import into your .cursor/rules directory (number): ', (answer) => {
            const index = parseInt(answer) - 1;
            if (index >= 0 && index < templates.length) {
                resolve(templates[index]);
            } else {
                console.log('Invalid selection. Please try again.');
                resolve(showTemplateMenu(rl, category));
            }
        });
    });
}

/**
 * Imports the selected template into the user's project
 * 
 * @param {string} category - The template category
 * @param {string} template - The template name
 * @param {readline.Interface} rl - The readline interface for user interaction
 * @returns {Promise<void>}
 */
async function importTemplate(category, template, rl) {
    // Create .cursor/rules directory if it doesn't exist
    const cursorRulesDir = path.join('.cursor', 'rules');
    fs.mkdirSync(cursorRulesDir, { recursive: true });
    
    // Source template path
    const templatePath = path.join(__dirname, '..', 'templates', `${template}-rules.template.md`);
    
    // Destination path with .mdc extension (required for Cursor rules)
    const destPath = path.join(cursorRulesDir, `${template}.mdc`);
    
    try {
        // Verify source template exists
        if (!fs.existsSync(templatePath)) {
            console.error(`\n❌ Error: Template file not found at ${templatePath}`);
            return;
        }
        
        // Read the template file content
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        console.log(`\n📄 Template content loaded (${templateContent.length} bytes)`);
        
        // Check if the file already exists
        if (fs.existsSync(destPath)) {
            console.log(`\n⚠️ File already exists: ${destPath}`);
            
            const answer = await new Promise((resolve) => {
                rl.question(`\nFile ${template}.mdc already exists. What would you like to do?\n1) Override existing file\n2) Create a new file with numbered suffix\n3) Cancel import\n\nSelect an option (number): `, resolve);
            });
            
            let finalDestPath = destPath;
            
            if (answer === '1') {
                // Override - use the same path
                console.log(`\n🔄 Overriding existing file: ${destPath}`);
                
                // Explicitly delete the existing file first
                try {
                    fs.unlinkSync(destPath);
                    console.log(`\n🗑️ Deleted existing file: ${destPath}`);
                } catch (err) {
                    console.error(`\n⚠️ Warning: Could not delete existing file: ${err.message}`);
                }
                
                // Write to destination
                fs.writeFileSync(destPath, templateContent, { flag: 'w' });
                console.log(`\n✅ Successfully wrote ${templateContent.length} bytes to ${destPath}`);
            } else if (answer === '2') {
                // Create a new file with numbered suffix
                let counter = 1;
                let newPath;
                
                // Find an available filename with numbered suffix
                do {
                    counter++;
                    newPath = path.join(cursorRulesDir, `${template}-${counter}.mdc`);
                } while (fs.existsSync(newPath));
                
                finalDestPath = newPath;
                console.log(`\n📝 Creating new file: ${finalDestPath}`);
                
                // Write to destination
                fs.writeFileSync(finalDestPath, templateContent, { flag: 'w' });
                console.log(`\n✅ Successfully wrote ${templateContent.length} bytes to ${finalDestPath}`);
            } else {
                // Cancel import
                console.log('\n❌ Import cancelled.');
                return;
            }
            
            // Verify the file was written
            if (fs.existsSync(finalDestPath)) {
                const writtenContent = fs.readFileSync(finalDestPath, 'utf8');
                if (writtenContent.length === templateContent.length) {
                    console.log(`\n✅ Successfully imported ${template} rules to ${finalDestPath}`);
                } else {
                    console.error(`\n⚠️ Warning: File was written but content length doesn't match (${writtenContent.length} vs ${templateContent.length})`);
                }
            } else {
                console.error(`\n❌ Error: File was not created at ${finalDestPath}`);
            }
        } else {
            // File doesn't exist, proceed with normal import
            console.log(`\n📝 Creating new file: ${destPath}`);
            
            // Write to destination
            fs.writeFileSync(destPath, templateContent, { flag: 'w' });
            
            // Verify the file was written
            if (fs.existsSync(destPath)) {
                const writtenContent = fs.readFileSync(destPath, 'utf8');
                if (writtenContent.length === templateContent.length) {
                    console.log(`\n✅ Successfully imported ${template} rules to ${destPath}`);
                } else {
                    console.error(`\n⚠️ Warning: File was written but content length doesn't match (${writtenContent.length} vs ${templateContent.length})`);
                }
            } else {
                console.error(`\n❌ Error: File was not created at ${destPath}`);
            }
        }
    } catch (error) {
        console.error(`\n❌ Error importing template: ${error.message}`);
        console.error(error.stack);
    }
}

/**
 * Main function to handle the --load command
 */
async function handleLoadCommand() {
    const rl = createReadlineInterface();
    
    try {
        // Show category menu
        const category = await showCategoryMenu(rl);
        
        // Show template menu
        const template = await showTemplateMenu(rl, category);
        
        // Import the selected template
        await importTemplate(category, template, rl);
    } finally {
        rl.close();
    }
}

module.exports = {
    handleLoadCommand
}; 