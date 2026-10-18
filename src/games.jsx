import { useEffect, useMemo, useRef, useState } from 'react';
import { dingSound, buzzSound, clickSound, winSound } from './sounds.js';
import { ArrangeBoard } from './QuestionBody.jsx';

/* ألعاب الأنشطة — game_type + config من الـAPI، والإجابات داخل config
   كل لعبة تنادي onDone({ score, max_score, mistakes, time_spent_seconds }) مرة واحدة عند الانتهاء */

const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = (s) => String(s ?? '').replace(/[ً-ْ]/g, '').replace(/[أإآ]/g, 'ا').trim();
const ZONE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6'];

/* مؤقت تنازلي اختياري + عدّاد الوقت المستغرق */
function useClock(limit, onTimeout) {
  const start = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  const spent = Math.floor((now - start.current) / 1000);
  const left = limit ? Math.max(0, limit - spent) : null;
  useEffect(() => { if (limit && left === 0 && !fired.current) { fired.current = true; onTimeout?.(); } }, [left, limit, onTimeout]);
  return { spent: () => Math.floor((Date.now() - start.current) / 1000), left, limit };
}

/* حلقة العدّ التنازلي */
function Clock({ left, total }) {
  if (left == null) return null;
  const pct = total ? left / total : 1;
  const c = left <= 5 ? '#ef4444' : left <= 10 ? '#f59e0b' : '#3b82f6';
  return (
    <div className={'g-clock' + (left <= 5 ? ' urgent' : '')} style={{ '--c': c }}>
      <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" className="bg" /><circle cx="20" cy="20" r="17" className="fg" style={{ strokeDashoffset: 107 * (1 - pct) }} /></svg>
      <b>{left}</b>
    </div>
  );
}

/* شريط اللعبة: التقدّم + المؤقت */
function Hud({ label, done, total, clock }) {
  return (
    <div className="g-hud">
      <div style={{ flex: 1 }}>
        <div className="g-hud-l">{label} <b>{done}</b> / {total}</div>
        <div className="g-hud-bar"><i style={{ width: (total ? (done / total) * 100 : 0) + '%' }} /></div>
      </div>
      {clock && <Clock left={clock.left} total={clock.limit} />}
    </div>
  );
}

