/**
 * ================================================================
 *  ✏️  ملف الإعدادات الوحيد  —  SITE CONFIG
 * ================================================================
 *  غيّر القيم داخل "✏️ غيّر هذه البيانات فقط" فقط.
 *  لا تحتاج لتعديل أي HTML أو CSS أو JavaScript آخر.
 *  بعد التعديل شغّل:  npm run build
 * ================================================================
 */

/** جنس المتوفى — يغيّر صياغة النصوص الشخصية فقط (لا نصوص القرآن ولا الأحاديث) */
export const GENDER = {
  male: {
    for: 'له',       // صيغة الـ lam: "اغفر له"
    obj: 'ه',       // صيغة الـ obj: "وارحمه" / "أسكنه"
    qabr: 'قبره',
    Ahl: 'أهله',
    soul: 'روحه',
    dua: 'ادعُ له',
    istighfar: 'استغفر له',
    actions: 'ادعُ له واستغفر له',
  },
  female: {
    for: 'لها',
    obj: 'ها',
    qabr: 'قبرها',
    ahl: 'أهلها',
    soul: 'روحها',
    dua: 'ادعُ لها',
    istighfar: 'استغفر لها',
    actions: 'ادعُ لها واستغفر لها',
  },
};

/* ================================================================
 *  ✏️  غيّر هذه البيانات فقط
 * ================================================================ */
export const siteConfig = {
  /* --- 1) المتوفى --------------------------------------------- */
  deceased: {
    /** اكتب اسم المتوفى هنا — مثال: "والدة يوسف عادل" أو "محمد أحمد علي" */
    name: 'والدة يوسف عادل',
    /** "male" أو "female" — يغيّر صياغة النصوص الشخصية فقط */
    gender: 'female',
  },

  /* --- 2) معلومات الموقع --------------------------------------- */
  site: {
    shortName: 'صدقة جارية',
    /** اتركه فارغًا وسيُبنى تلقائيًا: "صدقة جارية على روح <الاسم>" */
    title: '',
    /** اتركه فارغًا وسيُبنى تلقائيًا */
    description: '',
    /** رابط الموقع بعد النشر — مثال: 'https://my-sadaqah.vercel.app' (بلا / نهائي) */
    url: '',
    keywords: 'صدقة جارية, دعاء للمتوفى, استغفار, سورة يس, ذكر الله, قرآن كريم',
  },

  /* --- 3) الأدعية الشخصية (قابلة للتعديل) ----------------------- */
  dua: {
    /** اتركها فارغة ليبقى النص الافتراضي المناسب للجنس */
    intro: '',
    footer: '',
    about: '',
    /** أدعية إضافية تكتبها أنت — تُضاف لبطاقات الدعاء */
    custom: [],
  },

  /* --- 4) الصوت (سورة يس) -------------------------------------- */
  audio: {
    enabled: true,
    title: 'سورة يس',
    /** ملف محلي: ضعه في assets/audio/yaseen.mp3 */
    local: 'assets/audio/yaseen.mp3',
    /** أو رابط خارجي موثوق يبدأ بـ https — له الأولوية على المحلي */
    remote: '',
    volume: 0.4,
  },

  /* --- 5) الأقسام والميزات ------------------------------------- */
  features: {
    quran: true,    // قسم + قارئ القرآن
    audio: true,    // مشغل سورة يس
    counters: true, // عدادات الذكر
    share: true,    // مشاركة و QR
  },

  /* --- 6) المشاركة --------------------------------------------- */
  social: {
    enabled: true,
    text: '', // اتركه فارغًا وسيُبنى تلقائيًا
  },

  /* --- 7) صاحب القالب -------------------------------------------
     ⚠️ بيانات صاحب القالب — منفصلة تمامًا عن بيانات المتوفى.
     مستخدمو القالب يغيّرون deceased فقط ولا يحتاجون لتعديل هذا.
     من يستخدم القالب كنسخة خاصة يمكنه تغيير هذه البيانات لحسابه.
     ------------------------------------------------------------- */
  creator: {
    name: 'Hussein Mohamed Mostafa Ahmed ElBassiouni',
    copyright: true,
    templateName: 'Islamic Sadaqah Jariyah Template',
    social: {
      facebook: 'https://www.facebook.com/hus.bassi/',
      instagram: 'https://www.instagram.com/hus_bassi/',
      vk: 'https://vk.ru/hus.bassi',
      linkedin: 'https://www.linkedin.com/in/hus-bassi/',
      github: 'https://github.com/hus-bassi',
      tiktok: 'https://www.tiktok.com/@hus_bassi',
      youtube: 'https://www.youtube.com/channel/UCmh6wrbfJ-0VYL1e7kl8nMw',
      discord: 'https://discord.gg/hywgCBEZPv',
    },
  },
};
/* ================================================================
 *  لا تحتاج إلى تعديل ما بعد هذا السطر
 * ================================================================ */

