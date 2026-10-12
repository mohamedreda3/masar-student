import { useState } from 'react';
import { StatsBar, FooterStrip } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome } from '../api/useApi.js';
import { Link } from 'react-router-dom';
import { clickSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* تدرجات الألوان — الطالب يلوّن منصته (تُحفظ بجهازه) */
const THEMES = [
  { key: 'blue',    ar: 'مسار الأزرق',  grad: 'linear-gradient(135deg, #0d7a42, #1d6fe0)' },
  { key: 'pink',    ar: 'زهري وموف 🌸', grad: 'linear-gradient(135deg, #a21caf, #ec4899)' },
  { key: 'purple',  ar: 'بنفسجي 💜',    grad: 'linear-gradient(135deg, #5b21b6, #8b5cf6)' },
  { key: 'coral',   ar: 'مرجاني 🌅',    grad: 'linear-gradient(135deg, #e11d48, #fb923c)' },
  { key: 'gold',    ar: 'ذهبي ⭐',      grad: 'linear-gradient(135deg, #b45309, #fbbf24)' },
  { key: 'emerald', ar: 'زمردي 🌿',     grad: 'linear-gradient(135deg, #047857, #34d399)' },
  { key: 'teal',    ar: 'تركواز 🌊',    grad: 'linear-gradient(135deg, #0f766e, #14b8a6)' },
  { key: 'sky',     ar: 'سماوي ☁️',     grad: 'linear-gradient(135deg, #0369a1, #38bdf8)' },
  { key: 'indigo',  ar: 'نيلي 🌌',      grad: 'linear-gradient(135deg, #3730a3, #818cf8)' },
];

function ThemePicker() {
  const [active, setActive] = useState(() => {
    try { return localStorage.getItem('masar-theme') || 'blue'; } catch { return 'blue'; }
  });
  const pick = (key) => {
    clickSound();
    setActive(key);
    if (key === 'blue') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = key;
    try { key === 'blue' ? localStorage.removeItem('masar-theme') : localStorage.setItem('masar-theme', key); } catch { /* كماليّ */ }
  };
  return (
    <div className="theme-swatches">
      {THEMES.map(t => (
        <div key={t.key} className={'theme-swatch' + (active === t.key ? ' active' : '')}>
          <button className="dot" style={{ background: t.grad }} onClick={() => pick(t.key)} aria-label={t.ar} />
          <div className="l">{t.ar}</div>
        </div>
      ))}
    </div>
  );
}

const FS_MAP = { 'A-': 'sm', 'A': null, 'A+': 'lg' };

/* تغيير كلمة المرور — يفتح داخل بطاقة المعلومات الشخصية */
function PasswordForm({ onClose }) {
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return showToast('كلمة المرور الجديدة 8 أحرف على الأقل', '⚠️');
    setBusy(true);
    try {
      await api.changePassword(cur, pw);
      showToast('تم تغيير كلمة المرور', '✅');
      onClose();
    } catch (ex) { showToast(ex.message, '⚠️'); setBusy(false); }
  };
  const inp = { width: '100%', marginTop: 8, direction: 'ltr' };
  return (
    <form onSubmit={save} style={{ padding: '10px 0', borderBottom: '1px solid var(--line2)' }}>
      <input className="eng-input" type="password" required placeholder="كلمة المرور الحالية" value={cur} onChange={e => setCur(e.target.value)} style={inp} />
      <input className="eng-input" type="password" required placeholder="كلمة المرور الجديدة" value={pw} onChange={e => setPw(e.target.value)} style={inp} />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn-sm" type="submit" disabled={busy}>{busy ? '…' : 'حفظ'}</button>
        <button className="btn-sm" type="button" onClick={onClose} style={{ background: 'var(--line2)', color: 'var(--ink2)' }}>إلغاء</button>
      </div>
    </form>
  );
}

