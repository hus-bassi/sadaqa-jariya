import fs from 'fs';
import path from 'path';

const html = fs.readFileSync('index.html', 'utf8');
const errors = [];
const warn = [];

/* ---------- 1) معرّفات HTML ---------- */
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]));

/* ---------- 2) مراجع JS لكل معرّف ---------- */
const jsFiles = fs.readdirSync('assets/js').filter((f) => f.endsWith('.js'));
const DYNAMIC = new Set(['rRetry', 'rContinue', 'ay1']);
for (const f of jsFiles) {
  const src = fs.readFileSync(path.join('assets/js', f), 'utf8');
  const refs = new Set();
  for (const m of src.matchAll(/\$\$?\('#([A-Za-z0-9_-]+)'\)/g)) refs.add(m[1]);
  for (const m of src.matchAll(/\$\('#([A-Za-z0-9_-]+)'/g)) refs.add(m[1]);
  for (const r of refs) {
    if (!ids.has(r) && !DYNAMIC.has(r)) errors.push(`${f}: ID missing in HTML -> #${r}`);
  }
}

/* ---------- 3) الصادرات مقابل الواردات ---------- */
const exportsOf = {};
for (const f of jsFiles) {
  const src = fs.readFileSync(path.join('assets/js', f), 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s+(?:const|let|var|class)\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    m[1].split(',').forEach((n) => names.add(n.trim().split(/\s+as\s+/).pop().trim()));
  }
  exportsOf[f] = names;
}
for (const f of jsFiles) {
  const src = fs.readFileSync(path.join('assets/js', f), 'utf8');
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*'\.\/([^']+)'/g)) {
    const target = m[2];
    if (!exportsOf[target]) { errors.push(`${f}: import from missing module ${target}`); continue; }
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0].trim();
      if (!name) continue;
      if (!exportsOf[target].has(name)) {
        errors.push(`${f}: '${name}' is not exported by ${target}`);
      }
    }
  }
}

/* ---------- 4) الدوال المتاحة: معرّفة محليًا أو مستوردة ---------- */
const mainSrc = fs.readFileSync('assets/js/main.js', 'utf8');
const defined = new Set([...mainSrc.matchAll(/function\s+([A-Za-z0-9_$]+)\s*\(/g)].map((x) => x[1]));
defined.add('boot');
// الأسماء المستوردة صالحة أيضًا (تم التحقق من تصديرها في القسم 3)
for (const m of mainSrc.matchAll(/import\s*\{([^}]+)\}\s*from/g)) {
  m[1].split(',').forEach((n) => defined.add(n.trim().split(/\s+as\s+/).pop().trim()));
}

/* ---------- 5) كل دالة تُستدعى داخل boot() يجب أن تكون معرّفة ---------- */
const bootMatch = mainSrc.match(/function boot\(\)\s*\{([\s\S]*?)\n\}/);
if (!bootMatch) {
  errors.push('main.js: boot() not found');
} else {
  for (const m of bootMatch[1].matchAll(/([A-Za-z0-9_$]+)\(\s*\)/g)) {
    const fn = m[1];
    if (!defined.has(fn)) errors.push(`boot(): '${fn}()' is called but not defined in main.js`);
  }
  warn.push('boot() calls: ' + [...bootMatch[1].matchAll(/([A-Za-z0-9_$]+)\(\s*\)/g)].map((m) => m[1]).join(', '));
}

