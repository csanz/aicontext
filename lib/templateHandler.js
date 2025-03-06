const fs = require('fs');
const path = require('path');
const { CONFIG_DIR } = require('./configHandler');
const generateContext = require('./contextGenerator');

const TEMPLATES_DIR = path.join(CONFIG_DIR, 'templates');

async function handleTemplateOperation(readline, operation) {
  const templates = fs.readdirSync(TEMPLATES_DIR)
    .filter(file => file.endsWith('.txt'))
    .map(file => file.replace(/\.txt$/, ''));

  if (templates.length === 0) {
    console.log('\n❌ No templates found.');
    return;
  }

  console.log('\nAvailable templates:\n');
  templates.forEach((template, index) => {
    console.log(`${index + 1}. ${template}`);
  });

  const choice = await new Promise(resolve => {
    readline.question(`\nSelect template to ${operation} (or press Enter to cancel): `, resolve);
  });

  if (choice && templates[choice - 1]) {
    const confirm = await new Promise(resolve => {
      readline.question(`\n⚠️  Are you sure you want to ${operation} "${templates[choice - 1]}"? (y/N): `, resolve);
    });

    return { confirmed: confirm.toLowerCase() === 'y', template: templates[choice - 1] };
  }

  return { confirmed: false };
}

async function handleTemplate(dir, templateName) {
  // If no template name provided, show menu
  if (!templateName) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\nTemplate Options:\n');
    console.log('1. Create new template');
    console.log('2. Remove existing template');
    console.log('3. Override existing template\n');

    const answer = await new Promise(resolve => {
      readline.question('Choose an option (1-3): ', resolve);
    });

    try {
      switch(answer) {
        case '1':
          if (!templateName) {
            throw new Error('Template name required');
          }
          await createTemplate(dir, templateName);
          break;

        case '2':
          const removeResult = await handleTemplateOperation(readline, 'remove');
          if (removeResult.confirmed) {
            fs.unlinkSync(path.join(TEMPLATES_DIR, `${removeResult.template}.txt`));
            console.log('✅ Template removed successfully!');
          }
          break;

        case '3':
          const overrideResult = await handleTemplateOperation(readline, 'override');
          if (overrideResult.confirmed) {
            await createTemplate(dir, overrideResult.template);
            console.log('✅ Template overridden successfully!');
          }
          break;

        default:
          console.log('Invalid option');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      readline.close();
    }
    return;
  }

  // Direct template creation with name
  await createTemplate(dir, templateName);
}

async function createTemplate(dir, templateName) {
    try {
        // Get current date for the filename
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Clean the template name and create base filename
        const cleanName = templateName
            .replace(/^["']|["']$/g, '') // Remove quotes
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Convert spaces and special chars to hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

        // Create base filename without sequence number
        const baseFilename = `${cleanName}-${date}`;
        
        // Check for existing files and add sequence number if needed
        let seq = 1;
        let filename;
        
        do {
            filename = seq === 1 
                ? `${baseFilename}.txt`
                : `${baseFilename}-${seq}.txt`;
            
            if (!fs.existsSync(path.join(TEMPLATES_DIR, filename))) {
                break;
            }
            seq++;
        } while (true);

        // Ensure templates directory exists
        fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

        const options = {
            minimize: false,
            snapshot: false,
            template: true,
            templateName: cleanName
        };

        const result = generateContext(dir, options);
        
        // Rename the generated file to our desired format
        const finalPath = path.join(TEMPLATES_DIR, filename);
        if (fs.existsSync(result.outputFile)) {
            fs.renameSync(result.outputFile, finalPath);
        }
        
        console.log(`✅ Template '${cleanName}${seq > 1 ? ` (${seq})` : ''}' created successfully in ~/.aictx/templates/`);
        return { ...result, outputFile: finalPath };
    } catch (error) {
        console.error('❌ Failed to create template:', error.message);
        throw error;
    }
}

module.exports = {
  handleTemplate,
  createTemplate,
  TEMPLATES_DIR
}; 