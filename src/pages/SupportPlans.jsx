import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip, Ring, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, usePageTitle } from '../api/useApi.js';
import { clickSound } from '../sounds.js';

/* خطة الدعم الخاصة بي — للعرض فقط (الحل في صفحات الواجبات والاختبارات)
   GET /support/plans (الجارية أولاً) · GET /support/plans/:id */

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const fmtDue = (d) => (d ? new Date(d).toLocaleString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '');
const listOf = (d) => (Array.isArray(d) ? d : d?.items || d?.plans || []);

/* open_api → راوت الفرونت: /api/student/exams/:id أو /assignments/:id → صفحة التكليف */
const routeOf = (api) => { const m = /\/(exams|assignments)\/(\d+)/.exec(api || ''); return m ? '/assignment?id=' + m[2] : null; };

/* شكل كل حالة خطوة */
const STEP = {
  passed:           { c: 'var(--green)',  bg: 'var(--green-soft)',  ico: '✓',  msg: 'أحسنت! تخطيت هذه الخطوة 🎉' },
  not_passed:       { c: '#e8857f',       bg: '#fdf0ef',            ico: '↻',  msg: 'لا بأس، معلمك سيضيف لك تدريباً جديداً 💪' },
  in_progress:      { c: 'var(--brand)',  bg: 'var(--lav-soft)',    ico: '★',  msg: 'هذه خطوتك الحالية — أنجز المطلوب منك' },
  awaiting_teacher: { c: 'var(--gold)',   bg: 'var(--gold-soft)',   ico: '⏳', msg: 'أنهيت المطلوب — بانتظار تقييم معلمك' },
  upcoming:         { c: 'var(--mute2)',  bg: 'var(--line2)',       ico: '🔒', msg: 'تُفتح بعد إنهاء الخطوة السابقة' },
};

/* ===== كارت «خطتي للتحسن» — يظهر فقط لو فيه خطة نشطة (الدعم + الرئيسية) ===== */
export function MyPlanCard({ side }) {
  const nav = useNavigate();
  const { data } = useApi(() => api.supportPlans().catch(() => null), []);
  const plan = listOf(data).find(p => p.status?.key === 'active');
  if (!plan) return null;
  const pr = plan.progress || {};
  const cur = plan.current_step;
  const curNum = typeof cur === 'object' ? cur?.step_number : cur;
  const open = () => { clickSound(); nav('/support-plan?id=' + plan.id); };
  return (
    <div className={side ? 'side-card' : 'card next-card'} style={{ borderTop: '4px solid var(--purple)', ...(side ? {} : { marginTop: 22 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, flexWrap: 'wrap' }}>
        <Ring pct={Math.round(pr.percentage ?? 0)} size={side ? 76 : 92} stroke={9} color="var(--purple)" />
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--purple)' }}>🧭 خطتي للتحسن</div>
          <h3 style={{ margin: '2px 0 0', fontSize: side ? 15.5 : 18 }}>{plan.title}</h3>
          <div style={{ fontSize: 12.5, color: 'var(--ink2)', marginTop: 4 }}>
            {curNum ? `الخطوة الحالية: ${curNum} من ${pr.steps_total ?? plan.steps?.length ?? '—'}` : `أنجزت ${pr.steps_done ?? 0} من ${pr.steps_total ?? 0} خطوات`}
          </div>
        </div>
      </div>
      <div className={side ? '' : 'actions'} style={side ? { marginTop: 12 } : undefined}>
        <button className="btn btn-primary btn-col" onClick={open} style={side ? { width: '100%' } : undefined}>
          <span>عرض الخطة ←</span><span className="sub">My Support Plan</span>
        </button>
      </div>
    </div>
  );
}

/* عنصر داخل الخطوة: تكليف (واجب/اختبار) أو مهمة مع المعلم */
function PlanItem({ it }) {
  const nav = useNavigate();
  const isTask = it.kind === 'task';
  const to = !isTask ? routeOf(it.open_api) : null;
  const graded = it.score != null && it.total_grade != null;
  return (
    <div className="act-row" style={{ '--edge': it.done ? 'var(--green)' : isTask ? 'var(--teal)' : 'var(--brand)' }}>
      <div className="ico" style={{ background: isTask ? '#e0f4f8' : 'var(--lav-soft)', fontSize: 22, display: 'grid', placeItems: 'center' }}>
        {isTask ? '👩‍🏫' : <img src="/img/clipboard.png" alt="" />}
      </div>
      <div className="body">
        <h4>{it.title}</h4>
        <div className="unit-meta-chips" style={{ marginTop: 4 }}>
          <span className="chip" style={{ fontSize: 10.5 }}>{isTask ? 'مع معلمك' : it.kind_label || it.work?.type || 'تكليف'}</span>
          {it.work?.due_at && <span className="chip" style={{ fontSize: 10.5 }}>⏰ آخر موعد: {fmtDue(it.work.due_at)}</span>}
        </div>
        {graded && <div className="d" style={{ fontWeight: 800, color: 'var(--ink)' }}>الدرجة: {it.score} / {it.total_grade}{it.percentage != null ? ` (${Math.round(it.percentage)}%)` : ''}</div>}
        {it.feedback && <div className="d">💬 {it.feedback}</div>}
      </div>
      <span className={'st-chip ' + (it.done ? 'مكتملة' : 'قادمة')}>{it.state?.label || (it.done ? 'تم' : 'لم يُنجز')}</span>
      <div className="act" style={{ minWidth: 96, textAlign: 'center' }}>
        {!isTask && !it.done && to && (
          <button className="btn-sm pink" onClick={() => { clickSound(); nav(to); }}>{it.state?.key === 'in_progress' ? 'أكمل' : 'ابدأ الآن'}</button>
        )}
        {!isTask && it.done && to && <button className="btn-sm" onClick={() => { clickSound(); nav(to); }}>راجع</button>}
      </div>
    </div>
  );
}

/* ===== تفاصيل خطة: هيدر + مسار الخطوات ===== */
/* «مع أ. فلان» بصورة صغيرة */
function TeacherTag({ t }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800 }}>
      <img src={t.user_image || t.image || '/img/teacher.png'} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
      مع أ. {t.name}
    </span>
  );
}

