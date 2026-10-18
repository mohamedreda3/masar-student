import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { applyPrefs, readPrefs } from './prefs.js';

/* تحميل ثيم الطالب المحفوظ قبل الرسم */
try {
  const qs = new URLSearchParams(location.search); // ?theme=pink&mode=dark للتجربة والعروض
  const t = qs.get('theme') || localStorage.getItem('masar-theme');
  if (t && t !== 'blue') document.documentElement.dataset.theme = t;
  const m = qs.get('mode') || localStorage.getItem('masar-mode');
  if (m === 'dark') document.documentElement.dataset.mode = 'dark';
  const f = qs.get('fs') || localStorage.getItem('masar-fs');
  if (f === 'sm' || f === 'lg') document.documentElement.dataset.fs = f;
  // تفضيلات الحساب المحفوظة من آخر جلسة (الثيم/الداكن/الخط/اللغة) — قبل أول رسم
  applyPrefs(readPrefs(), { save: false });
} catch { /* بلا تخزين؟ الافتراضي يكفي */ }

/* أي صورة لا تُحمَّل (رابط مكسور أو فارغ) تُستبدل بشعار مسار */
export const FALLBACK_IMG = '/img/logo-masar.svg';
document.addEventListener('error', (e) => {
  const img = e.target;
  if (img.tagName !== 'IMG' || img.dataset.fallback) return;
  img.dataset.fallback = '1';
  img.classList.add('img-fallback');
  img.src = FALLBACK_IMG;
}, true);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
