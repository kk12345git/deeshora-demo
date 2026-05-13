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

    // Detect if the file is likely "flattened" or has comment-swallowing issues
    const lines = content.split(/\r?\n/);
    const isFlattened = lines.some(l => l.length > 500);

    if (isFlattened) {
        console.log(`Deep un-flattening: ${file}`);
        
        // 1. First, make sure every // starts on a new line
        content = content.replace(/\/\//g, '\n//');
        
        // 2. Now, for every line that starts with //, if it contains code markers like ; { } , 
        // we need to break it.
        // Actually, let's just break ALL lines at code markers.
        content = content
            .replace(/;/g, ';\n')
            .replace(/\{/g, '{\n')
            .replace(/\}/g, '\n}\n')
            .replace(/import /g, '\nimport ')
            .replace(/export /g, '\nexport ')
            .replace(/const /g, '\nconst ')
            .replace(/function /g, '\nfunction ')
            .replace(/return /g, '\nreturn ');

        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
    }
});