function DoneBox({ r }) {
  const pct = r.max_score ? r.score / r.max_score : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct > 0 ? 1 : 0;
  return (
    <div className="g-done">
      <div className="g-stars">{[0, 1, 2].map(k => <span key={k} className={k < stars ? 'on' : ''} style={{ animationDelay: k * 0.18 + 's' }}>★</span>)}</div>
      <img src="/img/owl.png" alt="" />
      <h3>{stars === 3 ? 'رائع! أداء ممتاز 🎉' : stars === 2 ? 'أحسنت! 👏' : 'انتهت اللعبة — حاول مرة أخرى لتتحسن 💪'}</h3>
      <div className="g-done-row">
        <span><b>{r.score}</b> / {r.max_score}<small>النتيجة</small></span>
        {r.mistakes > 0 && <span><b>{r.mistakes}</b><small>أخطاء</small></span>}
        <span><b>{r.time_spent_seconds}</b><small>ثانية</small></span>
      </div>
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
  const [bad, setBad] = useState([]);
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
      if (x.pair !== y.pair) setTimeout(() => setBad(next), 450);
      setTimeout(() => {
        if (x.pair === y.pair) {
          dingSound();
          const m = [...matched, x.pair];
          setMatched(m);
          if (m.length === pairs.length) finish({ score: m.length, max_score: pairs.length, mistakes, time_spent_seconds: clock.spent() });
        } else { buzzSound(); setMistakes(n => n + 1); }
        setOpen([]); setBad([]);
      }, 950);
    }
  };
  return (
    <>
      <Hud label="الأزواج" done={matched.length} total={pairs.length} clock={clock} />
      <div className="g-mem">
        {cards.map((c, idx) => {
          const m = matched.includes(c.pair);
          const shown = open.includes(c.k) || m;
          return (
            <button key={c.k} type="button" className={'g-mem-card' + (shown ? ' flip' : '') + (m ? ' ok' : '') + (bad.includes(c.k) ? ' bad' : '')} onClick={() => tap(c)} style={{ animationDelay: idx * 0.04 + 's' }}>
              <span className="in">
                <span className="face back">؟</span>
                <span className="face front" dir="auto">{c.text}</span>
              </span>
            </button>
          );
        })}
      </div>
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 2) drag_drop — صنّف كل عبارة في مجموعتها (اسحب العبارة وأفلتها في المجموعة، أو اضغط العبارة ثم المجموعة) ===== */
function DragDrop({ config, onDone }) {
  const items = useMemo(() => shuffle((config.items || []).map((x, i) => ({ ...x, i }))), [config]);
  const groups = config.groups || [];
  const [place, setPlace] = useState({});   // i → group
  const [sel, setSel] = useState(null);
  const [drag, setDrag] = useState(null);   // { i, x, y, dx, dy, w, h, over }
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds);
  const POOL = '__pool';
  const move = (i, g) => { clickSound(); setPlace(p => { const n = { ...p }; if (g === POOL) delete n[i]; else n[i] = g; return n; }); setSel(null); };
  const put = (g) => { if (sel === null || res) return; move(sel, g); };
  const zoneAt = (x, y) => document.elementFromPoint(x, y)?.closest('[data-zone]')?.dataset.zone ?? null;

  const start = (e, i) => {
    if (res) return;
    e.preventDefault(); e.stopPropagation();
    const R = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    const d0 = { i, dx: sx - R.left, dy: sy - R.top, w: R.width, h: R.height };
    const mv = (ev) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
      moved = true;
      setDrag({ ...d0, x: ev.clientX, y: ev.clientY, over: zoneAt(ev.clientX, ev.clientY) });
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      setDrag(null);
      if (!moved) {                                       // ضغطة: من المجموعة → يرجع · من القائمة → يتحدد
        if (place[i] !== undefined) move(i, POOL); else { clickSound(); setSel(s => (s === i ? null : i)); }
        return;
      }
      const z = zoneAt(ev.clientX, ev.clientY);
      if (z !== null && z !== (place[i] ?? POOL)) move(i, z);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  const check = () => {
    const score = items.filter(x => place[x.i] === x.group).length;
    score === items.length ? dingSound() : buzzSound();
    finish({ score, max_score: items.length, mistakes: items.length - score, time_spent_seconds: clock.spent() });
  };
  const chip = (x, cls = '') => (
    <button key={x.i} type="button" className={'ar-chip' + cls + (sel === x.i ? ' in' : '') + (drag?.i === x.i ? ' ghosted' : '')} onPointerDown={e => start(e, x.i)}>{x.text}</button>
  );
  const pool = items.filter(x => place[x.i] === undefined);
  return (
    <>
      <Hud label="صنّفت" done={items.length - pool.length} total={items.length} clock={clock} />
      <div data-zone={POOL} className={'g-pool' + (drag?.over === POOL ? ' dd-hot' : '')}>
        {pool.map(x => chip(x))}
        {!pool.length && <span className="g-pool-done">✓ صنّفت كل العبارات — اضغط «تحقق»</span>}
      </div>
      {pool.length > 0 && !res && <div className="g-tip">👆 اسحب كل عبارة وأفلتها في مجموعتها</div>}
      <div className="g-zones">
        {groups.map((g, gi) => {
          const hot = drag?.over === g;
          const c = ZONE_COLORS[gi % ZONE_COLORS.length];
          const inZone = items.filter(x => place[x.i] === g);
          return (
            <div key={g} data-zone={g} className={'g-zone' + (hot ? ' hot' : '') + (sel !== null ? ' ready' : '')} onClick={() => put(g)} style={{ '--c': c }}>
              <div className="g-zone-h"><span>{g}</span><small>{inZone.length}</small></div>
              <div className="g-zone-b">
                {inZone.map(x => chip(x, ' in' + (res ? (x.group === g ? ' dd-ok' : ' dd-bad') : '')))}
                {hot && <span className="ar-gap" style={{ width: drag.w }} />}
                {!inZone.length && !hot && <span className="g-zone-ph">أفلت هنا</span>}
              </div>
            </div>
          );
        })}
      </div>
      {!res && <button className="btn btn-primary g-check" disabled={pool.length > 0} onClick={check}>تحقق ✓</button>}
      {res && <DoneBox r={res} />}
      {drag && <div className="ar-chip floating" style={{ position: 'fixed', left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w, height: drag.h }}>{items.find(x => x.i === drag.i)?.text}</div>}
    </>
  );
}

