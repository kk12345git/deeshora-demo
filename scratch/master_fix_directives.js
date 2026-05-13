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

    // Split into lines
    const lines = content.split(/\r?\n/);
    if (lines.length === 0) return;

    const firstLine = lines[0];
    
    // Check if first line is a comment that contains 'use client'
    if (firstLine.startsWith('//') && (firstLine.includes("'use client'") || firstLine.includes('"use client"'))) {
        console.log(`Fixing malformed comment directive in: ${file}`);
        
        // Determine quote style
        const quote = firstLine.includes('"') ? '"' : "'";
        const directive = `${quote}use client${quote};`;
        
        // Clean the comment line
        let cleanComment = firstLine.replace(/'use client';?/g, '').replace(/"use client";?/g, '').trim();
        
        // Reconstruct content
        lines[0] = directive;
        if (cleanComment !== '//') {
            lines.splice(1, 0, cleanComment);
        }
        content = lines.join('\n');
        changed = true;
    } 
    // Check if 'use client' is at the start of a line but followed immediately by code
    else {
        const directiveRegex = /^(['"]use client['"];?)([^\s\r\n])/m;
        if (directiveRegex.test(content)) {
            console.log(`Fixing mid-line directive in: ${file}`);
            content = content.replace(directiveRegex, '$1\n$2');
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, content);
    }
});
