/**
 * ============================================================
 *  التطبيق الرئيسي — ربط كل المكونات
 * ============================================================
 */
import { STORAGE_KEYS, SURAHS, tokens, creator } from './config.js';
import {
  $, $$, store, toast, copyText, share, updateShareLinks, canNativeShare,
  showShareFallback, formatTime, toArabicNumber, siteUrl, prefersReducedMotion,
} from './utils.js';
import { audioManager, initFirstInteraction } from './audio.js';
import { icon, hydrateIcons } from './icons.js';
import { DUAS, ISTIGFHARAT, SAYYID_ISTIGFHAR, GOOD_DEEDS } from './duas.js';
import { increment, resetAll, initCounters, subscribe, ripple, registerCounter, paint } from './counters.js';
import { initReader, openReader } from './quran.js';

/* ============================================================
 *  1) تطبيق ملف الإعدادات على الصفحة
 *     يملأ أي رمز {{key}} متبقٍ — شبكة أمان لو لم يُشغَّل البناء
 * ============================================================ */
function applyConfig() {
  if (!tokens || typeof tokens !== 'object') return;
  const re = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
  const sub = (s) => s.replace(re, (m, k) => (k in tokens ? tokens[k] : m));
  if (!document.body) return;

  // 1) النص الظاهر — TreeWalker إن توفّر، وإلا نمرّ على العناصر مباشرة
  const hasTokens = (el) => {
    for (const n of el.childNodes || []) {
      if (n.nodeType === 3 && re.test(n.nodeValue)) return true;
      if (n.nodeType === 1 && hasTokens(n)) return true;
    }
    re.lastIndex = 0;
    return false;
  };
  const walk = (el) => {
    for (const n of el.childNodes || []) {
      if (n.nodeType === 3) {
        re.lastIndex = 0;
        if (re.test(n.nodeValue)) n.nodeValue = sub(n.nodeValue);
      } else if (n.nodeType === 1) {
        walk(n);
      }
    }
  };
  if (hasTokens(document.body)) walk(document.body);

  // 2) السمات (title, content, aria-label, href ...)
  document.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes || []).forEach((a) => {
      re.lastIndex = 0;
      if (re.test(a.value)) el.setAttribute(a.name, sub(a.value));
    });
  });

  document.title = tokens['site.title'] || document.title;
}

/* ============================================================
 *  2) تفعيل خطوط Google (بديل CSP-safe عن onload=)
 * ============================================================ */
function initFonts() {
  const link = $('#fontCss');
  if (!link) return;
  const enable = () => {
    link.rel = 'stylesheet';
  };
  // بعد التحميل المسبق نُفعّلها فورًا، مع مهلة احتياطية إن فشل event
  if (link.sheet) {
    enable();
    return;
  }
  link.addEventListener('load', enable, { once: true });
  link.addEventListener('error', enable, { once: true });
  setTimeout(enable, 3000); // لا نُبقي الصفحة بلا خط أبدًا
}

/* ============================================================
 *  3) التنقل + شريط التقدم
 * ============================================================ */
function initNav() {
  const burger = $('#burger');
  const menu = $('#menu');
  const nav = $('#nav');
  const closeMenu = () => {
    menu.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
    if (burger) burger.innerHTML = icon('menu', 24);
  };

  burger?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.innerHTML = icon(open ? 'close' : 'menu', 24);
  });
  $$('#menu a').forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && !nav.contains(e.target)) closeMenu();
  });

  const prog = $('#prog');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement;
      const max = h.scrollHeight - window.innerHeight;
      nav?.classList.toggle('scrolled', window.scrollY > 40);
      if (prog) prog.style.width = (window.scrollY / (max || 1)) * 100 + '%';
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================================================
 *  مساعدات عدّادات الأذكار
 *  كل دعاء وكل صيغة استغفار له عدّاد مستقل قابل للضغط
 * ============================================================ */

/** مفتاح عدّاد الدعاء رقم i في DUAS */
const duaKey = (i) => 'd' + i;
/** مفتاح عدّاد صيغة الاستغفار رقم i في ISTIGFHARAT */
const istKey = (i) => 'i' + i;

