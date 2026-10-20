import { useEffect, useMemo, useRef, useState } from 'react';
import { dingSound, buzzSound, clickSound, playClip, popSound, stopAudio, tickTimer } from './sounds.js';
import { shuffle, pickN, normAr, useClock, Hud, DoneBox, useFinish } from './gamekit.jsx';
import { Lives } from './games-a.jsx';
import { DragDrop } from './games.jsx';

/* محركات الألعاب (2): القواعد · الكتابة · التحدث · السنوات المبكرة */

function useCountdown(seconds, key, running, onEnd) {
  const [left, setLeft] = useState(seconds);
  const cb = useRef(onEnd); cb.current = onEnd;
  useEffect(() => { setLeft(seconds); }, [key, seconds]);
  useEffect(() => {
    if (!running || !seconds) return;
    if (left <= 0) { cb.current?.(); return; }
    if (left <= 3) tickTimer();
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, running, seconds]);
  return left;
}
/* حلقة وقت تنكمش (بلا أرقام — للصغار وللجولات) */
function Ring({ left, total, size = 54 }) {
  if (!total) return null;
  const p = Math.max(0, left / total);
  const c = left <= 3 ? '#ef4444' : p < 0.5 ? '#f59e0b' : '#22c55e';
  return <svg className="gx-ring" width={size} height={size} viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" className="bg" /><circle cx="20" cy="20" r="16" className="fg" style={{ stroke: c, strokeDashoffset: 100.5 * (1 - p) }} /></svg>;
}

/* ========== القواعد ========== */