export default function Settings() {
  const { data: prof } = useApi(() => api.profile(), []);
  const me = prof?.student || {};
  const tier = useHome().home?.tier;
  const [pwOpen, setPwOpen] = useState(false);
  const [size, setSize] = useState(() => {
    try {
      const v = localStorage.getItem('masar-fs');
      return v === 'sm' ? 'A-' : v === 'lg' ? 'A+' : 'A';
    } catch { return 'A'; }
  });
  const pickSize = (s) => {
    clickSound();
    setSize(s);
    const v = FS_MAP[s];
    if (v) document.documentElement.dataset.fs = v;
    else delete document.documentElement.dataset.fs;
    try { v ? localStorage.setItem('masar-fs', v) : localStorage.removeItem('masar-fs'); } catch { /* كماليّ */ }
  };
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('masar-mode') === 'dark'; } catch { return false; }
  });
  const toggleDark = () => {
    clickSound();
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.mode = 'dark';
    else delete document.documentElement.dataset.mode;
    try { next ? localStorage.setItem('masar-mode', 'dark') : localStorage.removeItem('masar-mode'); } catch { /* كماليّ */ }
  };
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>حسابي والإعدادات</h1>
          <div className="en">Account &amp; Settings</div>
        </div>
        <div className="tag">بياناتك وتفضيلاتك.</div>
      </div>
      <div className="container" style={{ marginTop: 26 }}>
        <div className="profile-card">
          <div className="av"><img src={me.user_image || '/img/logo-masar.svg'} alt="" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 19 }}>{me.name}</div>
            <div style={{ fontSize: 11, color: 'var(--mute)' }}>{me.student_code} · {me.user_name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink2)', marginTop: 4 }}>
              {[me.performance_level?.label, tier && `سنوات دراسة العربية: ${tier.arabic_years_now}`, tier?.label].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={() => { clickSound(); showToast('بيانات الملف يديرها معلمك والمدرسة', '🔒'); }}>تعديل الملف</button>
        </div>

        <div className="settings-grid">
          <div className="setting-card">
            <h3><img src="/img/gear.png" alt="" />المعلومات الشخصية</h3>
            <div className="en">Personal Information</div>
            <div className="setting-row"><span>الاسم الكامل</span><span style={{ fontWeight: 400 }}>{me.name}</span></div>
            <div className="setting-row"><span>البريد الإلكتروني</span><span style={{ fontWeight: 400, direction: 'ltr' }}>{me.user_email}</span></div>
            <div className="setting-row"><span>ولي الأمر</span><span style={{ fontWeight: 400 }}>{me.guardian_name}</span></div>
            <div className="setting-row"><span>المدينة</span><span style={{ fontWeight: 400 }}>{me.city}</span></div>
            <div className="setting-row"><span>كلمة المرور</span><button className="btn-sm" onClick={() => { clickSound(); setPwOpen(v => !v); }}>تغيير</button></div>
            {pwOpen && <PasswordForm onClose={() => setPwOpen(false)} />}
          </div>

          <div className="setting-card">
            <h3><img src="/img/bell.png" alt="" />تفضيلات التنبيهات</h3>
            <div className="en">Notification Preferences</div>
            {['تذكير يومي بالمهام', 'إشعارات المعلم', 'إشعارات الإنجازات'].map((s, i) => (
              <div className="setting-row" key={s}>
                <span>{s}</span>
                <span className={'toggle' + (i < 2 ? ' on' : '')} />
              </div>
            ))}
          </div>

          <div className="setting-card">
            <h3><img src="/img/lamp.png" alt="" />المظهر</h3>
            <div className="en">Appearance</div>
            <div style={{ padding: '10px 0', borderBottom: '1px solid var(--line2)' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink2)', marginBottom: 4 }}>تدرجات ألوان منصتك ✨</div>
              <ThemePicker />
            </div>
            <div className="setting-row">
              <span>الوضع الداكن 🌙</span>
              <button className={'toggle' + (dark ? ' on' : '')} onClick={toggleDark} aria-label="الوضع الداكن" />
            </div>
            <div className="setting-row">
              <span>حجم النص</span>
              <span className="size-pills">
                {['A-', 'A', 'A+'].map(s => (
                  <button key={s} className={'size-pill' + (size === s ? ' active' : '')} onClick={() => pickSize(s)} style={{ direction: 'ltr' }}>{s}</button>
                ))}
              </span>
            </div>
            <div className="setting-row">
              <span>لغة الواجهة</span>
              <span style={{ fontWeight: 400 }}>عربي مع ترجمة إنكليزية</span>
            </div>
          </div>

          <div className="setting-card">
            <h3><img src="/img/shield.png" alt="" />الخصوصية والأمان</h3>
            <div className="en">Privacy &amp; Security</div>
            <div className="setting-row"><span>من يرى ملف أعمالي</span><span style={{ fontWeight: 400 }}>المعلمون فقط</span></div>
            <div className="setting-row"><span>الأجهزة المتصلة</span><span style={{ fontWeight: 400 }}>جهاز واحد</span></div>
            <div className="setting-row"><span>الدعم والمساعدة</span><Link to="/support"><button className="btn-sm">تواصل معنا</button></Link></div>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="حسابك آمن ومحفوظ – ركّز على التعلم ونحن نهتم بالباقي"
        en="Your account is safe — focus on learning and we handle the rest!"
      />
    </div>
  );
}
