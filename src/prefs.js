/* تفضيلات المظهر (الثيم · الوضع الداكن · حجم الخط · اللغة) — من GET /api/student/settings → appearance
   تُطبَّق على <html> فوراً، وتُحفظ نسخة في localStorage لتجنّب الوميض حتى يرجع الطلب */

const KEY = 'masar-prefs';

/* مفاتيح الـAPI → ثيمات التصميم الموجودة (data-theme) */
const THEME_MAP = { masar_blue: 'blue', pink: 'pink', violet: 'purple', coral: 'coral', gold: 'gold', emerald: 'emerald', turquoise: 'teal', sky: 'sky', indigo: 'indigo' };
const FS_MAP = { small: 'sm', normal: null, large: 'lg' };

export function readPrefs() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

/* p = { theme: { key, colors }, dark_mode, font_size: { key, scale }, language: { key } } (أو مفاتيح نصية) */
export function applyPrefs(p = {}, { save = true } = {}) {
  const html = document.documentElement;
  const themeKey = typeof p.theme === 'string' ? p.theme : p.theme?.key;
  if (themeKey) {
    const t = THEME_MAP[themeKey] || themeKey;
    if (t === 'blue') delete html.dataset.theme; else html.dataset.theme = t;
    const colors = p.theme?.colors;
    if (colors?.length) { html.style.setProperty('--primary-from', colors[0]); html.style.setProperty('--primary-to', colors[1] || colors[0]); }
  }
  if (typeof p.dark_mode === 'boolean') {
    html.classList.toggle('dark', p.dark_mode);
    if (p.dark_mode) html.dataset.mode = 'dark'; else delete html.dataset.mode;
  }
  const fsKey = typeof p.font_size === 'string' ? p.font_size : p.font_size?.key;
  if (fsKey !== undefined) {
    const fs = FS_MAP[fsKey];
    if (fs) html.dataset.fs = fs; else delete html.dataset.fs;
  }
  const lang = typeof p.language === 'string' ? p.language : p.language?.key;
  if (lang) html.classList.toggle('ar-only', lang === 'ar');   // «عربي فقط» → إخفاء الترجمة الإنجليزية الصغيرة
  if (save) {
    const cur = readPrefs();
    const next = {
      ...cur,
      ...(themeKey ? { theme: { key: themeKey, colors: p.theme?.colors || cur.theme?.colors } } : {}),
      ...(typeof p.dark_mode === 'boolean' ? { dark_mode: p.dark_mode } : {}),
      ...(fsKey !== undefined ? { font_size: fsKey } : {}),
      ...(lang ? { language: lang } : {}),
    };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* بلا تخزين */ }
  }
}
