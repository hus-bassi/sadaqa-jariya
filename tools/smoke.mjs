/**
 * اختبار دخان: ينفّذ وحدات ES فعليًا في Node عبر dynamic import.
 * الغرض: التقاط أخطاء التهيئة (reference errors) قبل التشغيل في المتصفح.
 * ملاحظة: لا يُغني عن اختبار المتصفح الحقيقي (تخطيط، صوت، شبكة).
 *
 * الطريقة: ننسخ الوحدات إلى مجلد مؤقت مع package.json من نوع module،
 * ثم نضبط الكائنات العامة (document/window/...) قبل الاستيراد.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { buildDom, makeDocument } from './dom-shim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsDir = path.join(root, 'assets/js');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const byId = buildDom(html);
const doc = makeDocument(byId);
const storage = new Map();

class FakeAudio {
  constructor() {
    this.paused = true;
    this.volume = 1;
    this.muted = false;
    this.currentTime = 0;
    this.duration = NaN;
    this.ended = false;
  }
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  getAttribute() { return null; }
  removeAttribute() {}
  load() {}
  pause() { this.paused = true; }
  play() { this.paused = false; return Promise.resolve(); }
}

const win = {
  console,
  document: doc,
  location: { origin: 'https://example.com', pathname: '/', href: 'https://example.com/', protocol: 'https:' },
  navigator: { onLine: true, vibrate() {}, userAgent: 'node-smoke' },
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  },
  fetch: async () => ({ ok: false, status: 404, json: async () => ({}) }),
  AbortController: class { constructor() { this.signal = {}; } abort() {} },
  setTimeout: () => 0,
  clearTimeout: () => {},
  requestAnimationFrame: (f) => f(),
  matchMedia: () => ({ matches: false }),
  IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
  Audio: FakeAudio,
  isSecureContext: false,
  QRCode: undefined,
  addEventListener() {},
  removeEventListener() {},
  scrollY: 0,
  innerHeight: 800,
};
// نثبّت الكائنات العامة على globalThis حتى تعمل الوحدات في بيئة Node
for (const [k, v] of Object.entries(win)) {
  try { globalThis[k] = v; } catch { /* خصائص للقراءة فقط — نتجاهلها */ }
}
globalThis.window = win;
globalThis.self = win;

/* ---------- تحميل الوحدات: نسخ مؤقت + استيراد بمسار file:// ---------- */
// نضع النسخة في مجلد مؤقت خارج tools/ لتفادي تعارض loaders في Node 24
const tmp = path.join(root, '.smoke-tmp');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
for (const f of fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'))) {
  fs.copyFileSync(path.join(jsDir, f), path.join(tmp, f));
}
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}', 'utf8');

try {
  await import(pathToFileURL(path.join(tmp, 'main.js')).href + '?v=' + Date.now());
  console.log('modules evaluated: OK (no throw during init)');
} catch (e) {
  console.log('*** SMOKE TEST FAILED ***\n' + (e && e.stack ? e.stack : e));
  process.exitCode = 1;
}

if (!process.exitCode) {
  const required = ['nav', 'burger', 'menu', 'duaGrid', 'istGrid', 'qGrid', 'deedsGrid',
    'totalCount', 'playerBar', 'playerMini', 'ppBtn', 'seekSlider',
    'muteBtn', 'volSlider', 'timeLabel', 'playerClose', 'reader', 'rbody', 'fab', 'toast',
    'qr', 'shareBtn', 'socialRow', 'footerCopy', 'istMsg', 'resetBtn', 'offlineBanner', 'prog'];
  const missing = required.filter((id) => !byId.has(id));
  if (missing.length) {
    console.log('FAIL: required elements missing -> ' + missing.join(', '));
    process.exitCode = 1;
  } else {
    console.log('all ' + required.length + ' required interactive elements present');
    console.log('*** SMOKE TEST PASSED ***');
  }
}

fs.rmSync(tmp, { recursive: true, force: true });