/**
 * زر عدّاد قابل للضغط داخل بطاقة دعاء/استغفار.
 * الزر نفسه هو هدف الضغط، والرقم يُحدَّث live لقارئ الشاشة.
 */
function tapCounter(key, hint, label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tap tap-count';
  btn.dataset.k = key;
  btn.setAttribute('aria-label', label);

  const h = document.createElement('span');
  h.className = 'tap-hint';
  h.textContent = hint;

  const n = document.createElement('span');
  n.className = 'counter-mini';
  n.dataset.count = key;
  n.setAttribute('aria-live', 'polite');
  n.setAttribute('aria-atomic', 'true');
  n.textContent = '٠';

  btn.append(h, n);
  registerCounter(key);
  return btn;
}

/**
 * إعادة ربط زر عدّاد بمفتاح مختلف — للبطاقات المتغيّرة
 * مثل "دعاء آخر" ونافذة الدعاء العائمة.
 */
function bindTapKey(btn, key) {
  if (!btn) return;
  const span = btn.querySelector('[data-count]');
  btn.dataset.k = key;
  if (span) span.dataset.count = key;
  registerCounter(key);
  paint(key);
}

/* ============================================================
 *  4) Scroll Reveal
 * ============================================================ */
function initReveal() {
  const items = $$('.reveal');
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((i) => i.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  items.forEach((i) => io.observe(i));
}

/* ============================================================
 *  4) بطاقات الدعاء
 * ============================================================ */
function duaCard(item, opts = {}) {
  const { key, hint = 'اضغط للعدّ', label = 'عدّاد', act = 'الدعاء' } = opts;
  const el = document.createElement('article');
  el.className = 'card dua-card';

  // عنوان الصيغة (يوجد في صيغ الاستغفار فقط)
  if (item.title) {
    const h = document.createElement('h3');
    h.className = 'dua-title';
    h.textContent = item.title;
    el.appendChild(h);
  }

  const p = document.createElement('p');
  p.className = 'dua-text';
  p.textContent = item.text;
  el.appendChild(p);

  if (item.source) {
    const s = document.createElement('span');
    s.className = 'dua-source';
    s.textContent = item.source;
    el.appendChild(s);
  }

  // العدّاد — كل دعاء/استغفار قابل للضغط
  if (key) el.appendChild(tapCounter(key, hint, label + ': ' + item.text.slice(0, 40)));

  const acts = document.createElement('div');
  acts.className = 'card-actions';

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'mini';
  copy.innerHTML = `${icon('copy', 16)}<span>نسخ ${act}</span>`;
  copy.setAttribute('aria-label', 'نسخ ' + act + ': ' + item.text.slice(0, 40));
  copy.addEventListener('click', () => copyText(item.text, 'تم نسخ ' + act + ' 🤍'));

  const sh = document.createElement('button');
  sh.type = 'button';
  sh.className = 'mini';
  sh.innerHTML = `${icon('share', 16)}<span>مشاركة</span>`;
  sh.setAttribute('aria-label', 'مشاركة ' + act);
  sh.addEventListener('click', () => share(item.text));

  acts.append(copy, sh);
  el.appendChild(acts);
  return el;
}

let lastDuaIndex = -1;
/** فهرس دعاء عشوائي مختلف عن المعروض سابقًا */
function nextDuaIndex() {
  let i;
  do {
    i = Math.floor(Math.random() * DUAS.length);
  } while (i === lastDuaIndex && DUAS.length > 1);
  lastDuaIndex = i;
  return i;
}
function nextDua() {
  return DUAS[nextDuaIndex()];
}

function initDuas() {
  const grid = $('#duaGrid');
  if (grid) {
    DUAS.forEach((d, i) =>
      grid.appendChild(
        duaCard(d, { key: duaKey(i), label: 'عدّاد الدعاء', act: 'الدعاء' })
      )
    );
  }

  const card = $('#rndCard');
  const txt = $('#rndTxt');
  const src = $('#rndSrc');
  const rndTap = $('#rndTap');

  $('#moreDua')?.addEventListener('click', () => {
    const i = nextDuaIndex();
    const d = DUAS[i];
    card.hidden = false;
    card.classList.remove('in');
    txt.textContent = d.text;
    if (src) src.textContent = d.source || '';
    bindTapKey(rndTap, duaKey(i));
    void card.offsetWidth;
    card.classList.add('in');
  });

  $('#rndCopy')?.addEventListener('click', () =>
    copyText(txt.textContent, 'تم نسخ الدعاء 🤍')
  );
  $('#rndShare')?.addEventListener('click', () => share(txt.textContent));
}

/* ============================================================
 *  5) نافذة الدعاء العائمة (Floating Dua)
 * ============================================================ */
function initDuaModal() {
  const dlg = $('#duaModal');
  if (!dlg) return;
  const dlgTxt = $('#dlgTxt');
  const dlgSrc = $('#dlgSrc');
  const closeX = $('#dlgCloseX');
  let closeTimer = 0;
  let lastTrigger = null; // الزر الذي فتح النافذة (لإعادة التركيز عند الإغلاق)

  const render = () => {
    const i = nextDuaIndex();
    const d = DUAS[i];
    dlgTxt.textContent = d.text;
    if (dlgSrc) dlgSrc.textContent = d.source || '';
    bindTapKey($('#dlgTap'), duaKey(i));
  };

  // إنهاء الإغلاق فعليًا بعد انتهاء أنيميشن الخروج
  const settle = () => {
    clearTimeout(closeTimer);
    closeTimer = 0;
    // فُتحت النافذة من جديد أثناء الخروج — لا نُفسد الحالة
    if (!dlg.classList.contains('closing')) return;
    dlg.classList.remove('closing');
    dlg.classList.remove('on');
  };

  const open = () => {
    clearTimeout(closeTimer);
    closeTimer = 0;
    dlg.classList.remove('closing');
    render();
    dlg.classList.add('on');
    dlg.setAttribute('aria-hidden', 'false');
    // التركيز على زر الإغلاق — أول عنصر تفاعلي داخل النافذة
    (closeX || $('#dlgClose'))?.focus();
  };

  const close = () => {
    if (!dlg.classList.contains('on') || dlg.classList.contains('closing')) return;
    dlg.setAttribute('aria-hidden', 'true');
    if (prefersReducedMotion()) {
      settle();
    } else {
      dlg.classList.add('closing');
      clearTimeout(closeTimer);
      closeTimer = setTimeout(settle, 320);
    }
    // إعادة التركيز إلى الزر الذي فتح النافذة (زر "ادعُ لها" العائم حُذف)
    lastTrigger?.focus();
  };

  $$('[data-dua-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      lastTrigger = btn;
      open();
    });
  });
  closeX?.addEventListener('click', close);
  $('#dlgClose')?.addEventListener('click', close);
  $('#dlgMore')?.addEventListener('click', render);
  $('#dlgCopy')?.addEventListener('click', () =>
    copyText(dlgTxt.textContent, 'تم نسخ الدعاء 🤍')
  );
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dlg.classList.contains('on')) close();
  });
  // حصر التركيز داخل النافذة أثناء فتحها (إتاحة الوصول)
  dlg.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !dlg.classList.contains('on')) return;
    const items = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', dlg)
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/* ============================================================
 *  6) الاستغفار + صيغه + سيد الاستغفار
 * ============================================================ */
