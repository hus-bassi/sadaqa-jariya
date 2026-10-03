/**
 * ============================================================
 *  الأدوات المشتركة — Store / Toast / Clipboard / Share
 *  كل شيء مع protection ضد رفض المتصفح (private mode, إلخ)
 * ============================================================
 */
import { STORAGE_KEYS, SITE } from './config.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- 1) التخزين المحلي الآمن ---------- */
export const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null; // وضع التصفح الخاص أو محجوب
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, String(val));
      return true;
    } catch {
      return false;
    }
  },
  del(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* تجاهل */
    }
  },
  getInt(key, fallback = 0) {
    const n = parseInt(this.get(key), 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  },
  getFloat(key, fallback) {
    const n = parseFloat(this.get(key));
    return Number.isFinite(n) ? n : fallback;
  },
};

/* ---------- 2) Toast هادئ ---------- */
let toastTimer = null;
export function toast(message, ms = 2600) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('on');
  el.setAttribute('aria-live', 'polite');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}

/* ---------- 3) نسخ النص مع fallback ---------- */
export async function copyText(text, successMsg = 'تم النسخ 🤍') {
  const ok = () => toast(successMsg);
  const fallback = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const done = document.execCommand('copy');
      ta.remove();
      done ? ok() : toast('تعذّر النسخ — انسخ النص يدويًا');
    } catch {
      toast('تعذّر النسخ — انسخ النص يدويًا');
    }
  };

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      ok();
      return;
    } catch {
      fallback();
    }
  } else {
    fallback();
  }
}

/* ---------- 4) رابط الموقع ---------- */
export function siteUrl() {
  const base = SITE.SITE_URL || location.origin + location.pathname;
  return base.split('#')[0];
}

/* ---------- 5) المشاركة ---------- */
export function canNativeShare() {
  return typeof navigator.share === 'function';
}

export async function share(text) {
  const payload = {
    title: SITE.FULL_NAME,
    text: text || SITE.SHARE_TEXT,
    url: siteUrl(),
  };
  if (canNativeShare()) {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'aborted';
      // فشل حقيقي → نعرض روابط بديلة
      showShareFallback();
      return 'fallback';
    }
  }
  showShareFallback();
  return 'fallback';
}

export function showShareFallback() {
  const box = $('#shareLinks');
  if (box) {
    box.hidden = false;
    box.classList.add('on');
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

export function updateShareLinks() {
  const url = encodeURIComponent(siteUrl());
  const txt = encodeURIComponent(SITE.SHARE_TEXT);
  const map = {
    '#wa': `https://wa.me/?text=${txt}%20${url}`,
    '#tg': `https://t.me/share/url?url=${url}&text=${txt}`,
    '#fb': `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  };
  Object.entries(map).forEach(([sel, href]) => {
    const a = $(sel);
    if (a) a.href = href;
  });
}

/* ---------- 6) مساعدات عامة ---------- */
export function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function toArabicNumber(n) {
  try {
    return Number(n).toLocaleString('ar-EG');
  } catch {
    return String(n);
  }
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function haptic(ms = 10) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* غير مدعوم — نتجاهله بهدوء */
  }
}

export { $, $$ };
