import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { clickSound } from '../sounds.js';
import { showToast } from '../toast.js';
import { MyPlanCard } from './SupportPlans.jsx';
import { openFile } from '../FileViewer.jsx';

/* موارد الدعم — GET /support?skill_id= → { tabs, resources (source: teacher|platform), ticket_categories, teacher }
   تذاكري: GET /support/tickets?to=support|teacher · تذكرة: POST /support/tickets { category, message, title? }
   سؤال للمعلم: POST /support/teacher-questions { message, title? } · متابعة: POST /support/tickets/:id/messages
   ?ticket=ID يفتح التذكرة مباشرة (من الإشعارات) · إعادة الجلب عند رجوع التركيز للصفحة */

const isUrl = (s) => typeof s === 'string' && /^(https?:|\/|data:)/.test(s);
const fieldStyle = { fontFamily: 'inherit', fontSize: 14, padding: '11px 14px', borderRadius: 12, border: '2px solid var(--line)', background: 'var(--white)', color: 'var(--ink)', width: '100%' };
const unwrap = (r) => r?.ticket || r;
const listOf = (d) => (Array.isArray(d) ? d : d?.items || d?.tickets || []);

/* حالة التذكرة → كلاس الشارة */
const ST = { open: { cls: 'جارية', t: 'قيد المراجعة' }, answered: { cls: 'مكتملة', t: 'تم الرد' }, closed: { cls: 'قادمة', t: 'مغلقة' } };
/* من ردّ؟ */
const FROM = {
  support: { ico: '🛟', t: 'فريق الدعم', c: 'var(--teal)' },
  teacher: { ico: '👩‍🏫', t: 'معلمك', c: 'var(--purple)' },
  school:  { ico: '🏫', t: 'إدارة المدرسة', c: 'var(--orange)' },
  student: { ico: '🙋', t: 'أنت', c: 'var(--brand)' },
};
const FILE_ICO = { pdf: '📕', video: '🎬', audio: '🎧', image: '🖼', link: '🔗', doc: '📘', docx: '📘', ppt: '📙', pptx: '📙' };

/* ===== درج المحادثة ===== */
function TicketDrawer({ tk, onClose, onUpdate }) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [onClose]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [tk.conversation?.length]);
  const closed = tk.status?.key === 'closed';
  const send = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try { const r = await api.ticketMessage(tk.id, msg.trim()); onUpdate(unwrap(r)); setMsg(''); showToast(r?.message || 'تم إرسال ردّك', '✉'); }
    catch (ex) { showToast(ex.message, '⚠️'); }
    setBusy(false);
  };
  const conv = tk.conversation?.length ? tk.conversation : [{ id: 'm', is_mine: true, from: 'student', message: tk.message, created_at: tk.created_at }];
  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" style={{ justifyContent: 'flex-start', alignItems: 'stretch', padding: 0 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(480px, 100vw)', height: '100vh', background: 'var(--surface)', display: 'flex', flexDirection: 'column', boxShadow: '0 0 40px rgba(0,0,0,.25)', marginInlineStart: 'auto' }}>
        <div className="modal-head" style={{ padding: '18px 20px', borderBottom: '1px solid var(--line2)' }}>
          <div>
            <div className="t">{tk.title}</div>
            <div className="e">{[tk.code, tk.category?.label, tk.time_ago].filter(Boolean).join(' · ')}</div>
          {tk.teacher?.name && <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--teal)', marginTop: 2 }}>إلى: أ. {tk.teacher.name}</div>}
          </div>
          <span className={'st-chip ' + (ST[tk.status?.key]?.cls || 'قادمة')}>{ST[tk.status?.key]?.t || tk.status?.label}</span>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
          {conv.map(c => {
            const F = FROM[c.from] || (c.is_mine ? FROM.student : FROM.support);
            return (
              <div key={c.id} style={{ display: 'flex', justifyContent: c.is_mine ? 'flex-start' : 'flex-end', marginBottom: 10 }}>
                <div style={{ maxWidth: '84%', padding: '10px 14px', borderRadius: 16, background: c.is_mine ? 'var(--lav-soft)' : 'var(--green-soft)', fontSize: 14, lineHeight: 1.85 }}>
                  {!c.is_mine && <div style={{ fontSize: 11, fontWeight: 900, color: F.c }}>{F.ico} {F.t}{c.sender_name ? ` · ${c.sender_name}` : ''}</div>}
                  {c.message}
                  {c.created_at && <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 2 }}>{new Date(c.created_at).toLocaleString('ar-EG-u-nu-latn', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
                </div>
              </div>
            );
          })}
          <div ref={end} />
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line2)' }}>
          {closed ? <div style={{ textAlign: 'center', color: 'var(--mute)', fontWeight: 800 }}>🔒 التذكرة مغلقة</div> : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="اكتب متابعتك…" rows={2} style={{ ...fieldStyle, resize: 'vertical' }} />
              <button className="btn btn-primary" disabled={busy || !msg.trim()} onClick={send} style={{ opacity: msg.trim() ? 1 : 0.5 }}>{busy ? '…' : 'إرسال'}</button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* بطاقة تذكرة في القائمة */
function TicketRow({ tk, onOpen }) {
  const R = tk.reply;
  const F = R ? (FROM[R.from] || FROM.support) : null;
  return (
    <div className="fb-card" style={{ marginBottom: 14, cursor: 'pointer' }} onClick={() => { clickSound(); onOpen(tk); }}>
      <div className="fb-head">
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--lav-soft)', display: 'grid', placeItems: 'center', fontSize: 20 }}>{tk.to === 'teacher' ? '👩‍🏫' : '🎫'}</div>
        <div>
          <div className="n">{tk.title}</div>
          <div className="e">{[tk.code, tk.category?.label, tk.time_ago].filter(Boolean).join(' · ')}</div>
        </div>
        <span className={'st-chip ' + (ST[tk.status?.key]?.cls || 'قادمة')} style={{ marginInlineStart: 'auto' }}>{ST[tk.status?.key]?.t || tk.status?.label}</span>
      </div>
      {R && (
        <div className="fb-block good" style={{ marginTop: 10 }}>
          <span className="l">{F.ico} {R.from_label || F.t}{R.time_ago ? ` · ${R.time_ago}` : ''}</span>
          {R.message}
        </div>
      )}
    </div>
  );
}

