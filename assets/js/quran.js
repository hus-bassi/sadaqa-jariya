/**
 * ============================================================
 *  قارئ القرآن الكريم — يجلب النص من مصدر موثوق فقط
 *  لا نص مكتوب يدويًا ولا مولَّد بالذكاء الاصطناعي.
 * ============================================================
 */
import { QURAN_APIS, STORAGE_KEYS } from './config.js';
import { store, $, toast, toArabicNumber } from './utils.js';

let currentSurah = 36;
let currentName = 'يس';
let fontSize = store.getInt(STORAGE_KEYS.readerFont, 30);

/* ---------- جلب مع مهلة زمنية ---------- */
function fetchWithTimeout(url, ms = QURAN_APIS.TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    fetch(url, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then((data) => {
        clearTimeout(timer);
        resolve(data);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

/** تطبيع الرد إلى مصفوفة آيات موحّدة */
function normalize(payload) {
  if (payload && Array.isArray(payload.verses)) {
    return payload.verses.map((v) => ({
      n: parseInt(String(v.verse_key).split(':')[1], 10) || 0,
      text: v.text_uthmani,
    }));
  }
  if (payload && payload.data && Array.isArray(payload.data.ayahs)) {
    return payload.data.ayahs.map((a) => ({ n: a.numberInSurah, text: a.text }));
  }
  return null;
}

/** جلب السورة: مصدر أساسي ثم بديل */
export async function fetchSurah(n) {
  const sources = [
    QURAN_APIS.PRIMARY.replace('{n}', n),
    QURAN_APIS.FALLBACK.replace('{n}', n),
  ];
  let lastErr = null;
  for (const url of sources) {
    try {
      const verses = normalize(await fetchWithTimeout(url));
      if (verses && verses.length) return verses;
      lastErr = new Error('empty');
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('no-source');
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}


/* ---------- أدوات العرض ---------- */
function setFontSize(n) {
  fontSize = Math.min(48, Math.max(20, n));
  const body = $('#rbody');
  if (body) body.style.fontSize = fontSize + 'px';
  store.set(STORAGE_KEYS.readerFont, fontSize);
  const label = $('#fontLabel');
  if (label) label.textContent = toArabicNumber(fontSize);
}

function showLoading() {
  const b = $('#rbody');
  if (!b) return;
  b.innerHTML = `<div class="reader-state">
      <div class="spinner" aria-hidden="true"></div>
      <p class="reader-state-text">جاري تجهيز سورة ${escapeHtml(currentName)}...</p>
    </div>`;
}

function showError() {
  const b = $('#rbody');
  if (!b) return;
  b.innerHTML = `<div class="reader-state">
      <p class="reader-state-text">تعذّر تحميل سورة ${escapeHtml(currentName)} حاليًا. حاول مرة أخرى.</p>
      <button class="btn gold" id="rRetry">إعادة المحاولة</button>
    </div>`;
  $('#rRetry')?.addEventListener('click', load);
}

async function load() {
  showLoading();
  try {
    render(await fetchSurah(currentSurah));
  } catch (e) {
    showError();
  }
}

/* ---------- عرض الآيات ---------- */
function render(verses) {
  const b = $('#rbody');
  if (!b) return;
  const saved = store.getInt(STORAGE_KEYS.readPos(currentSurah), 0);

  const parts = [`<h2 class="reader-title">سورة ${escapeHtml(currentName)}</h2>`];

  if (saved > 1 && saved <= verses.length) {
    parts.push(`<div class="reader-actions">
        <button class="btn gold" id="rContinue">تابع من حيث توقفت</button>
        <span class="reader-hint">آخر موضع على جهازك: الآية ${toArabicNumber(saved)}</span>
      </div>`);
  }

  parts.push('<div class="ayat">');
  verses.forEach((v) => {
    parts.push(
      `<span class="ayah" id="ay${v.n}" role="button" tabindex="0" aria-label="الآية ${v.n}">` +
        `<span class="ayah-text">${escapeHtml(v.text)}</span> ` +
        `<span class="ayah-num" aria-hidden="true">${toArabicNumber(v.n)}</span></span> `
    );
  });
  parts.push('</div>');
  b.innerHTML = parts.join('');

  $('#rContinue')?.addEventListener('click', () => {
    const t = document.getElementById('ay' + saved);
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  b.querySelectorAll('.ayah').forEach((el) => {
    const save = () => {
      const n = parseInt(el.id.replace('ay', ''), 10);
      if (!Number.isFinite(n)) return;
      store.set(STORAGE_KEYS.readPos(currentSurah), n);
      b.querySelectorAll('.ayah').forEach((x) => x.classList.remove('current'));
      el.classList.add('current');
      toast('تم حفظ موضع القراءة');
    };
    el.addEventListener('click', save);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        save();
      }
    });
  });

  if (saved > 0) document.getElementById('ay' + saved)?.classList.add('current');
}

/* ---------- فتح / إغلاق القارئ ---------- */
export function openReader(n, name) {
  currentSurah = Number(n);
  currentName = name || 'يس';
  const reader = $('#reader');
  if (!reader) return;
  document.body.classList.add('no-scroll');
  reader.classList.add('on');
  reader.setAttribute('aria-hidden', 'false');
  $('#rClose')?.focus();
  setFontSize(fontSize);
  load();
}

export function closeReader() {
  const reader = $('#reader');
  if (!reader) return;
  reader.classList.remove('on');
  reader.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
}

export function initReader() {
  $('#rClose')?.addEventListener('click', closeReader);
  $('#fUp')?.addEventListener('click', () => setFontSize(fontSize + 2));
  $('#fDn')?.addEventListener('click', () => setFontSize(fontSize - 2));
  $('#fReset')?.addEventListener('click', () => setFontSize(30));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#reader')?.classList.contains('on')) closeReader();
  });
}
