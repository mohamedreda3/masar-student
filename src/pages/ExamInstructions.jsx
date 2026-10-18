import { Link, useNavigate } from 'react-router-dom';
import { StatsBar, SecHead, Empty } from '../components.jsx';
import { SKILLS } from '../data.js';
import api from '../api/client.js';
import { useApi, SKILL_KEY, usePageTitle } from '../api/useApi.js';
import { clickSound } from '../sounds.js';

/* ===== تعليمات اختبار الوحدة من الـAPI — GET /path/units/:unitId/exam =====
   نفس تصميم QuizInstructions (هيرو + بطاقات المهارات + الإرشادات + البومة + زر البدء) */

const GUIDE_ICO = {
  book: '/img/book.png', read: '/img/book.png', headphones: '/img/headphones.png', listen: '/img/headphones.png',
  mic: '/img/mic.png', record: '/img/mic.png', review: '/img/clipboard.png', clipboard: '/img/clipboard.png',
  save: '/img/cloudDone.png', cloud: '/img/cloudDone.png', write: '/img/pencil.png', pencil: '/img/pencil.png', time: '/img/target.png',
};
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '');
const mins = (m) => (m ? (m.from && m.to ? `${m.from}–${m.to}` : m.from || m.to) : null);

/* لون/أيقونة القسم: color/icon ثم skill.color/skill.icon ثم مهارة التصميم المقابلة */
export function sectionLook(s) {
  const K = SKILLS[SKILL_KEY[s.skill?.name || s.title]] || {};
  const ico = s.icon || s.skill?.icon;
  return {
    color: s.color || s.skill?.color || K.color || 'var(--brand)',
    ico: ico && /^(https?:|\/|data:)/.test(ico) ? ico : K.ico || '/img/clipboard.png',
  };
}

