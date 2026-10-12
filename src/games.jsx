import { useEffect, useMemo, useRef, useState } from 'react';
import { dingSound, buzzSound, clickSound, winSound } from './sounds.js';

/* ألعاب الأنشطة — game_type + config من الـAPI، والإجابات داخل config
   كل لعبة تنادي onDone({ score, max_score, mistakes, time_spent_seconds }) مرة واحدة عند الانتهاء */

const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = (s) => String(s ?? '').replace(/[ً-ْ]/g, '').replace(/[أإآ]/g, 'ا').trim();

/* مؤقت تنازلي اختياري + عدّاد الوقت المستغرق */
function useClock(limit, onTimeout) {
  const start = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  const spent = Math.floor((now - start.current) / 1000);
  const left = limit ? Math.max(0, limit - spent) : null;
  useEffect(() => { if (limit && left === 0 && !fired.current) { fired.current = true; onTimeout?.(); } }, [left, limit, onTimeout]);
  return { spent: () => Math.floor((Date.now() - start.current) / 1000), left };
}

function Clock({ left }) {
  if (left == null) return null;
  return <span className="chip" style={{ fontWeight: 900, background: left <= 10 ? 'var(--pink-soft)' : 'var(--lav-soft)' }}>⏱ {left} ث</span>;
}

function DoneBox({ r }) {
  return (
    <div className="explain-box ok" style={{ marginTop: 16 }}>
      <img src="/img/owl.png" alt="" />
      <div><span className="h">انتهت اللعبة! {r.score} من {r.max_score}</span>{r.mistakes ? `أخطاء: ${r.mistakes} · ` : ''}الوقت: {r.time_spent_seconds} ثانية</div>
    </div>
  );
}

/* غلاف مشترك: يمنع تكرار onDone ويعرض النتيجة */
function useFinish(onDone) {
  const [res, setRes] = useState(null);
  const finish = (r) => { if (res) return; setRes(r); winSound(); onDone(r); };
  return [res, finish];
}

