const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const srcDir = path.join(process.cwd(), 'src');
const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace // comments with /* */ to prevent code swallowing in flattened/minified files.
    // We avoid http:// and https:// by checking for : before //
    // Regex: find // that isn't preceded by :
    // We also want to capture the rest of the line.
    
    const newContent = content.replace(/(?<!:)\/\/(.*)/g, '/* $1 */');
    if (newContent !== content) {
        content = newContent;
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Converted comments in: ${file}`);
    }
});
