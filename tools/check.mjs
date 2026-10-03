import fs from 'fs';
import path from 'path';

const html = fs.readFileSync('index.html', 'utf8');
const body = html.slice(html.indexOf('<body'));

const VOID = new Set([
  'input', 'img', 'br', 'hr', 'meta', 'link', 'source',
  'path', 'circle', 'line', 'rect', 'use', 'stop', 'area', 'base', 'col', 'embed', 'track', 'wbr',
]);
// ابدأ التتبع من وسم <body> نفسه حتى لا نحصل على pop على stack فارغ
const bodyStart = body.indexOf('<body');
const scanFrom = body.indexOf('>', bodyStart) + 1;
const stack = [];
const errors = [];

const tagRe = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
tagRe.lastIndex = scanFrom;
let m;
while ((m = tagRe.exec(body)) !== null) {
  const [, closing, name, attrs, selfClose] = m;
  const tag = name.toLowerCase();

  if (tag === 'script' || tag === 'style') { continue; }

  if (closing) {
    // </body> و </html> ينيان الجذر — لا داعي لمقارنتهما
    if (tag === 'body' || tag === 'html') continue;
    const top = stack.pop();
    if (top !== tag) {
      const ctx = body.slice(Math.max(0, m.index - 160), m.index + 40).replace(/\s+/g, ' ');
      errors.push(`MISMATCH: </${tag}> but open was <${top}>\n      ctx: ...${ctx}...`);
    }
  } else if (!selfClose && !VOID.has(tag)) {
    stack.push(tag);
  }
}
if (stack.length) errors.push('UNCLOSED: ' + stack.join(' > '));

// duplicate ids
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]);
const dup = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
if (dup.length) errors.push('DUPLICATE IDS: ' + dup.join(', '));

// ids referenced by JS but missing in HTML
const jsFiles = fs.readdirSync('assets/js').filter((f) => f.endsWith('.js'));
const used = new Set();
for (const f of jsFiles) {
  const src = fs.readFileSync(path.join('assets/js', f), 'utf8');
  for (const mm of src.matchAll(/\$\('#([A-Za-z0-9_-]+)'\)/g)) used.add(mm[1]);
}
const missing = [...used].filter((id) => !ids.includes(id));
// rRetry / rContinue تُنشأ ديناميكيًا داخل ملفات JS
const DYNAMIC_OK = new Set(['rRetry', 'rContinue']);
const realMissing = missing.filter((id) => !DYNAMIC_OK.has(id));
if (realMissing.length) errors.push('JS REFS MISSING IN HTML: ' + realMissing.join(', '));
console.log('dynamic ids (created by JS): ' + missing.filter((i) => DYNAMIC_OK.has(i)).join(', '));

// data-icon names used in HTML
const iconNames = new Set();
for (const mm of html.matchAll(/data-icon="([a-zA-Z]+)"/g)) iconNames.add(mm[1]);
const iconsSrc = fs.readFileSync('assets/js/icons.js', 'utf8');
const iconDefs = new Set([...iconsSrc.matchAll(/^\s{2}([a-zA-Z]+):/gm)].map((x) => x[1]));
const badIcons = [...iconNames].filter((n) => !iconDefs.has(n));
if (badIcons.length) errors.push('UNKNOWN ICON NAMES: ' + badIcons.join(', '));

// icon names used in JS data
const duasSrc = fs.readFileSync('assets/js/duas.js', 'utf8');
for (const mm of duasSrc.matchAll(/icon:\s*'([a-zA-Z]+)'/g)) iconNames.add(mm[1]);
const badIcons2 = [...iconNames].filter((n) => !iconDefs.has(n));
if (badIcons2.length) errors.push('UNKNOWN ICON NAMES (js data): ' + badIcons2.join(', '));

console.log('ids in html: ' + ids.length);
console.log('icon defs: ' + [...iconDefs].join(', '));
console.log('icon used: ' + [...iconNames].join(', '));

// ---- CSS: توازن الأقواس (يمنع تلف الملف) ----
const css = fs.readFileSync('assets/css/main.css', 'utf8');
let depth = 0;
let minDepth = 0;
let curLine = 1;
for (const ch of css) {
  if (ch === '\n') curLine++;
  if (ch === '{') depth++;
  if (ch === '}') {
    depth--;
    if (depth < minDepth) {
      minDepth = depth;
      errors.push(`CSS: إغلاق زائد للقوس في السطر ${curLine}`);
    }
  }
}
if (depth !== 0) errors.push(`CSS: أقواس غير متوازنة (المتبقي ${depth})`);

// ---- CSS: تغطية كل الأصناف المستخدمة ----
const cssClasses = new Set();
for (const mm of css.matchAll(/\.([a-zA-Z][\w-]*)/g)) cssClasses.add(mm[1]);

