import { useEffect, useMemo, useRef, useState } from 'react';
import { dingSound, buzzSound, clickSound, playClip, popSound, stopAudio } from './sounds.js';
import { shuffle, pickN, useClock, Hud, DoneBox, useFinish } from './gamekit.jsx';
import { DropdownFill } from './QTypes.jsx';

/* محركات الألعاب (1): المفردات · الاستماع · القراءة
   كل محرك يعمل كلياً من config ويحسب score / max_score بنفسه ثم onDone مرة واحدة */

/* قلوب المحاولات */
export function Lives({ n, max = 3 }) {
  return <span className="gx-lives">{Array.from({ length: max }, (_, i) => <i key={i} className={i < n ? 'on' : ''}>❤</i>)}</span>;
}
/* عدّاد تنازلي لكل جولة — يعيد onEnd عند الصفر */
function useRoundTimer(seconds, key, running, onEnd) {
  const [left, setLeft] = useState(seconds);
  const cb = useRef(onEnd); cb.current = onEnd;
  useEffect(() => { setLeft(seconds); }, [key, seconds]);
  useEffect(() => {
    if (!running || !seconds) return;
    if (left <= 0) { cb.current?.(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, running, seconds]);
  return left;
}
/* شريط وقت ينكمش */
function Fuse({ left, total }) {
  if (!total) return null;
  const p = Math.max(0, left / total) * 100;
  return <div className="sq-fuse"><i style={{ width: p + '%', background: left <= 3 ? '#ef4444' : left <= total / 2 ? '#f59e0b' : '#22c55e' }} /></div>;
}

/* ========== المفردات ========== */

/* word_hunt — صائد الكلمات: حديقة بجحور، الكلمات تقفز منها؛ اضغط الكلمة المطابقة للمطلوب */
export function WordHunt({ config, onDone }) {
  const items = config.items || [];
  const rounds = Math.min(config.rounds || items.length, items.length || 0);
  const order = useMemo(() => pickN(items.map((_, i) => i), rounds), [items, rounds]);
  const [r, setR] = useState(0);
  const [won, setWon] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [holes, setHoles] = useState([]);     // [{ word, k }] لكل جحر أو null
  const [flash, setFlash] = useState(null);   // ok | bad
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const it = items[order[r]];
  const pool = useMemo(() => {
    if (!it) return [];
    const others = [...items.filter(x => x !== it).map(x => x.text), ...(config.distractors || [])];
    return [it.text, ...pickN([...new Set(others)], 5)];
  }, [it]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = (ok) => {
    const w = won + (ok ? 1 : 0);
    setWon(w); setFlash(ok ? 'ok' : 'bad');
    setTimeout(() => {
      setFlash(null);
      if (r >= rounds - 1) finish({ score: w, max_score: rounds, mistakes, time_spent_seconds: clock.spent() });
      else setR(r + 1);
    }, 700);
  };
  const left = useRoundTimer(config.seconds_per_round || 10, r, !res && !flash, () => { buzzSound(); next(false); });
  // الكلمات تقفز من 6 جحور كل ~1.3 ث (الصحيحة تظهر غالباً)
  useEffect(() => {
    if (!it || res) return;
    const tick = () => {
      const n = Array(6).fill(null);
      const spots = pickN([0, 1, 2, 3, 4, 5], 3);
      const words = Math.random() < 0.75 ? [it.text, ...pickN(pool.slice(1), 2)] : pickN(pool.slice(1), 3);
      spots.forEach((s, i) => { n[s] = { word: words[i], k: Math.random() }; });
      setHoles(n);
    };
    tick();
    const t = setInterval(tick, 1300);
    return () => clearInterval(t);
  }, [it, pool, res]);
  useEffect(() => { if (it?.audio && config.prompt === 'audio') playClip(it.audio); }, [it]); // eslint-disable-line react-hooks/exhaustive-deps
  const whack = (h, i) => {
    if (!h || flash) return;
    if (h.word === it.text) { popSound(); dingSound(); setHoles(x => x.map((y, k) => (k === i ? null : y))); next(true); }
    else { buzzSound(); setMistakes(m => m + 1); setHoles(x => x.map((y, k) => (k === i ? { ...y, bad: true } : y))); }
  };
  if (!it && !res) return null;
  return (
    <>
      <Hud label="الجولة" done={r} total={rounds} />
      {!res && <>
        <div className={'wh-prompt' + (flash ? ' ' + flash : '')}>
          {config.prompt === 'audio' ? <button type="button" className="duo-spk" onClick={() => playClip(it.audio)}>🔊</button>
            : config.prompt === 'image' && it.image ? <img src={it.image} alt="" /> : <b>{it.meaning}</b>}
          <span>اصطد الكلمة!</span>
        </div>
        <Fuse left={left} total={config.seconds_per_round || 10} />
        <div className="wh-garden">
          {holes.map((h, i) => (
            <div key={i} className="wh-hole">
              {h && <button key={h.k} type="button" className={'wh-mole' + (h.bad ? ' bad' : '')} onClick={() => whack(h, i)}>{h.word}</button>}
              <span className="dirt" />
            </div>
          ))}
        </div>
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* balloon_pop — بالونات المعاني: المعنى مثبّت أعلى، البالونات تصعد؛ فرقع الكلمة المطابقة (3 قلوب) */
const BAL_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6'];
export function BalloonPop({ config, onDone }) {
  const pairs = useMemo(() => shuffle(config.pairs || []), [config]);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [lives, setLives] = useState(3);
  const [mistakes, setMistakes] = useState(0);
  const [balloons, setBalloons] = useState([]);   // { id, word, x, c, dur, pop, bad }
  const [res, finish] = useFinish(onDone);
  const end = (ok, l = lives) => finish({ score: ok, max_score: pairs.length, mistakes, time_spent_seconds: clock.spent(), completed: l > 0 });
  const clock = useClock(config.time_limit_seconds, () => end(right));
  const cur = pairs[i];
  // speed: رقم أو slow | normal | fast
  const SPD = { slow: 7.5, normal: 6, medium: 6, fast: 4.5 };
  const dur = typeof config.speed === 'string' ? SPD[config.speed] || 6 : Math.max(4, 11 - (Number(config.speed) || 3) * 1.4);
  useEffect(() => {
    if (!cur || res) return;
    const spawn = () => setBalloons(b => [...b.filter(x => Date.now() - x.id < dur * 1000 + 500), {
      id: Date.now() + Math.random(), word: Math.random() < 0.4 ? cur.word : pairs[Math.floor(Math.random() * pairs.length)].word,
      x: 6 + Math.random() * 78, c: BAL_COLORS[Math.floor(Math.random() * BAL_COLORS.length)], dur: dur * (0.85 + Math.random() * 0.3),
    }]);
    spawn();
    const t = setInterval(spawn, 1000);
    return () => clearInterval(t);
  }, [cur, res]); // eslint-disable-line react-hooks/exhaustive-deps
  const pop = (b) => {
    if (b.pop || res) return;
    if (b.word === cur.word) {
      popSound(); dingSound();
      setBalloons(x => x.map(y => (y.id === b.id ? { ...y, pop: true } : y)));
      const n = right + 1; setRight(n);
      if (i >= pairs.length - 1) end(n); else { setI(i + 1); setTimeout(() => setBalloons([]), 250); }
    } else {
      buzzSound(); setMistakes(m => m + 1);
      setBalloons(x => x.map(y => (y.id === b.id ? { ...y, bad: true } : y)));
      const l = lives - 1; setLives(l);
      if (l <= 0) end(right, 0);
    }
  };
  if (!cur && !res) return null;
  return (
    <>
      <Hud label="المعاني" done={right} total={pairs.length} clock={clock} />
      {!res && <>
        <div className="bp-top"><span className="bp-meaning">{cur.image && <img src={cur.image} alt="" />}{cur.meaning}</span><Lives n={lives} /></div>
        <div className="bp-sky">
          <i className="cloud c1" /><i className="cloud c2" />
          {balloons.map(b => (
            <button key={b.id} type="button" className={'bp-b' + (b.pop ? ' pop' : '') + (b.bad ? ' bad' : '')} onClick={() => pop(b)}
              style={{ '--x': b.x + '%', '--c': b.c, '--d': b.dur + 's' }}>
              <span>{b.word}</span>
            </button>
          ))}
        </div>
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* word_search — البحث عن الكلمة: لوحة حروف متوهجة؛ اسحب على الحروف لتحديد الكلمة */
const AR_LETTERS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
const DIRS = { horizontal: [[0, -1]], vertical: [[1, 0]], diagonal: [[1, -1], [1, 1]] };
function buildGrid(words, n, dirs) {
  const g = Array.from({ length: n }, () => Array(n).fill(''));
  const vecs = (dirs?.length ? dirs : ['horizontal', 'vertical']).flatMap(d => DIRS[d] || []);
  const placed = [];
  for (const w of [...words].sort((a, b) => b.length - a.length)) {
    const L = [...w];
    let ok = false;
    for (let t = 0; t < 200 && !ok; t++) {
      const [dr, dc] = vecs[Math.floor(Math.random() * vecs.length)];
      const r0 = Math.floor(Math.random() * n), c0 = Math.floor(Math.random() * n);
      const cells = L.map((_, k) => [r0 + dr * k, c0 + dc * k]);
      if (cells.every(([r, c], k) => r >= 0 && c >= 0 && r < n && c < n && (!g[r][c] || g[r][c] === L[k]))) {
        cells.forEach(([r, c], k) => { g[r][c] = L[k]; });
        placed.push({ w, cells: cells.map(([r, c]) => r * n + c) }); ok = true;
      }
    }
  }
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!g[r][c]) g[r][c] = AR_LETTERS[Math.floor(Math.random() * AR_LETTERS.length)];
  return { g, placed };
}
export function WordSearch({ config, onDone }) {
  const words = (config.words || []).map(w => String(w).replace(/\s+/g, ''));
  const n = Math.max(config.grid_size || 8, ...words.map(w => w.length));
  const { g, placed } = useMemo(() => buildGrid(words, n, config.directions), [config]); // eslint-disable-line react-hooks/exhaustive-deps
  const [found, setFound] = useState([]);
  const [sel, setSel] = useState(null);       // { a, b } فهارس الخلايا
  const [hints, setHints] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds, () => finish({ score: found.length, max_score: placed.length, mistakes, time_spent_seconds: clock.spent() }));
  const line = (a, b) => {
    if (a == null || b == null) return [];
    const [r1, c1, r2, c2] = [Math.floor(a / n), a % n, Math.floor(b / n), b % n];
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1), len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
    if (!(r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1))) return [a];
    return Array.from({ length: len + 1 }, (_, k) => (r1 + dr * k) * n + (c1 + dc * k));
  };
  const cellAt = (x, y) => { const el = document.elementFromPoint(x, y)?.closest('[data-cell]'); return el ? +el.dataset.cell : null; };
  const down = (e) => {
    if (res) return;
    const a = cellAt(e.clientX, e.clientY); if (a == null) return;
    e.preventDefault(); setSel({ a, b: a });
    const mv = (ev) => { const b = cellAt(ev.clientX, ev.clientY); if (b != null) setSel(s => ({ ...s, b })); };
    const up = () => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      setSel(s => {
        const cells = line(s.a, s.b), key = cells.join(','), rev = [...cells].reverse().join(',');
        const hit = placed.find(p => !found.includes(p.w) && (p.cells.join(',') === key || p.cells.join(',') === rev));
        if (hit) {
          dingSound();
          const f = [...found, hit.w]; setFound(f);
          if (f.length === placed.length) finish({ score: f.length, max_score: placed.length, mistakes, time_spent_seconds: clock.spent() });
        } else if (cells.length > 1) buzzSound();
        return null;
      });
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  const selCells = sel ? line(sel.a, sel.b) : [];
  const foundCells = placed.filter(p => found.includes(p.w)).flatMap(p => p.cells);
  const hint = () => { const p = placed.find(x => !found.includes(x.w) && !hints.includes(x.cells[0])); if (!p) return; clickSound(); setHints(h => [...h, p.cells[0]]); setMistakes(m => m + 1); };
  return (
    <>
      <Hud label="الكلمات" done={found.length} total={placed.length} clock={clock} />
      <div className="ws-wrap">
        <div className="ws-grid" style={{ '--n': n }} onPointerDown={down}>
          {g.flat().map((ch, i) => (
            <span key={i} data-cell={i} className={'ws-c' + (selCells.includes(i) ? ' sel' : '') + (foundCells.includes(i) ? ' found' : '') + (hints.includes(i) ? ' hint' : '')}>{ch}</span>
          ))}
        </div>
        {config.show_list !== false && (
          <div className="ws-list">
            {placed.map(p => <span key={p.w} className={found.includes(p.w) ? 'done' : ''}>{found.includes(p.w) ? '✓ ' : ''}{p.w}</span>)}
            {!res && <button type="button" className="hint-btn" onClick={hint}>💡 تلميح</button>}
          </div>
        )}
      </div>
      {res && <DoneBox r={res} />}
    </>
  );
}

/* odd_one_out — الكلمة الدخيلة: رف برطمانات؛ اضغط الكلمة التي لا تنتمي */
export function OddOneOut({ config, onDone }) {
  const rounds = config.rounds || [];
  const [r, setR] = useState(0);
  const [right, setRight] = useState(0);
  const [pick, setPick] = useState(null);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const R = rounds[r];
  const go = (ok) => {
    const n = right + (ok ? 1 : 0); setRight(n);
    setTimeout(() => { setPick(null); if (r >= rounds.length - 1) finish({ score: n, max_score: rounds.length, mistakes: r + 1 - n, time_spent_seconds: clock.spent() }); else setR(r + 1); }, ok ? 700 : 1800);
  };
  const left = useRoundTimer(config.seconds_per_round, r, !res && pick == null, () => { buzzSound(); setPick(-1); go(false); });
  const tap = (k) => { if (pick != null) return; setPick(k); const ok = k === R.odd_index; ok ? dingSound() : buzzSound(); go(ok); };
  if (!R && !res) return null;
  return (
    <>
      <Hud label="الجولة" done={r} total={rounds.length} />
      {!res && <>
        <Fuse left={left} total={config.seconds_per_round} />
        <div className="oo-shelf">
          {R.words.map((w, k) => {
            const st = pick == null ? '' : k === R.odd_index ? ' ok' : k === pick ? ' bad' : ' dim';
            return <button key={k} type="button" className={'oo-jar' + st} onClick={() => tap(k)} style={{ animationDelay: k * 0.06 + 's' }}><span>{w}</span></button>;
          })}
        </div>
        {pick != null && pick !== R.odd_index && R.hint && <div className="g-answer">💡 {R.hint}</div>}
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ========== الاستماع ========== */

/* listen_pick — ماذا سمعت؟ راديو يشغّل المقطع؛ اختر الصورة/الكلمة قبل انتهاء الوقت */
export function ListenPick({ config, onDone }) {
  const rounds = config.rounds || [];
  const [r, setR] = useState(0);
  const [right, setRight] = useState(0);
  const [pick, setPick] = useState(null);
  const [plays, setPlays] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const R = rounds[r];
  const max = config.max_plays || null;
  const play = () => { if (max && plays >= max) return; playClip(R.audio); setPlays(p => p + 1); };
  useEffect(() => { if (R?.audio) { setPlays(1); const t = setTimeout(() => playClip(R.audio), 350); return () => { clearTimeout(t); stopAudio(); }; } }, [r]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (ok) => {
    const n = right + (ok ? 1 : 0); setRight(n);
    setTimeout(() => { setPick(null); setPlays(0); if (r >= rounds.length - 1) finish({ score: n, max_score: rounds.length, mistakes: r + 1 - n, time_spent_seconds: clock.spent() }); else setR(r + 1); }, ok ? 700 : 1500);
  };
  const left = useRoundTimer(config.seconds_per_round, r, !res && pick == null, () => { buzzSound(); setPick('—'); go(false); });
  const tap = (o) => { if (pick != null) return; setPick(o.id); o.is_correct ? dingSound() : buzzSound(); go(!!o.is_correct); };
  if (!R && !res) return null;
  const pics = R?.options?.some(o => o.image);
  return (
    <>
      <Hud label="الجولة" done={r} total={rounds.length} />
      {!res && <>
        <div className="lp-radio">
          <span className="lp-wave"><i /><i /><i /><i /><i /></span>
          <button type="button" className="qt-bigplay" disabled={max && plays >= max} onClick={play}>🔊</button>
          {max && <small>متبقٍ {Math.max(0, max - plays)}</small>}
        </div>
        <Fuse left={left} total={config.seconds_per_round} />
        <div className={pics ? 'ey-grid n' + Math.min(R.options.length, 4) : 'g-tiles'}>
          {R.options.map((o, k) => {
            const st = pick == null ? '' : o.is_correct ? ' ok' : pick === o.id ? ' bad' : ' dim';
            return pics
              ? <button key={o.id} type="button" className={'ey-card' + (o.image ? ' pic' : '') + st + (pick === o.id ? ' on' : '')} onClick={() => tap(o)}>{o.image ? <img src={o.image} alt="" /> : <span className="ey-word">{o.text}</span>}</button>
              : <button key={o.id} type="button" className={'g-tile' + st} style={{ '--c': ['#0ea5e9', '#f59e0b', '#10b981', '#ec4899'][k % 4] }} onClick={() => tap(o)}><span className="k">{k + 1}</span>{o.text}</button>;
          })}
        </div>
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* sound_sequence — سلسلة الأصوات (سايمون): طبول ملوّنة تضيء بالتسلسل؛ أعده بالضغط */
const DRUMS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899'];
export function SoundSequence({ config, onDone }) {
  const sounds = config.sounds || [];
  const start = config.start_length || 2, max = config.max_length || 6;
  const [seq, setSeq] = useState(() => Array.from({ length: start }, () => Math.floor(Math.random() * sounds.length)));
  const [lit, setLit] = useState(null);
  const [phase, setPhase] = useState('ready');   // ready | show | input | fail
  const [pos, setPos] = useState(0);
  const [best, setBest] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const show = (s = seq) => {
    setPhase('show'); setPos(0);
    s.forEach((k, i) => {
      setTimeout(() => { setLit(k); if (sounds[k]?.audio) playClip(sounds[k].audio); else popSound(); }, 300 + i * 900);
      setTimeout(() => setLit(null), 300 + i * 900 + 600);
    });
    setTimeout(() => setPhase('input'), 300 + s.length * 900);
  };
  const tap = (k) => {
    if (phase !== 'input') return;
    setLit(k); setTimeout(() => setLit(null), 250);
    if (sounds[k]?.audio) playClip(sounds[k].audio); else popSound();
    if (k !== seq[pos]) {
      buzzSound(); setPhase('fail');
      setTimeout(() => finish({ score: best, max_score: max, mistakes: 1, time_spent_seconds: clock.spent() }), 900);
      return;
    }
    if (pos === seq.length - 1) {
      dingSound(); const b = seq.length; setBest(b);
      if (b >= max) { finish({ score: b, max_score: max, mistakes: 0, time_spent_seconds: clock.spent() }); return; }
      const s = [...seq, Math.floor(Math.random() * sounds.length)]; setSeq(s);
      setTimeout(() => show(s), 900); setPhase('show');
    } else setPos(pos + 1);
  };
  return (
    <>
      <Hud label="أطول سلسلة" done={best} total={max} />
      {!res && <>
        <div className="ss-status">{phase === 'ready' ? 'استمع ثم أعد نفس الترتيب' : phase === 'show' ? '👂 استمع…' : phase === 'input' ? `👆 دورك! (${pos + 1} / ${seq.length})` : '✗ حاول مرة أخرى'}</div>
        <div className="ss-drums">
          {sounds.map((s, k) => (
            <button key={s.id ?? k} type="button" className={'ss-drum' + (lit === k ? ' lit' : '')} style={{ '--c': DRUMS[k % DRUMS.length] }} onClick={() => tap(k)} disabled={phase !== 'input'}>
              {s.image ? <img src={s.image} alt="" /> : <span>{s.label}</span>}
            </button>
          ))}
        </div>
        {phase === 'ready' && <button className="btn btn-primary g-check" onClick={() => { clickSound(); show(); }}>▶ ابدأ</button>}
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* picture_hunt — كنز الصورة: خريطة كنز فوق المشهد؛ اسمع/اقرأ الهدف واضغط مكانه */
export function PictureHunt({ config, onDone }) {
  const targets = useMemo(() => shuffle(config.targets || []), [config]);
  const [i, setI] = useState(0);
  const [found, setFound] = useState([]);
  const [miss, setMiss] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const img = useRef(null);
  const T = targets[i];
  const advance = (f) => { if (i >= targets.length - 1) finish({ score: f.length, max_score: targets.length, mistakes, time_spent_seconds: clock.spent() }); else setI(i + 1); };
  const left = useRoundTimer(config.seconds_per_target, i, !res, () => { buzzSound(); advance(found); });
  useEffect(() => { if (T?.audio && config.prompt !== 'label') playClip(T.audio); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const tap = (e) => {
    if (res || !T) return;
    const r = img.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 100;
    const dy = (y - T.y) * (r.height / r.width);
    if (Math.hypot(x - T.x, dy) <= (T.radius || 6)) { dingSound(); const f = [...found, T.id]; setFound(f); setTimeout(() => advance(f), 500); }
    else { buzzSound(); setMistakes(m => m + 1); setMiss({ x, y, k: Date.now() }); }
  };
  if (!T && !res) return null;
  return (
    <>
      <Hud label="الكنوز" done={found.length} total={targets.length} />
      {!res && <>
        <div className="ph-prompt">🗺️ ابحث عن: {config.prompt !== 'label' && T.audio ? <button type="button" className="duo-spk" onClick={() => playClip(T.audio)}>🔊</button> : <b>{T.label}</b>}</div>
        <Fuse left={left} total={config.seconds_per_target} />
        <div className="hs-frame ph-map">
          <div className="qt-pimg-in" ref={img} onClick={tap} style={{ cursor: 'crosshair' }}>
            <img src={config.image} alt="" draggable={false} />
            {targets.filter(t => found.includes(t.id)).map(t => <span key={t.id} className="ph-hit" style={{ left: t.x + '%', top: t.y + '%', width: (t.radius || 6) * 2 + '%' }}>✨</span>)}
            {miss && <span key={miss.k} className="ph-miss" style={{ left: miss.x + '%', top: miss.y + '%' }}>✗</span>}
          </div>
        </div>
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ========== القراءة ========== */

/* story_order — رتّب القصة: صفحات كتاب تُرتَّب بالسحب، ثم «تحقق» وتُقرأ القصة صفحة صفحة */
export function StoryOrder({ config, onDone }) {
  const pages = config.pages || [];
  const [seq, setSeq] = useState(() => shuffle(pages.map((_, i) => i)));
  const [drag, setDrag] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const list = useRef(null);
  const move = (a, b) => { if (a === b) return; const n = [...seq]; const [x] = n.splice(a, 1); n.splice(b, 0, x); setSeq(n); clickSound(); };
  const start = (e, from) => {
    if (res) return;
    e.preventDefault();
    const sy = e.clientY, rows = [...list.current.children].map(el => el.getBoundingClientRect());
    const at = (y) => { const k = rows.findIndex(r => y < r.top + r.height / 2); return k < 0 ? rows.length - 1 : k; };
    const mv = (ev) => setDrag({ from, dy: ev.clientY - sy, over: at(ev.clientY) });
    const up = (ev) => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); setDrag(null); move(from, at(ev.clientY)); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  const check = () => {
    const score = seq.filter((p, k) => p === k).length;
    score === pages.length ? dingSound() : buzzSound();
    finish({ score, max_score: pages.length, mistakes: pages.length - score, time_spent_seconds: clock.spent() });
    // اقرأ القصة بالترتيب الصحيح
    let t = 600;
    pages.forEach((p, k) => { setTimeout(() => { setPlaying(k); if (p.audio) playClip(p.audio); }, t); t += p.audio ? 4000 : 1800; });
    setTimeout(() => setPlaying(null), t);
  };
  return (
    <>
      <Hud label="الصفحات" done={res ? res.score : 0} total={pages.length} />
      <div className="so-book" ref={list}>
        {(res ? pages.map((_, i) => i) : seq).map((p, k) => {
          const pg = pages[p];
          const st = res ? (seq[k] === k ? ' ok' : ' bad') : '';
          return (
            <div key={p} className={'so-page' + st + (drag?.from === k ? ' dragging' : '') + (playing === p ? ' play' : '')}
              style={drag?.from === k ? { transform: `translateY(${drag.dy}px) rotate(-1deg)` } : undefined} onPointerDown={res ? undefined : (e) => start(e, k)}>
              <span className="so-n">{k + 1}</span>
              {config.show_images !== false && pg.image && <img src={pg.image} alt="" />}
              <span className="so-t">{pg.text}</span>
            </div>
          );
        })}
      </div>
      {!res && <button className="btn btn-primary g-check" onClick={check}>تحقق ✓</button>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* story_cloze — أكمل القصة: لفافة بفراغات؛ بنك كلمات لكل فراغ (اضغط/اسحب)، ثم «تحقق» */
export function StoryCloze({ config, onDone }) {
  const blanks = useMemo(() => (config.blanks || []).map(b => ({ ...b, options: shuffle(b.options || [b.answer]) })), [config]);
  const [v, setV] = useState({});
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const model = res ? { blanks: blanks.map(b => ({ id: b.id, answer: b.answer })) } : null;
  const check = () => {
    const score = blanks.filter(b => v[String(b.id)] === b.answer).length;
    score === blanks.length ? dingSound() : buzzSound();
    finish({ score, max_score: blanks.length, mistakes: blanks.length - score, time_spent_seconds: clock.spent() });
  };
  const filled = blanks.filter(b => v[String(b.id)]).length;
  return (
    <>
      <Hud label="الفراغات" done={filled} total={blanks.length} />
      {config.audio && <div style={{ textAlign: 'center', marginTop: 10 }}><button type="button" className="duo-spk" onClick={() => playClip(config.audio)}>🔊</button></div>}
      <div className="sc-scroll">
        <DropdownFill q={{ text: config.text, blanks }} value={v} onChange={(x) => setV(x || {})} readOnly={!!res} model={model} />
      </div>
      {!res && <button className="btn btn-primary g-check" disabled={filled < blanks.length} style={{ opacity: filled < blanks.length ? 0.55 : 1 }} onClick={check}>تحقق ✓</button>}
      {res && <DoneBox r={res} />}
    </>
  );
}
