import { useEffect, useRef, useState } from 'react';
import { Logo, Empty } from '../components.jsx';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import { useApi, useHome, activityLink, ST } from '../api/useApi.js';
import { playClip, dingSound, buzzSound, clickSound } from '../sounds.js';
import { showToast } from '../toast.js';
import ActivityLibrary from './ActivityLibrary.jsx';

/* صفحة الدرس (المحتوى الدراسي) — GET /path/lessons/:id/page
   journey = شريط الخطوات · gallery/passage = النص · task = صح/خطأ · self_check · mascot · helpers */

const realImg = (src) => (src && !src.startsWith('data:image/svg') ? src : null);

/* شريط الجلسة المركّز — بلا نقاط ولا شارات (قاعدة العميل: لا مشتتات داخل التمرين) */
function FocusBar({ P }) {
  return (
    <div className="focus-bar">
      <div className="container in">
        <Logo h={50} />
        <div className="title">
          <div className="t">{P ? `${P.unit?.title} · ${P.lesson?.name}` : '…'}</div>
          <div className="e">{P ? [P.unit?.title_en, P.passage?.title_en].filter(Boolean).join(' · ') : ''}</div>
        </div>
        <Link to={P?.unit?.id ? '/unit?id=' + P.unit.id : '/path'} className="focus-exit">خروج من الدرس ⎋</Link>
      </div>
    </div>
  );
}

function FlowStrip({ P }) {
  const steps = (P.journey || []).map(a => {
    const s = ST(a.status);
    return { n: a.index, ar: a.title, en: a.type_label, status: s === 'done' ? 'done' : s === 'current' ? 'current' : 'todo', locked: a.is_locked, to: activityLink(P.lesson.id, a.activity_id) };
  });
  if (!steps.length) return null;
  return (
    <div className="flow-strip" style={{ marginTop: 30 }}>
      {steps.map(s => {
        const inner = (
          <>
            <div className="n">{s.status === 'done' ? '✓' : s.n}</div>
            <div className="t">{s.ar}</div>
            <div className="e">{s.en}</div>
          </>
        );
        return s.locked
          ? <div key={s.n} className={'flow-step ' + s.status} title="يُفتح بعد الخطوة السابقة">{inner}</div>
          : <Link key={s.n} to={s.to} className={'flow-step ' + s.status}>{inner}</Link>;
      })}
    </div>
  );
}

