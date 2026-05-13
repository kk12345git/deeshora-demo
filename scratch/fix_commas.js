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

    // Fix missing commas between procedures
    // Look for }) followed by whitespace and then a key:
    const newContent = content.replace(/\}\)([ \t\r\n]*(?:\/\/[^\n]*[ \t\r\n]*)*)([a-zA-Z0-9_]+):/g, (match, p1, p2) => {
        // If p1 already contains a comma, don't add one
        if (p1.includes(',')) return match;
        // Also check if match starts with }),
        if (match.startsWith('}),')) return match;
        
        console.log(`Fixing missing comma in: ${file} at ${p2}:`);
        return `}),${p1}${p2}:`;
    });

    if (newContent !== content) {
        content = newContent;
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
    }
});
