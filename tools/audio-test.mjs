/**
 * اختبار منطق فحص مصدر الصوت (Audio Gating)
 * ------------------------------------------------------------
 * يتأكد أن ملفًا محليًا غير موجود لا يُعتبر "مصدرًا مضبوطًا"،
 * وأن الملف الموجود يُعتبر كذلك، وأن الروابط غير الآمنة (http) تُرفض.
 *
 * يستخدم خادمًا حقيقيًا على منفذ مؤقت + fetch حقيقي (HEAD).
 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- 1) خادم حقيقي لخدمة assets ---------- */
function startServer() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(root, p);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('no');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
    if (req.method === 'HEAD') res.end(); // HEAD → بلا جسم
    else res.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

/* ---------- 2) عناصر DOM وهمية ---------- */
class FakeAudio {
  constructor() {
    this.paused = true;
    this.ended = false;
    this.volume = 1;
    this.muted = false;
    this.currentTime = 0;
    this.duration = NaN;
    this._attrs = {};
  }
  addEventListener() {}
  removeEventListener() {}
  setAttribute(k, v) { this._attrs[k] = v; }
  getAttribute(k) { return this._attrs[k] ?? null; }
  removeAttribute(k) { delete this._attrs[k]; }
  load() {}
  pause() { this.paused = true; }
  play() { this.paused = false; return Promise.resolve(); }
}

const memory = new Map();
const doc = {
  documentElement: { setAttribute() {}, classList: { add() {}, remove() {} } },
  body: { classList: { add() {}, remove() {} }, appendChild() {} },
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener() {},
  createElement: () => ({
    style: {}, setAttribute() {}, appendChild() {}, remove() {}, select() {}, setSelectionRange() {},
  }),
  readyState: 'complete',
};

const G = {
  document: doc,
  Audio: FakeAudio,
  localStorage: {
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
  },
  navigator: { onLine: true },
  matchMedia: () => ({ matches: false }),
  isSecureContext: false,
};
for (const [k, v] of Object.entries(G)) {
  try { globalThis[k] = v; } catch { /* global للقراءة فقط في Node */ }
}
globalThis.window = globalThis;
globalThis.self = globalThis;

/* ---------- 3) سيناريو واحد ---------- */
const results = [];
let scenarioId = 0;

async function scenario(label, localUrl, origin, expectConfigured) {
  try {
    globalThis.location = { origin, href: origin + '/', pathname: '/' };
  } catch { /* ignore */ }

  // مجلد فريد لكل سيناريو — تتجنّب ESM cache على config.js/utils.js
  const tmp = path.join(root, `.audio-test-${++scenarioId}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}', 'utf8');

  // config مخصّص: يوفّر كل ما يحتاجه utils.js و audio.js
  fs.writeFileSync(
    path.join(tmp, 'config.js'),
    `export const AUDIO = { LOCAL: ${JSON.stringify(localUrl)}, REMOTE: '', TITLE: 'سورة يس', DEFAULT_VOLUME: 0.4 };
export const STORAGE_KEYS = { volume: 'audioVolume', muted: 'audioMuted', userPaused: 'userPausedAudio' };
export const SITE = { NAME: 'صدقة جارية', FULL_NAME: 'اختبار', DECEASED: 'اختبار', SITE_URL: '', SHARE_TEXT: 'اختبار' };`,
    'utf8'
  );

  // ننسخ الملفات الحقيقية بدلًا من stubs (لتفادي اختلاف الواجهة)
  fs.copyFileSync(path.join(root, 'assets/js/utils.js'), path.join(tmp, 'utils.js'));
  fs.copyFileSync(path.join(root, 'assets/js/audio.js'), path.join(tmp, 'audio.js'));

  const mod = await import('file:///' + path.join(tmp, 'audio.js').replace(/\\/g, '/') + '?v=' + Date.now());
  const m = mod.audioManager;

  await new Promise((r) => setTimeout(r, 900)); // انتظار الفحص الشبكي

  const actual = m.isConfigured;
  const ok = actual === expectConfigured;
  results.push(
    `${ok ? 'PASS' : 'FAIL'}  ${label}\n        isConfigured=${actual} (متوقّع ${expectConfigured}) source=${JSON.stringify(m.source || '')}`
  );

  fs.rmSync(tmp, { recursive: true, force: true });
}

/* ---------- 4) التنفيذ ---------- */
const server = await startServer();
const port = server.address().port;
const origin = `http://localhost:${port}`;

const realFile = path.join(root, 'assets/audio/yaseen.mp3');
const marker = path.join(root, '.audio-test-marker');
const hadReal = fs.existsSync(realFile);

try {
  if (hadReal) {
    results.push('SKIP  ملف صوت حقيقي موجود مسبقًا — تخطّي سيناريو 404 للحفاظ عليه');
  } else {
    await scenario('ملف محلي غير موجود (404)', 'assets/audio/yaseen.mp3', origin, false);
    fs.writeFileSync(realFile, 'fake-mp3-for-test');
    fs.writeFileSync(marker, '1');
  }
  await scenario('ملف محلي موجود (200)', 'assets/audio/yaseen.mp3', origin, true);
  await scenario('رابط خارجي غير آمن (http)', 'http://example.com/a.mp3', origin, false);
  await scenario('لا يوجد أي مصدر', '', origin, false);
} finally {
  server.close();
  if (fs.existsSync(marker) && fs.existsSync(realFile)) {
    fs.rmSync(realFile, { force: true }); // ملفنا الوهمي فقط
    fs.rmSync(marker, { force: true });
  }
}

console.log(results.join('\n'));
console.log('---');
if (results.some((r) => r.startsWith('FAIL'))) {
  console.log('*** AUDIO GATING FAILED ***');
  process.exitCode = 1;
} else {
  console.log('*** AUDIO GATING PASSED ***');
}