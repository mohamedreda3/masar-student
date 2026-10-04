import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip } from '../components.jsx';
import { supportResources, SKILLS, student, myTickets } from '../data.js';

const ST_TICKET = { 'مفتوحة': 'جارية', 'تم الرد': 'مكتملة', 'مغلقة': 'قادمة' };

/* 🎫 دعم الطالب — فتح تذكرة + سجل تذاكره */
function Tickets() {
  const [tickets, setTickets] = useState(myTickets);
  const [subj, setSubj] = useState('');
  const [type, setType] = useState('مشكلة تقنية');
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!subj.trim()) return;
    setTickets(t => [{ id: 'T-' + (105 + t.length), subj: subj.trim(), type, t: 'الآن', status: 'مفتوحة' }, ...t]);
    setSubj('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <>
      <SecHead ico="/img/speech.png" ar="الدعم والتذاكر" en="Support Tickets" />
      <div className="grid-main" style={{ marginTop: 0 }}>
        <div className="col">
          {tickets.map(tk => (
            <div className="fb-card" key={tk.id} style={{ marginBottom: 14 }}>
              <div className="fb-head">
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--lav-soft)', display: 'grid', placeItems: 'center', fontSize: 20 }}>🎫</div>
                <div>
                  <div className="n">{tk.subj}</div>
                  <div className="e">{tk.id} · {tk.type} · {tk.t}</div>
                </div>
                <span className={'st-chip ' + ST_TICKET[tk.status]} style={{ marginInlineStart: 'auto' }}>{tk.status}</span>
              </div>
              {tk.reply && (
                <div className="fb-block good" style={{ marginTop: 10 }}>
                  <span className="l">💬 ردّ فريق الدعم</span>
                  {tk.reply}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="col">
          <div className="side-card">
            <div className="badges-head">
              <div>
                <h3>افتح تذكرة جديدة</h3>
                <div className="en">Open a New Ticket</div>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              <select value={type} onChange={e => setType(e.target.value)}
                style={{ fontFamily: 'inherit', fontSize: 14, fontWeight: 700, padding: '11px 14px', borderRadius: 12, border: '2px solid var(--line)', background: 'var(--white)', color: 'var(--ink)' }}>
                <option>مشكلة تقنية</option>
                <option>سؤال عن درس</option>
                <option>مشكلة في حسابي</option>
                <option>اقتراح</option>
              </select>
              <textarea value={subj} onChange={e => setSubj(e.target.value)} placeholder="اشرح مشكلتك أو سؤالك هنا…"
                style={{ fontFamily: 'inherit', fontSize: 14, lineHeight: 1.9, padding: '12px 14px', borderRadius: 12, border: '2px solid var(--line)', minHeight: 100, resize: 'vertical' }} />
              <button className="btn btn-primary" onClick={submit} style={{ opacity: subj.trim() ? 1 : 0.5 }}>🎫 أرسل التذكرة</button>
              {sent && (
                <div className="explain-box ok" style={{ marginTop: 4 }}>
                  <img src="/img/owl.png" alt="" />
                  <div><span className="h">وصلت تذكرتك!</span> سيردّ عليك فريق الدعم أو معلمك خلال يوم دراسي.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const FILTERS = ['الكل', 'القراءة', 'الاستماع', 'التحدث', 'المفردات', 'القواعد'];

/* غلاف: رابط إذا كان للمورد صفحة، وإلا كرت عادي */
function Wrap({ to, children }) {
  return to
    ? <Link to={to} className="more-card">{children}</Link>
    : <div className="more-card" style={{ cursor: 'pointer' }}>{children}</div>;
}

export default function Support() {
  const [f, setF] = useState('الكل');
  const shown = supportResources.filter(r => f === 'الكل' || SKILLS[r.skill].ar === f);
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>موارد الدعم</h1>
          <div className="en">Support Resources</div>
        </div>
        <div className="tag">أدوات ومواد تساعدك على التعلّم — في أي وقت.</div>
      </div>
      <div className="container">
        <div className="filters">
          {FILTERS.map(x => (
            <button key={x} className={'filter' + (f === x ? ' active' : '')} onClick={() => setF(x)}>
              <span>{x}</span>
            </button>
          ))}
        </div>
        <SecHead ico="/img/lamp.png" ar="مصادر تساعدك" en="Resources for You" />
        <div className="more-grid">
          {shown.map(r => (
            <Wrap key={r.ar} to={r.ar === 'كتب وقصص' ? '/library' : null}>
              <div className="head">
                <div className="ico"><img src={r.ico} alt="" /></div>
                <div>
                  <h3>{r.ar}</h3>
                  <div className="en">{r.en}</div>
                </div>
              </div>
              <div className="d">{r.d}</div>
              <div className="arr" style={{ color: SKILLS[r.skill].color }}>‹ {SKILLS[r.skill].ar}</div>
            </Wrap>
          ))}
        </div>

        <Tickets />

        <div className="card next-card" style={{ marginTop: 34, borderTopColor: 'var(--teal)' }}>
          <img src="/img/teacher.png" alt="" style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <div className="body">
            <h3>تحتاج مساعدة إضافية؟ تواصل مع معلمك</h3>
            <div className="en">Need more help? Contact your teacher</div>
            <div className="d">{student.teacher.ar} ستجيبك خلال يوم دراسي واحد.</div>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => document.querySelector('.ticket-form, form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>✉ أرسل سؤالاً</button>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="اطلب المساعدة متى احتجتها – هذا من شطارة المتعلم"
        en="Asking for help is what smart learners do!"
      />
    </div>
  );
}
