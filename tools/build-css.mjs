import fs from 'fs';
import path from 'path';

const srcDir = 'assets/css/src';
const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.css')).sort();

if (!files.length) {
  console.error('لا توجد أجزاء في ' + srcDir);
  process.exit(1);
}

const banner = `/* ============================================================
   صدقة جارية — ورقة الأنماط
   مولّدة من assets/css/src — لا تعدّل هذا الملف مباشرة
   الأقسام: ${files.length} ملفات مرتبة
   ============================================================ */
`;

const out = banner + files.map((f) => fs.readFileSync(path.join(srcDir, f), 'utf8').trim()).join('\n\n') + '\n';
fs.writeFileSync('assets/css/main.css', out, 'utf8');

// تحقق من توازن الأقواس
let depth = 0;
let min = 0;
for (const ch of out) {
  if (ch === '{') depth++;
  if (ch === '}') { depth--; if (depth < min) min = depth; }
}
if (depth !== 0 || min < 0) {
  console.error(`CSS غير متوازن: depth=${depth} min=${min}`);
  process.exit(1);
}

console.log('built assets/css/main.css from ' + files.length + ' parts');
console.log('size: ' + out.length + ' chars, braces balanced');
