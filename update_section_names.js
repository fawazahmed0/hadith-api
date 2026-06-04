// update_section_names.js
const fs = require('fs');
const path = require('path');

function updateJsonFile(filePath, sections) {
  const fileName = path.basename(filePath);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;
  if (data.metadata && data.metadata.section) {
    for (const key of Object.keys(data.metadata.section)) {
      if (sections[key] && data.metadata.section[key] !== sections[key]) {
        data.metadata.section[key] = sections[key];
        changed = true;
      }
    }
  }
  if (data.metadata && data.metadata.sections) {
    if (JSON.stringify(data.metadata.sections) !== JSON.stringify(sections)) {
      data.metadata.sections = sections;
      changed = true;
    }
  }
  if (changed) {
    const isMin = fileName.includes('min');
    fs.writeFileSync(filePath, isMin ? JSON.stringify(data) : JSON.stringify(data, null, 2));
    console.log(`Updated: ${filePath}`);
  }
}

function updateSectionNames(bookPrefix) {
  const mainPath = path.join(__dirname, 'editions', `${bookPrefix}.json`);
  const folderPath = path.join(__dirname, 'editions', bookPrefix);
  // 1. Read source of truth
  const mainData = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
  const sections = mainData.metadata.sections;

  // Update minified JSON in the editions folder if it exists
  const minPath = path.join(__dirname, 'editions', `${bookPrefix}.min.json`);
  if (fs.existsSync(minPath)) {
    updateJsonFile(minPath, sections);
  }

  // Update each file in the folder
  fs.readdirSync(folderPath).forEach(file => {
    if (!file.endsWith('.json')) return;
    const filePath = path.join(folderPath, file);
    updateJsonFile(filePath, sections);
  });

  // Update each file in the sections subfolder (if exists)
  const sectionsFolderPath = path.join(folderPath, 'sections');
  if (fs.existsSync(sectionsFolderPath)) {
    fs.readdirSync(sectionsFolderPath).forEach(file => {
      if (!file.endsWith('.json')) return;
      const filePath = path.join(sectionsFolderPath, file);
      updateJsonFile(filePath, sections);
    });
  }
}

// Usage: node update_section_names.js tur-malik
const bookPrefix = process.argv[2];
if (!bookPrefix) {
  console.error('Usage: node update_section_names.js <book-prefix>');
  process.exit(1);
}
updateSectionNames(bookPrefix);