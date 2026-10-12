import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome } from '../api/useApi.js';
import QuestionBody, { isAnswered } from '../QuestionBody.jsx';
import { dingSound, winSound, clickSound } from '../sounds.js';
import { showToast } from '../toast.js';
import { sectionLook } from './ExamInstructions.jsx';

/* ===== قسم (مهارة) من اختبار الوحدة — نفس تصميم شاشة Exam =====
   GET …/exam/sections/:id → حفظ تلقائي POST …/save → تسليم POST …/submit (مرة واحدة) */

function FocusBar({ title, unitId, onLeave }) {
  return (
    <div className="focus-bar">
      <div className="container in">
        <Logo h={50} />
        <div className="title">
          <div className="t">{title}</div>
          <div className="e">Unit Summative Exam</div>
        </div>
        <Link to={'/quiz?unit=' + unitId} onClick={onLeave} className="focus-exit">إيقاف مؤقت ⎋</Link>
      </div>
    </div>
  );
}

const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '');
const toPayload = (answers) => Object.entries(answers)
  .filter(([, v]) => v !== undefined && v !== null && !(typeof v === 'string' && !v.trim()) && !(Array.isArray(v) && !v.length))
  .map(([id, answer]) => ({ question_id: Number(id), answer }));

export default function ExamSection({ unitId, sectionId }) {
  const nav = useNavigate();
  const { reload: reloadHome } = useHome();
  const { data: D, error, reload } = useApi(() => api.examSection(unitId, sectionId), [unitId, sectionId]);
  const { data: X } = useApi(() => api.unitExam(unitId).catch(() => null), [unitId]); // لشريط الأقسام
  const [answers, setAnswers] = useState({});
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);      // نتيجة التسليم
  const [locked, setLocked] = useState(false);     // 403 / 409 أثناء الحل
  const dirty = useRef(false);
  const timer = useRef();
  const latest = useRef(answers);
  latest.current = answers;

  // تعبئة الإجابات المحفوظة عند العودة
  useEffect(() => {
    if (!D) return;
    const init = {};
    (D.questions || []).forEach(q => { if (q.saved_answer !== null && q.saved_answer !== undefined) init[q.id] = q.saved_answer; });
    setAnswers(init);
    dirty.current = false;
  }, [D]);

  const readOnly = !D?.can_answer || locked || !!result;

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    if (!dirty.current) return Promise.resolve();
    dirty.current = false;
    const payload = toPayload(latest.current);
    if (!payload.length) return Promise.resolve();
    setSaving(true);
    return api.saveSection(unitId, sectionId, payload).then(
      r => { setSavedAt(r.saved_at || new Date().toISOString()); setSaving(false); },
      ex => { setSaving(false); if (ex.status === 409 || ex.status === 403) { setLocked(true); showToast(ex.message, '🔒'); } },
    );
  }, [unitId, sectionId]);

  // حفظ عند مغادرة الشاشة
  useEffect(() => () => { flush(); }, [flush]);

  const change = (qid, v) => {
    if (readOnly) return;
    setAnswers(a => ({ ...a, [qid]: v }));
    dirty.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 1000); // حفظ تلقائي بعد ثانية من آخر تعديل
  };

  if (error) return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar title="اختبار الوحدة الختامي" unitId={unitId} />
      <div className="container"><Empty t={(error.status === 403 ? '🔒 ' : '') + error.message} e="Section not available" /></div>
    </div>
  );
  if (!D) return <div className="page" style={{ background: 'var(--wash)' }}><FocusBar title="…" unitId={unitId} /></div>;

  const S = D.section || {};
  const L = sectionLook(S);
  const qs = D.questions || [];
  const unanswered = qs.filter(q => !isAnswered(q, answers[q.id])).length;
  const sections = X?.sections || [];
  // ✓/✗ لكل سؤال: من نتيجة التسليم أو من result المحفوظ في السؤال
  const verdict = (q) => {
    const r = result?.answers?.find(a => a.question_id === q.id) || q.result;
    return r ? r.is_correct : undefined;
  };

  const submit = async () => {
    setBusy(true);
    try {
      await flush();
      const r = await api.submitSection(unitId, sectionId, toPayload(answers));
      setResult(r);
      setConfirm(false);
      winSound();
      if (r.reward?.level_up) showToast(`مبروك! وصلت إلى المستوى ${r.reward.level}`, '🎉');
      else if (r.reward?.points_earned) showToast(`+${r.reward.points_earned} نقطة! أُضيفت لرصيدك`, '⭐');
      reloadHome();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (ex) {
      setConfirm(false);
      showToast(ex.message, '⚠️');
      if (ex.status === 409) reload();           // سُلِّم من قبل → إعادة التحميل للقراءة فقط
      if (ex.status === 403) setLocked(true);    // انتهى الموعد
    }
    setBusy(false);
  };

  const goSection = (s) => { clickSound(); flush(); nav(`/exam?unit=${unitId}&section=${s.id}`); };
  const res = result || (S.status === 'completed' && S.score != null ? { score: S.score, max_score: S.max_score, pending_review: S.pending_review } : null);

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar title={`${X?.exam?.title || 'اختبار الوحدة الختامي'} — ${S.title}`} unitId={unitId} onLeave={flush} />
      <div className="container" style={{ maxWidth: 1060 }}>
        {/* شريط الأقسام */}
        {sections.length > 0 && (
          <div className="flow-strip" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)`, marginTop: 30 }}>
            {sections.map((s, si) => {
              const st = s.status === 'completed' ? 'done' : String(s.id) === String(sectionId) ? 'current' : 'todo';
              return (
                <a key={s.id} href="#!" onClick={(e) => { e.preventDefault(); if (String(s.id) !== String(sectionId)) goSection(s); }} className={'flow-step ' + st}>
                  <div className="n">{st === 'done' ? '✓' : si + 1}</div>
                  <div className="t">{s.title}</div>
                  <div className="e">{s.title_en || s.skill?.name || ''}</div>
                </a>
              );
            })}
          </div>
        )}

        {/* نتيجة القسم */}
        {res && (
          <div className={'explain-box ' + (res.pending_review ? '' : 'ok')} style={{ marginTop: 20 }}>
            <img src="/img/owl.png" alt="" />
            <div>
              <span className="h">
                نتيجة {S.title}: {res.score} من {res.max_score}{res.percentage != null ? ` (${Math.round(res.percentage)}٪)` : ''}
                {res.correct_count != null ? ` · ${res.correct_count} من ${res.questions_count} صحيحة` : ''}
              </span>
              {res.pending_review ? 'فيه إجابات كتابية — سيصحّحها معلمك وتظهر نتيجتها لاحقاً.' : 'تم تسليم القسم — لا يمكن تعديل الإجابات.'}
            </div>
          </div>
        )}

        <div className="card activity-card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span className="chip" style={{ color: L.color, background: L.color + '15', fontSize: 13 }}>
              {S.title}{S.title_en ? ` · ${S.title_en}` : ''} · {qs.length} أسئلة
            </span>
            {readOnly && !res && <span className="chip" style={{ background: 'var(--line2)' }}>🔒 للقراءة فقط</span>}
          </div>
          {S.description && <p className="prompt" style={{ marginTop: 10 }}>{S.description}</p>}

          {qs.map((q, qi) => {
            const v = verdict(q);
            return (
              <div key={q.id} style={{ borderTop: qi ? '1px dashed var(--line)' : 0, paddingTop: qi ? 22 : 6, marginTop: qi ? 22 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--mute)' }}>السؤال {qi + 1} · {q.points} درجة</span>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {v === true && <span style={{ color: 'var(--green-deep)', fontWeight: 900 }}>✓ صحيحة</span>}
                    {v === false && <span style={{ color: 'var(--danger)', fontWeight: 900 }}>✗ خاطئة</span>}
                    {v === null && <span style={{ color: 'var(--gold)', fontWeight: 900 }}>⏳ بانتظار المعلم</span>}
                    {q.hint && !readOnly && <button className="hint-btn" onClick={() => showToast(q.hint, '💡')}>💡 تلميح</button>}
                  </span>
                </div>
                <QuestionBody q={q} value={answers[q.id]} readOnly={readOnly} onChange={(val) => change(q.id, val)} />
              </div>
            );
          })}

          {/* تأكيد التسليم */}
          {confirm && (
            <div className="explain-box no" style={{ marginTop: 22 }}>
              <img src="/img/owl.png" alt="" />
              <div style={{ flex: 1 }}>
                <span className="h">متأكد من التسليم؟</span>
                لا يمكنك تعديل إجاباتك بعد التسليم.{unanswered > 0 && <b> لم تُجب عن {unanswered} {unanswered === 1 ? 'سؤال' : 'أسئلة'} بعد!</b>}
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? '…' : 'نعم، سلّم القسم'}</button>
                  <button className="btn btn-ghost" onClick={() => setConfirm(false)}>رجوع للمراجعة</button>
                </div>
              </div>
            </div>
          )}

          <div className="activity-nav">
            <span style={{ fontSize: 12.5, color: 'var(--mute)', fontWeight: 700 }}>
              {readOnly ? '🔒 القسم مُسلَّم' : saving ? '☁ جارٍ الحفظ…' : savedAt ? `☁ تم الحفظ ✓ ${fmtTime(savedAt)}` : '☁ الحفظ التلقائي مفعّل · خذ وقتك'}
            </span>
            <div className="spacer" />
            {D.previous_section && <button className="btn btn-ghost" onClick={() => goSection(D.previous_section)}>→ المهارة السابقة</button>}
            {!readOnly && !confirm && (
              <button className="btn btn-primary" onClick={() => { dingSound(); setConfirm(true); }}>تسليم القسم ✓</button>
            )}
            {readOnly && (D.next_section
              ? <button className="btn btn-primary" onClick={() => goSection(D.next_section)}>المهارة التالية: {D.next_section.title} ←</button>
              : <button className="btn btn-primary" onClick={() => { clickSound(); nav('/quiz?unit=' + unitId); }}>العودة للتعليمات والنتيجة ←</button>)}
            {!readOnly && D.next_section && <button className="btn btn-ghost" onClick={() => goSection(D.next_section)}>المهارة التالية ←</button>}
          </div>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
