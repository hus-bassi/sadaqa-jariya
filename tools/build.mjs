import fs from 'fs';
import path from 'path';
import { tokens } from '../assets/js/site.config.js';

const partsDir = 'parts';
const files = fs.readdirSync(partsDir).filter((f) => f.endsWith('.html')).sort();

if (!files.length) {
  console.error('لا توجد أجزاء في parts/');
  process.exit(1);
}

// استبدال رموز الإعدادات {{key}} بقيم assets/js/site.config.js
// هذا ما يجعل تغيير اسم المتوفى لا يحتاج لتعديل أي HTML
const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const used = new Set();

function render(html, source) {
  return html.replace(TOKEN_RE, (match, key) => {
    if (!(key in tokens)) {
      console.error(`رمز غير معروف {{${key}}} في ${source}`);
      process.exit(1);
    }
    used.add(key);
    return String(tokens[key]);
  });
}

let out = files
  .map((f) => render(fs.readFileSync(path.join(partsDir, f), 'utf8'), f).trim())
  .join('\n');

// تحقّق: لا يجوز أن يبقى أي رمز {{ }} في الناتج
const leftover = out.match(/\{\{[^}]*\}\}/g);
if (leftover) {
  console.error('رموز لم تُستبدل: ' + [...new Set(leftover)].join(', '));
  process.exit(1);
}

fs.writeFileSync('index.html', out + '\n', 'utf8');

console.log('built index.html from ' + files.length + ' parts');
console.log(files.map((f) => '  - ' + f).join('\n'));
console.log('size: ' + out.length + ' chars');
console.log('config tokens applied: ' + [...used.keys()].sort().join(', '));