function Activity({ P }) {
  const { reload: reloadHome } = useHome();
  const nav = useNavigate();
  const [speed, setSpeed] = useState('1.0x');
  const task = P.task;
  const qs = task?.questions || [];
  const [tf, setTf] = useState({});                 // question_id → 'true' | 'false'
  const [res, setRes] = useState(task?.result || null); // { answers: [{ question_id, is_correct }] }
  const [checked, setChecked] = useState(() => (P.self_check?.items || []).filter(i => i.checked).map(i => i.index));
  const saveTimer = useRef();

  const isRight = (id) => res?.answers?.find(a => a.question_id === id)?.is_correct;

  const answerTf = (q, val) => {
    if (res || tf[q.id] !== undefined) return;
    clickSound();
    const next = { ...tf, [q.id]: val };
    setTf(next);
    if (Object.keys(next).length === qs.length) {
      // كل الأسئلة أُجيبت → تصحيح على السيرفر
      api.submitLessonTask(P.lesson.id, qs.map(x => ({ question_id: x.id, answer: next[x.id] }))).then(r => {
        setRes(r);
        r.percentage >= 60 ? dingSound() : buzzSound();
        if (r.reward?.level_up) showToast(`مبروك! وصلت إلى المستوى ${r.reward.level}`, '🎉');
        else if (r.reward?.points_earned) showToast(`+${r.reward.points_earned} نقطة! أُضيفت لرصيدك`, '⭐');
        else showToast(`أجبت ${r.correct_count} من ${r.questions_count} إجابات صحيحة`, '✅');
        reloadHome();
      }, ex => showToast(ex.message, '⚠️'));
    }
  };

  const toggleCheck = (idx) => {
    clickSound();
    const next = checked.includes(idx) ? checked.filter(x => x !== idx) : [...checked, idx];
    setChecked(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => api.saveSelfCheck(P.lesson.id, next).catch(ex => showToast(ex.message, '⚠️')), 500);
  };
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const pass = P.passage;
  const img = realImg(P.gallery?.[0]?.url);
  const outcome = P.learning_outcomes?.[0];
  const steps = P.journey || [];
  const nextAct = steps.find(a => !a.is_locked && a.status !== 'completed') || steps.find(a => !a.is_locked);
  const firstAct = steps.find(a => !a.is_locked);

  return (
    <div className="card activity-card">
      {img && (
        <div className="scene">
          <img src={img} alt="" />
        </div>
      )}
      <h2>{pass?.title || P.lesson.name}</h2>
      <div className="en">{pass?.title_en}</div>
      {outcome && (
        <div className="outcome-banner">
          <img src="/img/target2.png" alt="" />
          <div>
            <div className="l">ناتج التعلم لهذا الدرس · Learning Outcome</div>
            {P.learning_outcomes.map(o => <div className="t" key={o.id}>{o.title}</div>)}
          </div>
        </div>
      )}
      {pass?.instruction && (
        <p className="prompt">
          {pass.instruction} مرّر الماوس فوق أي فقرة لترى ترجمتها.
        </p>
      )}

      {/* فقرة لكل متحدث، بترجمة هوفر وصوت للفقرة */}
      {(pass?.paragraphs || []).map(p => (
        <div className="passage" key={p.index} style={{ marginTop: 10 }}>
          <b style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            {p.icon} {p.speaker}
            {p.audio && <button className="sound-btn" style={{ width: 30, height: 30, fontSize: 13 }} onClick={() => playClip(p.audio, parseFloat(speed))} aria-label={'استمع: ' + p.speaker}>🔊</button>}
          </b>
          <span className="tr-hover" data-tr={p.text_en}>{p.text}</span>
        </div>
      ))}

      {(pass?.audio || pass?.paragraphs?.length > 0) && (
        <div className="audio-player">
          <button className="audio-play" onClick={() => pass.audio
            ? playClip(pass.audio, parseFloat(speed))
            : playClip(pass.paragraphs[0].audio, parseFloat(speed))}>▶</button>
          <div className="audio-track">
            <div className="bar"><i style={{ width: '35%' }} /></div>
          </div>
          <span className="speed-lab">سرعة التشغيل</span>
          <div className="speed-pills">
            {['0.75x', '1.0x', '1.25x'].map(s => (
              <button key={s} className={'speed-pill' + (speed === s ? ' active' : '')} onClick={() => setSpeed(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* المهمة: صح أم خطأ — التصحيح من السيرفر بعد آخر إجابة */}
      {qs.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h4 style={{ fontSize: 15.5 }}>{task.title} ✓✗</h4>
          <div className="en" style={{ fontSize: 11, color: 'var(--mute)' }}>{task.instruction}</div>
          {qs.map(q => {
            const mine = tf[q.id];
            const ok = isRight(q.id);
            const graded = ok !== undefined;
            const cls = (v) => 'option' + (mine === v && graded ? (ok ? ' correct' : ' wrong') : mine === v ? ' selected' : '');
            return (
              <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{ flex: 1, fontWeight: 700, fontSize: 14.5, minWidth: 200 }}>
                  <span className="tr-hover" data-tr={q.text_en}>{q.text}</span>
                </span>
                {q.audio && <button className="sound-btn" onClick={() => playClip(q.audio)} aria-label="استمع للسؤال">🔊</button>}
                <button className={cls('true')} style={{ padding: '8px 18px' }} disabled={!!res || mine !== undefined} onClick={() => answerTf(q, 'true')}>صح ✓</button>
                <button className={cls('false')} style={{ padding: '8px 18px' }} disabled={!!res || mine !== undefined} onClick={() => answerTf(q, 'false')}>خطأ ✗</button>
                {graded && <span style={{ fontSize: 18 }}>{ok ? '🌟' : '👣'}</span>}
              </div>
            );
          })}
          {res && (
            <div className="eng-note" style={{ marginTop: 10, fontWeight: 700 }}>
              نتيجتك: {res.correct_count ?? res.answers?.filter(a => a.is_correct).length} من {res.questions_count ?? qs.length}
            </div>
          )}
        </div>
      )}

      {P.self_check?.items?.length > 0 && (
        <div className="self-check">
          <h4>{P.self_check.title}</h4>
          <div className="e">Check yourself after reading</div>
          <div style={{ marginTop: 8 }}>
            {P.self_check.items.map(c => (
              <label key={c.index}><input type="checkbox" checked={checked.includes(c.index)} onChange={() => toggleCheck(c.index)} /> {c.text}</label>
            ))}
          </div>
        </div>
      )}

      <div className="activity-nav">
        {P.hint && <button className="hint-btn" onClick={() => showToast(P.hint, '💡')}>💡 تلميح</button>}
        <div className="spacer" />
        {firstAct && <button className="btn btn-ghost" onClick={() => nav(activityLink(P.lesson.id, firstAct.activity_id))}>أنشطة الدرس</button>}
        {nextAct && (
          <button className="btn btn-primary" onClick={() => nav(activityLink(P.lesson.id, nextAct.activity_id))}>
            الخطوة التالية: {nextAct.type_label} ←
          </button>
        )}
      </div>
    </div>
  );
}

function Tools({ P }) {
  const H = P.helpers || {};
  const phrases = H.phrases || [];
  const vocab = H.vocabulary || [];
  const pron = H.pronunciation || [];
  const g = H.grammar;
  const [pi, setPi] = useState(0);
  const pw = pron[pi];
  return (
    <div className="col">
      {P.mascot?.text && (
        <div className="mascot">
          <img src="/img/owl.png" alt="" />
          <div className="b">{P.mascot.text}</div>
        </div>
      )}

      {phrases.length > 0 && (
        <div className="side-card tool-card" id="tool-phrases">
          <div className="head">
            <img src="/img/speech.png" alt="" />
            <div>
              <h3>عبارات مفيدة</h3>
              <div className="en">Useful Phrases</div>
            </div>
          </div>
          {phrases.map(p => (
            <div className="phrase-row" key={p.ar}>
              <button className="sound-btn" onClick={() => playClip(p.audio)} aria-label={'استمع: ' + p.ar}>🔊</button>
              <div className="txt">
                <div className="ar">{p.ar}</div>
                <div className="tr">{p.en}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {vocab.length > 0 && (
        <div className="side-card tool-card" id="tool-vocab">
          <div className="head">
            <img src="/img/flashcards.png" alt="" />
            <div>
              <h3>بنك المفردات</h3>
              <div className="en">Vocabulary Bank</div>
            </div>
          </div>
          <div className="vocab-grid">
            {vocab.map(v => (
              <div className="vocab-card" key={v.id}>
                <div className="img"><img loading="lazy" decoding="async" src={realImg(v.front_image) || '/img/logo-masar.svg'} alt="" /></div>
                <div className="ar">{v.front_text}</div>
                <div className="tr">{v.front_text_en}</div>
                {v.front_audio && <button className="sound-btn" onClick={() => playClip(v.front_audio)} aria-label={'استمع: ' + v.front_text}>🔊</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {pw && (
        <div className="side-card tool-card" id="tool-pron">
          <div className="head">
            <img src="/img/mic.png" alt="" />
            <div>
              <h3>دعم النطق</h3>
              <div className="en">Pronunciation Support</div>
            </div>
          </div>
          <div style={{ background: 'var(--lav-soft)', borderRadius: 14, padding: '16px 18px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="audio-play" style={{ width: 52, height: 52, flexShrink: 0 }} aria-label="استمع للنطق" onClick={() => playClip(pw.reference_audio)}>🔊</button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 22 }}>{pw.text}</div>
              <div style={{ fontSize: 13, color: 'var(--mute)', direction: 'ltr' }}>[{pw.phonetic}]</div>
            </div>
            {pron.length > 1 && <button className="sound-btn" onClick={() => { clickSound(); setPi((pi + 1) % pron.length); }} aria-label="الكلمة التالية">↻</button>}
          </div>
          {pw.hint && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5, fontWeight: 700, color: 'var(--brand-ink)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px' }}>
              <span>🗣</span> {pw.hint}
            </div>
          )}
        </div>
      )}

      {g && (
        <div className="side-card tool-card" id="tool-grammar">
          <div className="head">
            <img src="/img/book.png" alt="" />
            <div>
              <h3>{g.title || 'القاعدة المساعدة'}</h3>
              <div className="en">Grammar Helper</div>
            </div>
          </div>
          <div className="grammar-box">
            <div className="rule">{g.rule}</div>
            {(g.correct?.length > 0 || g.wrong?.length > 0) && (
              <div className="ex">
                {(g.correct || []).map(c => <span key={c}><span className="ok">✔ {c}</span><br /></span>)}
                {(g.wrong || []).map(c => <span key={c}><span className="no">✘ {c}</span><br /></span>)}
              </div>
            )}
            {g.common_mistake && <div className="warn">{g.common_mistake}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolkitBar({ P }) {
  const nav = useNavigate();
  const c = P.helpers?.counts || {};
  const jump = (id) => { clickSound(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const items = [
    { t: 'بطاقات المفردات', e: 'Flashcards',      ico: '/img/flashcards.png', cnt: c.vocabulary,    id: 'tool-vocab' },
    { t: 'قواعد اللغة',     e: 'Grammar Toolkit', ico: '/img/book.png',       cnt: c.grammar,       id: 'tool-grammar' },
    { t: 'عبارات مساعدة',   e: 'Helping Phrases', ico: '/img/speech.png',     cnt: c.phrases,       id: 'tool-phrases' },
    { t: 'دعم النطق',       e: 'Pronunciation',   ico: '/img/mic.png',        cnt: c.pronunciation, id: 'tool-pron' },
  ].filter(i => i.cnt > 0);
  const prev = P.previous_lesson, next = P.next_lesson;
  const go = (l) => {
    clickSound();
    if (!l) return;
    if (l.is_locked) return showToast(`«${l.name}» يُفتح بعد إنهاء هذا الدرس`, '🔒');
    nav('/lesson?id=' + l.id);
  };
  return (
    <div className="toolkit-bar">
      {items.length > 0 && <>
        <div className="head">أدوات مساعدة</div>
        <div className="en">Helpful Tools — حقيبة أدواتك في كل درس</div>
        <div className="toolkit-items">
          {items.map(i => (
            <a href="#!" onClick={(e) => { e.preventDefault(); jump(i.id); }} className="toolkit-item" key={i.t}>
              <span className="cnt">{i.cnt}</span>
              <img src={i.ico} alt="" />
              <div>
                <div className="t">{i.t}</div>
                <div className="e">{i.e}</div>
              </div>
            </a>
          ))}
        </div>
      </>}
      <div className="lesson-nav-bar">
        <button className="btn btn-ghost" disabled={!prev} style={{ opacity: prev ? 1 : 0.5 }}
          onClick={() => (prev ? go(prev) : showToast('هذا أول درس في الوحدة — أنت في البداية!', '🌱'))}>→ الدرس السابق</button>
        <div className="mid">
          <div className="t">الدرس {P.lesson.number}: {P.lesson.name}</div>
          <div className="e">{P.lesson.description}</div>
        </div>
        <button className="btn btn-primary" disabled={!next} style={{ opacity: next ? 1 : 0.5 }}
          onClick={() => (next ? go(next) : showToast('هذا آخر درس في الوحدة', '🏁'))}>الدرس التالي ←</button>
      </div>
    </div>
  );
}

export default function Lesson() {
  const [qs] = useSearchParams();
  const id = qs.get('id');
  const { data: P, error } = useApi(() => (id ? api.lessonPage(id) : Promise.resolve(null)), [id]);
  if (!id) return <Navigate to="/path" replace />;
  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar P={P} />
      <div className="container">
        {/* صفحة الدرس مقفلة في المسار (403) → نعرض أنشطة الدرس من مكتبة المنصة (لا تُقفل) بدل رسالة القفل */}
        {error && error.status === 403 && (
          <div style={{ marginTop: 26 }}>
            <div className="page-head" style={{ padding: 0 }}>
              <div><h1 style={{ fontSize: 26 }}>أنشطة الدرس</h1><div className="en">Lesson Activities</div></div>
              <Link to="/activities?tab=library" className="btn btn-ghost" style={{ padding: '9px 20px', fontSize: 13.5 }}>كل أنشطة المنصة</Link>
            </div>
            <ActivityLibrary lessonId={id} />
          </div>
        )}
        {error && error.status !== 403 && <Empty t={error.message} e="Could not load lesson" />}
        {P && <>
          <FlowStrip P={P} />
          <div className="lesson-grid">
            <div className="col">
              <Activity key={P.lesson.id} P={P} />
              <ToolkitBar P={P} />
            </div>
            <Tools P={P} />
          </div>
        </>}
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
