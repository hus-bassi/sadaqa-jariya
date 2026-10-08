# 🤍 صدقة جارية — Islamic Sadaqah Jariyah Template

<div dir="rtl">

**قالب مفتوح المصدر لإنشاء موقع صدقة جارية على روح شخص متوفى.**

هذا مشروع كامل وجاهز للنشر. لا تحتاج إلى تعديل أي كود برمجي — غيّر اسم المتوفى
في ملف واحد، ثم انشر موقعك.

</div>

---

<div dir="rtl">

## ✏️ تغيير اسم المتوفى

**هذا كل ما تحتاجه.** افتح ملفًا واحدًا:

```
assets/js/site.config.js
```

غيّر هذه القيم فقط:

```js
deceased: {
  name: "محمد أحمد علي",   // ← اكتب اسم المتوفى
  gender: "male",          // ← "male" أو "female"
},
```

ثم شغّل البناء:

```bash
npm run build
```

**انتهى.** لا حاجة لتعديل أي HTML أو CSS أو JavaScript آخر — الاسم يتغيّر تلقائيًا
في كل مكان بالموقع: العنوان، والوصف، ونتائج البحث، والهيرو، والفوتر، ونافذة الدعاء،
وزر المشاركة، وكل ذلك.

</div>

---

<div dir="rtl">

## 🚀 البدء السريع (5 دقائق)

### الخطوة 1 — خذ نسخة من المشروع

اضغط زر **Use this template** (أو **Fork**) في أعلى صفحة المستودع على GitHub.

> ⚠️ **لا تحتاج ولا يمكنك الكتابة في المستودع الأصلي.**
> المستودع عام للقراءة والنسخ، لكن نسخة كل شخص مستقلة تمامًا في حسابه، والتغييرات
> تبقى في نسختك ولا تؤثر على أحد.
>
> **الفرق:**
> - **Use this template** ← ينشئ مستودعًا جديدًا باسمك، بدون أي علاقة "forked from". *(مُستحسن)*
> - **Fork** ← ينشئ نسخة مرتبطة بالمستودع الأصلي. مقبول أيضًا.

### الخطوة 2 — عدّل الإعدادات

عدّل هذا الملف في نسختك:

```
assets/js/site.config.js
```

```js
deceased: {
  name: "اسم المتوفى",
  gender: "male",   // "male" أو "female"
},
```

### الخطوة 3 — شغّل المشروع محليًا

```bash
npm run serve
```

ثم افتح: **http://localhost:8080**

> لا يحتاج المشروع إلى `npm install` — لا توجد أي اعتمادات (dependencies).
> Node.js مطلوب فقط لأمر `npm run build` والخادم المحلي.

### الخطوة 4 — انشر موقعك

اضغط زر **Deploy** مع Vercel (الأسهل والمجاني)، أو انشر على أي استضافة ثابتة.

### الخطوة 5 — شارك

انسخ رابط موقعك وشاركه. كل قراءة ودعاء واستغفار يصل الأجر.

</div>

---

## 📋 الأوامر

| الأمر | الوظيفة |
|-------|---------|
| `npm run build` | يبني `index.html` و `main.css` — **يلزم بعد تغيير الإعدادات** |
| `npm run serve` | خادم محلي على المنفذ 8080 |
| `npm run check` | فحص بنية HTML و CSS |
| `npm run verify` | فحص ثابت لوحدات JS ورموز CSS |
| `npm run smoke` | اختبار تشغيل سريع |
| `npm test` | تشغيل كل الاختبارات معًا |

---

## ⚙️ كل خيارات التخصيص

كل شيء في ملف واحد: `assets/js/site.config.js`

| المفتاح | الوظيفة |
|---------|---------|
| `deceased.name` | اسم المتوفى |
| `deceased.gender` | `"male"` أو `"female"` — يغيّر صياغة النصوص الشخصية |
| `site.title` | اتركه فارغًا ويُبنى تلقائيًا |
| `site.description` | اتركه فارغًا ويُبنى تلقائيًا |
| `site.url` | رابط موقعك بعد النشر |
| `dua.intro` | دعاء الهيرو |
| `dua.footer` | دعاء الفوتر |
| `dua.about` | نص قسم "عن هذه الصدقة" |
| `dua.custom` | أدعية إضافية تكتبها أنت |
| `audio.local` | مسار ملف سورة يس المحلي |
| `audio.remote` | رابط خارجي لسورة يس |
| `features.*` | تشغيل أو إيقاف الأقسام |

