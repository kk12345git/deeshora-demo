const fs = require('fs');

function repairTemplateLiterals(content) {
    // This is a naive repair: find things like `${ \n code \n }` and join them.
    // Also ` \n }` and `{ \n `.
    
    // Fix ${ \n
    content = content.replace(/\$\{\s*\n\s*/g, '${');
    // Fix \n }
    // content = content.replace(/\s*\n\s*\}/g, '}'); // This is too aggressive, can match block endings
    
    // Specifically fix the pattern we saw: `${ \n char \n }`
    content = content.replace(/\$\{\n([a-zA-Z0-9.+-_]+)\n\}/g, '${$1}');
    
    return content;
}

const file = 'c:\\swen tech projects\\deeshora - demo\\src\\server\\routers\\product.ts';
let content = fs.readFileSync(file, 'utf8');
content = repairTemplateLiterals(content);
fs.writeFileSync(file, content);
console.log('Repaired product.ts');
