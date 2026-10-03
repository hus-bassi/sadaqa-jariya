/**
 * ============================================================
 *  العدادات — محلية بالكامل على جهاز المستخدم
 *  لا leaderboard ولا منافسة ولا أي مقارنة بين الزوار.
 * ============================================================
 */
import { STORAGE_KEYS } from './config.js';
import { store, toArabicNumber, haptic, $$, prefersReducedMotion } from './utils.js';

export const COUNTERS = [
  { key: 'istighfar', storage: STORAGE_KEYS.istighfar, label: 'الاستغفار' },
  { key: 'salawat', storage: STORAGE_KEYS.salawat, label: 'الصلاة على النبي ﷺ' },
  { key: 'subhan', storage: STORAGE_KEYS.subhan, label: 'سبحان الله' },
  { key: 'hamd', storage: STORAGE_KEYS.hamd, label: 'الحمد لله' },
  { key: 'akbar', storage: STORAGE_KEYS.akbar, label: 'الله أكبر' },
  { key: 'tahlil', storage: STORAGE_KEYS.tahlil, label: 'لا إله إلا الله' },
];

/* مخزن كل عدّاد: الأساسية لها مفاتيح تخزين ثابتة، والفرعية تُشتق من مفتاحها */
const STORAGE_OF = Object.create(null);
COUNTERS.forEach((c) => {
  STORAGE_OF[c.key] = c.storage;
});

/* مفاتيح العدّادات الفرعية: حروف/أرقام فقط حتى تصلح في محدّد CSS بلا تهريب */
const KEY_RE = /^[A-Za-z][A-Za-z0-9_]*$/;

const values = Object.create(null);
const subscribers = new Set();

function storageFor(key) {
  return STORAGE_OF[key] || STORAGE_KEYS.count(key);
}

/* تحميل القيم المحفوظة */
COUNTERS.forEach((c) => {
  values[c.key] = store.getInt(c.storage, 0);
});

/**
 * تسجيل عدّاد فرعي (دعاء / صيغة استغفار) وتحميل قيمته المحفوظة.
 * يعيد false لو كان المفتاح غير صالح.
 */
export function registerCounter(key) {
  if (typeof key !== 'string' || !KEY_RE.test(key)) return false;
  if (!(key in values)) values[key] = store.getInt(storageFor(key), 0);
  return true;
}

/** قراءة كل العدادات (لـ Summary) */
export function getAll() {
  return { ...values };
}

/** الاشتراك في تغيّر أي عدّاد */
export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify(key) {
  subscribers.forEach((fn) => {
    try {
      fn(key, values[key], getAll());
    } catch (e) {
      console.warn('counter listener error', e);
    }
  });
}

/** العناصر التي تُشغّل نبضة تكبير عند زيادة العدّاد */
function canPop(el) {
  return (
    el.classList.contains('counter-big') ||
    el.classList.contains('counter-mini') ||
    el.classList.contains('big')
  );
}

/** تحديث العرض في كل عناصر [data-count] */
export function paint(key, pop = false) {
  const val = values[key] || 0;
  $$(`[data-count="${key}"]`).forEach((el) => {
    el.textContent = toArabicNumber(val);
    if (pop && canPop(el) && !prefersReducedMotion()) {
      el.classList.remove('pop');
      // إعادة تشغيل الأنيميشن
      void el.offsetWidth;
      el.classList.add('pop');
      setTimeout(() => el.classList.remove('pop'), 600);
    }
  });
}

/** زيادة عدّاد (+1) مع حفظ محلي — تسجّل أي عدّاد فرعي عند أول ضغط */
export function increment(key) {
  if (!registerCounter(key)) return 0;
  values[key] += 1;
  store.set(storageFor(key), values[key]);
  paint(key, true);
  haptic(10);
  notify(key);
  return values[key];
}

/** إعادة كل العدادات (الأساسية والفرعية) إلى الصفر */
export function resetAll() {
  Object.keys(values).forEach((key) => {
    values[key] = 0;
    store.set(storageFor(key), 0);
    paint(key);
  });
  notify(null);
}

/** تهيئة العرض الأولي لكل العدادات المعروفة */
export function initCounters() {
  Object.keys(values).forEach((key) => paint(key));
}

/* ---------- تأثير Ripple ---------- */
export function ripple(el, event) {
  if (prefersReducedMotion()) return;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 1.1;
  const span = document.createElement('span');
  span.className = 'ripple';
  const x = (event?.clientX || r.left + r.width / 2) - r.left - size / 2;
  const y = (event?.clientY || r.top + r.height / 2) - r.top - size / 2;
  span.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  el.appendChild(span);
  setTimeout(() => span.remove(), 1000);
}
