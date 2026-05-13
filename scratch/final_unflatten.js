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

    // 1. Fix directives at the very top
    if (content.startsWith('//')) {
        const firstLineEnd = content.indexOf('\n');
        const firstLine = firstLineEnd === -1 ? content : content.substring(0, firstLineEnd);
        
        if (firstLine.includes("'use client'") || firstLine.includes('"use client"') || firstLine.includes('import ') || firstLine.includes('export ')) {
            const codeStarts = firstLine.search(/['"]use client['"]|import |export /);
            if (codeStarts !== -1) {
                content = firstLine.substring(0, codeStarts) + '\n' + firstLine.substring(codeStarts) + (firstLineEnd === -1 ? '' : content.substring(firstLineEnd));
                changed = true;
            }
        }
    }

    // 2. Comprehensive un-flattening keywords
    const lines = content.split(/\r?\n/);
    if (lines.some(l => l.length > 500)) {
        console.log(`Deep safe un-flattening: ${file}`);
        
        const keywords = [
            'import {', 'import type', 'export const', 'export default', 'export function', 'export type',
            'const ', 'function ', 'return ', 
            'publicProcedure', 'protectedProcedure', 'adminProcedure',
            'smartSearch:', 'list:', 'create:', 'update:', 'delete:', 'byId:', 'bySlug:', 'categories:', 'seedCategories:', 'autoAnalyze:', 'addReview:', 'bulkUpload:', 'checkCartAvailability:', 'suggest:',
            'async ', 'await ', 'try {', '} catch ', 'throw new'
        ];

        let newContent = content;
        for (const kw of keywords) {
            newContent = newContent.replace(new RegExp(kw.replace('{', '\\{').replace('}', '\\}'), 'g'), '\n' + kw);
        }
        
        // Break before function calls BUT NOT if they are likely methods on the same line
        // newContent = newContent.replace(/([a-zA-Z0-9_]+\()/g, '\n$1'); // Removed as it was too aggressive
        
        // Special case for // - break BEFORE if it's not already at the start AND NOT a URL
        // We use a regex that avoids ://
        newContent = newContent.replace(/(?<!:)\/\//g, '\n//');
        
        if (newContent !== content) {
            content = newContent;
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, content);
    }
});
