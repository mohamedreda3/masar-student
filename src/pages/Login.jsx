import { useState } from 'react';
import api, { setToken } from '../api/client.js';
import { showToast } from '../toast.js';

/* زر إظهار/إخفاء كلمة المرور */
function PassInput({ value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="login-pass">
      <input className="login-input" type={show ? 'text' : 'password'} dir="ltr" required autoComplete={autoComplete}
        placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
      <button type="button" className="login-eye" onClick={() => setShow(v => !v)} aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          {show && <line x1="3" y1="3" x2="21" y2="21" />}
        </svg>
      </button>
    </div>
  );
}

/* رمز الاستعادة قد يصل كرابط: #/login?reset_token=… */
const tokenFromUrl = () => new URLSearchParams(location.hash.split('?')[1] || '').get('reset_token') || '';

/* تسجيل دخول الطالب — نفس تصميم شاشة دخول لوحة المدرسة (شعار + شعار نصي يساراً، النموذج يميناً)
   mode: login → forgot (إرسال الرمز بالبريد/واتساب) → reset (الرمز + كلمة مرور جديدة) */
export default function Login() {
  const [mode, setMode] = useState(tokenFromUrl() ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [channel, setChannel] = useState('email');
  const [code, setCode] = useState(tokenFromUrl());
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const go = (m) => { setMode(m); setErr(''); setPassword(''); };
  const run = async (fn) => {
    setErr(''); setBusy(true);
    try { await fn(); } catch (ex) { setErr(ex.message); }
    setBusy(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'login') return run(async () => {
      const d = await api.login(email.trim(), password);
      setToken(d.token, remember);
      location.hash = '#/'; location.reload(); // إعادة تحميل لجلب بيانات الطالب
    });
    if (mode === 'forgot') return run(async () => {
      await api.forgotPassword(email.trim(), channel);
      showToast(channel === 'email' ? 'أرسلنا رمز الاستعادة إلى بريدك' : 'أرسلنا رمز الاستعادة على واتساب', '📩');
      go('reset');
    });
    return run(async () => {
      if (password.length < 8) throw new Error('كلمة المرور الجديدة 8 أحرف على الأقل');
      await api.resetPassword(code.trim(), password);
      showToast('تم تغيير كلمة المرور — سجّل الدخول الآن', '✅');
      location.hash = '#/login';
      go('login');
    });
  };

  const SUB = {
    login: 'سجّل الدخول باسم المستخدم أو البريد الإلكتروني',
    forgot: 'أدخل بريدك أو اسم المستخدم أو كود الطالب لنرسل لك رمز الاستعادة',
    reset: 'أدخل رمز الاستعادة الذي وصلك وكلمة المرور الجديدة',
  };
  const BTN = { login: 'تسجيل الدخول', forgot: 'إرسال رمز الاستعادة', reset: 'تغيير كلمة المرور' };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={submit}>
        <h1 className="login-title">{mode === 'login' ? 'تسجيل الدخول' : 'استعادة كلمة المرور'}</h1>
        <span className="login-rule" />
        <p className="login-sub">{SUB[mode]}</p>

        {mode !== 'reset' && (
          <input className="login-input" type="text" dir="ltr" required autoComplete="username"
            placeholder={mode === 'login' ? 'اسم المستخدم أو البريد الإلكتروني' : 'البريد أو اسم المستخدم أو الهاتف أو كود الطالب'}
            value={email} onChange={e => setEmail(e.target.value)} />
        )}

        {mode === 'login' && <PassInput value={password} onChange={setPassword} placeholder="كلمة المرور" autoComplete="current-password" />}

        {mode === 'forgot' && (
          <div className="login-tabs" role="radiogroup" aria-label="طريقة الإرسال">
            {[['email', '✉️ البريد الإلكتروني'], ['whatsapp', '💬 واتساب']].map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={channel === k}
                className={'login-tab' + (channel === k ? ' on' : '')} onClick={() => setChannel(k)}>{l}</button>
            ))}
          </div>
        )}

        {mode === 'reset' && (
          <>
            <input className="login-input" type="text" dir="ltr" required autoComplete="one-time-code"
              placeholder="رمز الاستعادة" value={code} onChange={e => setCode(e.target.value)} />
            <PassInput value={password} onChange={setPassword} placeholder="كلمة المرور الجديدة" autoComplete="new-password" />
          </>
        )}

        <div className="login-row">
          {mode === 'login' ? (
            <>
              <label className="login-check">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                <span className="box">✓</span>
                تذكرني
              </label>
              <a href="#!" className="login-forgot" onClick={(e) => { e.preventDefault(); go('forgot'); }}>نسيت كلمة المرور؟</a>
            </>
          ) : (
            <>
              <a href="#!" className="login-forgot" onClick={(e) => { e.preventDefault(); go('login'); }}>→ العودة لتسجيل الدخول</a>
              {mode === 'forgot'
                ? <a href="#!" className="login-forgot" onClick={(e) => { e.preventDefault(); go('reset'); }}>لديّ رمز بالفعل</a>
                : <a href="#!" className="login-forgot" onClick={(e) => { e.preventDefault(); go('forgot'); }}>إعادة إرسال الرمز</a>}
            </>
          )}
        </div>

        {err && <div className="login-err">{err}</div>}

        <button className="login-btn" type="submit" disabled={busy}>{busy ? '…' : BTN[mode]}</button>
      </form>

      <div className="login-brand">
        <img src="/img/logo-masar.svg" alt="مسار العربية — مسارك نحو إتقان العربية" />
        <p>مِن هنا تُدرك الواقع، تَستشرف الغد.</p>
        <p>تَتعلم، تَتطور، تُنمي مَهاراتك.</p>
        <p>تَبتكر، تُبدع، تَنجح، تُحقق أهدافك.</p>
      </div>
    </div>
  );
}
