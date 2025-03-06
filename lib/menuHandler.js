const readline = require('readline');
const { configure, showConfig } = require('./configHandler');
const { showHelp } = require('./helpHandler');
const fs = require('fs');
const path = require('path');
const { CONFIG_DIR } = require('./configHandler');

const TEMPLATES_DIR = path.join(CONFIG_DIR, 'templates');

async function showMainMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\nWhat would you like to do?\n');
  console.log('1. Configure');
  console.log('2. Show Configuration');
  console.log('3. Show Help');
  console.log('4. View Templates\n');

  const answer = await new Promise(resolve => {
    rl.question('Choose an option (1-4): ', resolve);
  });

  switch(answer) {
    case '1':
      rl.close();
      configure();
      break;
    case '2':
      rl.close();
      showConfig();
      break;
    case '3':
      rl.close();
      showHelp();
      break;
    case '4':
      await showTemplates(rl);
      break;
    default:
      console.log('Invalid option');
      rl.close();
  }
}

async function showTemplates(rl) {
  const templates = fs.readdirSync(TEMPLATES_DIR)
    .filter(file => file.endsWith('.txt'))
    .map(file => file.replace(/\.txt$/, ''));

  if (templates.length === 0) {
    console.log('\nNo templates found.');
    rl.close();
    return;
  }

  console.log('\nAvailable templates:\n');
  templates.forEach((template, index) => {
    console.log(`${index + 1}. ${template}`);
  });

  const answer = await new Promise(resolve => {
    rl.question('\nChoose a template to load (or press Enter to cancel): ', resolve);
  });

  if (answer && templates[answer - 1]) {
    const templateName = templates[answer - 1];
    const sourcePath = path.join(TEMPLATES_DIR, `${templateName}.txt`);
    const destDir = './context/template';
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(sourcePath, path.join(destDir, `${templateName}.txt`));
    console.log(`✅ Template '${templateName}' loaded successfully!`);
  }

  rl.close();
}

module.exports = {
  showMainMenu,
  showTemplates
}; 