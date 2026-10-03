/** تقرير سريع: كم عدّادًا قابلًا للضغط في المخرجات المبنيّة */
import fs from 'fs';

const h = fs.readFileSync('index.html', 'utf8');
const buttons = [...h.matchAll(/data-k="([^"]+)"/g)].map((m) => m[1]);
const counts = [...h.matchAll(/data-count="([^"]+)"/g)].map((m) => m[1]);
const tapCount = (h.match(/class="tap tap-count"/g) || []).length;

console.log('data-k buttons : ' + buttons.length);
console.log('  keys         : ' + [...new Set(buttons)].join(', '));
console.log('tap-count btns : ' + tapCount);
console.log('data-count     : ' + counts.length + ' (' + [...new Set(counts)].length + ' unique)');
console.log('counter-mini   : ' + (h.match(/counter-mini/g) || []).length);

// مفاتيح JS المولّدة: كل دعاء وكل صيغة استغفار
const main = fs.readFileSync('assets/js/main.js', 'utf8');
const duas = fs.readFileSync('assets/js/duas.js', 'utf8');
console.log('DUAS count     : ' + (duas.split('export const DUAS')[1].split('];')[0].match(/text:/g) || []).length);
console.log('ISTIGFHARAT    : ' + (duas.split('export const ISTIGFHARAT')[1].split('];')[0].match(/title:/g) || []).length);
console.log('JS tapCounter  : ' + (main.match(/tapCounter\(/g) || []).length + ' usages');