/* ---------- 6) دوال معرّفة لكنها غير مستخدمة (مؤشر على كود ميت) ---------- */
const allCalls = new Set();
for (const f of jsFiles) {
  const src = fs.readFileSync(path.join('assets/js', f), 'utf8');
  for (const m of src.matchAll(/(?<![\w.$])([A-Za-z0-9_$]+)\s*\(/g)) allCalls.add(m[1]);
}
const unused = [...defined].filter((fn) => fn !== 'boot' && !allCalls.has(fn));
if (unused.length) warn.push('defined but never called: ' + unused.join(', '));

/* ---------- 7) متغيرات CSS المعرّفة مقابل المستخدمة ---------- */
const css = fs.readFileSync('assets/css/main.css', 'utf8');
const cssVars = new Set([...css.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((x) => x[1]));
const usedVars = new Set();
for (const src of [html, ...jsFiles.map((f) => fs.readFileSync(path.join('assets/js', f), 'utf8'))]) {
  for (const m of src.matchAll(/var\((--[\w-]+)\)/g)) usedVars.add(m[1]);
}
const undefinedVars = [...usedVars].filter((v) => !cssVars.has(v));
if (undefinedVars.length) errors.push('CSS vars used but never defined: ' + undefinedVars.join(', '));

/* ---------- التقرير ---------- */
/* ---------- 8) معرّفات مستخدمة لكنها غير معرّفة/مستوردة (يكشف الأخطاء الإملائية) ---------- */
const GLOBALS = new Set([
  'window', 'document', 'console', 'navigator', 'location', 'localStorage', 'fetch', 'setTimeout',
  'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
  'matchMedia', 'IntersectionObserver', 'MutationObserver', 'AbortController', 'URL', 'URLSearchParams',
  'Audio', 'Image', 'Date', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Promise',
  'Set', 'Map', 'RegExp', 'Error', 'TypeError', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURIComponent', 'decodeURIComponent', 'structuredClone', 'queueMicrotask', 'undefined',
  'true', 'false', 'null', 'NaN', 'Infinity', 'this', 'arguments', 'globalThis', 'self',
  'innerWidth', 'innerHeight', 'scrollY', 'scrollX', 'devicePixelRatio', 'alert', 'confirm',
  'HTMLElement', 'Node', 'Event', 'CustomEvent', 'Blob', 'File', 'FileReader', 'FormData',
]);
// اعتبارات خاصة داخل audio.js (تتحدث عبر this)
const SKIP_FILES = new Set();

for (const f of jsFiles) {
  if (SKIP_FILES.has(f)) continue;
  let src = fs.readFileSync(path.join('assets/js', f), 'utf8');
  // أزل النصوص والتعليقات لتقليل الإنذارات الكاذبة
  src = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
  src = src.replace(/(^|[^:])\/\/[^\n]*/g, '$1 '); // تعليقات السطر (مع استثناء https://)
  src = src.replace(/`(?:\\.|[^`\\])*`/g, '``');
  src = src.replace(/'(?:\\.|[^'\\\n])*'/g, "''");
  src = src.replace(/"(?:\\.|[^"\\\n])*"/g, '""');

  const localDefs = new Set();
  for (const m of src.matchAll(/(?:function|class)\s+([A-Za-z0-9_$]+)/g)) localDefs.add(m[1]);
  for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z0-9_$]+)/g)) localDefs.add(m[1]);
  for (const m of src.matchAll(/(?:const|let|var)\s*\{([^}]+)\}/g)) {
    m[1].split(',').forEach((p) => {
      const name = p.split(':').pop().split('=')[0].trim();
      if (name) localDefs.add(name);
    });
  }
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from/g)) {
    m[1].split(',').forEach((n) => localDefs.add(n.trim().split(/\s+as\s+/).pop().trim()));
  }
  for (const m of src.matchAll(/\(([^)]*)\)\s*=>/g)) {
    m[1].split(',').forEach((p) => { const n = p.trim().split(/[=:]/)[0].trim(); if (n) localDefs.add(n); });
  }
  for (const m of src.matchAll(/([A-Za-z0-9_$]+)\s*=>/g)) localDefs.add(m[1]);
  for (const m of src.matchAll(/([A-Za-z0-9_$]+)\s*=>/g)) localDefs.add(m[1]);
  for (const m of src.matchAll(/(?:const|let|var)\s+\[([^\]]+)\]/g)) {
    m[1].split(',').forEach((n) => localDefs.add(n.trim()));
  }
  for (const m of src.matchAll(/([A-Za-z0-9_$]+)\s*\(/g)) localDefs.add(m[1]);

  for (const m of src.matchAll(/(?<![\w.$'"`])([A-Z][A-Za-z0-9_]{2,})/g)) {
    const name = m[1];
    if (GLOBALS.has(name) || localDefs.has(name) || defined.has(name)) continue;
    const after = src.slice(m.index + name.length);
    // خصائص: AUDIO.LOCAL  |  مفاتيح كائن: LOCAL:  |  استدعاء: FOO(
    if (/^\s*[.:(]/.test(after)) continue;
    errors.push(`${f}: constant '${name}' used but never defined or imported`);
  }
}

console.log('html ids: ' + ids.size);
console.log('css vars defined: ' + cssVars.size + ', used: ' + usedVars.size);
warn.forEach((w) => console.log('note: ' + w));
console.log('---');
console.log(errors.length ? 'ERRORS:\n  ' + errors.join('\n  ') : '*** STATIC VERIFICATION PASSED ***');
process.exitCode = errors.length ? 1 : 0;
