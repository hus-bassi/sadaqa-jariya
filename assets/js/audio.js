/**
 * ============================================================
 *  Audio Manager — مدير الصوت المركزي (Singleton)
 * ============================================================
 *  عنصر <audio> واحد فقط في التطبيق كله.
 *  أي زر في أي مكان يتعامل مع نفس الـ manager.
 *
 *  القواعد:
 *   • لا تشغيل تلقائي عند تحميل الصفحة
 *   • أول تفاعل حقيقي فقط يبدأ التشغيل
 *   • بعد التشغيل لا يُعاد تلقائيًا أبدًا
 *   • إن أوقف المستخدم → لا يُستأنف تلقائيًا
 *   • محاولة play() مرفوضة → لا خطأ، مجرد زر واضح
 *   • لا Synthetic Events / لا حيل لتجاوز سياسة المتصفح
 * ============================================================
 */
import { AUDIO, STORAGE_KEYS } from './config.js';
import { store, toast } from './utils.js';

class AudioManager {
  constructor() {
    this.el = new Audio();
    this.el.preload = 'none';
    this.el.crossOrigin = 'anonymous';

    this.hasInteracted = false;
    this.hasStartedOnce = false;
    /* لا نحفظ التوقف عبر الجلسات: كل تحميل = جلسة جديدة (§42) */
    this.userPaused = false;
    this.loading = false;
    this.hasError = false;
    this.listeners = new Set();
    this.lastPlayAttempt = 0;
    this.bindUI();
    this.restorePrefs();
    this.resolveSource();
  }

  restorePrefs() {
    const vol = store.getFloat(STORAGE_KEYS.volume, AUDIO.DEFAULT_VOLUME);
    this.el.volume = Math.min(1, Math.max(0, vol));
    this.el.muted = store.get(STORAGE_KEYS.muted) === '1';
  }

  /**
   * تحديد المصدر مع تحقق من وجوده فعلًا.
   * ملف محلي غير موجود = مصدر غير مضبوط (لا محاولة تشغيل فاشلة).
   */
  resolveSource() {
    this.source = '';
    this.pending = false;
    const candidates = [AUDIO.LOCAL, (AUDIO.REMOTE || '').trim()].filter(Boolean);

    for (const c of candidates) {
      if (!this.isValidUrl(c)) continue;
      if (c.startsWith('assets/')) {
        // نحتاج فحصًا شبكيًا لتأكيد وجود الملف
        this.pending = true;
        this.probe(c);
      } else {
        this.source = c;
      }
    }
    this.isConfigured = Boolean(this.source) || this.pending;
  }

  /** فحص خفيف (HEAD) للتأكد من وجود الملف المحلي */
  async probe(url) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      // نُحوّل المسار النسبي إلى مطلق للفحص (يعمل في المتصفح وفي أي بيئة أخرى)
      let target = url;
      try {
        target = new URL(url, location.href).href;
      } catch {
        /* نُبقي المسار كما هو */
      }
      const res = await fetch(target, { method: 'HEAD', signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (res.ok) {
        this.source = url;
        this.isConfigured = true;
        this.pending = false;
        this.emit();
      } else {
        this.pending = false;
        this.isConfigured = Boolean(this.source);
        this.emit();
      }
    } catch {
      // فشل الفحص = نتعامل مع المصدر كغير موجود
      this.pending = false;
      this.isConfigured = Boolean(this.source);
      this.emit();
    }
  }

  isValidUrl(url) {
    if (typeof url !== 'string' || !url.trim()) return false;
    if (url.startsWith('assets/')) return true; // ملف محلي
    try {
      return new URL(url, location.href).protocol === 'https:';
    } catch {
      return false;
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.getState());
    return () => this.listeners.delete(fn);
  }