### ♀️ الجنس وصياغة النصوص

`gender` يغيّر **النصوص الشخصية فقط**:

| | `female` | `male` |
|---|---|---|
| زر الدعاء | ادعُ لها | ادعُ له |
| زر الاستغفار | استغفر لها | استغفر له |
| الخاتمة | رحم الله… رحمةً واسعة | رحم الله… رحمةً واسعة |

> 📖 **النصوص الدينية الثابتة لا تتغيّر أبدًا بتغيّر الجنس.**
> سيد الاستغفار وصيغ الاستغفار وأدعية القرآن موجودة في `assets/js/duas.js`
> وهي نصوص ثابتة موثوقة لا يغيّرها هذا القالب.

### ملفات مثال جاهزة

```
assets/js/site.config.example.js     ← نموذج الإعدادات كاملًا
assets/js/env.local.example.js       ← نموذج الإعدادات المحلية
```

---

## 🎨 الهوية البصرية

الموقع بتصميم **Dark Islamic** واحد — لا يوجد Light Mode ولا زر تبديل.

```css
--bg-primary:    #061C16;   /* الخلفية الأساسية */
--bg-secondary:  #0B3D2E;   /* البطاقات والنوافذ */
--bg-card:       #0E4A38;   /* سطح البطاقة */
--green:         #145A42;
--green-light:   #1B6B50;
--gold:          #C9A227;   /* اللون الذهبي */
--gold-light:    #D8BE63;
--text-primary:  #F8F5EA;   /* لون النص */
--text-secondary:#C7D8D0;
--border-gold:   rgba(201, 162, 39, 0.45);
```

الألوان معرّفة في `assets/css/src/01-tokens-reset.css`. لتغييرها عدّل هناك فقط،
ثم شغّل `npm run build`.
## 🔊 إضافة صوت سورة يس

الملف الصوتي **غير موجود في هذا المستودع** (حجمه كبير، وله ترخيص منفصل). اختر طريقة:

**الطريقة 1 — ملف محلي:**
ضع `yaseen.mp3` داخل `assets/audio/`. المسار مضبوط مسبقًا في الإعدادات.

**الطريقة 2 — رابط خارجي (بدون رفع ملفات كبيرة):**
```js
audio: {
  remote: 'https://example.com/yaseen.mp3',   // https فقط
}
```

**الطريقة 3 — ملف مستبعد من Git:**
```bash
cp assets/js/env.local.example.js assets/js/env.local.js
# ثم عدّل SURAH_YASEEN_AUDIO_URL داخله
```
هذا الملف مُدرج في `.gitignore` فلن يُرفع إلى GitHub.

> إن لم يوجد أي مصدر صوت، يعرض الموقع رسالة واضحة بدل أن يفشل صامتًا.

---

## 🚀 Deploy

### Vercel (الأسهل — مجاني)