/* ===== 1) memory_match — اقلب بطاقتين متطابقتين (a ↔ b) ===== */
function MemoryMatch({ config, onDone }) {
  const pairs = config.pairs || [];
  const cards = useMemo(() => shuffle(pairs.flatMap((p, i) => [{ k: i + 'a', pair: i, text: p.a }, { k: i + 'b', pair: i, text: p.b }])), [pairs]);
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds, () => finish({ score: matched.length, max_score: pairs.length, mistakes, time_spent_seconds: clock.spent() }));
  const tap = (c) => {
    if (res || open.length === 2 || open.includes(c.k) || matched.includes(c.pair)) return;
    clickSound();
    const next = [...open, c.k];
    setOpen(next);
    if (next.length === 2) {
      const [x, y] = next.map(k => cards.find(z => z.k === k));
      setTimeout(() => {
        if (x.pair === y.pair) {
          dingSound();
          const m = [...matched, x.pair];
          setMatched(m);
          if (m.length === pairs.length) finish({ score: m.length, max_score: pairs.length, mistakes, time_spent_seconds: clock.spent() });
        } else { buzzSound(); setMistakes(n => n + 1); }
        setOpen([]);
      }, 650);
    }
  };
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span className="chip">وصّلت {matched.length} من {pairs.length}</span><Clock left={clock.left} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginTop: 14 }}>
        {cards.map(c => {
          const shown = open.includes(c.k) || matched.includes(c.pair);
          return (
            <button key={c.k} className={'option' + (matched.includes(c.pair) ? ' correct' : shown ? ' selected' : '')}
              onClick={() => tap(c)} style={{ minHeight: 74, justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
              {shown ? c.text : '❓'}
            </button>
          );
        })}
      </div>
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 2) drag_drop — صنّف كل عبارة في مجموعتها (اختر العبارة ثم المجموعة) ===== */
function DragDrop({ config, onDone }) {
  const items = useMemo(() => shuffle((config.items || []).map((x, i) => ({ ...x, i }))), [config]);
  const groups = config.groups || [];
  const [place, setPlace] = useState({});   // i → group
  const [sel, setSel] = useState(null);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds);
  const put = (g) => { if (sel === null || res) return; clickSound(); setPlace(p => ({ ...p, [sel]: g })); setSel(null); };
  const check = () => {
    const score = items.filter(x => place[x.i] === x.group).length;
    score === items.length ? dingSound() : buzzSound();
    finish({ score, max_score: items.length, mistakes: items.length - score, time_spent_seconds: clock.spent() });
  };
  return (
    <>
      <div className="dd-words" style={{ marginTop: 14 }}>
        {items.filter(x => place[x.i] === undefined).map(x => (
          <button key={x.i} className={'option' + (sel === x.i ? ' selected' : '')} onClick={() => { clickSound(); setSel(x.i); }}>{x.text}</button>
        ))}
        {!items.some(x => place[x.i] === undefined) && <span style={{ color: 'var(--mute)', fontWeight: 700 }}>صنّفت كل العبارات ✓</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(groups.length, 1)}, 1fr)`, gap: 12, marginTop: 14 }}>
        {groups.map(g => (
          <div key={g} className="card" onClick={() => put(g)} style={{ padding: 14, cursor: sel !== null ? 'pointer' : 'default', border: sel !== null ? '2px dashed var(--brand)' : undefined }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>{g}</div>
            {items.filter(x => place[x.i] === g).map(x => {
              const cls = res ? (x.group === g ? ' correct' : ' wrong') : '';
              return <button key={x.i} className={'option' + cls} style={{ margin: 4 }} onClick={(e) => { e.stopPropagation(); if (!res) setPlace(p => { const n = { ...p }; delete n[x.i]; return n; }); }}>{x.text}</button>;
            })}
          </div>
        ))}
      </div>
      {!res && <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={items.some(x => place[x.i] === undefined)} onClick={check}>تحقق ✓</button>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 3) puzzle — رتّب القطع (answer_order) ===== */
function Puzzle({ config, onDone }) {
  const pieces = config.pieces || [];
  const order = config.answer_order || pieces.map((_, i) => i);
  const bag = useMemo(() => shuffle(pieces.map((t, i) => ({ t, i }))), [pieces]);
  const [seq, setSeq] = useState([]);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds);
  const check = () => {
    const score = seq.filter((p, k) => p === order[k]).length;
    score === order.length ? dingSound() : buzzSound();
    finish({ score, max_score: order.length, mistakes: order.length - score, time_spent_seconds: clock.spent() });
  };
  return (
    <>
      <div className="order-line" style={{ marginTop: 14 }}>{seq.length ? seq.map(i => pieces[i]).join(' ← ') : '… اضغط القطع بالترتيب الصحيح'}</div>
      {!res && (
        <div className="dd-words">
          {bag.filter(x => !seq.includes(x.i)).map(x => <button key={x.i} className="option" onClick={() => { clickSound(); setSeq([...seq, x.i]); }}>{x.t}</button>)}
          {seq.length > 0 && <button className="hint-btn" onClick={() => setSeq([])}>↺ إعادة</button>}
        </div>
      )}
      {!res && <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={seq.length !== pieces.length} onClick={check}>تحقق ✓</button>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 4) custom (scenes) — اختر العبارة المناسبة لكل موقف ===== */
function Scenes({ config, onDone }) {
  const scenes = config.scenes || [];
  const choices = useMemo(() => shuffle([...new Set(scenes.map(s => s.answer))]), [scenes]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds);
  const s = scenes[i];
  const choose = (c) => {
    if (pick !== null || res) return;
    setPick(c);
    const ok = c === s.answer;
    ok ? dingSound() : buzzSound();
    const sc = score + (ok ? 1 : 0);
    setScore(sc);
    setTimeout(() => {
      if (i === scenes.length - 1) finish({ score: sc, max_score: scenes.length, mistakes: scenes.length - sc, time_spent_seconds: clock.spent() });
      else { setI(i + 1); setPick(null); }
    }, 900);
  };
  if (!s) return null;
  return (
    <>
      <span className="chip" style={{ marginTop: 10 }}>الموقف {Math.min(i + 1, scenes.length)} من {scenes.length}</span>
      <div className="q-title" style={{ marginTop: 12 }}>🎬 {s.scene}</div>
      <div className="q-en">ماذا تقول؟</div>
      <div className="options">
        {choices.map(c => (
          <button key={c} className={'option' + (pick !== null && c === s.answer ? ' correct' : pick === c ? ' wrong' : '')} onClick={() => choose(c)}>{c}</button>
        ))}
      </div>
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 5) speed_quiz — أجب بسرعة، ثم قارن بالنموذج وقيّم نفسك ===== */
function SpeedQuiz({ config, onDone }) {
  const qs = config.questions || [];
  const per = config.seconds_per_question || 15;
  const [i, setI] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(per);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  useEffect(() => { if (reveal || res) return; if (left <= 0) { setReveal(true); return; } const t = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(t); }, [left, reveal, res]);
  const mark = (ok) => {
    ok ? dingSound() : buzzSound();
    const sc = score + (ok ? 1 : 0);
    setScore(sc);
    if (i === qs.length - 1) finish({ score: sc, max_score: qs.length, mistakes: qs.length - sc, time_spent_seconds: clock.spent() });
    else { setI(i + 1); setReveal(false); setLeft(per); }
  };
  const q = qs[i];
  if (!q) return null;
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span className="chip">السؤال {i + 1} من {qs.length}</span>{!reveal && !res && <Clock left={left} />}
      </div>
      <div className="q-title" style={{ marginTop: 12 }}>⚡ {q.q}</div>
      <div className="q-en">قل إجابتك بصوت عالٍ قبل انتهاء الوقت</div>
      {!reveal && !res && <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setReveal(true)}>أجبت — أظهر النموذج</button>}
      {reveal && !res && (
        <>
          <div className="explain-box ok" style={{ marginTop: 12 }}><div><span className="h">الإجابة النموذجية</span>{q.a}</div></div>
          <div className="options" style={{ marginTop: 10 }}>
            <button className="option" onClick={() => mark(true)}>✓ أجبت مثلها</button>
            <button className="option" onClick={() => mark(false)}>✗ لم أعرفها</button>
          </div>
        </>
      )}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 6) word_builder — كوّن الكلمة من حروفها المبعثرة ===== */
function WordBuilder({ config, onDone }) {
  const words = config.words || [];
  const [i, setI] = useState(0);
  const [built, setBuilt] = useState([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds, () => finish({ score, max_score: words.length, mistakes, time_spent_seconds: clock.spent() }));
  const w = words[i] || '';
  const letters = useMemo(() => shuffle([...w].map((ch, k) => ({ ch, k }))), [w]);
  const next = (ok) => {
    const sc = score + (ok ? 1 : 0);
    setScore(sc);
    if (!ok) setMistakes(m => m + 1);
    if (i === words.length - 1) finish({ score: sc, max_score: words.length, mistakes: mistakes + (ok ? 0 : 1), time_spent_seconds: clock.spent() });
    else { setI(i + 1); setBuilt([]); }
  };
  const tap = (l) => {
    if (res) return;
    clickSound();
    const b = [...built, l.k];
    setBuilt(b);
    if (b.length === w.length) {
      const ok = norm(b.map(k => w[k]).join('')) === norm(w);
      ok ? dingSound() : buzzSound();
      setTimeout(() => next(ok), 600);
    }
  };
  if (!w && !res) return null;
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span className="chip">الكلمة {Math.min(i + 1, words.length)} من {words.length}</span><Clock left={clock.left} />
      </div>
      {!res && <>
        <div className="order-line" style={{ marginTop: 14, fontSize: 26, letterSpacing: 2 }}>{built.length ? built.map(k => w[k]).join('') : '…'}</div>
        <div className="dd-words">
          {letters.filter(l => !built.includes(l.k)).map(l => <button key={l.k} className="option" style={{ minWidth: 52, justifyContent: 'center', fontSize: 22, fontWeight: 900 }} onClick={() => tap(l)}>{l.ch}</button>)}
          {built.length > 0 && <button className="hint-btn" onClick={() => setBuilt([])}>↺ إعادة</button>}
          <button className="hint-btn" onClick={() => { buzzSound(); next(false); }}>تخطَّ ←</button>
        </div>
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

const GAMES = { memory_match: MemoryMatch, drag_drop: DragDrop, puzzle: Puzzle, custom: Scenes, scenes: Scenes, speed_quiz: SpeedQuiz, word_builder: WordBuilder };

/* لعبة واحدة: العنوان والتعليمات + المكوّن المناسب */
export default function GamePlayer({ game, onDone }) {
  const G = GAMES[game.game_type];
  return (
    <>
      <div className="q-title">🎮 {game.title || 'لعبة'}</div>
      {(game.instructions || game.description) && <div className="q-en">{game.instructions || game.description}</div>}
      {G ? <G config={game.config || {}} onDone={onDone} />
        : <div className="explain-box" style={{ marginTop: 14 }}><div>نوع اللعبة «{game.game_type}» غير مدعوم بعد.
            <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => onDone({ score: 0, max_score: 0, mistakes: 0, time_spent_seconds: 0 })}>تخطَّ</button></div></div>}
    </>
  );
}
