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

    // Pattern: /* comment content code_marker
    // We want to turn this into: /* comment content */ code_marker
    
    // We look for /* followed by text, and then a marker like const, function, export, import, or { } ;
    // We want to be careful not to match too much.
    
    const markers = ['const ', 'function ', 'export ', 'import ', 'return ', 'if ', 'for ', 'switch ', 'let ', 'var ', 'async '];
    
    let lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes('/*')) {
            // Find the start of the comment
            let startIdx = line.indexOf('/*');
            let rest = line.substring(startIdx + 2);
            
            // Look for any marker in the rest of the line
            let bestMarkerIdx = -1;
            let foundMarker = '';
            
            for (const marker of markers) {
                let mIdx = rest.indexOf(marker);
                if (mIdx !== -1 && (bestMarkerIdx === -1 || mIdx < bestMarkerIdx)) {
                    bestMarkerIdx = mIdx;
                    foundMarker = marker;
                }
            }
            
            // Also check for ; { } if they are followed by code-like things
            const charMarkers = [';', '{', '}'];
            for (const char of charMarkers) {
                let cIdx = rest.indexOf(char);
                if (cIdx !== -1 && (bestMarkerIdx === -1 || cIdx < bestMarkerIdx)) {
                    bestMarkerIdx = cIdx;
                    foundMarker = char;
                }
            }

            if (bestMarkerIdx !== -1) {
                console.log(`Fixing swallowed code in: ${file} at line ${i+1}`);
                // Insert */ before the marker
                lines[i] = line.substring(0, startIdx + 2 + bestMarkerIdx) + ' */ ' + line.substring(startIdx + 2 + bestMarkerIdx);
                changed = true;
                // Re-process the same line in case there are more comments
                i--; 
                line = lines[i+1]; // update line for next iteration
            }
        }
    }

    if (changed) {
        fs.writeFileSync(file, lines.join('\n'));
    }
});
