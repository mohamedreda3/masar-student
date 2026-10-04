import { useState } from 'react';
import { Logo } from '../components.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { exitTicket, SKILLS } from '../data.js';
import { dingSound, winSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* تذكرة الخروج — سؤال سريع + شعور الطالب (خطوة 8 برحلة الدرس) */
const MOODS = [
  { e: '😊', ar: 'فهمت جيداً' },
  { e: '😐', ar: 'فهمت أغلبه' },
  { e: '😕', ar: 'أحتاج مساعدة' },
];

export default function ExitTicket() {
  const nav = useNavigate();
  const [sel, setSel] = useState(null);
  const [mood, setMood] = useState(null);
  const canGo = sel !== null && mood !== null;

  const finish = () => {
    winSound();
    showToast('أنهيت الدرس! الاختبار القصير فُتح لك', '🔓');
    nav('/quiz/run');
  };

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <div className="focus-bar">
        <div className="container in">
        <Logo h={50} />
          <div className="title">
            <div className="t">🎫 تذكرة الخروج · احتياجاتنا ورغباتنا</div>
            <div className="e">Exit Ticket — quick check before you go</div>
          </div>
          <Link to="/lesson" className="focus-exit">رجوع ⎋</Link>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 860 }}>
        <div className="card activity-card" style={{ marginTop: 30 }}>
          <h2 style={{ marginTop: 0 }}>قبل أن تخرج… سؤال واحد سريع!</h2>
          <div className="en">One quick question before you go</div>

          <div className="q-title" style={{ fontSize: 18 }}>{exitTicket.q}</div>
          <div className="options">
            {exitTicket.options.map((o, oi) => (
              <button key={o} className={'option' + (sel === oi ? ' selected' : '')} onClick={() => { dingSound(); setSel(oi); }}>
                <span className="key">{['أ', 'ب', 'ج', 'د'][oi]}</span>{o}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 26 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>كيف كان شعورك بهذا الدرس؟</div>
            <div className="en" style={{ color: 'var(--mute)', fontSize: 11 }}>How did this lesson feel?</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
              {MOODS.map((m, mi) => (
                <button key={m.ar} onClick={() => { dingSound(); setMood(mi); }}
                  className="option" style={{ flex: 1, flexDirection: 'column', gap: 6, borderColor: mood === mi ? 'var(--brand)' : 'var(--line)', background: mood === mi ? 'var(--blue-soft)' : 'var(--surface)' }}>
                  <span style={{ fontSize: 34 }}>{m.e}</span>
                  <span style={{ fontSize: 13.5 }}>{m.ar}</span>
                </button>
              ))}
            </div>
            {mood === 2 && (
              <div className="explain-box ok" style={{ marginTop: 14 }}>
                <img src="/img/owl.png" alt="" />
                <div><span className="h">لا بأس أبداً!</span> سيصل معلمك إشعار لطيف ليساعدك — وجرّب زر «🛟 أحتاج مساعدة» داخل أي مهارة.</div>
              </div>
            )}
          </div>

          <div className="activity-nav">
            <div className="spacer" />
            <button className="btn btn-primary" onClick={finish} disabled={!canGo} style={{ opacity: canGo ? 1 : 0.5 }}>
              سلّم التذكرة وافتح الاختبار القصير ←
            </button>
          </div>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
