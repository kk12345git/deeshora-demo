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

    // Check for flattened content (very long lines)
    const lines = content.split(/\r?\n/);
    const hasLongLines = lines.some(line => line.length > 500);

    if (hasLongLines) {
        console.log(`Un-flattening: ${file}`);
        
        // Strategy: 
        // 1. Identify single-line comments // that are NOT followed by a newline soon.
        // 2. Since the file is flattened, any // will comment out EVERYTHING until the actual \n.
        // 3. We want to find these and add a \n after the comment text.
        // 4. BUT we don't know where the comment ends.
        
        // Actually, let's try a simpler approach:
        // Replace 'import' with '\nimport'
        // Replace 'export' with '\nexport'
        // Replace 'const' with '\nconst' (risky but mostly okay)
        // Replace 'function' with '\nfunction'
        // Replace 'return' with '\nreturn'
        // Replace ';' with ';\n'
        // Replace '{' with '{\n'
        // Replace '}' with '}\n'
        
        // To be safe, we'll only do this for the flattened files.
        
        content = content
            .replace(/import /g, '\nimport ')
            .replace(/export /g, '\nexport ')
            .replace(/;(?![^"']*["'])/g, ';\n') // semi-colon not in quotes
            .replace(/\{(?![^"']*["'])/g, '{\n')
            .replace(/\}(?![^"']*["'])/g, '\n}\n')
            .replace(/const /g, '\nconst ')
            .replace(/function /g, '\nfunction ')
            .replace(/return /g, '\nreturn ');
            
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
    }
});
