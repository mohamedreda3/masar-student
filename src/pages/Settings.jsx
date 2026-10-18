import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { StatsBar, FooterStrip, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome } from '../api/useApi.js';
import { applyPrefs } from '../prefs.js';
import { clickSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* حسابي والإعدادات — GET /settings · الحفظ: PATCH /settings بالحقل المتغيّر فقط (تفاؤلي، ويرجع للقيمة عند الفشل)
   تعديل الملف: PATCH /auth/profile (multipart user_image) · كلمة المرور: PATCH /auth/change-password */

const field = { fontFamily: 'inherit', fontSize: 14, padding: '11px 14px', borderRadius: 12, border: '2px solid var(--line)', background: 'var(--white)', color: 'var(--ink)', width: '100%' };
const FieldErr = ({ m }) => (m ? <div style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 700, marginTop: 4 }}>{m}</div> : null);

/* نافذة عامة */
function Modal({ title, en, onClose, children, foot }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div><div className="t">{title}</div><div className="e">{en}</div></div>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>{children}</div>
        <div className="modal-foot">{foot}</div>
      </div>
    </div>,
    document.body,
  );
}

/* تغيير كلمة المرور */
function PasswordModal({ onClose }) {
  const [v, setV] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV(x => ({ ...x, [k]: e.target.value }));
  const save = async () => {
    setErrs({});
    if (v.new_password !== v.confirm_password) return setErrs({ confirm_password: 'كلمتا المرور غير متطابقتين' });
    setBusy(true);
    try {
      const r = await api.changePassword(v.current_password, v.new_password, v.confirm_password);
      showToast(r?.message || 'تم تغيير كلمة المرور', '✅');
      onClose();
    } catch (ex) { setErrs(ex.fields || {}); showToast(ex.message, '⚠️'); setBusy(false); }
  };
  const ok = v.current_password && v.new_password && v.confirm_password;
  return (
    <Modal title="تغيير كلمة المرور" en="Change Password" onClose={onClose}
      foot={<button className="btn btn-primary" disabled={!ok || busy} onClick={save} style={{ opacity: ok ? 1 : 0.5 }}>{busy ? '…' : 'حفظ'}</button>}>
      {[['current_password', 'كلمة المرور الحالية'], ['new_password', 'كلمة المرور الجديدة'], ['confirm_password', 'تأكيد كلمة المرور الجديدة']].map(([k, ph]) => (
        <div key={k}>
          <input type="password" dir="ltr" placeholder={ph} value={v[k]} onChange={set(k)} style={{ ...field, ...(errs[k] ? { borderColor: 'var(--danger)' } : {}) }} />
          <FieldErr m={errs[k]} />
        </div>
      ))}
    </Modal>
  );
}

/* تعديل الملف — الصورة (user_image) */
function ProfileModal({ profile, onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const preview = file ? URL.createObjectURL(file) : profile?.image || '/img/avatar-boy.png';
  const save = async () => {
    setBusy(true); setErrs({});
    try {
      const r = await api.updateProfile({ user_image: file });
      showToast(r?.message || 'تم تحديث ملفك', '✅');
      onSaved(); onClose();
    } catch (ex) { setErrs(ex.fields || {}); showToast(ex.message, '⚠️'); setBusy(false); }
  };
  return (
    <Modal title="تعديل الملف" en="Edit Profile" onClose={onClose}
      foot={<button className="btn btn-primary" disabled={!file || busy} onClick={save} style={{ opacity: file ? 1 : 0.5 }}>{busy ? '…' : 'حفظ'}</button>}>
      <div style={{ textAlign: 'center' }}>
        <img src={preview} alt="" style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--line)' }} />
      </div>
      <label className="btn btn-ghost" style={{ cursor: 'pointer', textAlign: 'center' }}>
        📷 اختر صورة جديدة
        <input type="file" accept="image/*" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
      </label>
      <FieldErr m={errs.user_image} />
      <div style={{ fontSize: 12, color: 'var(--mute)', textAlign: 'center' }}>باقي بياناتك يديرها معلمك والمدرسة.</div>
    </Modal>
  );
}