function PlanDetails({ id }) {
  const { data: P, error, loading } = useApi(() => api.supportPlan(id), [id]);
  usePageTitle(P?.title && `خطتي: ${P.title}`);
  const [openStep, setOpenStep] = useState(null);
  if (error) return <div className="container"><Empty t={error.message} e="Could not load the plan" /><div style={{ textAlign: 'center', marginTop: 12 }}><Link to="/support-plan" className="btn btn-ghost">→ كل خططي</Link></div></div>;
  if (loading || !P) return <div className="container"><Empty t="جارٍ تحميل خطتك…" e="Loading" /></div>;

  const pr = P.progress || {};
  const steps = P.steps || [];
  const closed = P.status?.key === 'closed';
  const isOpen = (s) => (openStep == null ? s.is_current || (closed && false) : openStep === s.id);

  return (
    <div className="container">
      {/* الهيدر */}
      <div className="hero" style={{ padding: '28px 36px', marginTop: 10 }}>
        <div className="hero-txt">
          <span className="hero-chip">🧭 خطة الدعم الخاصة بي{closed ? ' · منتهية' : ''}</span>
          <h1 style={{ marginTop: 12 }}>{P.title}</h1>
          <div className="unit-meta-chips" style={{ marginTop: 12 }}>
            <span className="chip">{P.status?.label}</span>
            {P.started_at && <span className="chip">بدأت: {fmtDate(P.started_at)}</span>}
            {P.closed_at && <span className="chip">انتهت: {fmtDate(P.closed_at)}</span>}
            {P.teacher?.name && <span className="chip"><TeacherTag t={P.teacher} /></span>}
            <span className="chip">أنجزت {pr.steps_done ?? 0} من {pr.steps_total ?? steps.length} خطوات</span>
          </div>
          <p style={{ marginTop: 12 }}>معلمك صمّم لك هذه الخطة لتتحسن خطوة بخطوة — أنجز المطلوب في كل خطوة من صفحة الواجبات والاختبارات.</p>
        </div>
        <div className="week-card">
          <Ring pct={Math.round(pr.percentage ?? 0)} color="var(--purple)" />
          <div>
            <div className="t1">تقدّمك في الخطة</div>
            <div className="te">Plan Progress</div>
            <div className="t2">{pr.steps_done ?? 0} / {pr.steps_total ?? steps.length} خطوات</div>
          </div>
        </div>
      </div>

      {/* مسار الخطوات (RTL) */}
      <SecHead ico="/img/target.png" ar="مسار خطتك" en="Your Plan Steps" />
      {!steps.length && <Empty t="لم يضف معلمك خطوات بعد" e="No steps yet" />}
      <div className="flow-strip" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(steps.length, 1), 6)}, 1fr)` }}>
        {steps.map(s => {
          const k = s.status?.key;
          const cls = k === 'passed' ? 'done' : k === 'in_progress' || k === 'awaiting_teacher' ? 'current' : 'todo';
          return (
            <a key={s.id} href="#!" className={'flow-step ' + cls} onClick={(e) => { e.preventDefault(); clickSound(); setOpenStep(s.id); }}
              style={{ ...(k === 'not_passed' ? { borderColor: STEP.not_passed.c } : {}), opacity: k === 'upcoming' && !(s.is_current || s.step_number === 1) ? 0.55 : 1 }}>
              <div className="n" style={k === 'not_passed' ? { background: STEP.not_passed.c, color: '#fff' } : undefined}>{k === 'passed' ? '✓' : k === 'not_passed' ? '↻' : s.step_number}</div>
              <div className="t">{s.title}</div>
              <div className="e">{s.status?.label}</div>
            </a>
          );
        })}
      </div>

      {/* الخطوات بالتفصيل */}
      <div style={{ marginTop: 18, display: 'grid', gap: 14 }}>
        {steps.map(s => {
          const k = s.status?.key;
          // خطوة «قريباً» وهي الحالية أو الأولى: لا خطوة سابقة — المعلم لم يضف المطلوب بعد
          const preparing = k === 'upcoming' && (s.is_current || s.step_number === 1);
          const L = preparing
            ? { c: 'var(--brand)', bg: 'var(--lav-soft)', ico: '🕒', msg: 'معلمك يجهّز المطلوب في هذه الخطوة — سيظهر هنا قريباً' }
            : k === 'upcoming' ? { ...STEP.upcoming, msg: `تُفتح بعد إنهاء الخطوة ${s.step_number - 1}` }
            : STEP[k] || STEP.upcoming;
          const open = isOpen(s);
          return (
            <div key={s.id} className="card" style={{ padding: '16px 20px', borderInlineStart: `5px solid ${L.c}`, opacity: k === 'upcoming' && !preparing ? 0.7 : 1 }}>
              <div onClick={() => { clickSound(); setOpenStep(open ? -1 : s.id); }} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', background: L.bg, color: L.c, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>{L.ico}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>الخطوة {s.step_number}: {s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--mute)' }}>{s.status?.label}{s.items_count ? ` · أنجزت ${s.items_done ?? 0} من ${s.items_count}` : ''}{s.evaluated_at ? ` · قُيّمت ${fmtDate(s.evaluated_at)}` : ''}</div>
                </div>
                {s.is_current && <span className="chip" style={{ background: 'var(--lav-soft)', color: 'var(--brand)', fontWeight: 900 }}>الحالية</span>}
                <span style={{ color: 'var(--mute)' }}>{open ? '▴' : '▾'}</span>
              </div>
              {open && (
                <div style={{ marginTop: 12 }}>
                  <div className={'explain-box ' + (k === 'passed' ? 'ok' : k === 'not_passed' ? 'no' : '')} style={{ marginTop: 0 }}>
                    <img src="/img/owl.png" alt="" />
                    <div><span className="h">{L.msg}</span>{s.notes}</div>
                  </div>
                  {s.teacher_note && (
                    <div className="fb-block good" style={{ marginTop: 10 }}>
                      <span className="l">💬 ملاحظة معلمك</span>{s.teacher_note}
                    </div>
                  )}
                  {(s.items || []).length > 0 && <div style={{ marginTop: 10 }}>{s.items.map((it, i) => <PlanItem key={it.id ?? i} it={it} />)}</div>}
                  {!(s.items || []).length && (k === 'upcoming' || k === 'in_progress') && <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 8 }}>{preparing || k === 'in_progress' ? 'لم يضف معلمك واجبات أو مهام لهذه الخطوة بعد.' : 'سيظهر المطلوب منك هنا عندما تصل لهذه الخطوة.'}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== قائمة الخطط: الجارية + «خطط سابقة» ===== */
function PlansList() {
  const nav = useNavigate();
  const [tf, setTf] = useState(null);
  const { data, error, loading } = useApi(() => api.supportPlans(tf), [tf]);
  const [tab, setTab] = useState('active');
  // معلمو الخطط (من القائمة غير المفلترة، بلا تكرار)
  const [teachers, setTeachers] = useState([]);
  useEffect(() => {
    if (tf != null || !data) return;
    const m = new Map();
    listOf(data).forEach(p => p.teacher?.id != null && m.set(p.teacher.id, p.teacher));
    setTeachers([...m.values()]);
  }, [data, tf]);
  const all = listOf(data);
  const shown = all.filter(p => (tab === 'active' ? p.status?.key !== 'closed' : p.status?.key === 'closed'));
  return (
    <div className="container">
      <div className="filters" style={{ marginTop: 10 }}>
        {[['active', 'خطتي الحالية', 'Current'], ['closed', 'خطط سابقة', 'Previous']].map(([k, ar, en]) => (
          <button key={k} className={'filter' + (tab === k ? ' active' : '')} onClick={() => { clickSound(); setTab(k); }}>
            <span>{ar} ({all.filter(p => (k === 'active' ? p.status?.key !== 'closed' : p.status?.key === 'closed')).length})<span className="en">{en}</span></span>
          </button>
        ))}
      </div>
      {teachers.length > 1 && (
        <div className="filters">
          {[{ id: null, name: 'الكل' }, ...teachers].map(t => (
            <button key={t.id ?? 'all'} className={'filter' + (tf === t.id ? ' active' : '')} onClick={() => { clickSound(); setTf(t.id); }}>
              <span>{t.id != null ? 'أ. ' + t.name : t.name}</span>
            </button>
          ))}
        </div>
      )}
      {error && <Empty t={error.message} e="Could not load plans" />}
      {loading && <Empty t="جارٍ تحميل خططك…" e="Loading" />}
      {!loading && !error && !shown.length && (
        <Empty t={tab === 'active' ? 'لا توجد خطة دعم حالية' : 'لا توجد خطط سابقة'} e="No plans" d={tab === 'active' ? 'عندما يصمّم لك معلمك خطة للتحسن ستظهر هنا.' : null} />
      )}
      {shown.map(p => {
        const pr = p.progress || {};
        return (
          <div key={p.id} className="act-row" onClick={() => { clickSound(); nav('/support-plan?id=' + p.id); }} style={{ cursor: 'pointer', '--edge': p.status?.key === 'closed' ? 'var(--mute2)' : 'var(--purple)' }}>
            <div className="ico" style={{ background: 'var(--lav-soft)' }}><img src="/img/target.png" alt="" /></div>
            <div className="body">
              <h4>{p.title}</h4>
              <div className="d">{[p.status?.label, p.started_at && 'بدأت ' + fmtDate(p.started_at), p.closed_at && 'انتهت ' + fmtDate(p.closed_at)].filter(Boolean).join(' · ')}</div>
              {p.teacher?.name && <TeacherTag t={p.teacher} />}
            </div>
            <div className="prog">
              <div className="lab">{pr.steps_done ?? 0} / {pr.steps_total ?? 0} خطوات</div>
              <div className="bar thin"><i style={{ width: (pr.percentage ?? 0) + '%', background: 'var(--purple)' }} /></div>
            </div>
            <div className="act" style={{ minWidth: 84, textAlign: 'center' }}><button className="btn-sm">عرض</button></div>
          </div>
        );
      })}
    </div>
  );
}

export default function SupportPlans() {
  const [qs] = useSearchParams();
  const id = qs.get('id');
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>خطة الدعم الخاصة بي</h1>
          <div className="en">My Support Plan</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {id && <Link to="/support-plan" className="btn btn-ghost" style={{ padding: '9px 18px', fontSize: 13.5 }}>كل خططي</Link>}
          <Link to="/assignments" className="btn btn-ghost" style={{ padding: '9px 18px', fontSize: 13.5 }}>📝 اختباراتي وواجباتي</Link>
        </div>
      </div>
      {id ? <PlanDetails key={id} id={id} /> : <PlansList />}
      <FooterStrip ar="كل خطوة صغيرة تقرّبك من هدفك — معلمك معك في كل خطوة" en="Every small step brings you closer — your teacher is with you!" />
    </div>
  );
}