const cfg = siteConfig;
const g = GENDER[cfg.deceased.gender] || GENDER.female;
const name = String(cfg.deceased.name || 'المتوفى').trim();

/** إعدادات اختيارية من ملف محلي (مستثنى من Git) — انظر README */
const env = (typeof globalThis !== 'undefined' && globalThis.SADAQAH_ENV) || {};

export const deceased = {
  name,
  gender: cfg.deceased.gender,
  greeting: `على روح ${name}`,
  duaLabel: g.dua,
  istighfarLabel: g.istighfar,
  actions: g.actions,
  mercy: `رحم الله ${name} رحمةً واسعة 🤍`,
};

export const site = {
  shortName: cfg.site.shortName,
  title: cfg.site.title || `${cfg.site.shortName} ${deceased.greeting}`,
  description: cfg.site.description ||
    `${cfg.site.shortName} ${deceased.greeting} للدعاء والاستغفار والذكر وقراءة سورة يس.`,
  url: String(cfg.site.url || '').replace(/\/+$/, ''),
  keywords: cfg.site.keywords,
};

export const audio = {
  enabled: cfg.audio.enabled,
  title: cfg.audio.title,
  local: cfg.audio.local,
  remote: env.SURAH_YASEEN_AUDIO_URL || cfg.audio.remote,
  volume: cfg.audio.volume,
};

export const dua = {
  intro: cfg.dua.intro ||
    `اللهم اغفر ${g.for} وارحم${g.obj}، ونوّر ${g.qabr}، واجعل${g.obj} من أهل الجنة.`,
  footer: cfg.dua.footer ||
    `اللهم اغفر ${g.for} وارحم${g.obj} وأسكن${g.obj} فسيح جناتك.`,
  about: cfg.dua.about ||
    `هذا الموقع ${cfg.site.shortName} ${deceased.greeting}، نسأل الله أن يتقبلها، ` +
    `وأن يجعل فيه دعاءً واستغفارًا وذكرًا يصل نفعه إلى ${g.soul}، ` +
    `وأن يغفر ${g.for} ويرحم${g.obj} ويسكن${g.obj} فسيح جناته.`,
  custom: Array.isArray(cfg.dua.custom) ? cfg.dua.custom.filter(Boolean) : [],
};

export const features = { ...cfg.features };
export const social = {
  enabled: cfg.social.enabled,
  text: cfg.social.text || `${site.title} — ${dua.intro}`,
};

/** ترتيب شعارات التواصل كما تظهر في الفوتر */
export const SOCIAL_ORDER = [
  'facebook', 'instagram', 'vk', 'linkedin',
  'github', 'tiktok', 'youtube', 'discord',
];

/** بيانات صاحب القالب — منفصلة عن بيانات المتوفى */
export const creator = {
  name: cfg.creator.name,
  copyright: cfg.creator.copyright !== false,
  templateName: cfg.creator.templateName || 'Islamic Sadaqah Jariyah Template',
  social: Object.fromEntries(
    SOCIAL_ORDER
      .filter((k) => cfg.creator.social && cfg.creator.social[k])
      .map((k) => [k, cfg.creator.social[k]])
  ),
};

/**
 * خريطة رموز نصّية تُستبدل في HTML عند البناء ({{key}}).
 * نفس الخريطة تُستخدم في المتصفح كشبكة أمان.
 */
export const tokens = {
  'deceased.name': deceased.name,
  'deceased.gender': deceased.gender,
  'deceased.greeting': deceased.greeting,
  'deceased.duaLabel': deceased.duaLabel,
  'deceased.istighfarLabel': deceased.istighfarLabel,
  'deceased.actions': deceased.actions,
  'deceased.mercy': deceased.mercy,
  'site.shortName': site.shortName,
  'site.title': site.title,
  'site.description': site.description,
  'site.url': site.url,
  'site.keywords': site.keywords,
  'dua.intro': dua.intro,
  'dua.footer': dua.footer,
  'dua.about': dua.about,
  'share.text': social.text,
  'audio.title': audio.title,
  'creator.name': creator.name,
  'creator.template': creator.templateName,
  'creator.year': String(new Date().getFullYear()),
};

export default siteConfig;