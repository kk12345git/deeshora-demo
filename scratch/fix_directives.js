const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const srcDir = path.join(process.cwd(), 'src');

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern 1: // path/to/file'use client';
    // Pattern 2: //'use client';
    // We want to ensure 'use client'; is on its own line at the top, or properly after the comment.
    
    const malformedPattern = /^\/\/.*'use client';/m;
    if (malformedPattern.test(content)) {
      console.log(`Fixing malformed directive in: ${filePath}`);
      // Remove the 'use client'; from the comment line and add it properly at the top
      content = content.replace(/^(\/\/.*)'use client';/m, '$1\n\'use client\';');
      fs.writeFileSync(filePath, content);
    }
  }
});
