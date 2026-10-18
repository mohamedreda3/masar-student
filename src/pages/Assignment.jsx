import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { StatsBar, SecHead, Empty, FooterStrip } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome, activityLink, usePageTitle } from '../api/useApi.js';
import QuestionBody, { realImg, isAnswered } from '../QuestionBody.jsx';
import AssignmentResult from './AssignmentResult.jsx';
import { openFile } from '../FileViewer.jsx';
import { clickSound, winSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* تكليف من المعلم — GET /assignments/:id
   بدء (start) → حل أنشطته (activities/:id?lesson_id=) → تسليم (submit) */

/* ضغط صورة كبيرة (> 1.5MB) قبل الرفع — وإلا تُرفع كما هي */
async function compressImage(file) {
  if (!file.type.startsWith('image/') || file.size < 1.5 * 1024 * 1024 || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch { return file; }
}
const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
const FILE_ICO = (m = '') => (m.includes('pdf') ? '📕' : m.startsWith('audio') ? '🎧' : m.startsWith('video') ? '🎬' : /word|msword|document/.test(m) ? '📘' : '📄');

const fmtDate = (d) => (d ? new Date(d).toLocaleString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '');
const ACT_ST = { completed: { ar: 'مكتملة', cta: 'راجع' }, in_progress: { ar: 'جارية', cta: 'تابع' } };
const TYPE_ICO = { exercise: '/img/clipboard.png', flashcard: '/img/flashcards.png', pronunciation: '/img/mic.png', listening: '/img/headphones.png', reading: '/img/book.png', writing: '/img/pencil.png', game: '/img/gamepad.png' };
const TYPE_AR = { exercise: 'تمرين', flashcard: 'بطاقات', pronunciation: 'نطق', listening: 'استماع', reading: 'قراءة', writing: 'كتابة', game: 'لعبة' };

/* عدّاد تنازلي لنهاية المحاولة */
function Countdown({ endsAt, onZero }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, Math.floor((new Date(endsAt) - now) / 1000));
  const fired = useRef(false);
  useEffect(() => { if (left === 0 && !fired.current) { fired.current = true; onZero?.(); } }, [left, onZero]); // انتهى الوقت → تسليم تلقائي
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
  return <span className="chip" style={{ background: left < 300 ? 'var(--pink-soft)' : 'var(--lav-soft)', fontWeight: 900 }}>⏱ {left ? `${mm}:${ss}` : 'انتهى الوقت'}</span>;
}

export default function Assignment() {
  const [qs] = useSearchParams();
  const id = qs.get('id');
  const nav = useNavigate();
  const { reload: reloadHome } = useHome();
  const { data: A, error, reload } = useApi(() => (id ? api.assignment(id) : Promise.resolve(null)), [id]);
  usePageTitle(A?.title, A?.type_label);
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState({});   // question_id → answer
  const [files, setFiles] = useState([]);       // حتى 10 ملفات
  const [note, setNote] = useState('');
  const [startQs, setStartQs] = useState(null);
  const [startAtt, setStartAtt] = useState(null);   // مرفقات الواجب الراجعة من start
  const [zoom, setZoom] = useState(null);            // صورة مفتوحة بملء الشاشة  // الأسئلة الراجعة من start (للتكليفات المؤقتة)
  if (!id) return <Navigate to="/assignments" replace />;

  if (error) return (
    <div className="page"><StatsBar />
      <div className="container"><Empty t={(error.status === 403 ? '🔒 ' : '') + error.message} e="Assignment not available" /></div>
    </div>
  );
  if (!A) return <div className="page"><StatsBar /></div>;

  const acts = A.content?.activities || [];
  const doneActs = acts.filter(a => a.status === 'completed').length;
  const started = !!A.current_attempt || !!startQs;
  const needsStart = A.settings?.start_mode === 'on_entry' && !started && A.can_start;
  const finished = ['submitted', 'graded'].includes(A.status);
  const isExam = !!A.is_exam;
  const W = isExam ? 'الاختبار' : 'التكليف';                 // كلمة الشاشة
  const sub = A.submission;
  const submitted = (sub && ['submitted', 'graded'].includes(sub.status)) || ['waiting_for_teacher', 'hidden_until_due', 'graded'].includes(A.result_state); // محاولة مفتوحة (in_progress) ليست تسليماً
  const graded = A.result_state === 'graded' && A.result;
  const SUBX = A.submission || A.attempts?.[0] || {};       // بيانات التسليم (أو آخر محاولة)   // نتيجة التصحيح الكاملة (أفضل محاولة مصحَّحة)
  const backTab = A.type === 'activity' ? '/activities' : '/assignments';
  const unitExam = A.content?.unit_exam;
  // اختبار الوحدة يُحل من شاشاته: open_api = /api/student/path/units/:unitId/exam
  const unitExamId = unitExam && (unitExam.unit_id ?? unitExam.unit?.id ?? (unitExam.open_api || '').match(/units\/(\d+)/)?.[1]);
  const questions = startQs?.length ? startQs : (A.content?.questions || []);
  const subType = A.settings?.submission_type || A.submission_type;
  const isPaper = A.type === 'paper' || subType === 'paper';
  const fileRequired = subType === 'file_upload' || isPaper || !!A.settings?.files_required;
  const maxFiles = A.settings?.max_files || 10;
  const attachments = startAtt || A.content?.attachments || [];
  // المرفقات: لو التسليم ليس تفاعلياً فقط أو فيه أنواع ملفات مقبولة
  const allowFiles = fileRequired || (A.submission_type && A.submission_type !== 'interactive') || (A.settings?.accepted_files || []).length > 0;
  const ACCEPT = { image: 'image/*', pdf: '.pdf,application/pdf', audio: 'audio/*', video: 'video/*', word: '.doc,.docx', doc: '.doc,.docx', docx: '.docx' };
  const accept = (A.settings?.accepted_files?.length ? A.settings.accepted_files : ['image', 'pdf', 'audio', 'video', 'word']).map(t => ACCEPT[t] || t).join(',');
  const unanswered = questions.filter(q => !isAnswered(q, answers[q.id] ?? q.saved_answer)).length;
  const actsLeft = acts.length - doneActs;
  const answeredQs = questions.length - unanswered;
  const progTotal = acts.length || questions.length;
  const progDone = acts.length ? doneActs : answeredQs;
  const lastAttempt = (A.attempts || []).find(t => ['submitted', 'graded'].includes(t.status));
  const reviewAns = submitted && !sub?.result_hidden_until ? (lastAttempt?.answers || []) : [];
  const ansOf = (qid) => reviewAns.find(a => a.question_id === qid);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); if (okMsg) showToast(okMsg, '✅'); reload(); reloadHome(); }
    catch (ex) { showToast(ex.message, '⚠️'); }
    setBusy(false);
  };
  const start = () => run(async () => { const r = await api.startAssignment(id); if (r?.questions?.length) setStartQs(r.questions); if (r?.attachments?.length) setStartAtt(r.attachments); }, `بدأت ${W} — بالتوفيق!`);
  const submit = (auto) => run(async () => {
    if (fileRequired && !files.length && !auto) throw new Error(isPaper ? 'ارفع صور أو ملفات حلك الورقي أولاً' : 'ارفع ملف الإجابة أولاً');
    if (!auto && !window.confirm('لن تتمكن من التعديل بعد التسليم — هل تريد التسليم الآن؟')) throw new Error('لم يتم التسليم');
    if (!auto && unanswered && !window.confirm(`لم تُجب عن ${unanswered} سؤال — هل تريد التسليم؟`)) throw new Error('أكمل الإجابات ثم سلّم');
    const ans = questions.map(q => ({ question_id: q.id, answer: answers[q.id] ?? q.saved_answer ?? null })).filter(a => a.answer !== null && a.answer !== undefined);
    const spent = A.current_attempt?.started_at ? Math.round((Date.now() - new Date(A.current_attempt.started_at)) / 1000) : undefined;
    const r = await api.submitAssignment(id, { answers: ans, files, note: note.trim(), time_spent_seconds: spent });
    setFiles([]); setNote(''); setStartQs(null); setStartAtt(null);
    winSound();
    if (r?.waiting_for_teacher) showToast('تم التسليم — بانتظار تصحيح معلمك', '⏳');
    else if (r?.submission?.score != null) showToast(`درجتك: ${r.submission.score} من ${r.submission.total_grade}`, '🎯');
    if (r?.reward?.level_up) showToast(`مبروك! وصلت إلى المستوى ${r.reward.level}`, '🎉');
    else if (r?.reward?.points_earned) showToast(`+${r.reward.points_earned} نقطة! أُضيفت لرصيدك`, '⭐');
  }, auto ? 'انتهى الوقت — سُلِّمت إجاباتك تلقائياً' : `تم تسليم ${W}`);
  const openAct = async (a) => {
    clickSound();
    if (needsStart) { try { await api.startAssignment(id); } catch (ex) { return showToast(ex.message, '⚠️'); } }
    nav(activityLink(a.lesson_id, a.activity_id) + '&assignment=' + id);
  };

  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="hero" style={{ padding: '30px 40px' }}>
          <div className="hero-txt">
            <span className="hero-chip">📌 {A.type_label} · بتكليف من معلمك</span>
            <h1 style={{ marginTop: 12 }}>{A.title}</h1>
            {A.teacher?.name && <div className="en-sub">أ. {A.teacher.name}</div>}
            <div className="unit-meta-chips" style={{ marginTop: 14 }}>
              {isPaper && <span className="chip" style={{ background: 'var(--gold-soft)', color: 'var(--ink)' }}>📝 {A.type_label || 'واجب ورقي'}</span>}
              <span className="chip">{A.status_label}</span>
              {A.due_at && <span className="chip">آخر موعد: {fmtDate(A.due_at)}</span>}
              {A.duration_minutes && <span className="chip">{A.duration_minutes} دقيقة</span>}
              {A.total_grade != null && <span className="chip">الدرجة: {A.total_grade}</span>}
              {A.settings?.pass_percentage != null && <span className="chip">النجاح من {A.settings.pass_percentage}٪</span>}
              {questions.length > 0 && <span className="chip">{questions.length} {questions.length === 1 ? 'سؤال' : 'أسئلة'}</span>}
              {A.max_attempts && <span className="chip">المحاولات: {A.attempts_used}/{A.max_attempts}</span>}
              {A.current_attempt?.ends_at && !finished && <Countdown endsAt={A.current_attempt.ends_at} onZero={() => submit(true)} />}
            </div>
            {A.description && <p style={{ marginTop: 14 }}>{A.description}</p>}
            {A.blocked_reason && (
              <div className="explain-box no" style={{ marginTop: 14 }}><div><span className="h">غير متاح</span>{A.blocked_reason}</div></div>
            )}
            <div className="hero-actions">
              {needsStart && !unitExam && <button className="btn btn-primary btn-col" disabled={busy} onClick={start}><span>{graded ? '🔁 إعادة المحاولة' : `🚀 ابدأ ${W}`}</span><span className="sub">{graded ? 'Retry' : 'Start'}</span></button>}
              {!finished && !unitExam && (started || !needsStart) && (
                <button className="btn btn-primary btn-col" disabled={busy || actsLeft > 0 || !A.can_submit || (fileRequired && !files.length) || (isPaper && unanswered > 0)} onClick={() => submit(false)}
                  style={{ opacity: actsLeft > 0 || !A.can_submit || (fileRequired && !files.length) || (isPaper && unanswered > 0) ? 0.55 : 1 }} title={actsLeft > 0 ? 'أكمل كل الأنشطة أولاً' : fileRequired && !files.length ? 'ارفع ملفاً واحداً على الأقل' : isPaper && unanswered > 0 ? 'أجب عن كل الأسئلة' : A.blocked_reason || ''}>
                  <span>✓ سلّم {W}</span><span className="sub">{acts.length ? `أنجزت ${doneActs} من ${acts.length}` : `أجبت ${answeredQs} من ${questions.length}`}</span>
                </button>
              )}
              <Link to={backTab} className="btn btn-ghost btn-col"><span>→ رجوع</span><span className="sub">Back</span></Link>
            </div>
          </div>
          <div className="week-card">
            <div>
              <div className="t1">تقدّمك</div>
              <div className="te">Progress</div>
              <div className="t2">{acts.length ? 'أنجزت' : 'أجبت'} {progDone} من {progTotal}</div>
              {A.submission?.score != null && <div className="ok">الدرجة: {A.submission.score} / {A.total_grade}</div>}
            </div>
          </div>
        </div>

        {/* نتيجة التسليم */}
        {graded && <AssignmentResult r={A.result} W={W} />}

        {submitted && !graded && (
          <div className={'explain-box ' + (A.status === 'graded' ? 'ok' : '')} style={{ marginTop: 20 }}>
            <img src="/img/owl.png" alt="" />
            <div>
              <span className="h">
                {(A.result_hidden_until ?? SUBX.result_hidden_until) ? `تم التسليم — النتيجة تظهر في ${fmtDate((A.result_hidden_until ?? SUBX.result_hidden_until))}`
                  : A.status === 'graded' ? `تم التصحيح — ${SUBX.score ?? '—'} من ${A.total_grade}${SUBX.percentage != null ? ` (${Math.round(SUBX.percentage)}٪)` : ''}${SUBX.passed === true ? ' · ناجح ✓' : SUBX.passed === false ? ' · لم تنجح' : ''}`
                  : 'تم التسليم — بانتظار تصحيح معلمك'}
              </span>
              {SUBX.feedback && <div>💬 {SUBX.feedback}</div>}
              {SUBX.submitted_at && <div style={{ fontSize: 12, color: 'var(--mute)' }}>سُلِّم في {fmtDate(SUBX.submitted_at)}{SUBX.is_late ? ' · متأخر' : ''}</div>}
              {SUBX.files?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {SUBX.files.map(f => (f.mime_type || '').startsWith('image/')
                    ? <img key={f.url} src={f.url} alt={f.name} onClick={() => openFile(f)} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10, cursor: 'zoom-in', border: '1px solid var(--line)' }} />
                    : <button key={f.url} onClick={() => openFile(f)} className="chip" style={{ cursor: 'pointer', border: 0 }}>{FILE_ICO(f.mime_type)} {f.name}</button>)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* المحاولات السابقة */}
        {A.attempts?.length > 1 && (
          <>
            <SecHead ico="/img/clipboard.png" ar={`محاولاتك (${A.attempts.length})`} en="Previous Attempts" />
            {A.attempts.map(t => (
              <div className="act-row" key={t.id} style={{ '--edge': t.status === 'graded' ? 'var(--green)' : 'var(--gold)' }}>
                <div className="ico" style={{ background: 'var(--lav-soft)' }}><img src="/img/clipboard.png" alt="" /></div>
                <div className="body">
                  <h4>المحاولة {t.attempt_no}</h4>
                  <div className="d">{[t.submitted_at && 'سُلِّمت ' + fmtDate(t.submitted_at), t.is_late && 'متأخرة'].filter(Boolean).join(' · ')}</div>
                </div>
                <span className={'st-chip ' + (t.status === 'graded' ? 'مكتملة' : 'جارية')}>{t.status_label}</span>
                <div className="prog"><div className="lab">{t.result_hidden_until ? 'النتيجة لاحقاً' : t.score != null ? `${t.score} / ${t.total_grade}` : '—'}</div></div>
              </div>
            ))}
          </>
        )}

        {/* ورقة الواجب من المعلم: صور (عرض بملء الشاشة) + ملفات (فتح / تحميل) */}
        {attachments.length > 0 && <>
          <SecHead ico="/img/scroll.png" ar={`ورقة ${W} (${attachments.length})`} en="Homework Sheet" />
          <div className="card" style={{ padding: '18px 20px' }}>
            {attachments.some(a => a.is_image) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {attachments.filter(a => a.is_image).map(a => (
                  <img key={a.id ?? a.url} src={a.url} alt={a.name} onClick={() => { clickSound(); openFile(a); }}
                    style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 12, border: '1px solid var(--line)', cursor: 'zoom-in' }} />
                ))}
              </div>
            )}
            {attachments.filter(a => !a.is_image).map(a => (
              <div key={a.id ?? a.url} className="print-row" style={{ marginTop: 10 }}>
                <span style={{ fontSize: 30 }}>{FILE_ICO(a.mime_type)}</span>
                <div><div className="t">{a.name}</div><div className="d">{a.size ? fmtSize(a.size) : ''}</div></div>
                <button className="btn-sm" onClick={() => { clickSound(); openFile(a); }}>👁 فتح</button>
              </div>
            ))}
          </div>
        </>}

        {unitExam && (
          <div className="card next-card" style={{ borderTopColor: 'var(--gold)', marginTop: 22 }}>
            <img src="/img/scroll.png" alt="" style={{ width: 74, height: 74, objectFit: 'contain', flexShrink: 0 }} />
            <div className="body"><h3>{unitExam.title || 'اختبار الوحدة'}</h3></div>
            <div className="actions">
              <Link to={'/quiz?unit=' + unitExamId} className="btn btn-primary btn-col"><span>تعليمات الاختبار</span><span className="sub">Exam Instructions</span></Link>
            </div>
          </div>
        )}

        {acts.length > 0 && <SecHead ico="/img/clipboard.png" ar={`أنشطة ${W} (${acts.length})`} en="Activities" />}
        {!acts.length && !questions.length && !unitExam && !A.content?.questions_hidden_until_start && !allowFiles && <Empty t={`لا يوجد محتوى في هذا ${W} بعد`} e="No content yet" />}
        {acts.map(a => {
          const st = ACT_ST[a.status] || { ar: 'قادمة', cta: 'ابدأ' };
          const pct = a.status === 'completed' ? 100 : 0;
          const ico = realImg(a.thumbnail) || TYPE_ICO[a.type] || '/img/clipboard.png';
          return (
            <div className="act-row" key={a.activity_id} style={{ '--edge': a.status === 'completed' ? 'var(--green)' : 'var(--brand)' }}>
              <div className="ico" style={{ background: 'var(--lav-soft)' }}><img src={ico} alt="" /></div>
              <div className="body">
                <h4>{a.title}</h4>
                <div className="en">{a.title_en}</div>
                <div className="d">{[TYPE_AR[a.type] || a.type, a.duration_minutes && a.duration_minutes + ' دقيقة', a.points && a.points + ' نقطة', a.items_count && a.items_count + ' عناصر'].filter(Boolean).join(' · ')}</div>
              </div>
              <span className={'st-chip ' + st.ar}>{st.ar}</span>
              <div className="prog">
                <div className="lab">{a.score != null ? `${a.score} / ${a.max_score}` : a.status === 'completed' ? 'اكتملت' : 'لم تبدأ بعد'}</div>
                <div className="bar thin"><i style={{ width: pct + '%', background: 'var(--green)' }} /></div>
              </div>
              <div className="act" style={{ minWidth: 84, textAlign: 'center' }}>
                <button className={'btn-sm' + (st.cta === 'ابدأ' ? ' pink' : '')} disabled={finished && a.status !== 'completed'} onClick={() => openAct(a)}>{st.cta}</button>
              </div>
            </div>
          );
        })}

        {/* أسئلة التكليف المباشرة — تُصحَّح آلياً، والنصية/المقالية ينتظرها المعلم */}
        {!graded && (questions.length > 0 || (A.content?.questions_hidden_until_start && !submitted) || reviewAns.length > 0) && (
          <>
            <SecHead ico="/img/target2.png" ar={submitted ? `مراجعة إجاباتك (${A.content?.questions_count ?? reviewAns.length})` : `أسئلة ${W} (${A.content?.questions_count ?? questions.length})`} en={submitted ? 'Your Answers' : isExam ? 'Exam Questions' : 'Questions'} />
            <div className="card activity-card">
              {!questions.length && !submitted && <Empty t={`تظهر الأسئلة بعد أن تبدأ ${W}`} e="Questions appear after you start" />}
              {/* بعد التسليم والأسئلة مخفية: ملخص ✓/✗ لكل سؤال من attempts[].answers */}
              {!questions.length && reviewAns.map((r, i) => (
                <div key={r.question_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i ? '1px dashed var(--line)' : 0 }}>
                  <span style={{ fontSize: 22 }}>{r.is_correct === true ? '✅' : r.is_correct === false ? '❌' : '⏳'}</span>
                  <span style={{ flex: 1, fontWeight: 800 }}>
                    السؤال {i + 1}
                    {/* إجابتك النصية (الأرقام = معرّف خيار، لا تُعرض) */}
                    {typeof r.answer === 'string' && r.answer.trim() && !['true', 'false'].includes(r.answer) && <span style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--ink2)' }}>إجابتك: {r.answer}</span>}
                    {['true', 'false'].includes(r.answer) && <span style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--ink2)' }}>إجابتك: {r.answer === 'true' ? 'صح' : 'خطأ'}</span>}
                  </span>
                  <span style={{ fontWeight: 900, color: r.is_correct === true ? 'var(--green-deep)' : r.is_correct === false ? 'var(--danger)' : 'var(--gold)' }}>
                    {r.points != null && r.max_points != null ? `${r.points} / ${r.max_points}` : 'بانتظار تصحيح المعلم'}
                  </span>
                </div>
              ))}
              {!questions.length && submitted && !reviewAns.length && <Empty t={sub?.result_hidden_until ? `تظهر النتيجة في ${fmtDate(sub.result_hidden_until)}` : 'لا توجد تفاصيل للإجابات'} e="Answers review" />}
              {questions.map((q, qi) => (
                <div key={q.id} style={{ borderTop: qi ? '1px dashed var(--line)' : 0, paddingTop: qi ? 22 : 0, marginTop: qi ? 22 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--mute)' }}>السؤال {qi + 1}{q.points ? ` · ${q.points} درجة` : ''}{q.auto_graded === false ? ' · يصحّحه المعلم' : ''}</span>
                    {ansOf(q.id) && <span style={{ fontWeight: 900, color: ansOf(q.id).is_correct ? 'var(--green-deep)' : ansOf(q.id).is_correct === false ? 'var(--danger)' : 'var(--gold)' }}>
                      {ansOf(q.id).is_correct === true ? '✓ صحيحة' : ansOf(q.id).is_correct === false ? '✗ خاطئة' : '⏳ بانتظار المعلم'}{ansOf(q.id).points != null && ansOf(q.id).max_points != null ? ` · ${ansOf(q.id).points}/${ansOf(q.id).max_points}` : ''}</span>}
                    {q.hint && !finished && <button className="hint-btn" onClick={() => showToast(q.hint, '💡')}>💡 تلميح</button>}
                  </div>
                  <QuestionBody q={q} value={answers[q.id] ?? ansOf(q.id)?.answer ?? q.saved_answer ?? undefined} readOnly={finished || !started}
                    onChange={(v) => setAnswers(a => ({ ...a, [q.id]: v }))} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* المرفقات + الملاحظة — حتى 10 ملفات (صورة / PDF / صوت / فيديو / Word) */}
        {!finished && (allowFiles || acts.length + questions.length > 0) && (
          <>
            <SecHead ico="/img/scroll.png" ar={isPaper ? 'ارفع حلّك الورقي' : allowFiles ? 'المرفقات والملاحظة' : 'ملاحظة لمعلمك'} en={isPaper ? 'Upload your paper solution (required)' : allowFiles ? 'Files & Note' : 'Note'} />
            <div className="card" style={{ padding: '22px 26px' }}>
              {allowFiles && (
                <>
                  {(() => {
                    const full = files.length >= maxFiles;
                    const addFiles = async (list) => {
                      const add = await Promise.all([...list].map(compressImage));
                      setFiles(f => [...f, ...add].slice(0, maxFiles));
                      if (files.length + add.length > maxFiles) showToast(`الحد الأقصى ${maxFiles} ملفات`, '⚠️');
                    };
                    return (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <label className="btn btn-primary" style={{ cursor: full ? 'not-allowed' : 'pointer', opacity: full ? 0.5 : 1 }}>
                          📷 التقط صورة
                          <input type="file" accept="image/*" capture="environment" hidden disabled={full} onChange={e => { const l = e.target.files; addFiles(l); e.target.value = ''; }} />
                        </label>
                        <label className="btn btn-ghost" style={{ cursor: full ? 'not-allowed' : 'pointer', opacity: full ? 0.5 : 1 }}>
                          📎 اختر ملفات ({files.length}/{maxFiles})
                          <input type="file" multiple hidden accept={accept} disabled={full} onChange={e => { const l = e.target.files; addFiles(l); e.target.value = ''; }} />
                        </label>
                      </div>
                    );
                  })()}
                  <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 8 }}>
                    {isPaper ? 'حلّ الورقة على الورق، ثم صوّرها أو امسحها وارفعها هنا — ملف واحد على الأقل مطلوب.' : 'صورة · PDF · صوت · فيديو · Word — الملفات والإجابات الكتابية يصحّحها معلمك'}
                  </div>
                  {files.some(f => f.type.startsWith('image/')) && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                      {files.map((f, i) => f.type.startsWith('image/') && (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={URL.createObjectURL(f)} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--line)' }} />
                          <button onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))} aria-label="حذف"
                            style={{ position: 'absolute', top: -8, insetInlineEnd: -8, width: 26, height: 26, borderRadius: '50%', background: 'var(--danger)', color: '#fff', fontWeight: 900 }}>×</button>
                          <div style={{ fontSize: 10.5, color: 'var(--mute)', textAlign: 'center' }}>{fmtSize(f.size)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {files.map((f, i) => !f.type.startsWith('image/') && (
                    <div key={i} className="print-row" style={{ marginTop: 10 }}>
                      <span style={{ fontSize: 28 }}>{FILE_ICO(f.type)}</span>
                      <div><div className="t">{f.name}</div><div className="d">{fmtSize(f.size)}</div></div>
                      <button className="btn-sm" onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}>✕ حذف</button>
                    </div>
                  ))}
                </>
              )}
              <textarea className="eng-input" dir="rtl" rows={3} value={note} onChange={e => setNote(e.target.value)}
                placeholder="ملاحظة لمعلمك (اختياري)…" style={{ width: '100%', marginTop: allowFiles ? 16 : 0, fontSize: 15, lineHeight: 1.9 }} />
            </div>
          </>
        )}
      </div>
      {zoom && (
        <div className="modal-overlay" onClick={() => setZoom(null)} role="dialog" aria-modal="true" style={{ cursor: 'zoom-out' }}>
          <img src={zoom.url} alt={zoom.name} onClick={(e) => { e.stopPropagation(); e.currentTarget.style.transform = e.currentTarget.style.transform ? '' : 'scale(1.8)'; }}
            style={{ maxWidth: '94vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12, background: '#fff', transition: 'transform .25s', cursor: 'zoom-in' }} />
        </div>
      )}
      <FooterStrip ar="أنجز تكليفات معلمك في موعدها – كل خطوة تقرّبك من هدفك" en="Finish your teacher's assignments on time!" />
    </div>
  );
}
