import { useEffect, useMemo, useRef, useState } from 'react';
import { dingSound, buzzSound, clickSound, playClip } from './sounds.js';
import { shuffle, norm, normAr, ZONE_COLORS, useClock, Hud, DoneBox, useFinish, ShellCtx } from './gamekit.jsx';
import { WordHunt, BalloonPop, WordSearch, OddOneOut, ListenPick, SoundSequence, PictureHunt, StoryOrder, StoryCloze } from './games-a.jsx';
import { GrammarMaze, AnswerPlane, ErrorHunt, Tashkeel, RootFamily, SpeedDictation, ReadKaraoke, SpeakWheel, LetterForms, LetterTrace } from './games-b.jsx';

/* ألعاب الأنشطة — game_type + config من الـAPI، والإجابات داخل config
   كل لعبة تنادي onDone({ score, max_score, mistakes, time_spent_seconds }) مرة واحدة عند الانتهاء */

/* ===== 1) memory_match — «طابق»: بطاقات التحية (أزرق) وبطاقات الرد (برتقالي)، والأزواج المكتشفة تنزل إلى رف تحت اللوحة ===== */
function MemoryMatch({ config, onDone }) {
  const pairs = config.pairs || [];
  const cards = useMemo(() => shuffle(pairs.flatMap((p, i) => [{ k: i + 'a', pair: i, side: 'a', text: p.a, img: p.a_image, au: p.a_audio }, { k: i + 'b', pair: i, side: 'b', text: p.b, img: p.b_image, au: p.b_audio }])), [pairs]);
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [bad, setBad] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds, () => finish({ score: matched.length, max_score: pairs.length, mistakes, time_spent_seconds: clock.spent() }));
  const tap = (c) => {
    if (res || open.length === 2 || open.includes(c.k) || matched.includes(c.pair)) return;
    if (c.au) playClip(c.au); else clickSound();
    const next = [...open, c.k];
    setOpen(next);
    if (next.length === 2) {
      const [x, y] = next.map(k => cards.find(z => z.k === k));
      const ok = x.pair === y.pair;
      if (!ok) setTimeout(() => setBad(next), 450);
      setTimeout(() => {
        if (ok) {
          dingSound(); setCombo(n => n + 1);
          const m = [...matched, x.pair];
          setMatched(m);
          if (m.length === pairs.length) finish({ score: m.length, max_score: pairs.length, mistakes, time_spent_seconds: clock.spent() });
        } else { buzzSound(); setMistakes(n => n + 1); setCombo(0); }
        setOpen([]); setBad([]);
      }, 900);
    }
  };
  return (
    <>
      <Hud label="الأزواج" done={matched.length} total={pairs.length} clock={clock} />
      <div className="mm-legend"><span className="a">● تحية</span><span className="b">● رد</span>{combo > 1 && <span className="mm-combo" key={combo}>🔥 ×{combo}</span>}</div>
      <div className="g-mem">
        {cards.map((c, idx) => {
          const m = matched.includes(c.pair);
          const shown = open.includes(c.k) || m;
          return (
            <button key={c.k} type="button" className={'g-mem-card side-' + c.side + (shown ? ' flip' : '') + (m ? ' gone' : '') + (bad.includes(c.k) ? ' bad' : '')} onClick={() => tap(c)} style={{ animationDelay: idx * 0.04 + 's' }}>
              <span className="in">
                <span className="face back">{c.side === 'a' ? '👋' : '💬'}</span>
                <span className="face front" dir="auto">{c.img ? <img src={c.img} alt="" className="mm-img" /> : c.text}</span>
              </span>
            </button>
          );
        })}
      </div>
      {matched.length > 0 && (
        <div className="mm-shelf">
          {matched.map(i => <span key={i} className="mm-pair"><b>{pairs[i].a}</b><i>⟷</i><b>{pairs[i].b}</b></span>)}
        </div>
      )}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 2) drag_drop — «فرز البطاقات»: بطاقة واحدة في المنتصف تُسحب (أو يُضغط سهمها) نحو سلّتها ===== */
