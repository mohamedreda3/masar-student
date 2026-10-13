import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome, unitArt } from '../api/useApi.js';
import QuestionBody, { realImg, isAnswered } from '../QuestionBody.jsx';
import { playClip, clickSound, winSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* قارئ القصة من الباك اند — نفس تصميم Story: GET /stories/:id
   كل تغيير صفحة → POST progress { last_page } · آخر صفحة → أسئلة الفهم → POST submit → /result */

const SIZES = { 'A-': 17, 'A': 20, 'A+': 24 };

export default function StoryReader({ id }) {
  const nav = useNavigate();
  const { reload: reloadHome } = useHome();
  const { data: S, error } = useApi(() => api.story(id), [id]);
  const [p, setP] = useState(0);
  const [speed, setSpeed] = useState('1.0x');
  const [size, setSize] = useState('A');
  const [quiz, setQuiz] = useState(false);       // شاشة أسئلة الفهم
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(Date.now());
  const ready = useRef(false);

  // ابدأ من آخر صفحة وصلها الطالب
  useEffect(() => {
    if (!S) return;
    const n = S.pages?.length || 0;
    setP(Math.min(Math.max((S.last_page || 1) - 1, 0), Math.max(n - 1, 0)));
    ready.current = true;
  }, [S]);

  // حفظ موضع القراءة مع كل تغيير صفحة
  useEffect(() => {
    if (!S || !ready.current) return;
    api.storyProgress(id, p + 1).catch(() => {});
  }, [p]); // eslint-disable-line react-hooks/exhaustive-deps

  const FocusBar = () => (
    <div className="focus-bar">
      <div className="container in">
        <Logo h={50} />
        <div className="title">
          <div className="t">قصة: {S?.title || '…'}</div>
          <div className="e">{S?.title_en ? `Story: ${S.title_en}` : ''}</div>
        </div>
        <Link to="/library" className="focus-exit">خروج ⎋</Link>
      </div>
    </div>
  );

  if (error) return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar />
      <div className="container">
        <Empty t={error.status === 403 ? '🔒 ' + (error.message || 'هذه القصة مقفلة — أغلقها معلمك') : error.message} e={error.status === 403 ? 'Locked story' : 'Could not load story'} />
        <div style={{ textAlign: 'center', marginTop: 14 }}><Link to="/library" className="btn btn-ghost">→ مكتبة القصص</Link></div>
      </div>
    </div>
  );
  if (!S) return <div className="page" style={{ background: 'var(--wash)' }}><FocusBar /></div>;

  const pages = S.pages || [];
  const page = pages[p] || {};
  const last = p >= pages.length - 1;
  const qs = S.questions || [];
  const unanswered = qs.filter(q => !isAnswered(q, answers[q.id])).length;

  const submit = async () => {
    setBusy(true);
    try {
      const spent = Math.round((Date.now() - startedAt.current) / 1000);
      const r = await api.submitStory(id, qs.map(q => ({ question_id: q.id, answer: answers[q.id] ?? null })).filter(a => a.answer !== null), spent);
      const R = r.result || {};
      winSound();
      reloadHome();
      nav('/result', {
        state: {
          pct: Math.round(R.percentage ?? 100),
          reward: r.reward ?? { points_earned: R.points_earned ?? 0 },
          time: R.time_spent,
          correct: R.questions_count ? `${R.correct_count} من ${R.questions_count}` : '—',
          story: { rating: R.rating, did_well: r.feedback?.did_well || [], to_improve: r.feedback?.to_improve || [], no_questions: !R.questions_count },
          retry: '/story?id=' + id,
          next: r.next_story ? '/story?id=' + r.next_story.id : null,
        },
      });
    } catch (ex) { showToast(ex.message, '⚠️'); setBusy(false); }
  };
  const finish = () => { clickSound(); qs.length ? setQuiz(true) : submit(); };

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar />
      <div className="container">
        {!quiz ? <>
          <div className="quiz-progress">
            <span className="lab">الصفحة {p + 1} من {pages.length}</span>
            <div className="bar"><i style={{ width: ((p + 1) / Math.max(pages.length, 1)) * 100 + '%', background: 'var(--green)' }} /></div>
            <span className="size-pills">
              {['A-', 'A', 'A+'].map(s => (
                <button key={s} className={'size-pill' + (size === s ? ' active' : '')} onClick={() => setSize(s)} style={{ direction: 'ltr' }}>{s}</button>
              ))}
            </span>
          </div>

          <div className="card activity-card" style={{ marginTop: 22, maxWidth: 980, marginInline: 'auto' }}>
            {!pages.length && <Empty t="لا توجد صفحات في هذه القصة بعد" e="No pages yet" />}
            {pages.length > 0 && <>
              <div className="scene" style={{ maxWidth: 640, marginInline: 'auto' }}>
                <img src={realImg(page.image) || realImg(S.cover_image) || unitArt(S.unit?.title)} alt="" />
              </div>
              <p style={{ fontSize: SIZES[size], lineHeight: 2.4, marginTop: 24, textAlign: 'center', fontWeight: 500 }}>
                {page.text_en ? <span className="tr-hover" data-tr={page.text_en}>{page.text}</span> : page.text}
              </p>
              {page.text_en && (
                <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--mute2)', marginTop: 10 }}>
                  💡 مرّر الماوس فوق النص لترى الترجمة · Hover over the text to see the translation
                </div>
              )}
              {page.audio && (
                <div className="audio-player" style={{ maxWidth: 640, marginInline: 'auto' }}>
                  <button className="audio-play" onClick={() => playClip(page.audio, parseFloat(speed))}>▶</button>
                  <div className="audio-track"><div className="bar"><i style={{ width: '30%' }} /></div></div>
                  <span className="speed-lab">سرعة التشغيل</span>
                  <div className="speed-pills">
                    {['0.75x', '1.0x', '1.25x'].map(s => (
                      <button key={s} className={'speed-pill' + (speed === s ? ' active' : '')} onClick={() => setSpeed(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </>}

            <div className="activity-nav">
              <button className="btn btn-ghost" onClick={() => { clickSound(); setP(Math.max(0, p - 1)); }} style={{ opacity: p === 0 ? 0.4 : 1 }} disabled={p === 0}>
                → الصفحة السابقة
              </button>
              <div className="spacer" />
              {last
                ? <button className="btn btn-primary" disabled={busy} onClick={finish}>{busy ? '…' : 'أنهيت القصة 🎉'}</button>
                : <button className="btn btn-primary" onClick={() => { clickSound(); setP(p + 1); }}>الصفحة التالية ←</button>}
            </div>
          </div>
        </> : (
          /* أسئلة الفهم — نفس مكوّن أسئلة الأنشطة */
          <div className="card activity-card" style={{ marginTop: 22, maxWidth: 980, marginInline: 'auto' }}>
            <div className="q-title">أسئلة الفهم 🧠</div>
            <div className="q-en">أجب عن الأسئلة لتعرف مدى فهمك للقصة · {qs.length} أسئلة</div>
            {qs.map((q, qi) => (
              <div key={q.id} style={{ borderTop: '1px dashed var(--line)', paddingTop: 20, marginTop: 20 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--mute)' }}>السؤال {qi + 1}{q.points ? ` · ${q.points} درجة` : ''}</div>
                <QuestionBody q={q} value={answers[q.id]} onChange={(v) => setAnswers(a => ({ ...a, [q.id]: v }))} />
              </div>
            ))}
            <div className="activity-nav">
              <button className="btn btn-ghost" onClick={() => { clickSound(); setQuiz(false); }}>→ العودة للقصة</button>
              <div className="spacer" />
              {unanswered > 0 && <span style={{ fontSize: 12.5, color: 'var(--mute)', fontWeight: 700 }}>باقي {unanswered} أسئلة</span>}
              <button className="btn btn-primary" disabled={busy || unanswered > 0} onClick={submit} style={{ opacity: unanswered > 0 ? 0.55 : 1 }}>
                {busy ? '…' : 'تسليم وعرض النتيجة ←'}
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