const usedClasses = new Set();
for (const mm of html.matchAll(/class="([^"]+)"/g)) {
  mm[1].split(/\s+/).filter(Boolean).forEach((c) => usedClasses.add(c));
}
for (const f of jsFiles) {
  const src = fs.readFileSync(path.join('assets/js', f), 'utf8');
  for (const mm of src.matchAll(/class="([a-zA-Z0-9 _-]+)"/g)) {
    mm[1].split(/\s+/).filter(Boolean).forEach((c) => usedClasses.add(c));
  }
  for (const mm of src.matchAll(/className\s*=\s*'([^']+)'/g)) {
    mm[1].split(/\s+/).filter(Boolean).forEach((c) => usedClasses.add(c));
  }
  for (const mm of src.matchAll(/classList\.(?:add|remove|toggle)\('([a-z-]+)'/g)) {
    usedClasses.add(mm[1]);
  }
}
const unstyled = [...usedClasses].filter((c) => !cssClasses.has(c)).sort();
if (unstyled.length) console.log('classes with no CSS rule (may be JS-state or modifier): ' + unstyled.join(', '));

console.log('css lines: ' + css.split('\n').length + ', braces balanced: ' + (depth === 0 && minDepth === 0));
// ---- _headers: صيغة Netlify/Cloudflare (تعليقات بـ # فقط) ----
if (fs.existsSync('_headers')) {
  const hd = fs.readFileSync('_headers', 'utf8');
  const lines = hd.split(/\r?\n/);

  // نفحص فقط الأسطر غير التعليقية (المسارات تحتوي /* بشكل مشروع)
  const nonComment = lines.filter((l) => !/^\s*#/.test(l)).join('\n');
  if (/\/\*[\s\S]*?\*\//.test(nonComment)) {
    errors.push('_headers: تعليق بأسلوب /* */ — صيغة Netlify/Cloudflare تستخدم # للتعليقات، فهذه الرؤوس لن تُطبَّق');
  }

  let pathCount = 0;
  let headerCount = 0;
  lines.forEach((line, i) => {
    const raw = line.replace(/\s+$/, '');
    if (!raw.trim()) return;
    if (/^\s*#/.test(raw)) return; // تعليق
    if (/^\s/.test(raw)) {
      if (!/^\s+[A-Za-z-]+\s*:\s*\S/.test(raw)) {
        errors.push(`_headers:${i + 1}: سطر رأس غير صالح → ${raw.trim()}`);
      } else {
        headerCount++;
      }
      return;
    }
    if (!raw.startsWith('/')) {
      errors.push(`_headers:${i + 1}: مسار يجب أن يبدأ بـ / → ${raw.trim()}`);
      return;
    }
    pathCount++;
  });

  if (pathCount === 0) errors.push('_headers: لا يوجد أي مسار صالح');
  if (headerCount === 0) errors.push('_headers: لا يوجد أي رأس صالح');
  if (/^\s*Accept-Ranges\s*:/im.test(hd)) {
    console.log('note: _headers يضبط Accept-Ranges — يتجاهله Netlify (يتحكم به الخادم). اضبطه في .htaccess');
  }
  console.log(`_headers: ${pathCount} مسار، ${headerCount} رأس`);
} else {
  console.log('note: لا يوجد ملف _headers (طبيعي إن كنت تستخدم Apache/.htaccess فقط)');
}

// ---- عدّادات الأذكار: كل data-k صالح، وكل data-count له زر ضغط مطابق ----
// المفتاح يُدرَج مباشرة في محدّد CSS، فلازم يكون حروفًا/أرقامًا فقط
const KEY_RE = /^[A-Za-z][A-Za-z0-9_]*$/;
const tapBtns = [...html.matchAll(/data-k="([^"]*)"/g)].map((x) => x[1]);
const tapKeys = [...new Set(tapBtns)];
const badKeys = tapKeys.filter((k) => !KEY_RE.test(k));
if (badKeys.length) {
  errors.push('data-k بمفتاح غير صالح (حروف/أرقام فقط): ' + badKeys.join(', '));
}
const countKeys = [...new Set([...html.matchAll(/data-count="([^"]*)"/g)].map((x) => x[1]))];
const orphans = countKeys.filter((k) => !tapKeys.includes(k));
if (orphans.length) {
  errors.push('data-count بلا زر data-k مطابق — لن يتحدّث أبدًا: ' + orphans.join(', '));
}
console.log(`tap counters: ${tapBtns.length} زر قابل للضغط (${tapKeys.length} عدّاد فريد) · orphans: ${orphans.length}`);

console.log('---');
console.log(errors.length ? errors.join('\n') : '*** ALL CHECKS PASSED ***');
