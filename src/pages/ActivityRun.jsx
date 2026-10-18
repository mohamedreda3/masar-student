import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome, activityLink, usePageTitle } from '../api/useApi.js';
import { dingSound, winSound, clickSound, playClip } from '../sounds.js';
import { showToast } from '../toast.js';

import QuestionBody, { realImg, isAnswered } from '../QuestionBody.jsx';
import GamePlayer from '../games.jsx';

/* تشغيل نشاط من الباك اند داخل تصميم الاختبار القصير:
   أسئلة (mcq / tf / نصية) → submit · نطق (تسجيل لكل كلمة) → complete · بطاقات → complete */
function buildItems(A) {
  const qs = (A.questions || []).map(q => ({ kind: 'question', ...q }));
  const ps = (A.pronunciations || []).map(p => ({ kind: 'pron', ...p }));
  const fs = (A.flashcards || []).map(f => ({ kind: 'card', ...f }));
  const gs = (A.games || []).map(g => ({ kind: 'game', ...g }));
  return [...qs, ...ps, ...fs, ...gs];
}

function FocusBar({ A, back }) {
  return (
    <div className="focus-bar">
      <div className="container in">
        <Logo h={50} />
        <div className="title">
          <div className="t">{A ? `${A.type_label} · ${A.title}` : '…'}</div>
          <div className="e">{A?.title_en}</div>
        </div>
        <Link to={back} className="focus-exit">خروج ⎋</Link>
      </div>
    </div>
  );
}

/* زر تسجيل صوت بالمايك — يعيد Blob */
function Recorder({ onDone, has }) {
  const [rec, setRec] = useState(null);
  const chunks = useRef([]);
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = e => chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        onDone(new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' }));
        setRec(null);
      };
      mr.start();
      setRec(mr);
    } catch {
      showToast('اسمح للمتصفح باستخدام الميكروفون لتسجيل صوتك', '🎙');
    }
  };
  return rec
    ? <button className="btn btn-primary" onClick={() => rec.stop()} style={{ background: 'var(--pink)' }}>⏹ إيقاف التسجيل</button>
    : <button className="btn btn-ghost" onClick={start}>{has ? '🎙 أعد التسجيل' : '🎙 سجّل صوتك'}</button>;
}

/* مصدر النشاط: مسار الطالب، أو تكليف من المعلم (يعمل حتى لو درسه مقفل في المسار) */
const sourceOf = (lessonId, activityId, viaActivities) => (viaActivities ? {
  get: () => api.aActivity(activityId, lessonId),
  start: () => api.aStartActivity(activityId, lessonId),
  submit: (a, t) => api.aSubmitActivity(activityId, lessonId, a, t),
  complete: (b) => api.aCompleteActivity(activityId, lessonId, b),
} : {
  get: () => api.activity(lessonId, activityId),
  start: () => api.startActivity(lessonId, activityId),
  submit: (a, t) => api.submitActivity(lessonId, activityId, a, t),
  complete: (b) => api.completeActivity(lessonId, activityId, b),
});