  emit() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (e) {
        console.warn('audio listener error', e);
      }
    });
  }

  getState() {
    return {
      isPlaying: !this.el.paused && !this.el.ended,
      isPaused: this.el.paused,
      currentTime: this.el.currentTime,
      duration: Number.isFinite(this.el.duration) ? this.el.duration : 0,
      volume: this.el.volume,
      muted: this.el.muted,
      isConfigured: this.isConfigured,
      isLoading: this.loading,
      hasStartedOnce: this.hasStartedOnce,
      hasError: this.hasError,
      userPaused: this.userPaused,
    };
  }


  /** ربط أحداث عنصر الصوت */
  bindUI() {
    const a = this.el;
    const soft = () => this.emit();
    ['play', 'pause', 'playing', 'timeupdate', 'durationchange', 'ended', 'canplay'].forEach((e) =>
      a.addEventListener(e, soft)
    );
    a.addEventListener('waiting', () => {
      this.loading = true;
      this.emit();
    });
    a.addEventListener('error', () => {
      this.loading = false;
      this.hasError = true;
      this.hasStartedOnce = false;
      this.emit();
      // لا نُظهر error تقني — رسالة أنيقة فقط
      toast('تعذّر تحميل سورة يس حاليًا. حاول مرة أخرى.', 3200);
    });
  }

  prepare() {
    if (this.el.getAttribute('src') === this.source) return;
    this.el.src = this.source;
    this.el.load();
  }

  /** التشغيل — لا يُظهر أي خطأ للمستخدم */
  async play(userInitiated = false) {
    if (!this.isConfigured || !this.source) {
      if (userInitiated) toast('لم يتم ضبط مصدر صوت سورة يس بعد.', 3000);
      this.emit();
      return;
    }
    const now = Date.now();
    if (now - this.lastPlayAttempt < 400) return; // منع التكرار السريع
    this.lastPlayAttempt = now;

    this.hasError = false;
    this.prepare();
    this.loading = true;
    this.emit();

    try {
      const p = this.el.play();
      if (p && typeof p.then === 'function') await p;
      this.hasStartedOnce = true;
      this.userPaused = false;
    } catch (err) {
      // المتصفح رفض التشغيل (Autoplay Policy) — لا رسالة خطأ
      this.loading = false;
    }
    this.emit();
  }

  pause(byUser = false) {
    this.el.pause();
    if (byUser) this.userPaused = true;
    this.emit();
  }

  toggle(userInitiated = true) {
    if (this.el.paused) this.play(userInitiated);
    else this.pause(true);
  }

  restart(userInitiated = true) {
    try {
      this.el.currentTime = 0;
    } catch {
      /* ignore */
    }
    if (this.el.paused) this.play(userInitiated);
    else this.emit();
  }

  setVolume(v) {
    const vol = Math.min(1, Math.max(0, Number(v)));
    this.el.volume = vol;
    store.set(STORAGE_KEYS.volume, vol);
    if (vol > 0 && this.el.muted) this.setMuted(false);
    this.emit();
  }

  setMuted(m) {
    this.el.muted = Boolean(m);
    store.set(STORAGE_KEYS.muted, this.el.muted ? '1' : '0');
    this.emit();
  }

  toggleMute() {
    this.setMuted(!this.el.muted);
  }

  seek(ratio) {
    if (!Number.isFinite(this.el.duration) || this.el.duration <= 0) return;
    this.el.currentTime = Math.min(1, Math.max(0, ratio)) * this.el.duration;
    this.emit();
  }

  /** إعادة المحاولة بعد فشل */
  retry(userInitiated = true) {
    this.hasStartedOnce = false;
    this.hasError = false;
    this.el.removeAttribute('src');
    this.el.load();
    this.play(userInitiated);
  }

  /**
   * إعادة الفحص — مفيدة بعد إضافة الملف لاحقًا أثناء فتح الصفحة.
   * تُستدعى من زر "إعادة المحاولة" في الواجهة.
   */
  recheck(userInitiated = true) {
    this.hasError = false;
    this.resolveSource();
    if (this.source) this.play(userInitiated);
    else {
      if (userInitiated) toast('ملف سورة يس غير موجود بعد في assets/audio/.', 3200);
      this.emit();
    }
  }
}

/** نسخة واحدة فقط في التطبيق كله */
export const audioManager = new AudioManager();

/**
 * ---------- First Interaction ----------
 * سورة يس تجربة صوتية للموقع كله:
 *   • لا تشغيل عند تحميل الصفحة إطلاقًا
 *   • عند أول تفاعل حقيقي (pointerdown) يبدأ التشغيل مرة واحدة فقط
 *   • بعد ذلك لا يُعاد التشغيل تلقائيًا أبدًا
 *   • عند إعادة تحميل الصفحة تبدأ جلسة جديدة → أول تفاعل جديد
 *
 * لا نستخدم أي حيلة لتجاوز سياسة المتصفح — ننتظر User Gesture حقيقي فقط.
 */
export function initFirstInteraction() {
  if (audioManager.hasInteracted) return;

  const EVENTS = ['pointerdown', 'click', 'touchstart', 'keydown'];

  function onFirst(e) {
    if (audioManager.hasInteracted) return;

    // نقبل فقط التفاعلات الصريحة من المستخدم
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    if ((e.type === 'pointerdown' || e.type === 'mousedown') &&
        typeof e.button === 'number' && e.button > 0) return;
    if (e.type === 'click' && typeof e.button === 'number' && e.button > 0) return;

    audioManager.hasInteracted = true;
    removeFirstInteractionListener();

    // لا مصدر → لا تشغيل
    if (!audioManager.isConfigured) return;

    audioManager.play(true);
  }

  function removeFirstInteractionListener() {
    EVENTS.forEach((t) => window.removeEventListener(t, onFirst, true));
  }

  EVENTS.forEach((t) => window.addEventListener(t, onFirst, { capture: true, passive: true }));
}