export default function Support() {
  const [qs, setQs] = useSearchParams();
  const [skillId, setSkillId] = useState(null);
  const { data: D, error, loading, reload } = useApi(() => api.support({ skill_id: skillId }), [skillId]);
  const [tab, setTab] = useState('support');
  const { data: TD, error: tErr, loading: tLoading, reload: reloadTickets } = useApi(() => api.tickets({ to: tab }), [tab]);
  const [tickets, setTickets] = useState([]);
  const [openTk, setOpenTk] = useState(null);
  // تذكرة جديدة
  const [cat, setCat] = useState('');
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  // سؤال المعلم
  const [qTitle, setQTitle] = useState('');
  const [qMsg, setQMsg] = useState('');
  const [qBusy, setQBusy] = useState(false);

  useEffect(() => { setTickets(listOf(TD)); }, [TD]);
  useEffect(() => { if (!cat && D?.ticket_categories?.[0]) setCat(D.ticket_categories[0].key); }, [D]); // eslint-disable-line react-hooks/exhaustive-deps

  // إعادة الجلب عند رجوع التركيز للصفحة (ردود جديدة)
  const refresh = useCallback(() => { reload(); reloadTickets(); }, [reload, reloadTickets]);
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState !== 'hidden') refresh(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); };
  }, [refresh]);

  // ?ticket=ID من الإشعارات → افتح التذكرة (نبحث في التابين)
  const deep = qs.get('ticket');
  useEffect(() => {
    if (!deep) return;
    let alive = true;
    Promise.all(['support', 'teacher'].map(to => api.tickets({ to }).then(listOf).catch(() => [])))
      .then(([s, t]) => {
        if (!alive) return;
        const hit = s.find(x => String(x.id) === deep) || t.find(x => String(x.id) === deep);
        if (hit) { setTab(hit.to === 'teacher' ? 'teacher' : 'support'); setOpenTk(hit); }
      });
    return () => { alive = false; };
  }, [deep]);
  const closeTk = () => { setOpenTk(null); if (deep) { qs.delete('ticket'); setQs(qs, { replace: true }); } };
  const updateTk = (u) => { if (!u?.id) return; setTickets(ts => ts.map(x => (x.id === u.id ? u : x))); setOpenTk(u); };

  const submit = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      const r = await api.newTicket(cat, msg.trim(), title.trim());
      const t = unwrap(r);
      if (tab === 'support' && t?.id) setTickets(ts => [t, ...ts]); else setTab('support');
      setMsg(''); setTitle('');
      showToast(r?.message || 'وصلت تذكرتك! سيردّ عليك فريق الدعم قريباً', '🎫');
    } catch (ex) { showToast(ex.message, '⚠️'); }
    setBusy(false);
  };
  const [tId, setTId] = useState(null);
  const askTeacher = async () => {
    if (!qMsg.trim()) return;
    setQBusy(true);
    try {
      const r = await api.askTeacher(qMsg.trim(), qTitle.trim(), T?.id);
      const t = unwrap(r);
      if (tab === 'teacher' && t?.id) setTickets(ts => [t, ...ts]); else setTab('teacher');
      setQMsg(''); setQTitle('');
      showToast(r?.message || 'تم إرسال سؤالك إلى معلمك', '✉');
    } catch (ex) { showToast(ex.message, '⚠️'); }
    setQBusy(false);
  };

  // أكثر من معلم → اختيار (الافتراضي الأساسي)
  const teachers = D?.teachers?.length ? D.teachers : D?.teacher ? [D.teacher] : [];
  const T = teachers.find(t => t.id === tId) || teachers.find(t => t.is_main) || teachers[0];
  // موارد المعلم أولاً
  const resources = [...(D?.resources || [])].sort((a, b) => (a.source === 'teacher' ? 0 : 1) - (b.source === 'teacher' ? 0 : 1));

  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>موارد الدعم</h1>
          <div className="en">Support Resources</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span className="tag">أدوات ومواد تساعدك على التعلّم — في أي وقت.</span>
          <Link to="/support-plan" className="btn btn-ghost" style={{ padding: '9px 18px', fontSize: 13.5 }}>🧭 خطة الدعم الخاصة بي</Link>
        </div>
      </div>
      <div className="container">
        {error && <Empty t={error.message} e="Could not load support" />}
        {/* خطتي للتحسن — تظهر فقط لو فيه خطة نشطة */}
        <MyPlanCard />

        {(D?.tabs || []).length > 1 && (
          <div className="filters">
            {D.tabs.map(x => {
              const on = (skillId ?? null) === (x.skill_id ?? null);
              return (
                <button key={x.key} className={'filter' + (on ? ' active' : '')} onClick={() => { clickSound(); setSkillId(x.skill_id ?? null); }}
                  style={!on && x.color ? { borderBottom: `3px solid ${x.color}` } : undefined}>
                  <span>{x.label} ({x.count})<span className="en">{x.label_en}</span></span>
                </button>
              );
            })}
          </div>
        )}

        <SecHead ico="/img/lamp.png" ar="مصادر تساعدك" en="Resources for You" />
        {loading && !D && <Empty t="جارٍ تحميل المصادر…" e="Loading" />}
        {!loading && !error && !resources.length && <Empty t="لا توجد مصادر بعد" e="No resources yet" d="ستظهر هنا المصادر التي يضيفها معلمك والمنصة." />}
        <div className="more-grid">
          {resources.map(r => {
            const color = r.color || r.skills?.[0]?.color || 'var(--brand)';
            const fromTeacher = r.source === 'teacher';
            return (
              <div key={r.id} className="more-card" style={{ position: 'relative', cursor: 'default', ...(fromTeacher ? { outline: '2px solid var(--purple)' } : {}) }}>
                {fromTeacher && (
                  <span style={{ position: 'absolute', top: -10, insetInlineEnd: 14, background: 'var(--purple)', color: '#fff', fontSize: 11, fontWeight: 900, padding: '4px 12px', borderRadius: 99, boxShadow: '0 4px 10px rgba(124,58,237,.3)' }}>
                    👩‍🏫 من معلمك{r.teacher?.name ? `: ${r.teacher.name}` : ''}
                  </span>
                )}
                <div className="head">
                  <div className="ico" style={{ background: color + '18' }}>{isUrl(r.icon) ? <img src={r.icon} alt="" /> : <span style={{ fontSize: 30 }}>{r.icon || '📘'}</span>}</div>
                  <div>
                    <h3>{r.title}</h3>
                    {r.title_en && <div className="en">{r.title_en}</div>}
                  </div>
                </div>
                {r.description && <div className="d">{r.description}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {r.file_type && <span className="chip" style={{ fontSize: 11 }}>{FILE_ICO[String(r.file_type).toLowerCase()] || '📄'} {String(r.file_type).toUpperCase()}</span>}
                  {r.link_label && <span className="chip" style={{ fontSize: 11, color, background: color + '15' }}>{r.link_label}</span>}
                  <span style={{ flex: 1 }} />
                  {r.url
                    ? <button className="btn-sm" style={{ borderColor: color, color }} onClick={() => { clickSound(); openFile({ url: r.url, name: r.title, file_type: r.file_type }); }}>افتح</button>
                    : <button className="btn-sm" disabled style={{ opacity: 0.5 }}>غير متاح</button>}
                </div>
              </div>
            );
          })}
        </div>

        {/* الدعم والتذاكر */}
        <SecHead ico="/img/speech.png" ar="الدعم والتذاكر" en="Support Tickets" />
        <div className="grid-main" style={{ marginTop: 0 }}>
          <div className="col">
            <div className="filters" style={{ marginTop: 0 }}>
              {[['support', 'فريق الدعم', 'Support Team'], ['teacher', 'أسئلتي للمعلم', 'My Teacher']].map(([k, ar, en]) => (
                <button key={k} className={'filter' + (tab === k ? ' active' : '')} onClick={() => { clickSound(); setTab(k); }}>
                  <span>{ar}<span className="en">{en}</span></span>
                </button>
              ))}
            </div>
            {tErr && <Empty t={tErr.message} e="Could not load tickets" />}
            {tLoading && !tickets.length && <Empty t="جارٍ تحميل تذاكرك…" e="Loading" />}
            {!tLoading && !tErr && !tickets.length && (
              <Empty t={tab === 'teacher' ? 'لم ترسل أسئلة لمعلمك بعد' : 'لا توجد تذاكر بعد'} e="Nothing here yet"
                d={tab === 'teacher' ? 'اكتب سؤالك في «تواصل مع معلمك» وسيظهر هنا مع ردّه.' : 'افتح تذكرة إن واجهتك مشكلة أو لديك اقتراح.'} />
            )}
            {tickets.map(tk => <TicketRow key={tk.id} tk={tk} onOpen={setOpenTk} />)}
          </div>

          <div className="col">
            <div className="side-card">
              <div className="badges-head">
                <div><h3>افتح تذكرة جديدة</h3><div className="en">Open a New Ticket</div></div>
              </div>
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                <select value={cat} onChange={e => setCat(e.target.value)} style={{ ...fieldStyle, fontWeight: 700 }}>
                  {(D?.ticket_categories || []).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="العنوان (اختياري)" style={fieldStyle} />
                <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="اشرح مشكلتك أو سؤالك هنا…" style={{ ...fieldStyle, lineHeight: 1.9, minHeight: 100, resize: 'vertical' }} />
                <button className="btn btn-primary" disabled={busy || !msg.trim()} onClick={submit} style={{ opacity: msg.trim() ? 1 : 0.5 }}>{busy ? '…' : '🎫 أرسل التذكرة'}</button>
              </div>
            </div>

            {/* تواصل مع معلمك */}
            {T && (
              <div className="side-card" style={{ borderTop: '4px solid var(--teal)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={T.image || (T.gender === 'male' ? '/img/teacher-char.jpeg' : '/img/teacher.png')} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15.5 }}>تواصل مع معلمك</h3>
                    <div className="en">Contact your teacher</div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2 }}>{T.name}{T.is_main && teachers.length > 1 && <span className="chip" style={{ marginInlineStart: 6, fontSize: 11 }}>معلم الفصل</span>}</div>
                    {T.response_text && <div style={{ fontSize: 11.5, color: 'var(--mute)' }}>⏱ {T.response_text}</div>}
                  </div>
                </div>
                {teachers.length > 1 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {teachers.map(t => {
                      const on = t.id === T.id;
                      return (
                        <button key={t.id} onClick={() => { clickSound(); setTId(t.id); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 4px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 12, border: '2px solid ' + (on ? 'var(--teal)' : 'var(--line)'), background: on ? 'var(--teal)' : 'var(--card, #fff)', color: on ? '#fff' : 'inherit' }}>
                          <img src={t.image || (t.gender === 'male' ? '/img/teacher-char.jpeg' : '/img/teacher.png')} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
                          أ. {t.name}{t.is_main ? ' ★' : ''}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                  <input value={qTitle} onChange={e => setQTitle(e.target.value)} placeholder="عنوان السؤال (اختياري)" style={fieldStyle} />
                  <textarea value={qMsg} onChange={e => setQMsg(e.target.value)} placeholder="اكتب سؤالك لمعلمك…" style={{ ...fieldStyle, lineHeight: 1.9, minHeight: 90, resize: 'vertical' }} />
                  <button className="btn btn-primary" disabled={qBusy || !qMsg.trim()} onClick={askTeacher} style={{ opacity: qMsg.trim() ? 1 : 0.5, background: 'var(--teal)' }}>{qBusy ? '…' : '✉ أرسل السؤال'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <FooterStrip
        ar="اطلب المساعدة متى احتجتها – هذا من شطارة المتعلم"
        en="Asking for help is what smart learners do!"
      />
      {openTk && <TicketDrawer tk={openTk} onClose={closeTk} onUpdate={updateTk} />}
    </div>
  );
}
