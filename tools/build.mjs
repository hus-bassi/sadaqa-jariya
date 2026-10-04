import fs from 'fs';
import path from 'path';
import { tokens, creator, SOCIAL_ORDER } from '../assets/js/site.config.js';
import { icon } from '../assets/js/icons.js';

const SOCIAL_LABEL = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  vk: 'VK',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  discord: 'Discord',
};

/**
 * شعارات التواصل في الفوتر — تُبنى هنا من creator.social في site.config.js
 * حتى تظهر في HTML نفسه (تعمل بدون JavaScript وتعمل عند فتح الملف مباشرة).
 * main.js لا يكرّرها: هو فقط يملأها إن كانت فارغة.
 */
function renderSocialRow() {
  const keys = SOCIAL_ORDER.filter((k) => creator.social && creator.social[k]);
  if (!keys.length) return '';
  return keys
    .map((key) => {
      const url = String(creator.social[key]).replace(/"/g, '&quot;');
      const label = SOCIAL_LABEL[key] || key;
      return (
        '<li><a class="social-link" href="' + url + '" target="_blank" rel="noopener noreferrer"' +
        ' aria-label="' + label + '" title="' + label + '">' + icon(key, 18) + '</a></li>'
      );
    })
    .join('\n      ');
}

/** حقوق صاحب القالب — السنة تُحسب وقت البناء */
function renderFooterCopy() {
  if (!creator.copyright) return '';
  return (
    '© ' + new Date().getFullYear() + ' ' + creator.name +
    '<span class="footer-copy-sub">جميع الحقوق محفوظة — All Rights Reserved</span>'
  );
}

const partsDir = 'parts';
const files = fs.readdirSync(partsDir).filter((f) => f.endsWith('.html')).sort();

if (!files.length) {
  console.error('لا توجد أجزاء في parts/');
  process.exit(1);
}

// استبدال رموز الإعدادات {{key}} بقيم assets/js/site.config.js
// هذا ما يجعل تغيير اسم المتوفى لا يحتاج لتعديل أي HTML
const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
const used = new Set();

function render(html, source) {
  return html.replace(TOKEN_RE, (match, key) => {
    if (!(key in tokens)) {
      console.error(`رمز غير معروف {{${key}}} في ${source}`);
      process.exit(1);
    }
    used.add(key);
    return String(tokens[key]);
  });
}

let out = files
  .map((f) => render(fs.readFileSync(path.join(partsDir, f), 'utf8'), f).trim())
  .join('\n');

// تحقّق: لا يجوز أن يبقى أي رمز {{ }} في الناتج
const leftover = out.match(/\{\{[^}]*\}\}/g);
if (leftover) {
  console.error('رموز لم تُستبدل: ' + [...new Set(leftover)].join(', '));
  process.exit(1);
}

/* ---------- بناء مسبق لعناصر الفوتر (تعمل بدون JS) ---------- */
out = out
  .replace(
    /<ul class="social-row" id="socialRow"[^>]*><\/ul>/,
    () =>
      '<ul class="social-row" id="socialRow" aria-label="حسابات صاحب القالب">\n      ' +
      renderSocialRow() +
      '\n    </ul>'
  )
  .replace(
    /<p class="footer-copy" id="footerCopy"><\/p>/,
    () => '<p class="footer-copy" id="footerCopy">' + renderFooterCopy() + '</p>'
  );

fs.writeFileSync('index.html', out + '\n', 'utf8');

console.log('built index.html from ' + files.length + ' parts');
console.log(files.map((f) => '  - ' + f).join('\n'));
console.log('size: ' + out.length + ' chars');
console.log('config tokens applied: ' + [...used.keys()].sort().join(', '));
