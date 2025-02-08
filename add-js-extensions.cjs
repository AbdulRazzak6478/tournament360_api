const fs = require('fs');
const path = require('path');

function addJsExtensions(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      addJsExtensions(filePath);
    } else if (filePath.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(
        /from\s+['"](.*?)(?<!\.js)['"]/g, // Matches import paths without .js extensions
        (match, p1) => {
          if (p1.startsWith('./') || p1.startsWith('../')) {
            return `from '${p1}.js'`;
          }
          return match;
        }
      );
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

// Start the process in the `dist` directory
const distDir = path.resolve(__dirname, 'dist');
addJsExtensions(distDir);
console.log('Extensions added successfully!');