export default function ActivityRun({ lessonId, activityId, assignment, library }) {
  // تكليف أو مكتبة → مسارات /activities/:id (لا تُقفل)، وإلا مسار الطالب
  const src = sourceOf(lessonId, activityId, assignment || library);
  const nav = useNavigate();
  const { reload: reloadHome } = useHome();
  const back = assignment ? '/assignment?id=' + assignment : library ? '/activities?tab=library' : '/path';
  const { data, error } = useApi(() => src.get(), [lessonId, activityId, assignment, library]);
  usePageTitle(data?.activity?.title, data?.activity?.type_label);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});   // question_id → answer
  const [audios, setAudios] = useState({});     // pronunciation_id → Blob
  const [busy, setBusy] = useState(false);
  const [flipped, setFlipped] = useState({});  // flashcard id → مقلوبة؟
  const [known, setKnown] = useState({});      // flashcard id → أعرفها؟
  const [gameRes, setGameRes] = useState({});  // game id → { score, max_score, mistakes, time_spent_seconds }
  const startedAt = useRef(Date.now());   // لحساب «الوقت المستغرق»

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { src.start().catch(() => {}); }, [lessonId, activityId, assignment]);

  const A = data?.activity;
  if (error) return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar A={null} back={back} />
      <div className="container"><Empty t={(error.status === 403 ? '🔒 ' : '') + error.message} e={error.status === 403 ? 'Locked — finish the previous step first' : 'Could not load activity'} /></div>
    </div>
  );
  if (!A) return <div className="page" style={{ background: 'var(--wash)' }}><FocusBar A={null} back={back} /></div>;

  const items = buildItems(A);
  if (!items.length) return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar A={A} back={back} />
      <div className="container"><Empty t="لا يوجد محتوى في هذا النشاط بعد" e="No content yet" /></div>
    </div>
  );

  const it = items[i];
  const last = i === items.length - 1;
  const ans = it.kind === 'question' ? answers[it.id] : undefined;
  const setAns = (v) => { clickSound(); setAnswers(a => ({ ...a, [it.id]: v })); };
  const canNext =
    it.kind === 'question' ? isAnswered(it, ans) :
    it.kind === 'pron' ? !!audios[it.id] :
    it.kind === 'card' ? known[it.id] !== undefined :
    it.kind === 'game' ? !!gameRes[it.id] : true;
  const totalPts = (A.questions || []).reduce((s, q) => s + (q.points || 0), 0);

  const finish = async () => {
    setBusy(true);
    try {
      let pct = 100, reward = null, correct = null, nextStep = null, unitId = null;
      if (A.questions?.length) {
        const r = await src.submit(A.questions.map(q => ({ question_id: q.id, answer: answers[q.id] ?? null })), Math.round((Date.now() - startedAt.current) / 1000));
        pct = Math.round(r.result?.percentage ?? 0);
        reward = r.reward;
        nextStep = r.next_step; unitId = r.lesson?.unit_id;
        correct = `${r.result?.correct_count ?? 0} من ${r.result?.questions_count ?? A.questions.length}`;
      } else {
        let fd;
        if (A.flashcards?.length) fd = { flashcards: A.flashcards.map(c => ({ id: c.id, known: !!known[c.id] })) };
        if (A.games?.length) fd = { ...(fd || {}), games: A.games.map(g => ({ id: g.id, ...(gameRes[g.id] || { score: 0, max_score: 0, mistakes: 0, time_spent_seconds: 0 }) })) };
        if (A.pronunciations?.length) {
          fd = new FormData();
          A.pronunciations.forEach(p => fd.append('audio_' + p.id, audios[p.id], `audio_${p.id}.webm`));
        }
        const r = await src.complete(fd);
        pct = Math.round(r?.result?.percentage ?? r?.percentage ?? 100);
        reward = r?.reward;
        nextStep = r?.next_step; unitId = r?.lesson?.unit_id;
        const known_n = A.flashcards?.filter(c => known[c.id]).length;
        const n = A.pronunciations?.length || A.flashcards?.length || 0;
        if (A.flashcards?.length) correct = known_n + ' من ' + n;
        else if (n) correct = `${n} من ${n}`;
      }
      winSound();
      reloadHome();
      const sec = Math.round((Date.now() - startedAt.current) / 1000);
      const time = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
      // روابط أزرار النتيجة: النشاط التالي من next_step، وإعادة نفس النشاط
      const na = nextStep?.activity, nl = nextStep?.lesson;
      const next = assignment || library ? back : na && nl ? activityLink(nl.id, na.activity_id) : '/unit?id=' + (nextStep?.unit?.id || unitId || data.unit?.id || '');
      const retry = activityLink(lessonId, activityId) + (assignment ? '&assignment=' + assignment : library ? '&library=1' : '');
      nav('/result', { state: { pct, reward, correct, time, next, retry } });
    } catch (ex) {
      showToast(ex.message, '⚠️');
      setBusy(false);
    }
  };
  // البطاقات: بعد «أعرفها/لم أعرفها» انتقل للبطاقة التالية تلقائياً (الأخيرة تنتظر «إنهاء»)
  const autoNext = () => { if (!last) setTimeout(() => setI(x => x + 1), 350); };
  const next = () => {
    if (!canNext || busy) return;
    if (last) return finish();
    dingSound();
    setI(i + 1);
  };

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar A={A} back={back} />
      <div className="container">
        <div className="quiz-progress">
          <span className="lab">{it.kind === 'question' ? 'السؤال' : 'الخطوة'} {i + 1} من {items.length}</span>
          <div className="bar"><i style={{ width: ((i + (canNext ? 1 : 0)) / items.length) * 100 + '%' }} /></div>
          <span className="pts">{it.kind === 'question' ? `درجة السؤال ${it.points} · المجموع ${totalPts}` : `${A.points} نقطة`}</span>
        </div>

        <div className="card activity-card" style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span />
            {it.hint && <button className="hint-btn" onClick={() => showToast(it.hint, '💡')}>💡 تلميح</button>}
          </div>

          {it.kind === 'question' && (
            <>
              <QuestionBody q={it} value={ans} onChange={(v) => setAnswers(a => ({ ...a, [it.id]: v }))} />
            </>
          )}

          {it.kind === 'pron' && (
            <>
              {realImg(it.reference_image) && <div className="q-img"><img loading="lazy" decoding="async" src={it.reference_image} alt="" /></div>}
              <div className="q-title">{it.text}</div>
              <div className="q-en">{it.text_en} · <span dir="ltr">[{it.phonetic}]</span></div>
              <div className="audio-player">
                <button className="audio-play" onClick={() => playClip(it.reference_audio)}>▶</button>
                <div className="audio-track"><div className="bar"><i style={{ width: '25%' }} /></div></div>
                <span className="speed-lab">استمع للنطق الصحيح ثم سجّل صوتك</span>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                <Recorder has={!!audios[it.id]} onDone={(b) => { dingSound(); setAudios(a => ({ ...a, [it.id]: b })); }} />
                {audios[it.id] && <button className="btn btn-ghost" onClick={() => new Audio(URL.createObjectURL(audios[it.id])).play()}>🔊 استمع لتسجيلك</button>}
              </div>
            </>
          )}

          {it.kind === 'game' && <GamePlayer key={it.id} game={it} onDone={(r) => setGameRes(g => ({ ...g, [it.id]: r }))} />}

          {it.kind === 'card' && (
            <>
              {/* بطاقة فلاش حقيقية: اضغط عليها لتنقلب (وجه = الكلمة، ظهر = المعنى) */}
              <div className={"fcard" + (flipped[it.id] ? " flipped" : "")} key={it.id} role="button" tabIndex={0}
                aria-label={flipped[it.id] ? "اضغط لرؤية الكلمة" : "اضغط لرؤية المعنى"}
                onClick={() => { clickSound(); setFlipped(f => ({ ...f, [it.id]: !f[it.id] })); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFlipped(f => ({ ...f, [it.id]: !f[it.id] })); } }}>
                <div className="fcard-in">
                  <div className="fcard-face front">
                    <span className="fcard-tag">الكلمة · Word</span>
                    {realImg(it.front_image) && <img src={it.front_image} alt="" />}
                    <div className="w">{it.front_text}</div>
                    <div className="e">{it.front_text_en}</div>
                    {it.front_audio && <button className="fcard-snd" onClick={(e) => { e.stopPropagation(); playClip(it.front_audio); }} aria-label="استمع للكلمة">🔊</button>}
                    <span className="fcard-hint">👆 اضغط لتقلب البطاقة</span>
                  </div>
                  <div className="fcard-face back">
                    <span className="fcard-tag">المعنى · Meaning</span>
                    {realImg(it.back_image) && <img src={it.back_image} alt="" />}
                    <div className="w">{it.back_text}</div>
                    {it.back_text_en && it.back_text_en !== it.front_text_en && <div className="e">{it.back_text_en}</div>}
                    {it.back_audio && <button className="fcard-snd" onClick={(e) => { e.stopPropagation(); playClip(it.back_audio); }} aria-label="استمع للمعنى">🔊</button>}
                    <span className="fcard-hint">👆 اضغط للعودة للكلمة</span>
                  </div>
                </div>
              </div>
              <div className="fcard-dots">{A.flashcards.map(c => <i key={c.id} className={c.id === it.id ? "on" : known[c.id] === true ? "ok" : known[c.id] === false ? "no" : ""} />)}</div>
              {/* تقييم الطالب لنفسه — يُرسل للباك اند: flashcards: [{ id, known }] */}
              <div className="options" style={{ marginTop: 16 }}>
                <button className={'option' + (known[it.id] === true ? ' selected' : '')} onClick={() => { dingSound(); setKnown(k => ({ ...k, [it.id]: true })); autoNext(); }}>
                  <span className="key">✓</span>أعرفها
                </button>
                <button className={'option' + (known[it.id] === false ? ' selected' : '')} onClick={() => { clickSound(); setKnown(k => ({ ...k, [it.id]: false })); autoNext(); }}>
                  <span className="key">✗</span>لم أعرفها بعد
                </button>
              </div>
            </>
          )}

          <div className="activity-nav">
            {i > 0 && <button className="btn btn-ghost" onClick={() => setI(i - 1)}>→ السابق</button>}
            <div className="spacer" />
            <button className="btn btn-primary" onClick={next} style={{ opacity: canNext && !busy ? 1 : 0.5 }}>
              {busy ? '…' : last ? 'إنهاء وعرض النتيجة ←' : 'التالي ←'}
            </button>
          </div>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