function initIstighfar() {
  const grid = $('#istGrid');
  if (grid) {
    ISTIGFHARAT.forEach((it, i) =>
      grid.appendChild(
        duaCard(it, {
          key: istKey(i),
          hint: 'اضغط للاستغفار',
          label: 'عدّاد الاستغفار',
          act: 'الاستغفار',
        })
      )
    );
  }

  // سيد الاستغفار
  const sTxt = $('#sayyidTxt');
  if (sTxt) sTxt.textContent = SAYYID_ISTIGFHAR.text;
  $('#sayyidCopy')?.addEventListener('click', () =>
    copyText(sayyidFull(), 'تم نسخ سيد الاستغفار 🤍')
  );
  $('#sayyidShare')?.addEventListener('click', () => share(sayyidFull()));
}
function sayyidFull() {
  return SAYYID_ISTIGFHAR.text + ' (' + SAYYID_ISTIGFHAR.source + ')';
}

/* ============================================================
 *  7) أزرار العدادات (استغفار / صلاة / تسبيح)
 * ============================================================ */
function initTaps() {
  const msg = $('#istMsg');
  // أي عنصر يحمل data-k هو عدّاد قابل للضغط
  $$('[data-k]').forEach((btn) => {
    const key = btn.dataset.k;
    registerCounter(key);
    btn.addEventListener('click', (e) => {
      increment(key);
      ripple(btn, e);
      if (key === 'istighfar') flash(msg, 'اللهم اغفر لها 🤍');
    });
  });

  // ملخص "أعمالك اليوم"
  subscribe((key, value, all) => {
    const el = $('#totalCount');
    if (!el) return;
    const total = Object.values(all).reduce((a, b) => a + b, 0);
    el.textContent = toArabicNumber(total);
  });
}