1. افتح مستودعك في GitHub ثم تبويب **Deploy**
2. أو: [vercel.com/new](https://vercel.com/new) → استورد المستودع
3. **لا حاجة لأي إعدادات بناء** — المشروع ثابت بالكامل

### Netlify / Cloudflare Pages

ارفع المجلد كما هو، أو اربطه بالمستودع مباشرة. لا أوامر build مطلوبة.

### GitHub Pages

1. Settings → Pages → Source: الفرع `main` / root
2. أنشئ ملفًا فارغًا باسم `.nojekyll` في جذر المستودع

### Apache

المشروع يعمل مباشرة على Apache — ملف `.htaccess` مضبوط مسبقًا
(رؤوس الأمان، الكاش، ضغط gzip، ودعم Range للصوت).

---

## 🛡️ الأمان والخصوصية

- **لا يوجد Backend** — لا قاعدة بيانات، ولا مصادقة، ولا خادم.
- **العدادات تُحفظ في `localStorage`** على جهاز المستخدم وحده، ولا تُرسل لأي جهة.
- **لا يُجمع أي بيان شخصي** ولا يُرسل إلى أي جهة.
- **لا توجد مفاتيح سرية** في المشروع، ولا شيء يُضاف إلى `NEXT_PUBLIC_*` أو ما شابه.
- رؤوس **CSP** و **HSTS** و **X-Frame-Options** موجودة في `_headers` و `.htaccess`.

---

## 📁 هيكل المشروع

```
├── assets/
│   ├── audio/                # ملف سورة يس (اختياري)
│   ├── css/
│   │   ├── main.css          # مُولّد — لا تعدّله مباشرة
│   │   └── src/              # ★ المصدر الحقيقي لـ CSS
│   ├── icons/
│   └── js/
│       ├── site.config.js        # ★★ الملف الوحيد للتخصيص
│       ├── site.config.example.js
│       ├── config.js             # إعدادات مشتقّة (لا تعدّله)
│       ├── duas.js               # النصوص الدينية الثابتة
│       ├── main.js
│       └── ...
├── parts/                    # أجزاء HTML تُدمج في index.html
├── tools/                    # أوامر البناء والفحص
├── .github/                  # قوالب Issues و PR و Workflows
├── index.html                # مُولّد من parts/
├── package.json
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

> **مهم:** لا تعدّل `index.html` أو `assets/css/main.css` مباشرة — كلاهما **مُولَّد**.
> عدّل `parts/` و `assets/css/src/` ثم شغّل `npm run build`.

## 🔊 تجربة سورة يس الصوتية

سورة يس لم تعد قسمًا منفصلًا داخل الصفحة — بل أصبحت **تجربة صوتية للموقع كله**.

```
فتح الموقع
    ↓
لا صوت (لا تشغيل تلقائي عند التحميل)
    ↓
أول تفاعل حقيقي من المستخدم (ضغط)
    ↓
تبدأ سورة يس تلقائيًا
    ↓
يظهر المشغّل العائم أسفل الشاشة
```

<div dir="rtl">

**تعتمد على Browser Autoplay Policy:** لا يبدأ الصوت قبل تفاعل حقيقي من المستخدم،
لأن المتصفحات تمنع التشغيل التلقائي. لا يحاول القالب تجاوز هذه السياسة إطلاقًا.

**بعد أول تشغيل، لا يُعاد التشغيل تلقائيًا أبدًا** — لا عند التمرير، ولا عند فتح
النافذة، ولا عند النسخ أو المشاركة. والمستخدم يتحكم بالكامل:

| التحكم | الوظيفة |
|--------|---------|
| ⏸ / ▶ | إيقاف مؤقت / متابعة |
| ↻ | إعادة من البداية |
| شريط التقدّم | القفز لأي موضع (باللمس أو الفأرة أو لوحة المفاتيح) |
| 🔊 | كتم الصوت + مستوى الصوت |
| × | **إخفاء المشغّل فقط — والصوت يستمر**، ويظهر زر صغير لإعادة إظهاره |

> 🔒 كل تحميل جديد للصفحة يبدأ جلسة جديدة، فينتظر أول تفاعل جديد.

</div>

---

## 👤 الفوتر وحقوق صاحب القالب

الفوتر يعرض حسابات صاحب القالب كما هي محدّدة في `site.config.js`:

```js
creator: {
  name: 'Hussein Mohamed Mostafa Ahmed ElBassiouni',
  social: { facebook: '…', instagram: '…', vk: '…', linkedin: '…',
            github: '…', tiktok: '…', youtube: '…', discord: '…' },
},
```

**بيانات صاحب القالب منفصلة تمامًا عن بيانات المتوفى.** من يستخدم القالب لتلك
الصدقة يغيّر `deceased` فقط ولا يحتاج أن يمس حقوق صاحب القالب.

من يريد استخدام حساباته الخاصة بدلًا منها، يغيّر `creator.social` فقط.

---

## 🧪 قبل النشر

```bash
npm test
```

يشغّل: البناء + فحص البنية + الفحص الثابت + الصوت + العدادات + اختبار الدخان.
كلها يجب أن تنتهي بـ `PASS`.

## 📄 Third-party assets

The MIT license covers **the source code only**. These assets keep their own terms:

| الأصل | المصدر | الترخيص / ملاحظات |
|-------|--------|-------------------|
| نص القرآن الكريم | [Quran.com Foundation](https://quran.com) · [AlQuran Cloud](https://alquran.cloud) | يُجلب أثناء التشغيل. حقوق النص القرآني **غير** مُعطاة بهذا القالب |
| صوت سورة يس | **غير موجود في المستودع** | يجب أن تجلبه أنت من مصدر يسمح الترخيص بإعادة توزيعه |
| خط Cairo | [Google Fonts](https://fonts.google.com/specimen/Cairo) | SIL Open Font License 1.1 |
| خط Amiri Quran | [Google Fonts](https://fonts.google.com/specimen/Amiri+Quran) | SIL Open Font License 1.1 |
| مكتبة qrcodejs | [cdnjs](https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/) | MIT |
| الأيقونات وصورة OG | `assets/icons/` | مرفقة — يمكن توليدها من `og-template.html` |

**⚠️ تحقّق من ترخيص أي أصل تنشره.** هذا القالب لا يمنح حقوقًا على النص القرآني
ولا على التسجيلات الصوتية.

---

## 🤝 المساهمة

المساهمات مرحب بها. اقرأ [CONTRIBUTING.md](CONTRIBUTING.md).

القواعد المهمة:
- 🔒 لا تضف أي مفاتيح سرية أو Tokens
- 📖 لا تعدّل النص القرآني أو الأحاديث إلا بمصدر موثوق يمكن التحقق منه
- ✅ لا تنقض ضمانات الخصوصية (لا تتبّع، لا Backend، لا بيانات شخصية)
- 🌙 لا تعِد بإضافة Light Mode — التصميم الداكن هو الوحيد بالتصميم

---

## 🔐 لماذا المستودع عام لكنه محمي؟

المستودع **Public** يستطيع أي شخص قراءته واستنساخه واستخدامه كقالب،
لكن **لا يستطيع أحد الكتابة فيه مباشرة**. هذا يحقق المعادلة:

```
Template (عام + محمي)
      ↓  Use this template
مستودع المستخدم (مستقل تمامًا)
      ↓  عدّل site.config.js
موقع الصدقة الخاص به
```

**لا تحتاج إلى إذن من أحد، ولا يستطيع أحد العبث بنسختك.**

لدمج تعديل في القالب الأصلي: افتح Issue أو Pull Request.
نسختك تبقى مستقلة في كل الأحوال.

---

## 📄 License

الكود المصدري: [MIT](LICENSE) — اقرأ ملاحظة النطاق داخل الملف بشأن الأصول الخارجية.

---

## English

**An open-source template for creating a Sadaqah Jariyah website for a deceased person.**

A complete, ready-to-deploy website. To use it, change one value in one file —
no component editing required.

### Quick start

```bash
# 1. Click "Use this template" on GitHub (or Fork)
# 2. Edit assets/js/site.config.js:
#      deceased: { name: "Your Loved One", gender: "male" }
npm run build      # regenerate index.html + main.css
npm run serve      # preview at http://localhost:8080
# 3. Deploy — Vercel / Netlify / GitHub Pages (static site, no build needed)
```

### Key points

- **One config file** — `assets/js/site.config.js`
- **Dark theme only** — no light mode, no theme toggle
- **Fully static** — no backend, no database, no authentication
- **Counters stored locally** — `localStorage`, never transmitted
- **Gender-aware** — `gender: "male" | "female"` adjusts personal wording only;
  Quranic text and hadith are never altered
- **Zero dependencies** — plain HTML/CSS/JS

### Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Regenerate `index.html` + `main.css` |
| `npm run serve` | Local server on port 8080 |
| `npm test` | Run all checks |

### Repository model

Public but protected: anyone may view, fork, or use it as a template; nobody can
push to the main repository. If you need a change merged, open a Pull Request —
your own fork stays fully independent either way.

---

<div dir="rtl">

**نسأل الله أن يتقبل هذا العمل، وأن يجعله في ميزان حسنات كل من ينتفع به.**

</div>
---

---"# sadaqah_jariya_hamsa_mohams-" 