export default function Settings() {
  const { data: D, error, loading, reload } = useApi(() => api.settings(), []);
  const { data: prof, reload: reloadProf } = useApi(() => api.profile().catch(() => null), []);
  const { reload: reloadHome, home } = useHome();
  const tier = home?.tier;
  const [s, setS] = useState(null);              // نسخة محلية للتعديل التفاؤلي
  const [modal, setModal] = useState(null);      // 'password' | 'profile'
  useEffect(() => { if (D) setS(D); }, [D]);

  /* حفظ حقل واحد: تحديث تفاؤلي → PATCH → دمج الرد أو التراجع */
  const save = async (patch, optimistic, revert) => {
    clickSound();
    optimistic();
    try {
      const r = await api.saveSettings(patch);
      if (r) setS(x => ({ ...x, ...(r.notifications ? { notifications: r.notifications } : {}), ...(r.privacy ? { privacy: r.privacy } : {}), ...(r.appearance ? { appearance: r.appearance } : {}) }));
      if (r?.appearance) applyPrefs(r.appearance);
    } catch (ex) { revert(); showToast(ex.message, '⚠️'); }
  };

  if (error) return <div className="page"><StatsBar /><div className="container"><Empty t={error.message} e="Could not load settings" /></div></div>;

  const P = s?.profile || {};
  const N = s?.notifications || {};
  const PR = s?.privacy || {};
  const A = s?.appearance || {};
  const me = prof?.student || {};
  const meta = [me.performance_level?.label, tier && `سنوات دراسة العربية: ${tier.arabic_years_now}`, tier?.label, P.school?.name].filter(Boolean).join(' · ');

  const toggle = (k) => {
    const old = N[k];
    save({ [k]: !old }, () => setS(x => ({ ...x, notifications: { ...x.notifications, [k]: !old } })), () => setS(x => ({ ...x, notifications: { ...x.notifications, [k]: old } })));
  };
  const setAppearance = (k, val, key) => {
    const old = A[k];
    const prev = s.appearance;
    save({ [k]: key }, () => { setS(x => ({ ...x, appearance: { ...x.appearance, [k]: val } })); applyPrefs({ [k]: val }); },
      () => { setS(x => ({ ...x, appearance: prev })); applyPrefs({ [k]: old }); });
  };
  const setVisibility = (key) => {
    const old = PR.portfolio_visibility;
    const opt = PR.visibility_options?.find(o => o.key === key);
    save({ portfolio_visibility: key }, () => setS(x => ({ ...x, privacy: { ...x.privacy, portfolio_visibility: opt } })), () => setS(x => ({ ...x, privacy: { ...x.privacy, portfolio_visibility: old } })));
  };

  const NOTIF = [['daily_reminder', 'تذكير يومي بالمهام'], ['teacher_notifications', 'إشعارات المعلم'], ['achievement_notifications', 'إشعارات الإنجازات']];
  const Skel = () => <div style={{ height: 14, borderRadius: 8, background: 'var(--line2)', margin: '12px 0', width: '70%' }} />;

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
          <div className="av"><img src={P.image || '/img/avatar-boy.png'} alt="" /></div>
          <div style={{ flex: 1 }}>
            {loading && !s ? <><Skel /><Skel /></> : <>
              <div style={{ fontWeight: 900, fontSize: 19 }}>{P.name}</div>
              <div style={{ fontSize: 11, color: 'var(--mute)' }}><span dir="ltr">{[P.student_code, P.user_name].filter(Boolean).join(' · ')}</span></div>
              {meta && <div style={{ fontSize: 12.5, color: 'var(--ink2)', marginTop: 4 }}>{meta}</div>}
            </>}
          </div>
          <button className="btn btn-ghost" onClick={() => { clickSound(); setModal('profile'); }}>تعديل الملف</button>
        </div>

        <div className="settings-grid">
          {/* المعلومات الشخصية */}
          <div className="setting-card">
            <h3><img src="/img/gear.png" alt="" />المعلومات الشخصية</h3>
            <div className="en">Personal Information</div>
            {loading && !s && <><Skel /><Skel /><Skel /></>}
            {(s?.personal_info || []).map(r => (
              <div className="setting-row" key={r.key}><span>{r.label}</span><span style={{ fontWeight: 400, direction: r.key.includes('email') ? 'ltr' : undefined }}>{r.value ?? '—'}</span></div>
            ))}
            <div className="setting-row"><span>كلمة المرور</span><button className="btn-sm" onClick={() => { clickSound(); setModal('password'); }}>تغيير</button></div>
          </div>

          {/* تفضيلات التنبيهات */}
          <div className="setting-card">
            <h3><img src="/img/bell.png" alt="" />تفضيلات التنبيهات</h3>
            <div className="en">Notification Preferences</div>
            {NOTIF.map(([k, l]) => (
              <div className="setting-row" key={k}>
                <span>{l}</span>
                <button className={'toggle' + (N[k] ? ' on' : '')} disabled={!s} onClick={() => toggle(k)} aria-label={l} aria-pressed={!!N[k]} />
              </div>
            ))}
          </div>

          {/* المظهر */}
          <div className="setting-card">
            <h3><img src="/img/lamp.png" alt="" />المظهر</h3>
            <div className="en">Appearance</div>
            <div style={{ padding: '10px 0', borderBottom: '1px solid var(--line2)' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink2)', marginBottom: 4 }}>تدرجات ألوان منصتك ✨</div>
              <div className="theme-swatches">
                {(A.themes || []).map(t => (
                  <div key={t.key} className={'theme-swatch' + (A.theme?.key === t.key ? ' active' : '')}>
                    <button className="dot" style={{ background: `linear-gradient(135deg, ${t.colors?.[0]}, ${t.colors?.[1] || t.colors?.[0]})` }}
                      onClick={() => A.theme?.key !== t.key && setAppearance('theme', t, t.key)} aria-label={t.label} />
                    <div className="l">{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <span>الوضع الداكن 🌙</span>
              <button className={'toggle' + (A.dark_mode ? ' on' : '')} disabled={!s} onClick={() => setAppearance('dark_mode', !A.dark_mode, !A.dark_mode)} aria-label="الوضع الداكن" aria-pressed={!!A.dark_mode} />
            </div>
            <div className="setting-row">
              <span>حجم النص</span>
              <span className="size-pills">
                {(A.font_sizes || []).map(f => (
                  <button key={f.key} className={'size-pill' + (A.font_size?.key === f.key ? ' active' : '')} style={{ direction: 'ltr' }}
                    onClick={() => A.font_size?.key !== f.key && setAppearance('font_size', f, f.key)}>{f.label}</button>
                ))}
              </span>
            </div>
            <div className="setting-row">
              <span>لغة الواجهة</span>
              <select value={A.language?.key || ''} onChange={e => { const l = A.languages?.find(x => x.key === e.target.value); setAppearance('language', l, e.target.value); }}
                style={{ ...field, width: 'auto', padding: '7px 10px', fontSize: 13 }}>
                {(A.languages || []).map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
              </select>
            </div>
          </div>

          {/* الخصوصية والأمان */}
          <div className="setting-card">
            <h3><img src="/img/shield.png" alt="" />الخصوصية والأمان</h3>
            <div className="en">Privacy &amp; Security</div>
            <div className="setting-row">
              <span>من يرى ملف أعمالي</span>
              <select value={PR.portfolio_visibility?.key || ''} onChange={e => setVisibility(e.target.value)} style={{ ...field, width: 'auto', padding: '7px 10px', fontSize: 13 }}>
                {(PR.visibility_options || []).map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <div className="setting-row"><span>الأجهزة المتصلة</span><span style={{ fontWeight: 400 }}>{PR.devices?.label ?? '—'}</span></div>
            <div className="setting-row"><span>الدعم والمساعدة</span><Link to="/support"><button className="btn-sm">تواصل معنا</button></Link></div>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="حسابك آمن ومحفوظ – ركّز على التعلم ونحن نهتم بالباقي"
        en="Your account is safe — focus on learning and we handle the rest!"
      />
      {modal === 'password' && <PasswordModal onClose={() => setModal(null)} />}
      {modal === 'profile' && <ProfileModal profile={P} onClose={() => setModal(null)} onSaved={() => { reload(); reloadProf(); reloadHome(); }} />}
    </div>
  );
}
