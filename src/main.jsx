import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

/* تحميل ثيم الطالب المحفوظ قبل الرسم */
try {
  const qs = new URLSearchParams(location.search); // ?theme=pink&mode=dark للتجربة والعروض
  const t = qs.get('theme') || localStorage.getItem('masar-theme');
  if (t && t !== 'blue') document.documentElement.dataset.theme = t;
  const m = qs.get('mode') || localStorage.getItem('masar-mode');
  if (m === 'dark') document.documentElement.dataset.mode = 'dark';
  const f = qs.get('fs') || localStorage.getItem('masar-fs');
  if (f === 'sm' || f === 'lg') document.documentElement.dataset.fs = f;
} catch { /* بلا تخزين؟ الافتراضي يكفي */ }

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