export function DragDrop({ config, onDone }) {
  const items = useMemo(() => shuffle((config.items || []).map((x, i) => ({ ...x, i }))), [config]);
  const groups = config.groups || [];
  const [place, setPlace] = useState({});   // i → group
  const [drag, setDrag] = useState(null);   // { dx, dy, over }
  const [fly, setFly] = useState(null);     // اتجاه طيران البطاقة الأخيرة
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds);
  const deck = items.filter(x => place[x.i] === undefined);
  const cur = deck[0];
  const put = (g) => {
    if (!cur || res) return;
    clickSound();
    setFly(groups.indexOf(g));
    setPlace(p => ({ ...p, [cur.i]: g }));
    setTimeout(() => setFly(null), 260);
  };
  const back = (i) => { if (res) return; clickSound(); setPlace(p => { const n = { ...p }; delete n[i]; return n; }); };
  const zoneAt = (x, y) => document.elementFromPoint(x, y)?.closest('[data-zone]')?.dataset.zone ?? null;
  const start = (e) => {
    if (!cur || res) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const mv = (ev) => setDrag({ dx: ev.clientX - sx, dy: ev.clientY - sy, over: zoneAt(ev.clientX, ev.clientY) });
    const up = (ev) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      const z = zoneAt(ev.clientX, ev.clientY);
      setDrag(null);
      if (z) put(z);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  const check = () => {
    const score = items.filter(x => place[x.i] === x.group).length;
    score === items.length ? dingSound() : buzzSound();
    finish({ score, max_score: items.length, mistakes: items.length - score, time_spent_seconds: clock.spent() });
  };
  return (
    <>
      <Hud label="فرزت" done={items.length - deck.length} total={items.length} clock={clock} />
      <div className={'sw-board n' + Math.min(groups.length, 4)}>
        {groups.map((g, gi) => {
          const c = ZONE_COLORS[gi % ZONE_COLORS.length];
          const inZone = items.filter(x => place[x.i] === g);
          return (
            <div key={g} data-zone={g} className={'sw-bin' + (drag?.over === g ? ' hot' : '') + (fly === gi ? ' got' : '')} style={{ '--c': c }}>
              <button type="button" className="sw-bin-h" disabled={!cur || !!res} onClick={() => put(g)}>
                <span>{g}</span><small>{inZone.length}</small>
              </button>
              <div className="sw-bin-b">
                {inZone.map(x => (
                  <button key={x.i} type="button" disabled={!!res} className={'sw-chip' + (res ? (x.group === g ? ' ok' : ' bad') : '')} onClick={() => back(x.i)} title={res ? '' : 'اضغط لإرجاعها'}>{x.text}</button>
                ))}
              </div>
            </div>
          );
        })}
        {!res && (
          <div className="sw-center">
            {cur ? (
              <>
                <div className="sw-stack" aria-hidden>{deck.slice(1, 3).map((x, k) => <i key={x.i} style={{ '--k': k + 1 }} />)}</div>
                <div key={cur.i} className={'sw-card' + (drag ? ' dragging' : '')} onPointerDown={start}
                  style={drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(${drag.dx / 14}deg)` } : undefined}>
                  {cur.text}
                </div>
                <div className="g-tip">👆 اسحب البطاقة إلى مجموعتها — أو اضغط اسم المجموعة</div>
              </>
            ) : (
              <div className="sw-empty">✓ فرزت كل البطاقات<button className="btn btn-primary g-check" onClick={check}>تحقق ✓</button></div>
            )}
          </div>
        )}
      </div>
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 3) puzzle — «سلّم الخطوات»: قائمة رأسية مرقّمة تُعاد ترتيبها بالسحب (أو بأسهم ↑↓) ===== */
function Puzzle({ config, onDone }) {
  const pieces = config.pieces || [];
  const order = config.answer_order || pieces.map((_, i) => i);
  const [seq, setSeq] = useState(() => shuffle(pieces.map((_, i) => i)));
  const [drag, setDrag] = useState(null);   // { from, over, dy }
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds);
  const list = useRef(null);
  const move = (from, to) => { if (from === to) return; const n = [...seq]; const [x] = n.splice(from, 1); n.splice(to, 0, x); setSeq(n); clickSound(); };
  const start = (e, from) => {
    if (res) return;
    e.preventDefault();
    const sy = e.clientY;
    const rows = [...list.current.children].map(el => el.getBoundingClientRect());
    const overAt = (y) => { let k = rows.findIndex(r => y < r.top + r.height / 2); return k < 0 ? rows.length - 1 : k; };
    const mv = (ev) => setDrag({ from, dy: ev.clientY - sy, over: overAt(ev.clientY) });
    const up = (ev) => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); setDrag(null); move(from, overAt(ev.clientY)); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  const check = () => {
    const score = seq.filter((p, k) => p === order[k]).length;
    score === order.length ? dingSound() : buzzSound();
    finish({ score, max_score: order.length, mistakes: order.length - score, time_spent_seconds: clock.spent() });
  };
  return (
    <>
      <Hud label="الخطوات" done={res ? res.score : 0} total={pieces.length} clock={clock} />
      <div className="lad" ref={list}>
        {seq.map((p, k) => {
          const st = res ? (p === order[k] ? ' ok' : ' bad') : '';
          const shift = drag && drag.from !== k ? (drag.from < k && drag.over >= k ? -1 : drag.from > k && drag.over <= k ? 1 : 0) : 0;
          return (
            <div key={p} className={'lad-row' + (drag?.from === k ? ' dragging' : '') + st}
              style={drag?.from === k ? { transform: `translateY(${drag.dy}px) scale(1.03)` } : shift ? { transform: `translateY(${shift * 100}%)` } : undefined}>
              <span className="lad-n">{k + 1}</span>
              <span className="lad-t">{pieces[p]}</span>
              {!res && <>
                <span className="lad-arrows">
                  <button type="button" disabled={k === 0} onClick={() => move(k, k - 1)}>▲</button>
                  <button type="button" disabled={k === seq.length - 1} onClick={() => move(k, k + 1)}>▼</button>
                </span>
                <span className="lad-grip" onPointerDown={(e) => start(e, k)}>⋮⋮</span>
              </>}
            </div>
          );
        })}
      </div>
      {res && <div className="g-answer">الترتيب الصحيح: <b>{order.map(i => pieces[i]).join(' ← ')}</b></div>}
      {!res && <button className="btn btn-primary g-check" onClick={check}>تحقق ✓</button>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 4) custom (scenes) — «محادثة»: البومة تعرض الموقف في فقاعة، والطالب يرد بفقاعة يختارها ===== */
function Scenes({ config, onDone }) {
  const scenes = config.scenes || [];
  const choices = useMemo(() => shuffle([...new Set(scenes.map(s => s.answer))]), [scenes]);
  const [i, setI] = useState(0);
  const [log, setLog] = useState([]);       // [{ scene, pick, ok }]
  const [typing, setTyping] = useState(false);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [log.length, typing]);
  const s = scenes[i];
  const choose = (c) => {
    if (typing || res || !s) return;
    const ok = c === s.answer;
    ok ? dingSound() : buzzSound();
    const L = [...log, { scene: s.scene, pick: c, ok, answer: s.answer }];
    setLog(L);
    const sc = L.filter(x => x.ok).length;
    if (i === scenes.length - 1) { setTimeout(() => finish({ score: sc, max_score: scenes.length, mistakes: scenes.length - sc, time_spent_seconds: clock.spent() }), 900); return; }
    setTyping(true);
    setTimeout(() => { setTyping(false); setI(i + 1); }, 1100);
  };
  if (!scenes.length) return null;
  return (
    <>
      <Hud label="الموقف" done={log.length} total={scenes.length} clock={clock} />
      <div className="chat">
        {log.map((m, k) => (
          <div key={k} className="chat-pair">
            <div className="chat-msg owl"><img src="/img/owl.png" alt="" /><span>{m.scene}</span></div>
            <div className={'chat-msg me' + (m.ok ? ' ok' : ' bad')}><span>{m.pick}</span></div>
            {!m.ok && <div className="chat-fix">الأنسب: «{m.answer}»</div>}
          </div>
        ))}
        {typing && <div className="chat-msg owl"><img src="/img/owl.png" alt="" /><span className="dots"><i /><i /><i /></span></div>}
        {!typing && s && log.length === i && !res && <div className="chat-msg owl fresh"><img src="/img/owl.png" alt="" /><span>{s.image && <img src={s.image} alt="" className="chat-img" />}{s.scene}<small>ماذا تقول؟</small></span></div>}
        <div ref={end} />
      </div>
      {!res && !typing && log.length === i && (
        <div className="chat-replies">
          {(s?.options?.length ? s.options : choices).map(c => <button key={c} type="button" className="chat-reply" onClick={() => choose(c)}>{c}</button>)}
        </div>
      )}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 5) speed_quiz — «سباق البرق»: شريط وقت ينفد فوق البطاقة، ثم تنقلب لتكشف النموذج ===== */
function SpeedQuiz({ config, onDone }) {
  const qs = config.questions || [];
  const per = config.seconds_per_question || 15;
  const [i, setI] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [left, setLeft] = useState(per);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const [typed, setTyped] = useState('');
  const [picked, setPicked] = useState(null);
  const [verdict, setVerdict] = useState(false);
  // تصحيح فوري ثم انتقال تلقائي
  const answer = (a) => {
    if (reveal) return;
    const ok = normAr(a) === normAr(qs[i].a);
    setPicked(a); setVerdict(ok); setReveal(true);
    setTimeout(() => { setTyped(''); setPicked(null); mark(ok); }, 1500);
  };
  useEffect(() => { if (reveal || res) return; if (left <= 0) { buzzSound(); setVerdict(false); setReveal(true); setTimeout(() => { setTyped(''); setPicked(null); mark(false); }, 1500); return; } const t = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(t); }, [left, reveal, res]);
  const mark = (ok) => {
    ok ? dingSound() : buzzSound();
    const sc = score + (ok ? 1 : 0);
    setScore(sc); setStreak(n => (ok ? n + 1 : 0));
    if (i === qs.length - 1) finish({ score: sc, max_score: qs.length, mistakes: qs.length - sc, time_spent_seconds: clock.spent() });
    else { setI(i + 1); setReveal(false); setLeft(per); }
  };
  const q = qs[i];
  if (!q) return null;
  const pct = (left / per) * 100;
  return (
    <>
      <Hud label="السؤال" done={i} total={qs.length} />
      {!res && <>
        <div className="sq-top">
          <span className="sq-score">⚡ {score}</span>
          {streak > 1 && <span className="mm-combo" key={streak}>🔥 ×{streak}</span>}
          <span className={'sq-sec' + (left <= 5 && !reveal ? ' hot' : '')}>{reveal ? '—' : left + ' ث'}</span>
        </div>
        <div className="sq-fuse"><i style={{ width: reveal ? 0 : pct + '%', background: left <= 5 ? '#ef4444' : left <= 10 ? '#f59e0b' : '#22c55e' }} /></div>
        <div className={'g-flip' + (reveal ? ' flip' : '')} key={i}>
          <div className="in">
            <div className="face q">
              <span className="g-bolt">⚡</span>
              <div className="g-scene-t">{q.q}</div>
              {q.options?.length ? (
                <div className="g-tiles" style={{ marginTop: 12 }}>
                  {q.options.map((o, k) => <button key={o} type="button" className="g-tile" style={{ '--c': ['#3b82f6', '#f59e0b', '#10b981', '#ec4899'][k % 4] }} onClick={() => answer(o)}><span className="k">{k + 1}</span>{o}</button>)}
                </div>
              ) : (
                <form className="sq-type" onSubmit={(e) => { e.preventDefault(); answer(typed); }}>
                  <input dir="rtl" value={typed} onChange={e => setTyped(e.target.value)} placeholder="اكتب إجابتك…" autoFocus />
                  <button className="btn btn-primary" disabled={!typed.trim()}>✓</button>
                </form>
              )}
            </div>
            <div className="face a">
              <span className="g-scene-n">الإجابة النموذجية</span>
              <div className="g-scene-t">{q.a}</div>
              <div className={'sq-verdict ' + (verdict ? 'ok' : 'bad')}>{verdict ? '✓ إجابة صحيحة!' : typed || picked ? '✗ إجابتك: ' + (picked ?? typed) : '⏱ انتهى الوقت'}</div>
            </div>
          </div>
        </div>
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 6) word_builder — «بلاطات الحروف»: بلاطات خشبية تُسحب إلى خانات الكلمة، مع زر خلط ===== */
function WordBuilder({ config, onDone }) {
  const words = config.words || [];
  const [i, setI] = useState(0);
  const [slots, setSlots] = useState([]);   // موضع → رقم الحرف أو null
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [state, setState] = useState(null); // ok | bad
  const [drag, setDrag] = useState(null);   // { k, from, x, y, dx, dy, w, h, over }
  const [mix, setMix] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds, () => finish({ score, max_score: words.length, mistakes, time_spent_seconds: clock.spent() }));
  const W = typeof words[i] === 'object' && words[i] ? words[i] : { word: words[i] };
  const w = String(W.word || '');
  const letters = useMemo(() => shuffle([...w].map((ch, k) => ({ ch, k }))), [w, mix]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setSlots([...w].map(() => null)); }, [w]);
  const next = (ok) => {
    const sc = score + (ok ? 1 : 0);
    setScore(sc);
    if (!ok) setMistakes(m => m + 1);
    setState(null);
    if (i === words.length - 1) finish({ score: sc, max_score: words.length, mistakes: mistakes + (ok ? 0 : 1), time_spent_seconds: clock.spent() });
    else setI(i + 1);
  };
  const commit = (s) => {
    clickSound();
    setSlots(s);
    if (s.length && s.every(x => x !== null)) {
      const ok = norm(s.map(k => w[k]).join('')) === norm(w);
      ok ? dingSound() : buzzSound();
      setState(ok ? 'ok' : 'bad');
      setTimeout(() => next(ok), 900);
    }
  };
  const tap = (k) => { const p = slots.indexOf(null); if (p < 0) return; const s = [...slots]; s[p] = k; commit(s); };
  const slotAt = (x, y) => { const el = document.elementFromPoint(x, y)?.closest('[data-slot]'); return el ? Number(el.dataset.slot) : null; };
  const start = (e, k, from) => {
    if (res || state) return;
    e.preventDefault();
    const R = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    const d0 = { k, from, dx: sx - R.left, dy: sy - R.top, w: R.width, h: R.height };
    const mv = (ev) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
      moved = true;
      setDrag({ ...d0, x: ev.clientX, y: ev.clientY, over: slotAt(ev.clientX, ev.clientY) });
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      setDrag(null);
      const s = [...slots];
      if (!moved) { if (from === 'bank') tap(k); else { s[from] = null; commit(s); } return; }
      const to = slotAt(ev.clientX, ev.clientY);
      if (to === null) { if (from !== 'bank') { s[from] = null; commit(s); } return; }
      if (from === 'bank') s[to] = k; else { [s[to], s[from]] = [s[from], s[to]]; }
      commit(s);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  if (!w && !res) return null;
  return (
    <>
      <Hud label="الكلمة" done={i} total={words.length} clock={clock} />
      {!res && <>
        <div className="wb-rack-wrap">
          <div className={'g-slots wb-slots' + (state ? ' ' + state : '')} key={i}>
            {slots.map((k, pos) => (
              <div key={pos} data-slot={pos} className={'g-slot' + (k !== null ? ' filled' : '') + (drag?.over === pos ? ' hot' : '')}
                onPointerDown={k !== null ? e => start(e, k, pos) : undefined} style={k !== null && drag?.k === k ? { opacity: 0.3 } : undefined}>
                {k !== null ? w[k] : ''}
              </div>
            ))}
          </div>
          <div className="wb-hint">{W.image && <img src={W.image} alt="" className="wb-img" />}{W.audio && <button type="button" className="duo-spk" onClick={() => playClip(W.audio)}>🔊</button>}{W.hint ? <b>💡 {W.hint}</b> : null} {[...w].length} حروف</div>
        </div>
        <div className="wb-rack">
          {letters.map((l, n) => {
            const used = slots.includes(l.k);
            return <button key={l.k + '-' + mix} type="button" className={'wb-tile' + (used ? ' used' : '') + (drag?.k === l.k && drag.from === 'bank' ? ' ghost' : '')} disabled={used}
              onPointerDown={e => start(e, l.k, 'bank')} style={{ animationDelay: n * 0.05 + 's' }}>{l.ch}</button>;
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          {!state && <button className="hint-btn" onClick={() => { clickSound(); setMix(m => m + 1); }}>🔀 اخلط</button>}
          {slots.some(x => x !== null) && !state && <button className="hint-btn" onClick={() => { clickSound(); setSlots(slots.map(() => null)); }}>↺ إعادة</button>}
          {!state && <button className="hint-btn" onClick={() => { buzzSound(); next(false); }}>تخطَّ ←</button>}
        </div>
      </>}
      {res && <DoneBox r={res} />}
      {drag && <div className="wb-tile floating" style={{ position: 'fixed', left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w, height: drag.h }}>{w[drag.k]}</div>}
    </>
  );
}

export const GAMES = {
  memory_match: MemoryMatch, drag_drop: DragDrop, puzzle: Puzzle, custom: Scenes, scenes: Scenes, speed_quiz: SpeedQuiz, word_builder: WordBuilder,
  word_hunt: WordHunt, balloon_pop: BalloonPop, word_search: WordSearch, odd_one_out: OddOneOut,
  listen_pick: ListenPick, sound_sequence: SoundSequence, picture_hunt: PictureHunt,
  story_order: StoryOrder, story_cloze: StoryCloze,
  grammar_maze: GrammarMaze, answer_plane: AnswerPlane, error_hunt: ErrorHunt, tashkeel: Tashkeel, root_family: RootFamily,
  speed_dictation: SpeedDictation, read_karaoke: ReadKaraoke, speak_wheel: SpeakWheel, letter_forms: LetterForms, letter_trace: LetterTrace,
};

/* لعبة واحدة: العنوان والتعليمات + المكوّن المناسب */
export default function GamePlayer({ game, onDone, shell = false }) {
  const G = GAMES[game.game_type];
  if (shell) return G ? <ShellCtx.Provider value><G config={game.config || {}} onDone={onDone} /></ShellCtx.Provider> : null;
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
