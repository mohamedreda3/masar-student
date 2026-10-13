import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { StatsBar, SecHead, FooterStrip, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { clickSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* موارد الدعم — GET /support?skill_id= → { tabs, resources, tickets, ticket_categories, teacher }
   تذكرة جديدة: POST /support/tickets · متابعة: POST /support/tickets/:id/messages
   سؤال للمعلم: POST /support/teacher-questions · أسئلتي للمعلم: GET /support/tickets?to=teacher */

const ST_TICKET = { open: 'قادمة', answered: 'مكتملة', closed: 'قادمة' };
const isUrl = (s) => typeof s === 'string' && /^(https?:|\/|data:)/.test(s);
const fieldStyle = { fontFamily: 'inherit', fontSize: 14, padding: '11px 14px', borderRadius: 12, border: '2px solid var(--line)', background: 'var(--white)', color: 'var(--ink)' };

/* بطاقة تذكرة + المحادثة والرد (عند الفتح) */
function TicketCard({ tk, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try { const r = await api.ticketMessage(tk.id, msg.trim()); onUpdate(r); setMsg(''); showToast('تم إرسال ردّك', '✉'); }
    catch (ex) { showToast(ex.message, '⚠️'); }
    setBusy(false);
  };
  const st = tk.status?.key;
  return (
    <div className="fb-card" style={{ marginBottom: 14 }}>
      <div className="fb-head" onClick={() => { clickSound(); setOpen(o => !o); }} style={{ cursor: 'pointer' }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--lav-soft)', display: 'grid', placeItems: 'center', fontSize: 20 }}>{tk.to === 'teacher' ? '👩‍🏫' : '🎫'}</div>
        <div>
          <div className="n">{tk.title}</div>
          <div className="e">{[tk.code, tk.category?.label, tk.time_ago].filter(Boolean).join(' · ')}</div>
        </div>
        <span className={'st-chip ' + (ST_TICKET[st] || 'قادمة')} style={{ marginInlineStart: 'auto' }}>
          {st === 'open' ? 'قيد المراجعة' : tk.status?.label}
        </span>
      </div>
      {tk.reply && (
        <div className="fb-block good" style={{ marginTop: 10 }}>
          <span className="l">💬 {tk.reply.from_label}{tk.reply.time_ago ? ` · ${tk.reply.time_ago}` : ''}</span>
          {tk.reply.message}
        </div>
      )}
      {open && (
        <div style={{ marginTop: 12 }}>
          {(tk.conversation || []).map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: c.is_mine ? 'flex-start' : 'flex-end', marginTop: 8 }}>
              <div style={{ maxWidth: '82%', padding: '9px 13px', borderRadius: 14, background: c.is_mine ? 'var(--lav-soft)' : 'var(--green-soft)', fontSize: 13.5, lineHeight: 1.8 }}>
                {!c.is_mine && c.sender_name && <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--mute)' }}>{c.sender_name}</div>}
                {c.message}
              </div>
            </div>
          ))}
          {st !== 'closed' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="اكتب ردّك…" style={{ ...fieldStyle, flex: 1 }} />
              <button className="btn btn-primary" disabled={busy || !msg.trim()} onClick={send} style={{ opacity: msg.trim() ? 1 : 0.5 }}>{busy ? '…' : 'إرسال'}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* نافذة «أرسل سؤالاً» لمعلمك */
function AskTeacher({ teacher, onClose, onSent }) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  const send = async () => {
    setBusy(true);
    try { const r = await api.askTeacher(msg.trim()); showToast('تم إرسال سؤالك إلى معلمك', '✉'); onSent(r); onClose(); }
    catch (ex) { showToast(ex.message, '⚠️'); setBusy(false); }
  };
  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-head">
          <div><div className="t">✉ سؤال إلى {teacher?.name || 'معلمك'}</div><div className="e">Ask your teacher</div></div>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <textarea autoFocus value={msg} onChange={e => setMsg(e.target.value)} placeholder="اكتب سؤالك هنا…"
          style={{ ...fieldStyle, width: '100%', lineHeight: 1.9, minHeight: 120, resize: 'vertical' }} />
        <div className="modal-foot">
          <button className="btn btn-primary" disabled={busy || !msg.trim()} onClick={send} style={{ opacity: msg.trim() ? 1 : 0.5 }}>{busy ? '…' : 'أرسل السؤال'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function Support() {
  const [skillId, setSkillId] = useState(null);
  const { data: D, error, loading } = useApi(() => api.support({ skill_id: skillId }), [skillId]);
  const { data: TQ } = useApi(() => api.tickets({ to: 'teacher' }).catch(() => null), []);
  const [tickets, setTickets] = useState([]);
  const [teacherQs, setTeacherQs] = useState([]);
  const [cat, setCat] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);

  useEffect(() => { if (D) { setTickets(D.tickets || []); if (!cat && D.ticket_categories?.[0]) setCat(D.ticket_categories[0].key); } }, [D]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (TQ) setTeacherQs(Array.isArray(TQ) ? TQ : TQ.items || TQ.tickets || []); }, [TQ]);

  const submit = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      const r = await api.newTicket(cat, msg.trim());
      setTickets(t => [r.ticket || r, ...t]);
      setMsg('');
      showToast('وصلت تذكرتك! سيردّ عليك فريق الدعم قريباً', '🎫');
    } catch (ex) { showToast(ex.message, '⚠️'); }
    setBusy(false);
  };
  const T = D?.teacher;
  const resources = D?.resources || [];

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
        {error && <Empty t={error.message} e="Could not load support" />}
        {(D?.tabs || []).length > 1 && (
          <div className="filters">
            {D.tabs.map(x => (
              <button key={x.key} className={'filter' + ((skillId ?? null) === (x.skill_id ?? null) ? ' active' : '')} onClick={() => { clickSound(); setSkillId(x.skill_id ?? null); }}>
                <span>{x.label} ({x.count})<span className="en">{x.label_en}</span></span>
              </button>
            ))}
          </div>
        )}

        <SecHead ico="/img/lamp.png" ar="مصادر تساعدك" en="Resources for You" />
        {!loading && !error && !resources.length && <Empty t="لا توجد مصادر بعد" e="No resources yet" d="ستظهر هنا المصادر التي يضيفها معلمك والمنصة." />}
        <div className="more-grid">
          {resources.map(r => {
            const color = r.skills?.[0]?.color || r.color || 'var(--brand)';
            const body = (
              <>
                <div className="head">
                  <div className="ico">{isUrl(r.icon) ? <img src={r.icon} alt="" /> : <span style={{ fontSize: 30 }}>{r.icon || '📘'}</span>}</div>
                  <div>
                    <h3>{r.title}</h3>
                    {r.title_en && <div className="en">{r.title_en}</div>}
                  </div>
                </div>
                {r.description && <div className="d">{r.description}</div>}
                <div className="arr" style={{ color: r.url ? color : 'var(--mute2)' }}>{r.link_label ? `${r.link_label} ›` : r.url ? 'افتح ›' : 'غير متاح'}{r.file_type ? ` · ${r.file_type.toUpperCase()}` : ''}</div>
              </>
            );
            return r.url
              ? <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="more-card" onClick={clickSound}>{body}</a>
              : <div key={r.id} className="more-card" style={{ opacity: 0.7, cursor: 'default' }}>{body}</div>;
          })}
        </div>

        {/* التذاكر */}
        <SecHead ico="/img/speech.png" ar="الدعم والتذاكر" en="Support Tickets" />
        <div className="grid-main" style={{ marginTop: 0 }}>
          <div className="col">
            {!loading && !tickets.length && <Empty t="لا توجد تذاكر بعد" e="No tickets yet" d="افتح تذكرة إن واجهتك مشكلة أو لديك اقتراح." />}
            {tickets.map(tk => <TicketCard key={tk.id} tk={tk} onUpdate={(u) => setTickets(ts => ts.map(x => (x.id === tk.id ? (u.ticket || u) : x)))} />)}
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
                <select value={cat} onChange={e => setCat(e.target.value)} style={{ ...fieldStyle, fontWeight: 700 }}>
                  {(D?.ticket_categories || []).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="اشرح مشكلتك أو سؤالك هنا…"
                  style={{ ...fieldStyle, lineHeight: 1.9, minHeight: 100, resize: 'vertical' }} />
                <button className="btn btn-primary" disabled={busy || !msg.trim()} onClick={submit} style={{ opacity: msg.trim() ? 1 : 0.5 }}>{busy ? '…' : '🎫 أرسل التذكرة'}</button>
              </div>
            </div>
          </div>
        </div>

        {/* أسئلتي لمعلمي */}
        {teacherQs.length > 0 && <>
          <SecHead ico="/img/teacher.png" ar={`أسئلتي لمعلمي (${teacherQs.length})`} en="My Questions to My Teacher" />
          {teacherQs.map(tk => <TicketCard key={tk.id} tk={tk} onUpdate={(u) => setTeacherQs(ts => ts.map(x => (x.id === tk.id ? (u.ticket || u) : x)))} />)}
        </>}

        {T && (
          <div className="card next-card" style={{ marginTop: 34, borderTopColor: 'var(--teal)' }}>
            <img src={T.image || '/img/teacher.png'} alt="" style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            <div className="body">
              <h3>تحتاج مساعدة إضافية؟ تواصل مع معلمك</h3>
              <div className="en">Need more help? Contact your teacher</div>
              <div className="d">{T.name}{T.response_text ? ` — ${T.response_text}` : ''}</div>
            </div>
            <div className="actions">
              <button className="btn btn-primary" onClick={() => { clickSound(); setAsk(true); }}>✉ أرسل سؤالاً</button>
            </div>
          </div>
        )}
      </div>
      <FooterStrip
        ar="اطلب المساعدة متى احتجتها – هذا من شطارة المتعلم"
        en="Asking for help is what smart learners do!"
      />
      {ask && <AskTeacher teacher={T} onClose={() => setAsk(false)} onSent={(r) => { const t = r?.ticket || r; if (t?.id) setTeacherQs(q => [t, ...q]); }} />}
    </div>
  );
}
