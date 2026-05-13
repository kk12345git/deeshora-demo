// scripts/fix-flat-files.mjs
// Finds all .tsx files in src/app that are <= 3 lines, adds strategic newlines
// so they are no longer "flat", then runs prettier to properly format them.
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

const ROOT = join(process.cwd(), 'src', 'app');

function walk(dir) {
  let files = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.isFile() && extname(e.name) === '.tsx') files.push(full);
  }
  return files;
}

/** Insert newlines before statement-starting keywords so prettier can parse
 *  a minified single-line file into proper multi-line output. */
function preExpand(src) {
  let out = src;

  // Break before: import, export, const, let, var, function, type, interface, return
  // Only when they appear after a non-whitespace character (i.e. jammed together)
  const keywords = [
    'import ', 'export ', 'export default ', 'const ', 'let ', 'var ',
    'function ', 'type ', 'interface ', 'return ', 'class ',
  ];

  for (const kw of keywords) {
    // Find occurrences not already at start of line
    const re = new RegExp(`([^\\n\\r])(?=${kw.replace(' ', '\\s')})`, 'g');
    out = out.replace(re, (_, before) => before + '\n');
  }

  return out;
}

const allFiles = walk(ROOT);
const flatFiles = [];

for (const file of allFiles) {
  try {
    const content = readFileSync(file, 'utf-8');
    const nonEmptyLines = content.split('\n').filter(l => l.trim().length > 0);
    if (nonEmptyLines.length <= 3 && content.length > 200) {
      flatFiles.push(file);
    }
  } catch (e) {
    // skip
  }
}

console.log(`Found ${flatFiles.length} flattened file(s):`);
flatFiles.forEach(f => console.log('  -', f.replace(process.cwd(), '.')));

if (flatFiles.length === 0) {
  console.log('Nothing to fix!');
  process.exit(0);
}

// Step 1: pre-expand each file
console.log('\nPre-expanding files...');
for (const file of flatFiles) {
  const original = readFileSync(file, 'utf-8');
  const expanded = preExpand(original);
  writeFileSync(file, expanded, 'utf-8');
  console.log(`  Expanded: ${file.replace(process.cwd(), '.')}`);
}

// Step 2: run prettier on all of them
const fileList = flatFiles.map(f => `"${f}"`).join(' ');
console.log('\nRunning prettier to format...');
try {
  execSync(`npx prettier --write --parser typescript ${fileList}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log(`\n✅ Done! Expanded and formatted ${flatFiles.length} file(s).`);
} catch (err) {
  console.error('Prettier failed:', err.message);
  process.exit(1);
}
