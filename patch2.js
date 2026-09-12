const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

content = content.replace('import { useScroll', 'import { motion, useScroll');

fs.writeFileSync('frontend/src/app/page.tsx', content);
console.log('patched2');
