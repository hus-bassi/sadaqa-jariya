/**
 * ============================================================
 *  صدقة جارية — ملف الإعدادات الوحيد
 * ============================================================
 *  غيّر القيم هنا فقط. لا حاجة لتعديل أي ملف آخر.
 */

/**
 * 1) مصدر صوت سورة يس
 * ------------------------------------------------------------
 *ضع ملف MP3 داخل:  assets/audio/yaseen.mp3
 * ثم اترك LOCAL كما هو.
 *
 * أو استخدم رابطًا خارجيًا موثوقًا (https فقط) في REMOTE.
 * الأولوية: LOCAL ثم REMOTE.
 *
 * ⚠️ لا تضع رابطًا غير حقيقي — سيظهر رسالة "تعذر تحميل سورة يس".
 */
/**
 * ============================================================
 *  DERIVED CONFIG — do not edit for customization
 *  All personal values live in:  assets/js/site.config.js
 * ============================================================
 */
import { audio, site, dua, deceased, features, social, tokens, creator } from './site.config.js';

export { tokens, features, social, creator };

export const AUDIO = {
  LOCAL: audio.local,
  REMOTE: audio.remote,
  TITLE: audio.title,
  DEFAULT_VOLUME: audio.volume,
  ENABLED: audio.enabled,
};

/**
 * 2) مصادر نص القرآن الكريم
 * ------------------------------------------------------------
 * [0] = أساسي ، [1] = بديل عند فشل الأول
 * كلاهما من مصادر موثوقة (Quran.com Foundation / AlQuran Cloud).
 * النص لا يُكتب يدويًا ولا يُولَّد — يُجلب من المصدر فقط.
 */
export const QURAN_APIS = {
  PRIMARY: 'https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number={n}',
  FALLBACK: 'https://api.alquran.cloud/v1/surah/{n}/quran-uthmani',
  TIMEOUT_MS: 12000,
};

/** روابط الموقع — اترك SITE_URL فارغًا ليُستخدم الرابط الحالي تلقائيًا */
export const SITE = {
  NAME: site.shortName,
  FULL_NAME: site.title,
  DECEASED: deceased.name,
  SITE_URL: site.url,
  SHARE_TEXT: social.text,
  ABOUT: dua.about,
};

/** بيانات السور — للبطاقات في قسم القرآن */
export const SURAHS = [
  { n: 1, name: 'الفاتحة', place: 'مكية' },
  { n: 36, name: 'يس', place: 'مكية' },
  { n: 108, name: 'الكوثر', place: 'مكية' },
  { n: 112, name: 'الإخلاص', place: 'مكية' },
  { n: 113, name: 'الفلق', place: 'مكية' },
  { n: 114, name: 'الناس', place: 'مكية' },
];

/** مفاتيح التخزين المحلي */
export const STORAGE_KEYS = {
  istighfar: 'istighfarCount',
  salawat: 'salawatCount',
  subhan: 'subhanCount',
  hamd: 'hamdCount',
  akbar: 'akbarCount',
  tahlil: 'tahlilCount',
  volume: 'audioVolume',
  muted: 'audioMuted',
  readerFont: 'readerFont',
  readPos: (n) => `lastReadAyah${n}`,
  /**
   * عدّادات الأذكار الفرعية (كل دعاء وكل صيغة استغفار).
   * تُشتق من مفتاح العدّاد: d0 → count_d0
   */
  count: (key) => `count_${key}`,
};
