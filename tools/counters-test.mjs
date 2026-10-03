/**
 * ============================================================
 *  اختبار عدّادات الأذكار (الدعاء + الاستغفار)
 *  يشغّل counters.js الحقيقي على DOM مصغّر ويتحقق من:
 *   - تحميل القيم المحفوظة (الأساسية والفرعية)
 *   - الزيادة والحفظ في مفاتيح مستقلة
 *   - تحديث كل عناصر [data-count] لنفس المفتاح
 *   - نبضة .pop (التي كانت معطّلة بسبب classList.contains('big'))
 *   - رفض المفاتيح غير الصالحة (أمان محدّد CSS)
 *   - إعادة التعيين تشمل العدّادات الفرعية
 * ============================================================
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/* ---------- 1) ذاكرة localStorage قبل استيراد الوحدة ---------- */
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};

// قيم محفوظة مسبقًا: مفتاح أساسي قديم + عدّادَي دعاء/استغفار
mem.set('istighfarCount', '5');
mem.set('count_d3', '7');
mem.set('count_sayyid', '12');

/* ---------- 2) عناصر DOM مصغّرة ---------- */
class StubEl {
  constructor(key, cls = []) {
    this.key = key;
    this.textContent = '';
    this.offsetWidth = 100;
    this._cls = new Set(cls);
    this.classList = {
      add: (c) => this._cls.add(c),
      remove: (c) => this._cls.delete(c),
      contains: (c) => this._cls.has(c),
    };
  }
}

const registry = [
  new StubEl('d3', ['counter-mini']),   // عدّاد داخل زر بطاقة دعاء
  new StubEl('d3', ['counter-big']),    // نسخة ثانية لنفس المفتاح
  new StubEl('sayyid', ['counter-mini']),
  new StubEl('istighfar', ['counter-big']),
];

globalThis.document = {
  querySelectorAll(sel) {
    const m = /^\[data-count="([^"]+)"\]$/.exec(sel);
    return m ? registry.filter((e) => e.key === m[1]) : [];
  },
  querySelector: () => null,
  createElement: () => new StubEl(''),
};
globalThis.window = { matchMedia: () => ({ matches: false }) };
// navigator.vibrate غير موجود أصلًا في Node — وhaptic() محمي بـ try/catch

/* ---------- 3) تشغيل الوحدة ---------- */
const url = pathToFileURL(path.resolve('assets/js/counters.js')).href;
const C = await import(url);
const U = await import(pathToFileURL(path.resolve('assets/js/utils.js')).href);

const results = [];
const t = (name, fn) => {
  try {
    fn();
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', name + ' → ' + e.message]);
  }
};

const el = (k, i = 0) => registry.filter((e) => e.key === k)[i];

// أ) القيم الأساسية تُحمّل من مفاتيحها القديمة (بدون كسر بيانات المستخدمين)
t('تحميل العدّاد الأساسي من مفتاحه القديم', () => {
  assert.equal(C.getAll().istighfar, 5);
});

// ب) العدّادات الفرعية تُحمّل عند التسجيل
t('تسجيل عدّاد دعاء يحمّل قيمته المحفوظة', () => {
  assert.equal(C.registerCounter('d3'), true);
  assert.equal(C.registerCounter('sayyid'), true);
  assert.equal(C.getAll().d3, 7);
  assert.equal(C.getAll().sayyid, 12);
});

// ج) الزيادة تحفظ في المفتاح المشتق
t('زيادة عدّاد الدعاء تحفظ في count_d3', () => {
  assert.equal(C.increment('d3'), 8);
  assert.equal(mem.get('count_d3'), '8');
});

// د) كل العناصر التي تحمل نفس المفتاح تتحدّث
t('تحديث كل عناصر data-count لنفس المفتاح', () => {
  C.paint('d3');
  const n = U.toArabicNumber(8);
  assert.equal(el('d3', 0).textContent, n);
  assert.equal(el('d3', 1).textContent, n);
});

// هـ) نبضة .pop تعمل على counter-mini (كانت معطّلة سابقًا)
t('نبضة pop تُطبَّق على counter-mini', () => {
  C.paint('d3', true);
  assert.equal(el('d3', 0).classList.contains('pop'), true);
  assert.equal(el('d3', 1).classList.contains('pop'), true);
  el('d3', 0).classList.remove('pop');
});

// و) المفتاح الأساسي لا يزال يستخدم مفتاحه القديم
t('العدّاد الأساسي لا يزال يستخدم مفتاح التخزين القديم', () => {
  C.increment('istighfar');
  assert.equal(mem.get('istighfarCount'), '6');
  assert.equal(mem.get('count_istighfar'), undefined);
});

// ز) رفض المفاتيح غير الصالحة — حماية من حقن محدّد CSS
t('رفض المفتاح غير الصالح', () => {
  assert.equal(C.increment('a"b'), 0);
  assert.equal(C.registerCounter('1bad'), false);
  assert.equal(C.registerCounter(''), false);
  assert.equal(C.registerCounter(null), false);
  assert.equal(C.registerCounter('../etc'), false);
});

// ح) العدّاد غير المسجّل يُسجَّل تلقائيًا عند أول زيادة
t('تسجيل تلقائي عند أول زيادة', () => {
  assert.equal(C.getAll().d9, undefined);
  assert.equal(C.increment('d9'), 1);
  assert.equal(C.getAll().d9, 1);
  assert.equal(mem.get('count_d9'), '1');
});

// ط) إعادة التعيين تشمل الأساسية والفرعية
t('إعادة التعيين تشمل العدّادات الفرعية', () => {
  C.resetAll();
  assert.equal(C.getAll().d3, 0);
  assert.equal(C.getAll().sayyid, 0);
  assert.equal(C.getAll().istighfar, 0);
  assert.equal(mem.get('count_d3'), '0');
  assert.equal(mem.get('istighfarCount'), '0');
});

// ي) العرض الأولي يرسم كل العدّادات المعروفة
t('initCounters يرسم كل العدّادات المعروفة', () => {
  C.increment('d3');
  C.initCounters();
  assert.equal(el('d3', 0).textContent, U.toArabicNumber(1));
  assert.equal(el('sayyid', 0).textContent, U.toArabicNumber(0));
});

/* ---------- 4) التقرير ---------- */
let failed = 0;
for (const [s, n] of results) {
  if (s === 'FAIL') failed++;
  console.log(`  [${s}] ${n}`);
}
console.log(`counters: ${results.length - failed}/${results.length}`);
if (failed) process.exit(1);