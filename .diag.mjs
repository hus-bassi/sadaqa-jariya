/** تشخيص: هل تُبنى شعارات الفوتر فعلًا؟ (مؤقت) */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { buildDom, makeDocument } from './tools/dom-shim.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const byId = buildDom(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
const doc = makeDocument(byId);
doc.activeElement = null;
const storage = new Map();
class FakeAudio {
  constructor() { Object.assign(this, { paused: true, volume: 1, muted: false, currentTime: 0, duration: NaN, ended: false }); }
  addEventListener() {} removeEventListener() {} setAttribute() {} getAttribute() { return null; }
  removeAttribute() {} load() {} pause() { this.paused = true; }
  play() { this.paused = false; return Promise.resolve(); }
}
const win = {
  console, document: doc,
  location: { origin: 'https://example.com', pathname: '/', href: 'https://example.com/', protocol: 'https:' },
  navigator: { onLine: true, vibrate() {}, userAgent: 'node' },
  localStorage: { getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k) },
  fetch: async () => ({ ok: false, status: 404, json: async () => ({}) }),
  AbortController: class { constructor() { this.signal = {}; } abort() {} },
  setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: (f) => f(),
  matchMedia: () => ({ matches: false }),
  IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
  Audio: FakeAudio, isSecureContext: false, QRCode: undefined,
  addEventListener() {}, removeEventListener() {}, scrollY: 0, innerHeight: 800,
};
for (const [k, v] of Object.entries(win)) { try { globalThis[k] = v; } catch {} }
globalThis.window = win; globalThis.self = win;

const tmp = path.join(root, '.diag-tmp');
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'assets/js')).filter((f) => f.endsWith('.js'))) {
  fs.copyFileSync(path.join(root, 'assets/js', f), path.join(tmp, f));
}
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}', 'utf8');

try {
  await import(pathToFileURL(path.join(tmp, 'main.js')).href + '?v=' + Date.now());
  console.log('BOOT: OK');

  const { creator } = await import(pathToFileURL(path.join(tmp, 'config.js')).href);
  console.log('creator.social keys:', Object.keys(creator.social));
  console.log('count:', Object.keys(creator.social).length);

  const row = byId.get('socialRow');
  console.log('socialRow exists:', !!row);
  console.log('children (li):', row.children.length);

  const { icon } = await import(pathToFileURL(path.join(tmp, 'icons.js')).href);
  console.log('--- icon() output per key ---');
  for (const k of Object.keys(creator.social)) {
    const svg = icon(k, 18);
    console.log(k.padEnd(10), 'len=' + String(svg.length).padEnd(5), svg.slice(0, 90));
  }
  console.log('--- rendered <a> ---');
  row.children.forEach((li, i) => {
    const a = li.children[0];
    console.log(i, 'a.className=' + (a ? a.className : 'NONE'), 'href=' + (a ? a.attrs.href : '-'),
      'innerHTML.len=' + (a ? (a.innerHTML || '').length : 0));
  });
} catch (e) {
  console.log('ERROR:', e && e.stack ? e.stack : e);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}