/** رسالة هادئة تختفي تلقائيًا */
function flash(el, text, ms = 2200) {
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

/* ============================================================
 *  8) إعادة تعيين العدادات
 * ============================================================ */
function initReset() {
  const dlg = $('#resetModal');
  $('#resetBtn')?.addEventListener('click', () => {
    dlg.classList.add('on');
    dlg.setAttribute('aria-hidden', 'false');
    $('#rstNo')?.focus();
  });
  const close = () => {
    dlg.classList.remove('on');
    dlg.setAttribute('aria-hidden', 'true');
  };
  $('#rstNo')?.addEventListener('click', close);
  $('#rstYes')?.addEventListener('click', () => {
    resetAll();
    close();
    toast('تمت إعادة العدّاد إلى الصفر');
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dlg.classList.contains('on')) close();
  });
}

/* ============================================================
 *  9) بطاقات القرآن الكريم
 * ============================================================ */
function initQuran() {
  const grid = $('#qGrid');
  if (!grid) return;
  SURAHS.forEach((s) => {
    const card = document.createElement('article');
    card.className = 'card quran-card';
    card.innerHTML = `
      <span class="quran-num" aria-hidden="true">${toArabicNumber(s.n)}</span>
      <h3>سورة ${s.name}</h3>
      <p class="quran-meta">السورة رقم ${toArabicNumber(s.n)} — ${s.place}</p>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn gold';
    btn.innerHTML = `${icon('book', 18)}<span>اقرأ</span>`;
    btn.setAttribute('aria-label', 'اقرأ سورة ' + s.name);
    btn.addEventListener('click', () => openReader(s.n, s.name));
    card.appendChild(btn);
    grid.appendChild(card);
  });

  // زر سورة يس في قسمها المخصص
  $$('[data-read]').forEach((b) =>
    b.addEventListener('click', () => openReader(Number(b.dataset.read), 'يس'))
  );
}

/* ============================================================
 *  10) الأعمال الصالحة
 * ============================================================ */
function initGoodDeeds() {
  const grid = $('#deedsGrid');
  if (!grid) return;
  GOOD_DEEDS.forEach((d) => {
    const a = document.createElement('a');
    a.href = d.href;
    a.className = 'card deed-card';
    a.innerHTML = `
      <span class="deed-icon" aria-hidden="true">${icon(d.icon, 24)}</span>
      <h3>${d.title}</h3>
      <p>${d.desc}</p>`;
    grid.appendChild(a);
  });
}

/* ============================================================
 *  11) المشاركة + QR
 * ============================================================ */
function initShare() {
  updateShareLinks();

  $('#shareBtn')?.addEventListener('click', () => share());
  $$('[data-copylink]').forEach((b) =>
    b.addEventListener('click', () => copyText(siteUrl(), 'تم نسخ الرابط 🤍'))
  );

  // إظهار روابط المشاركة فقط عند غياب Web Share API
  const links = $('#shareLinks');
  if (links) {
    if (canNativeShare()) links.hidden = true;
    else links.hidden = false;
  }

  // رمز QR — يُحمّل فقط عند الظهور (أداء)
  const qrBox = $('#qr');
  if (qrBox) {
    const loadQR = () => {
      if (qrBox.dataset.loaded) return;
      qrBox.dataset.loaded = '1';
      if (typeof QRCode === 'undefined') {
        qrBox.innerHTML = '<span class="qr-fallback">استخدم زر «نسخ الرابط» للمشاركة</span>';
        return;
      }
      try {
        new QRCode(qrBox, {
          text: siteUrl(),
          width: 220,
          height: 220,
          colorDark: '#0B3D2E',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H,
        });
      } catch (e) {
        qrBox.innerHTML = '<span class="qr-fallback">تعذّر إنشاء الرمز</span>';
      }
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (es) => es.forEach((e) => {
          if (e.isIntersecting) {
            loadQR();
            io.disconnect();
          }
        }),
        { rootMargin: '200px' }
      );
      io.observe(qrBox);
    } else {
      loadQR();
    }
  }
}

/* ============================================================
 *  12) مشغل سورة يس العائم — تجربة صوتية للموقع كله
 *      • يبدأ تلقائيًا عند أول تفاعل حقيقي (audio.js)
 *      • × يخفي المشغل فقط ولا يوقف الصوت
 *      • زر صغير يعيد إظهاره
 *      • المنطق كله في AudioManager — هنا عرض فقط
 * ============================================================ */
function initPlayer() {
  const bar = $('#playerBar');
  const mini = $('#playerMini');
  const pp = $('#ppBtn');
  const restart = $('#restartBtn');
  const mute = $('#muteBtn');
  const vol = $('#volSlider');
  const seek = $('#seekSlider');
  const timeEl = $('#timeLabel');
  const closeBtn = $('#playerClose');

  let seekDragging = false;
  let dismissed = false;   // المستخدم أخفى المشغل صراحةً

  const showBar = () => {
    if (!bar) return;
    bar.classList.add('on');
    bar.setAttribute('aria-hidden', 'false');
  };
  const hideBar = () => {
    bar?.classList.remove('on');
    bar?.setAttribute('aria-hidden', 'true');
  };
  const showMini = (label) => {
    if (!mini) return;
    mini.hidden = false;
    const lbl = $('#playerMiniLabel');
    if (lbl && label) lbl.textContent = label;
  };
  const hideMini = () => {
    if (mini) mini.hidden = true;
  };

  // إخفاء المشغل — الصوت يستمر (§13)
  closeBtn?.addEventListener('click', () => {
    dismissed = true;
    hideBar();
    showMini(audioManager.getState().isPlaying ? 'سورة يس' : 'تشغيل سورة يس');
  });

  // إعادة إظهار المشغل — لا يعيد التشغيل من البداية (§4)
  mini?.addEventListener('click', () => {
    dismissed = false;
    hideMini();
    showBar();
  });

  pp?.addEventListener('click', () => audioManager.toggle(true));
  restart?.addEventListener('click', () => audioManager.restart(true));
  mute?.addEventListener('click', () => audioManager.toggleMute());

  if (vol) vol.addEventListener('input', () => audioManager.setVolume(vol.value));

  if (seek) {
    seek.addEventListener('pointerdown', () => { seekDragging = true; });
    const end = () => {
      if (!seekDragging) return;
      seekDragging = false;
      audioManager.seek(seek.value / 100);
    };
    seek.addEventListener('input', end);
    seek.addEventListener('keyup', end);
    seek.addEventListener('change', end);
  }

  audioManager.subscribe((s) => {
    const playing = s.isPlaying;
    // المشغل يظهر فقط بعد أن يبدأ الصوت فعلًا
    const active = s.hasStartedOnce || s.isLoading || playing;

    if (!dismissed) {
      if (active) {
        showBar();
        hideMini();
      }
    }

    // أزرار التحكم
    if (pp) {
      pp.innerHTML = playing ? icon('pause', 18) : icon('play', 18);
      pp.setAttribute('aria-label', playing ? 'إيقاف سورة يس مؤقتًا' : 'تشغيل سورة يس');
      pp.setAttribute('aria-pressed', String(playing));
    }
    if (mute) {
      mute.innerHTML = s.muted ? icon('mute', 17) : icon('volume', 17);
      mute.setAttribute('aria-label', s.muted ? 'إلغاء الكتم' : 'كتم الصوت');
      mute.setAttribute('aria-pressed', String(s.muted));
    }

    // الوقت والشريط
    if (timeEl) timeEl.textContent = `${formatTime(s.currentTime)} / ${formatTime(s.duration)}`;
    if (seek) {
      const pct = s.duration ? (s.currentTime / s.duration) * 100 : 0;
      if (!seekDragging) seek.value = String(pct);
      seek.setAttribute('aria-valuetext', `${formatTime(s.currentTime)} من ${formatTime(s.duration)}`);
    }
    if (vol) vol.value = String(s.volume);

    // لا مصدر صوت — زر صغير يوضّح ذلك بهدوء بدل إزعاج المستخدم
    if (!s.isConfigured || s.hasError) {
      showMini('سورة يس غير متاحة');
    }
  });
}

/* ============================================================
 *  13) شعارات التواصل في الفوتر — من creator.social في site.config.js
 * ============================================================ */
const SOCIAL_LABEL = {
  facebook: 'Facebook', instagram: 'Instagram', vk: 'VK', linkedin: 'LinkedIn',
  github: 'GitHub', tiktok: 'TikTok', youtube: 'YouTube', discord: 'Discord',
};

function initSocial() {
  const row = $('#socialRow');
  if (!row) return;

  const links = Object.entries(creator.social);
  if (!links.length) {
    row.remove();
    return;
  }

  // الشعارات مبنية مسبقًا عند البناء (tools/build.mjs ← creator.social).
  // هنا نملأها فقط إن كانت فارغة، حتى لا تتكرر.
  if (!row.querySelector('li')) {
    links.forEach(([key, url]) => {
      const label = SOCIAL_LABEL[key] || key;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'social-link';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', label);
      a.title = label;
      a.innerHTML = icon(key, 18);
      li.appendChild(a);
      row.appendChild(li);
    });
  }

  // حقوق صاحب القالب — مبنية مسبقًا أيضًا، فلا نكتب فوقها
  const copy = $('#footerCopy');
  if (copy && creator.copyright && !copy.textContent.trim()) {
    copy.innerHTML =
      `© ${new Date().getFullYear()} ${creator.name}` +
      '<span class="footer-copy-sub">جميع الحقوق محفوظة — All Rights Reserved</span>';
  }
}

/* ============================================================
 *  14) حالة الاتصال (#48)
 * ============================================================ */
function initNetwork() {
  const banner = $('#offlineBanner');
  if (!banner) return;
  const sync = () => {
    banner.hidden = navigator.onLine;
  };
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
  sync();
}

/* ============================================================
 *  15) التمرير السلس لأزرار [data-go]
 * ============================================================ */
function initSmoothScroll() {
  $$('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.go);
      if (!target) return;
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });
}

/* ============================================================
 *  16) Service Worker (#47)
 * ============================================================ */
function initPWA() {
  if (!('serviceWorker' in navigator)) return;
  // نتجاهل التسجيل عند فتح الملف مباشرة (file://)
  if (location.protocol === 'file:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* تسجيل غير متاح — الموقع يعمل بدونه */
    });
  });
}

/* ============================================================
 *  17) الإقلاع
 * ============================================================ */
function boot() {
  applyConfig();
  hydrateIcons();
  initFonts();
  initNav();
  initReveal();
  initDuas();
  initDuaModal();
  initIstighfar();
  initTaps();
  initCounters();   // يرسم القيم المحفوظة
  initReset();
  initQuran();
  initGoodDeeds();
  initShare();
  initPlayer();
  initSocial();
  initReader();
  initNetwork();
  initSmoothScroll();
  initPWA();
  initFirstInteraction(); // يبدأ عند أول تفاعل حقيقي فقط
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