export default function ExamInstructions({ unitId }) {
  const nav = useNavigate();
  const { data: D, error } = useApi(() => api.unitExam(unitId), [unitId]);
  usePageTitle(D?.exam?.title);

  if (error) return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <Empty t={error.status === 403 ? 'الاختبار غير متاح لك بعد' : error.message}
          e={error.status === 403 ? 'Not assigned yet' : 'Exam not available'}
          d={error.status === 403 ? error.message : null} />
        <div style={{ textAlign: 'center', marginTop: 16 }}><Link to={'/unit?id=' + unitId} className="btn btn-ghost">→ العودة للوحدة</Link></div>
      </div>
    </div>
  );
  if (!D) return <div className="page"><StatsBar /></div>;

  const X = D.exam || {}, A = D.assignment || {}, R = D.result || {};
  const canAnswer = A.can_answer !== false;
  const ended = A.state === 'ended';
  const sections = D.sections || [];
  const open = (s) => { clickSound(); nav(`/exam?unit=${unitId}&section=${s.id}`); };
  const startLabel = sections.some(s => s.status !== 'not_started') ? '🚀 أكمل التقييم / Continue' : '🚀 ابدأ التقييم / Start Assessment';
  const est = mins(X.estimated_minutes);
  const allDone = sections.length > 0 && sections.every(s => s.status === 'completed');

  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="hero" style={{ padding: '34px 40px' }}>
          <div className="hero-img" style={{ maxWidth: 280, width: '100%' }}>
            <img src={X.cover_image || '/img/scene-read.png'} alt="" />
          </div>
          <div className="hero-txt" style={{ textAlign: 'center' }}>
            <h1 style={{ marginTop: 0 }}>{X.title}</h1>
            {X.title_en && <div className="en-sub" style={{ fontSize: 16, fontWeight: 700 }}>{X.title_en}</div>}
            <div className="unit-meta-chips" style={{ justifyContent: 'center', marginTop: 12 }}>
              {D.unit?.title && <span className="chip">نهاية وحدة {D.unit.title}</span>}
              {X.questions_count != null && <span className="chip">{X.questions_count} سؤالاً</span>}
              {A.pass_percentage != null && <span className="chip">النجاح من {A.pass_percentage}٪</span>}
              <span className="chip">بتكليف من معلمك</span>
              {A.due_at && <span className="chip">{ended ? 'انتهى في' : 'آخر موعد:'} {fmtDate(A.due_at)}</span>}
            </div>
            {X.description && <p style={{ marginTop: 14 }}>{X.description}</p>}
            {X.description_en && <div className="en-sub">{X.description_en}</div>}
            {(ended || !canAnswer) && (
              <div className="explain-box no" style={{ marginTop: 14, textAlign: 'start' }}>
                <div><span className="h">{ended ? 'انتهى موعد الاختبار' : 'الاختبار غير متاح للحل الآن'}</span>يمكنك مراجعة الأقسام ونتيجتك فقط.</div>
              </div>
            )}
          </div>
          <img src="/img/clipboard.png" alt="" className="hide-xs" style={{ width: 120, height: 120, objectFit: 'contain', flexShrink: 0 }} />
        </div>

        {/* النتيجة النهائية — أو التقدم في الأقسام */}
        {R.is_finished ? (
          <div className={'explain-box ' + (R.pending_review ? '' : R.is_passed ? 'ok' : 'no')} style={{ marginTop: 22 }}>
            <img src="/img/owl.png" alt="" />
            <div>
              <span className="h">
                {R.pending_review ? 'أنهيت كل الأقسام 🎉'
                  : `${R.is_passed ? 'ناجح ✓' : 'لم تنجح بعد'} — ${R.score} من ${R.max_score} (${Math.round(R.percentage ?? 0)}٪)`}
              </span>
              {R.pending_review ? 'ستظهر النتيجة النهائية بعد أن يصحّح معلمك الإجابات الكتابية.'
                : R.is_passed ? 'أحسنت! أتممت اختبار الوحدة بنجاح.' : 'راجع دروس الوحدة مع معلمك وحاول مجدداً.'}
            </div>
          </div>
        ) : R.sections_count > 0 && (
          <div className="lesson-foot" style={{ paddingTop: 18 }}>
            <span className="pct">أنجزت {R.completed_sections} من {R.sections_count} أقسام</span>
            <div className="bar"><i style={{ width: (R.completed_sections / R.sections_count) * 100 + '%' }} /></div>
          </div>
        )}

        <SecHead ico="/img/target2.png" ar="مهارات الاختبار" en="Skills We'll Check" />
        {!sections.length && <Empty t="لا توجد أقسام في هذا الاختبار بعد" e="No sections yet" />}
        <div className="stations-grid" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(sections.length, 1), 4)}, 1fr)` }}>
          {sections.map(s => {
            const Lk = sectionLook(s);
            const pct = Math.round(s.progress_percentage || 0);
            const done = s.status === 'completed';
            return (
              <div key={s.id} className="card" style={{ textAlign: 'center', padding: '22px 18px', borderTop: `4px solid ${Lk.color}` }}>
                <img src={Lk.ico} alt="" style={{ width: 54, height: 54, objectFit: 'contain', margin: '0 auto' }} />
                <div style={{ fontWeight: 900, fontSize: 17, marginTop: 10 }}>{s.title}</div>
                {s.title_en && <div style={{ fontSize: 10.5, color: 'var(--mute)' }}>{s.title_en}</div>}
                {s.description && <div style={{ fontSize: 12.5, color: 'var(--ink2)', marginTop: 8, lineHeight: 1.7 }}>{s.description}</div>}
                <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 6 }}>{s.questions_count} أسئلة{s.answered_count ? ` · أجبت ${s.answered_count}` : ''}</div>
                <div className="bar thin" style={{ marginTop: 12 }}>
                  <i style={{ width: pct + '%', background: Lk.color }} />
                </div>
                <div style={{ marginTop: 12 }}>
                  {done ? (
                    <button className="st-chip مكتملة" onClick={() => open(s)} style={{ cursor: 'pointer', border: 0 }}>
                      {s.status_label} ✓{s.score != null ? ` · ${s.score}/${s.max_score}` : ''}
                    </button>
                  ) : (
                    <button className="btn-sm" disabled={!canAnswer && s.status === 'not_started'} onClick={() => open(s)}
                      style={{ display: 'block', width: '100%', textAlign: 'center', ...(s.status === 'in_progress' ? { borderColor: Lk.color, color: Lk.color } : {}) }}>
                      {s.status_label}{s.status === 'in_progress' ? ` (${pct}٪)` : ''}
                    </button>
                  )}
                  {s.pending_review && <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 800, marginTop: 6 }}>⏳ بانتظار تصحيح المعلم</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: 34, padding: '30px 34px', textAlign: 'center' }}>
          {X.guidelines?.length > 0 && <>
            <div style={{ fontWeight: 900, fontSize: 19 }}>لتحقيق أفضل نتيجة، اتبع الإرشادات التالية:</div>
            <div className="sec-en">To achieve the best result, please follow these guidelines:</div>
            <div className="toolkit-items" style={{ gridTemplateColumns: `repeat(${Math.min(X.guidelines.length, 5)}, 1fr)`, marginTop: 26 }}>
              {X.guidelines.map(g => (
                <div key={g.order} className="toolkit-item" style={{ flexDirection: 'column', textAlign: 'center', gap: 8, padding: '20px 14px', cursor: 'default' }}>
                  <span className="cnt">{g.order}</span>
                  <img src={GUIDE_ICO[g.icon] || '/img/bulb.png'} alt="" style={{ width: 56, height: 56 }} />
                  <div>
                    <div className="t" style={{ fontSize: 15 }}>{g.title}</div>
                    {g.title_en && <div className="e" style={{ fontSize: 10.5 }}>{g.title_en}</div>}
                  </div>
                  {g.text && <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.8 }}>{g.text}</div>}
                  {g.text_en && <div style={{ fontSize: 9.5, color: 'var(--mute2)', direction: 'ltr' }}>{g.text_en}</div>}
                </div>
              ))}
            </div>
          </>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: X.guidelines?.length ? 30 : 0, flexWrap: 'wrap', justifyContent: 'center' }}>
            {X.tip && (
              <div className="mascot" style={{ margin: 0, flex: 1, minWidth: 240 }}>
                <img src="/img/owl.png" alt="" />
                <div className="b">{X.tip}
                  {X.tip_en && <span style={{ fontSize: 10.5, color: 'var(--mute)', direction: 'ltr', display: 'block', textAlign: 'end' }}>{X.tip_en}</span>}
                </div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              {D.next_section && canAnswer
                ? <button className="btn btn-primary" onClick={() => open(D.next_section)} style={{ fontSize: 17, padding: '15px 44px' }}>{startLabel}</button>
                : allDone && <div style={{ fontWeight: 900, color: 'var(--green-deep)' }}>✓ أكملت كل أقسام الاختبار</div>}
              {est && (
                <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 10 }}>
                  ⏱ المدة التقريبية: {est} دقيقة · Estimated time: {est} minutes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 50 }} />
    </div>
  );
}