/* grammar_maze / answer_plane — أسئلة سريعة بقلوب، بغلافين: متاهة بأبواب · طائرة بين السحب */
function QuickFire({ config, onDone, skin }) {
  const qs = useMemo(() => (config.shuffle === false ? config.questions || [] : shuffle(config.questions || [])), [config]);
  const maxLives = config.lives || 3;
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [lives, setLives] = useState(maxLives);
  const [pick, setPick] = useState(null);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const Q = qs[i];
  const go = (ok) => {
    const r = right + (ok ? 1 : 0), l = lives - (ok ? 0 : 1);
    setRight(r); setLives(l);
    setTimeout(() => {
      setPick(null);
      if (l <= 0 || i >= qs.length - 1) finish({ score: r, max_score: qs.length, mistakes: maxLives - l, time_spent_seconds: clock.spent(), completed: l > 0 });
      else setI(i + 1);
    }, ok ? 800 : 2200);
  };
  const left = useCountdown(config.seconds_per_question, i, !res && pick == null, () => { buzzSound(); setPick(-1); go(false); });
  const tap = (k) => { if (pick != null) return; setPick(k); const ok = k === Q.answer_index; ok ? dingSound() : buzzSound(); go(ok); };
  if (!Q && !res) return null;
  const st = (k) => (pick == null ? '' : k === Q.answer_index ? ' ok' : k === pick ? ' bad' : ' dim');
  return (
    <>
      <Hud label="السؤال" done={i} total={qs.length} />
      {!res && <>
        <div className="qf-top"><Lives n={lives} max={maxLives} /><Ring left={left} total={config.seconds_per_question} size={44} /></div>
        <div className={'qf-q ' + skin}>{Q.image && <img src={Q.image} alt="" className="qf-img" />}{Q.audio && <button type="button" className="duo-spk" onClick={() => playClip(Q.audio)}>🔊</button>}<span>{Q.q}</span></div>
        {skin === 'maze' ? (
          <div className="mz-scene">
            <div className={'mz-walker' + (pick != null ? (pick === Q.answer_index ? ' go' : ' bump') : '')} style={{ '--col': pick != null && pick >= 0 ? pick : Math.floor(Q.options.length / 2), '--n': Q.options.length }}>🧒</div>
            <div className="mz-doors" style={{ '--n': Q.options.length }}>
              {Q.options.map((o, k) => <button key={k} type="button" className={'mz-door' + st(k)} onClick={() => tap(k)}><span className="knob" />{o}</button>)}
            </div>
          </div>
        ) : (
          <div className="pl-sky">
            <div className="pl-clouds" style={{ '--n': Q.options.length }}>
              {Q.options.map((o, k) => <button key={k} type="button" className={'pl-cloud' + st(k)} onClick={() => tap(k)} style={{ animationDelay: k * 0.4 + 's' }}>{o}</button>)}
            </div>
            <div className="pl-plane" style={{ '--col': pick != null && pick >= 0 ? pick : (Q.options.length - 1) / 2, '--n': Q.options.length }}>✈️</div>
          </div>
        )}
        {pick != null && pick !== Q.answer_index && Q.explanation && <div className="g-answer">💡 {Q.explanation}</div>}
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}
export const GrammarMaze = (p) => <QuickFire {...p} skin="maze" />;
export const AnswerPlane = (p) => <QuickFire {...p} skin="plane" />;

/* error_hunt — محكمة الأخطاء: اضغط الكلمة الخاطئة (½) ثم اختر تصحيحها (½) */
export function ErrorHunt({ config, onDone }) {
  const S = config.sentences || [];
  const [i, setI] = useState(0);
  const [pts, setPts] = useState(0);
  const [tapIdx, setTapIdx] = useState(null);
  const [fix, setFix] = useState(null);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const cur = S[i];
  const words = cur ? cur.text.split(/\s+/) : [];
  const chips = useMemo(() => {
    if (!cur) return [];
    const others = S.flatMap((s, k) => (k === i ? [] : s.text.split(/\s+/))).filter(w => normAr(w) !== normAr(cur.correction));
    return shuffle([cur.correction, ...pickN([...new Set(others)], 2)]);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = (p) => setTimeout(() => {
    setTapIdx(null); setFix(null);
    if (i >= S.length - 1) finish({ score: p, max_score: S.length, mistakes: Math.round((S.length - p) * 2), time_spent_seconds: clock.spent() });
    else setI(i + 1);
  }, 1400);
  const left = useCountdown(config.seconds_per_sentence, i, !res && fix == null, () => { buzzSound(); setTapIdx(t => t ?? -1); setFix('—'); next(pts); });
  const tapWord = (k) => {
    if (tapIdx != null) return;
    setTapIdx(k);
    if (k === cur.error_index) { dingSound(); setPts(p => p + 0.5); } else buzzSound();
  };
  const pickFix = (c) => {
    if (fix != null) return;
    setFix(c);
    const ok = normAr(c) === normAr(cur.correction);
    ok ? dingSound() : buzzSound();
    const p = pts + (ok ? 0.5 : 0); setPts(p); next(p);
  };
  if (!cur && !res) return null;
  return (
    <>
      <Hud label="الجملة" done={i} total={S.length} />
      {!res && <>
        <div className="eh-court"><span className="gavel">⚖️</span><Ring left={left} total={config.seconds_per_sentence} size={44} /></div>
        <div className="hl-paper eh-sent" dir="rtl">
          {words.map((w, k) => {
            const st = tapIdx == null ? '' : k === cur.error_index ? ' err' : k === tapIdx ? ' bad' : '';
            return <span key={k} role="button" className={'et-w' + st} onClick={() => tapWord(k)}>{w}</span>;
          })}
        </div>
        <div className="eh-step">{tapIdx == null ? '① اضغط الكلمة الخاطئة' : '② اختر التصحيح'}</div>
        {tapIdx != null && (
          <div className="chat-replies">
            {chips.map(c => {
              const st = fix == null ? '' : normAr(c) === normAr(cur.correction) ? ' ok' : c === fix ? ' bad' : '';
              return <button key={c} type="button" className={'chat-reply' + st} onClick={() => pickFix(c)}>{c}</button>;
            })}
          </div>
        )}
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* tashkeel — ضع التشكيل: لوحة مغناطيس؛ اختر الحرف ثم الحركة (الحرف يقبل شدة + حركة) */
const MARKS = ['َ', 'ُ', 'ِ', 'ْ', 'ّ', 'ً', 'ٌ', 'ٍ'];
const MARK_RE = /[ً-ْ]/;
const splitMarks = (w) => {
  const out = [];
  for (const ch of String(w || '')) { if (MARK_RE.test(ch) && out.length) out[out.length - 1].m += ch; else out.push({ ch, m: '' }); }
  return out.map(x => ({ ch: x.ch, m: [...x.m].sort().join('') }));
};
export function Tashkeel({ config, onDone }) {
  const W = config.words || [];
  const [i, setI] = useState(0);
  const [marks, setMarks] = useState({});   // index → string
  const [sel, setSel] = useState(0);
  const [checked, setChecked] = useState(null);
  const [right, setRight] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const cur = W[i];
  const letters = cur ? splitMarks(cur.base).map(x => x.ch) : [];
  const target = cur ? splitMarks(cur.target) : [];
  const check = () => {
    const per = letters.map((_, k) => [...(marks[k] || '')].sort().join('') === (target[k]?.m || ''));
    const ok = per.every(Boolean);
    ok ? dingSound() : buzzSound();
    setChecked(per);
    const r = right + (ok ? 1 : 0); setRight(r);
    setTimeout(() => {
      setChecked(null); setMarks({}); setSel(0);
      if (i >= W.length - 1) finish({ score: r, max_score: W.length, mistakes: i + 1 - r, time_spent_seconds: clock.spent() });
      else setI(i + 1);
    }, 1800);
  };
  const left = useCountdown(config.seconds_per_word, i, !res && !checked, () => check());
  const put = (m) => {
    if (checked) return;
    clickSound();
    setMarks(x => {
      const cur2 = x[sel] || '';
      let n;
      if (m === 'ّ') n = cur2.includes('ّ') ? cur2.replace('ّ', '') : cur2 + 'ّ';
      else { const keep = cur2.includes('ّ') ? 'ّ' : ''; n = cur2.replace('ّ', '') === m ? keep : keep + m; }
      return { ...x, [sel]: n };
    });
  };
  if (!cur && !res) return null;
  return (
    <>
      <Hud label="الكلمة" done={i} total={W.length} />
      {!res && <>
        <div className="qf-top"><span className="qt-muted">اختر الحرف ثم الحركة</span><Ring left={left} total={config.seconds_per_word} size={44} /></div>
        <div className="tk-board" dir="rtl">
          {letters.map((ch, k) => (
            <button key={k} type="button" className={'tk-letter' + (sel === k ? ' sel' : '') + (checked ? (checked[k] ? ' ok' : ' bad') : '')} onClick={() => { clickSound(); setSel(k); }}>
              {ch + (marks[k] || '')}
              {checked && !checked[k] && <small>{ch + (target[k]?.m || '')}</small>}
            </button>
          ))}
        </div>
        <div className="tk-tray">
          {MARKS.map(m => <button key={m} type="button" className="tk-mark" onClick={() => put(m)}>{'ـ' + m}</button>)}
        </div>
        {!checked && <button className="btn btn-primary g-check" onClick={check}>تحقق ✓</button>}
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* root_family — عائلة الكلمة: سلال باسم الجذر + سلة «لا تنتمي» (نفس محرك الفرز) */
export function RootFamily({ config, onDone }) {
  const NO = 'لا تنتمي';
  const cfg = useMemo(() => ({
    groups: [...(config.groups || []).map(g => g.root), ...(config.distractors?.length ? [NO] : [])],
    items: [...(config.groups || []).flatMap(g => g.words.map(w => ({ text: w, group: g.root }))), ...(config.distractors || []).map(w => ({ text: w, group: NO }))],
    time_limit_seconds: config.time_limit_seconds,
  }), [config]);
  return <DragDrop config={cfg} onDone={onDone} />;
}

/* ========== الكتابة ========== */

/* speed_dictation — إملاء السرعة: آلة كاتبة؛ استمع واكتب قبل انتهاء الحلقة */
export function SpeedDictation({ config, onDone }) {
  const items = config.items || [];
  const [i, setI] = useState(0);
  const [txt, setTxt] = useState('');
  const [plays, setPlays] = useState(0);
  const [verdict, setVerdict] = useState(null);
  const [right, setRight] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const inp = useRef(null);
  const it = items[i];
  const max = config.max_plays || null;
  const play = () => { if (max && plays >= max) return; playClip(it.audio); setPlays(p => p + 1); };
  useEffect(() => { if (it?.audio) { setPlays(1); const t = setTimeout(() => playClip(it.audio), 350); inp.current?.focus(); return () => { clearTimeout(t); stopAudio(); }; } }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = () => {
    if (verdict) return;
    const ok = [it.answer, ...(it.accepted || [])].some(a => normAr(a) === normAr(txt));
    ok ? dingSound() : buzzSound();
    setVerdict(ok ? 'ok' : 'bad');
    const r = right + (ok ? 1 : 0); setRight(r);
    setTimeout(() => {
      setVerdict(null); setTxt(''); setPlays(0);
      if (i >= items.length - 1) finish({ score: r, max_score: items.length, mistakes: i + 1 - r, time_spent_seconds: clock.spent() });
      else setI(i + 1);
    }, ok ? 800 : 1800);
  };
  const left = useCountdown(config.seconds_per_item, i, !res && !verdict, submit);
  if (!it && !res) return null;
  return (
    <>
      <Hud label="الكلمة" done={i} total={items.length} />
      {!res && (
        <div className="sd-type">
          <div className="sd-top">
            <button type="button" className="qt-bigplay" disabled={max && plays >= max} onClick={play}>🔊</button>
            <Ring left={left} total={config.seconds_per_item} />
          </div>
          {it.image && <img src={it.image} alt="" className="sd-img" />}
          <div className={'sd-paper' + (verdict ? ' ' + verdict : '')}>
            <input ref={inp} dir="rtl" value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="اكتب ما تسمعه…" disabled={!!verdict} />
          </div>
          {verdict === 'bad' && <div className="g-answer">الصحيح: <b>{it.answer}</b></div>}
          {!verdict && <button className="btn btn-primary g-check" disabled={!txt.trim()} onClick={submit}>✓ أرسل</button>}
        </div>
      )}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ========== التحدث ========== */

/* ميكروفون مع مؤشر مستوى (التسجيل يبقى على الجهاز) */
function useMic() {
  const [lvl, setLvl] = useState(0);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState(null);
  const R = useRef({});
  const stop = () => { const r = R.current; cancelAnimationFrame(r.raf); try { r.rec?.state === 'recording' && r.rec.stop(); } catch { /* */ } r.stream?.getTracks().forEach(t => t.stop()); r.ctx?.close().catch(() => {}); R.current = {}; setOn(false); setLvl(0); };
  const start = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const an = ctx.createAnalyser(); an.fftSize = 256; ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const loop = () => { an.getByteFrequencyData(buf); setLvl(Math.min(1, buf.reduce((a, b) => a + b, 0) / buf.length / 80)); R.current.raf = requestAnimationFrame(loop); };
      const rec = window.MediaRecorder ? new MediaRecorder(stream) : null; rec?.start();
      R.current = { stream, ctx, rec }; loop(); setOn(true); return true;
    } catch (e) { setErr(e?.name === 'NotAllowedError' ? 'اسمح باستخدام الميكروفون من إعدادات المتصفح ثم أعد المحاولة' : 'تعذّر تشغيل الميكروفون'); return false; }
  };
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps
  return { lvl, on, err, start, stop };
}
function Meter({ lvl }) {
  return <div className="qt-meter gx-meter">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ transform: `scaleY(${0.15 + lvl * (0.5 + 0.5 * Math.abs(Math.sin(i * 1.3 + Date.now() / 200)))})` }} />)}</div>;
}

/* read_karaoke — كاريوكي القراءة: كرة تقفز فوق الكلمات بسرعة words_per_minute؛ اقرأ مع الإضاءة */
export function ReadKaraoke({ config, onDone }) {
  const words = String(config.passage || '').split(/\s+/).filter(Boolean);
  const [idx, setIdx] = useState(-1);
  const [run, setRun] = useState(false);
  const mic = useMic();
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const ms = 60000 / (config.words_per_minute || 60);
  useEffect(() => {
    if (!run) return;
    if (idx >= words.length - 1) { stopNow(words.length); return; }
    const t = setTimeout(() => setIdx(i => i + 1), ms);
    return () => clearTimeout(t);
  }, [run, idx]); // eslint-disable-line react-hooks/exhaustive-deps
  const begin = async () => { clickSound(); await mic.start(); setIdx(0); setRun(true); };
  function stopNow(reached = idx + 1) {
    setRun(false); mic.stop(); dingSound();
    finish({ score: Math.max(0, reached), max_score: words.length, mistakes: 0, time_spent_seconds: clock.spent(), completed: reached >= words.length });
  }
  return (
    <>
      <Hud label="الكلمات" done={Math.max(0, idx + 1)} total={words.length} />
      {!res && <>
        {config.audio && idx < 0 && <div style={{ textAlign: 'center', marginTop: 10 }}><button type="button" className="hint-btn" onClick={() => playClip(config.audio)}>🎧 استمع للنموذج أولاً</button></div>}
        <div className="rk-stage" dir="rtl">
          {words.map((w, k) => (
            <span key={k} className={'rk-w' + (k === idx ? ' on' : k < idx ? ' done' : '')}>{k === idx && <i className="rk-ball" />}{w}</span>
          ))}
        </div>
        {mic.on && <Meter lvl={mic.lvl} />}
        {mic.err && <div className="qt-err">🎙 {mic.err}</div>}
        <div style={{ textAlign: 'center' }}>
          {!run ? <button className="btn btn-primary g-check" onClick={begin}>🎤 ابدأ القراءة</button>
            : <button className="btn btn-primary g-check" style={{ background: '#ef4444' }} onClick={() => stopNow()}>⏹ انتهيت</button>}
        </div>
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* speak_wheel — عجلة التحدث: دوّر العجلة، تقف على موضوع، تحدّث حتى ينتهي الوقت */
const WHEEL = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
export function SpeakWheel({ config, onDone }) {
  const topics = config.topics || [];
  const rounds = Math.min(config.rounds || topics.length, Math.max(topics.length, 1) * 3);
  const [r, setR] = useState(0);
  const [done, setDone] = useState(0);
  const [angle, setAngle] = useState(0);
  const [topic, setTopic] = useState(null);
  const [phase, setPhase] = useState('spin');   // spin | spinning | talk
  const [left, setLeft] = useState(0);
  const mic = useMic();
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const seg = 360 / Math.max(topics.length, 1);
  const spin = () => {
    clickSound();
    const k = Math.floor(Math.random() * topics.length);
    setAngle(a => a + 360 * 4 + (360 - (k * seg + seg / 2)) - (a % 360));
    setPhase('spinning');
    setTimeout(async () => { popSound(); setTopic(topics[k]); const s = topics[k].seconds || config.default_seconds || 30; setLeft(s); await mic.start(); setPhase('talk'); }, 3200);
  };
  useEffect(() => {
    if (phase !== 'talk') return;
    if (left <= 0) {
      mic.stop(); dingSound();
      const d = done + 1; setDone(d);
      if (r >= rounds - 1) finish({ score: d, max_score: rounds, mistakes: 0, time_spent_seconds: clock.spent() });
      else { setR(r + 1); setTopic(null); setPhase('spin'); }
      return;
    }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = topic ? topic.seconds || config.default_seconds || 30 : 1;
  return (
    <>
      <Hud label="الجولة" done={done} total={rounds} />
      {!res && <>
        <div className="sw-wheel-wrap">
          <div className="sw-pointer">▼</div>
          <div className="sw-wheel" style={{ transform: `rotate(${angle}deg)`, background: `conic-gradient(${topics.map((_, k) => `${WHEEL[k % WHEEL.length]} ${k * seg}deg ${(k + 1) * seg}deg`).join(',')})` }}>
            {topics.map((t, k) => <span key={k} className="sw-seg" style={{ transform: `rotate(${k * seg + seg / 2}deg)` }}><b>{t.text}</b></span>)}
          </div>
        </div>
        {phase === 'spin' && <div style={{ textAlign: 'center' }}><button className="btn btn-primary g-check" onClick={spin}>🎡 دوّر العجلة</button></div>}
        {phase === 'talk' && topic && (
          <div className="sw-talk">
            {topic.image && <img src={topic.image} alt="" />}
            <b>{topic.text}</b>
            <div className="sw-talk-row"><Ring left={left} total={total} size={64} /><Meter lvl={mic.lvl} /></div>
            <span className="qt-muted">🎤 تحدّث حتى تنتهي الدائرة</span>
          </div>
        )}
        {mic.err && <div className="qt-err">🎙 {mic.err}</div>}
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* ========== السنوات المبكرة ========== */

/* letter_forms — أشكال الحرف: الحرف كبير + 3 بلاطات لأشكاله؛ اختر الشكل المطلوب (أول/وسط/آخر) */
const FORM_LBL = { initial: 'في أول الكلمة', medial: 'في وسط الكلمة', final: 'في آخر الكلمة' };
export function LetterForms({ config, onDone }) {
  const L = config.letters || [];
  const plan = useMemo(() => L.map(() => ['initial', 'medial', 'final'][Math.floor(Math.random() * 3)]), [config]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [right, setRight] = useState(0);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const cur = L[i];
  const tiles = useMemo(() => (cur ? shuffle(['initial', 'medial', 'final']) : []), [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (cur?.audio) { const t = setTimeout(() => playClip(cur.audio), 350); return () => clearTimeout(t); } }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const tap = (f) => {
    if (pick) return;
    setPick(f);
    const ok = f === plan[i]; ok ? dingSound() : buzzSound();
    const r = right + (ok ? 1 : 0); setRight(r);
    setTimeout(() => { setPick(null); if (i >= L.length - 1) finish({ score: r, max_score: L.length, mistakes: i + 1 - r, time_spent_seconds: clock.spent() }); else setI(i + 1); }, ok ? 800 : 1600);
  };
  if (!cur && !res) return null;
  return (
    <>
      <Hud label="الحرف" done={i} total={L.length} />
      {!res && <>
        <div className="lf-board">
          <span className="lf-big">{cur.letter}</span>
          {cur.audio && <button type="button" className="duo-spk" onClick={() => playClip(cur.audio)}>🔊</button>}
        </div>
        <div className="lf-ask">{FORM_LBL[plan[i]]}{cur.example_word ? <small> · مثل: {cur.example_word}</small> : null}</div>
        <div className="ey-grid n3">
          {tiles.map(f => {
            const st = pick == null ? '' : f === plan[i] ? ' ok' : f === pick ? ' bad' : '';
            return <button key={f} type="button" className={'ey-card' + st + (pick === f ? ' on' : '')} onClick={() => tap(f)}><span className="ey-word lf-form">{cur[f]}</span></button>;
          })}
        </div>
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}

/* letter_trace — تتبّع الحرف: سبّورة بحرف منقّط؛ نسبة تغطية مسار الحرف ≥ الحد = نجاح */
export function LetterTrace({ config, onDone }) {
  const L = config.letters || [];
  const min = config.min_accuracy_score ?? 60;
  const [i, setI] = useState(0);
  const [passed, setPassed] = useState(0);
  const [acc, setAcc] = useState(null);
  const [res, finish] = useFinish(onDone);
  const clock = useClock(null);
  const cv = useRef(null);
  const cur = L[i];
  const FONT = (h) => `900 ${Math.round(h * 0.66)}px "Tajawal","Cairo","Noto Naskh Arabic",sans-serif`;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const r = c.getBoundingClientRect(); c.width = r.width * 2; c.height = r.height * 2;
    const x = c.getContext('2d'); x.scale(2, 2); x.lineCap = 'round'; x.lineJoin = 'round';
    if (cur?.audio) playClip(cur.audio);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const pos = (e) => { const r = cv.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = (e) => { if (acc != null) return; const c = cv.current, x = c.getContext('2d'); c.setPointerCapture(e.pointerId); x.strokeStyle = '#fde047'; x.lineWidth = Math.max(16, c.height / 30); const [a, b] = pos(e); x.beginPath(); x.moveTo(a, b); x.lineTo(a + 0.1, b + 0.1); x.stroke(); c._on = true; };
  const move = (e) => { const c = cv.current; if (!c._on) return; const x = c.getContext('2d'); const [a, b] = pos(e); x.lineTo(a, b); x.stroke(); };
  const up = () => { if (cv.current) cv.current._on = false; };
  const clear = () => { const c = cv.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); clickSound(); };
  // عيّنات على مسار الحرف: بكسلات الحرف (شبكة متباعدة) — الممرور منها ضمن السُّمك
  const measure = () => {
    const c = cv.current, W = c.width, H = c.height;
    const g = document.createElement('canvas'); g.width = W; g.height = H;
    const gx = g.getContext('2d'); gx.font = FONT(H); gx.textAlign = 'center'; gx.textBaseline = 'middle'; gx.direction = 'rtl'; gx.fillText(cur.letter, W / 2, H / 2);
    const G = gx.getImageData(0, 0, W, H).data, U = c.getContext('2d').getImageData(0, 0, W, H).data;
    let tot = 0, hit = 0;
    for (let y = 0; y < H; y += 6) for (let x = 0; x < W; x += 6) { const k = (y * W + x) * 4 + 3; if (G[k] > 100) { tot++; if (U[k] > 60) hit++; } }
    return tot ? Math.round((hit / tot) * 100) : 0;
  };
  const done = () => {
    const a = measure(); setAcc(a);
    const ok = a >= min; ok ? dingSound() : buzzSound();
    const p = passed + (ok ? 1 : 0); setPassed(p);
    setTimeout(() => { setAcc(null); if (i >= L.length - 1) finish({ score: p, max_score: L.length, mistakes: i + 1 - p, time_spent_seconds: clock.spent() }); else setI(i + 1); }, 1600);
  };
  if (!cur && !res) return null;
  return (
    <>
      <Hud label="الحرف" done={i} total={L.length} />
      {!res && <>
        <div className="lt-board">
          {cur.audio && <button type="button" className="duo-spk tr-spk" onClick={() => playClip(cur.audio)}>🔊</button>}
          <div className="lt-sheet" style={cur.guide_image ? { backgroundImage: `url("${cur.guide_image}")` } : undefined}>
            {!cur.guide_image && <svg className="lt-guide" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" aria-hidden><text x="200" y="135" textAnchor="middle" dominantBaseline="middle" direction="rtl">{cur.letter}</text></svg>}
            <canvas ref={cv} key={i} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
            {acc != null && <div className={'lt-score' + (acc >= min ? ' ok' : ' bad')}>{acc >= min ? '⭐ أحسنت!' : 'حاول مرة أخرى'} <b>{acc}%</b></div>}
          </div>
        </div>
        <div className="dr-foot">
          <button type="button" className="hint-btn" onClick={clear}>🧽 امسح</button>
          <button type="button" className="btn btn-primary" disabled={acc != null} onClick={done}>✓ انتهيت</button>
        </div>
      </>}
      {res && <DoneBox r={res} />}
    </>
  );
}