/* ===== 3) puzzle — رتّب القطع (answer_order) بالسحب والإفلات ===== */
function Puzzle({ config, onDone }) {
  const pieces = config.pieces || [];
  const order = config.answer_order || pieces.map((_, i) => i);
  const bag = useMemo(() => shuffle(pieces.map((t, i) => ({ id: i, text: t }))), [pieces]);
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
      <Hud label="القطع" done={seq.length} total={pieces.length} clock={clock} />
      <ArrangeBoard items={bag} value={seq} onChange={v => setSeq(v || [])} readOnly={!!res} />
      {res && (
        <div className="g-answer">الترتيب الصحيح: <b>{order.map(i => pieces[i]).join(' ← ')}</b></div>
      )}
      {!res && <button className="btn btn-primary g-check" disabled={seq.length !== pieces.length} onClick={check}>تحقق ✓</button>}
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
    }, 1000);
  };
  if (!s) return null;
  return (
    <>
      <Hud label="الموقف" done={i + (pick !== null ? 1 : 0)} total={scenes.length} clock={clock} />
      {!res && <>
        <div className="g-scene" key={i}>
          <span className="g-scene-n">الموقف {i + 1}</span>
          <div className="g-scene-t">🎬 {s.scene}</div>
          <div className="g-scene-q">ماذا تقول؟</div>
        </div>
        <div className="g-tiles">
          {choices.map((c, k) => {
            const st = pick !== null && c === s.answer ? ' ok' : pick === c ? ' bad' : pick !== null ? ' dim' : '';
            return (
              <button key={c} type="button" className={'g-tile' + st} onClick={() => choose(c)} style={{ '--c': ZONE_COLORS[k % ZONE_COLORS.length], animationDelay: k * 0.06 + 's' }}>
                <span className="k">{['أ', 'ب', 'ج', 'د', 'هـ', 'و'][k] || k + 1}</span>{c}
              </button>
            );
          })}
        </div>
      </>}
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
  useEffect(() => { if (reveal || res) return; if (left <= 0) { buzzSound(); setReveal(true); return; } const t = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(t); }, [left, reveal, res]);
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
      <Hud label="السؤال" done={i} total={qs.length} clock={!reveal && !res ? { left, limit: per } : null} />
      {!res && (
        <div className={'g-flip' + (reveal ? ' flip' : '')} key={i}>
          <div className="in">
            <div className="face q">
              <span className="g-bolt">⚡</span>
              <div className="g-scene-t">{q.q}</div>
              <div className="g-scene-q">قل إجابتك بصوت عالٍ قبل انتهاء الوقت</div>
              <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => { clickSound(); setReveal(true); }}>أجبت — أظهر النموذج</button>
            </div>
            <div className="face a">
              <span className="g-scene-n">الإجابة النموذجية</span>
              <div className="g-scene-t">{q.a}</div>
              <div className="g-tiles two">
                <button type="button" className="g-tile" style={{ '--c': '#10b981' }} onClick={() => mark(true)}><span className="k">✓</span>أجبت مثلها</button>
                <button type="button" className="g-tile" style={{ '--c': '#ef4444' }} onClick={() => mark(false)}><span className="k">✗</span>لم أعرفها</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ===== 6) word_builder — كوّن الكلمة: اسحب الحروف إلى خاناتها (أو اضغط الحرف ليملأ أول خانة فارغة) ===== */
function WordBuilder({ config, onDone }) {
  const words = config.words || [];
  const [i, setI] = useState(0);
  const [slots, setSlots] = useState([]);   // موضع → رقم الحرف أو null
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [state, setState] = useState(null); // ok | bad
  const [drag, setDrag] = useState(null);   // { k, from, x, y, dx, dy, w, h, over }
  const [res, finish] = useFinish(onDone);
  const clock = useClock(config.time_limit_seconds, () => finish({ score, max_score: words.length, mistakes, time_spent_seconds: clock.spent() }));
  const w = words[i] || '';
  const letters = useMemo(() => shuffle([...w].map((ch, k) => ({ ch, k }))), [w]);
  useEffect(() => { setSlots([...w].map(() => null)); }, [w]);
  const next = (ok) => {
    const sc = score + (ok ? 1 : 0);
    setScore(sc);
    if (!ok) setMistakes(m => m + 1);
    setState(null);
    if (i === words.length - 1) finish({ score: sc, max_score: words.length, mistakes: mistakes + (ok ? 0 : 1), time_spent_seconds: clock.spent() });
    else setI(i + 1);
  };
  // تحديث الخانات + التحقق عند امتلائها
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

  // سحب حرف (من البنك أو من خانة) وإفلاته في خانة
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
      if (!moved) {                                   // ضغطة: من البنك → أول خانة · من خانة → يرجع
        if (from === 'bank') tap(k); else { s[from] = null; commit(s); }
        return;
      }
      const to = slotAt(ev.clientX, ev.clientY);
      if (to === null) { if (from !== 'bank') { s[from] = null; commit(s); } return; }
      if (from === 'bank') s[to] = k;                 // الحرف المزاح يعود للبنك تلقائياً
      else { [s[to], s[from]] = [s[from], s[to]]; }   // تبديل بين خانتين
      commit(s);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  if (!w && !res) return null;
  const color = (k) => ['o', 'b', 'g'][letters.findIndex(l => l.k === k) % 3];
  return (
    <>
      <Hud label="الكلمة" done={i} total={words.length} clock={clock} />
      {!res && <>
        <div className={'g-slots' + (state ? ' ' + state : '')} key={i}>
          {slots.map((k, pos) => (
            <div key={pos} data-slot={pos} className={'g-slot' + (k !== null ? ' filled' : '') + (drag?.over === pos ? ' hot' : '')}
              onPointerDown={k !== null ? e => start(e, k, pos) : undefined} style={k !== null && drag?.k === k ? { opacity: 0.3 } : undefined}>
              {k !== null ? w[k] : ''}
            </div>
          ))}
        </div>
        <div className="g-tip">👆 اسحب الحروف إلى الخانات بالترتيب الصحيح</div>
        <div className="g-letters">
          {letters.map((l, n) => {
            const used = slots.includes(l.k);
            return <button key={l.k} type="button" className={'g-letter c-' + color(l.k) + (used ? ' used' : '') + (drag?.k === l.k && drag.from === 'bank' ? ' ghost' : '')} disabled={used}
              onPointerDown={e => start(e, l.k, 'bank')} style={{ animationDelay: n * 0.05 + 's' }}>{l.ch}</button>;
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
          {slots.some(x => x !== null) && !state && <button className="hint-btn" onClick={() => { clickSound(); setSlots(slots.map(() => null)); }}>↺ إعادة</button>}
          {!state && <button className="hint-btn" onClick={() => { buzzSound(); next(false); }}>تخطَّ ←</button>}
        </div>
      </>}
      {res && <DoneBox r={res} />}
      {drag && <div className={'g-letter floating c-' + color(drag.k)} style={{ position: 'fixed', left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w, height: drag.h, display: 'grid', placeItems: 'center' }}>{w[drag.k]}</div>}
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
