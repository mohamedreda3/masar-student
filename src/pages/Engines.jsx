import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip } from '../components.jsx';
import { lessonVocab, dialogueAudio, pronunciationAudio, storyPages, SKILLS } from '../data.js';
import { dingSound, buzzSound, winSound, clickSound, playClip } from '../sounds.js';

/* ============================================================
   معرض محركات الأسئلة — كل محرك نموذج حي مصغّر يعمل فعلاً
   (مواصفة بصرية لمحرر الأنشطة في لوحة المعلم لاحقاً)
   ============================================================ */

const ok = () => dingSound();
const no = () => buzzSound();

/* بطاقة محرك موحّدة */
function Eng({ ar, en, skill, children }) {
  const S = SKILLS[skill];
  return (
    <div className="card eng-card" data-skill={skill || 'all'}>
      <div className="eng-head">
        <div>
          <h3>{ar}</h3>
          <div className="en">{en}</div>
        </div>
        {S && <span className="chip" style={{ color: S.color, background: S.color + '15' }}>{S.ar}</span>}
      </div>
      {children}
    </div>
  );
}

/* نتيجة فورية صغيرة */
function Verdict({ v }) {
  if (v === null) return null;
  return (
    <div className={'eng-verdict ' + (v ? 'ok' : 'no')}>
      {v ? '✔ أحسنت! إجابة صحيحة' : '✘ قريبة — جرّب مرة أخرى'}
    </div>
  );
}

/* ---------- 1) اختيار من متعدد ---------- */
function MCQ() {
  const [sel, setSel] = useState(null);
  const [v, setV] = useState(null);
  const pick = (i) => { setSel(i); const r = i === 1; setV(r); r ? ok() : no(); };
  return (
    <Eng ar="الاختيار من متعدد" en="Multiple Choice" skill="reading">
      <div className="eng-q">ماذا نقرأ في المطعم لنعرف الأطباق؟</div>
      <div className="options" style={{ gridTemplateColumns: '1fr' }}>
        {['الكرسي', 'قائمة الطعام', 'النافذة'].map((o, i) => (
          <button key={o} className={'option' + (sel === i ? (i === 1 ? ' correct' : ' wrong') : '')} onClick={() => pick(i)}>
            <span className="key">{['أ', 'ب', 'ج'][i]}</span>{o}
          </button>
        ))}
      </div>
      <Verdict v={v} />
    </Eng>
  );
}

/* ---------- 2) المطابقة ---------- */
const PAIRS = [['مطعم', 'Restaurant'], ['عصير', 'Juice'], ['نادل', 'Waiter']];
function Matching() {
  const [left, setLeft] = useState(null);
  const [done, setDone] = useState([]);
  const right = ['Juice', 'Waiter', 'Restaurant'];
  const pickR = (en) => {
    if (left === null) return;
    if (PAIRS[left][1] === en) {
      const d = [...done, left];
      setDone(d); setLeft(null);
      d.length === PAIRS.length ? winSound() : ok();
    } else no();
  };
  return (
    <Eng ar="المطابقة" en="Matching Pairs" skill="vocab">
      <div className="eng-q">صِل الكلمة بترجمتها</div>
      <div className="match-grid">
        <div>
          {PAIRS.map((p, i) => (
            <button key={p[0]} className={'option' + (left === i ? ' selected' : '') + (done.includes(i) ? ' correct' : '')}
              disabled={done.includes(i)} onClick={() => { clickSound(); setLeft(i); }}>{p[0]}</button>
          ))}
        </div>
        <div>
          {right.map(en => {
            const m = done.some(i => PAIRS[i][1] === en);
            return <button key={en} className={'option' + (m ? ' correct' : '')} disabled={m} style={{ direction: 'ltr' }} onClick={() => pickR(en)}>{en}</button>;
          })}
        </div>
      </div>
      {done.length === PAIRS.length && <Verdict v={true} />}
    </Eng>
  );
}

/* ---------- 3) اختيار الصور ---------- */
function ImageChoice() {
  const [v, setV] = useState(null);
  const imgs = [lessonVocab[0], lessonVocab[3], lessonVocab[1]];
  return (
    <Eng ar="اختيار الصور" en="Image Choice" skill="listening">
      <div className="eng-q">
        <button className="sound-btn" onClick={() => playClip(lessonVocab[3].audio)}>🔊</button> استمع ثم اختر الصورة الصحيحة
      </div>
      <div className="eng-imgs">
        {imgs.map((m, i) => (
          <button key={m.ar} className={'eng-img' + (v !== null && i === 1 ? ' correct' : '')} onClick={() => { const r = i === 1; setV(r); r ? ok() : no(); }}>
            <img src={m.img} alt={m.en} />
          </button>
        ))}
      </div>
      <Verdict v={v} />
    </Eng>
  );
}

/* ---------- 4) السحب والإفلات (تصنيف) ---------- */
const DD_WORDS = [['تفاح', 'food'], ['عصير', 'drink'], ['خبز', 'food'], ['حليب', 'drink']];
function DragDrop() {
  const [sel, setSel] = useState(null);
  const [placed, setPlaced] = useState({});
  const drop = (cat) => {
    if (sel === null) return;
    const r = DD_WORDS[sel][1] === cat;
    if (r) {
      const p = { ...placed, [sel]: cat };
      setPlaced(p); setSel(null);
      Object.keys(p).length === DD_WORDS.length ? winSound() : ok();
    } else no();
  };
  return (
    <Eng ar="السحب والإفلات" en="Drag & Drop — Categorize" skill="vocab">
      <div className="eng-q">اضغط الكلمة ثم اضغط سلّتها الصحيحة</div>
      <div className="dd-words">
        {DD_WORDS.map((w, i) => !placed[i] && (
          <button key={w[0]} className={'option' + (sel === i ? ' selected' : '')} onClick={() => { clickSound(); setSel(i); }}>{w[0]}</button>
        ))}
      </div>
      <div className="dd-buckets">
        {[['food', '🍽 طعام'], ['drink', '🥤 شراب']].map(([k, t]) => (
          <button key={k} className="dd-bucket" onClick={() => drop(k)}>
            <div className="t">{t}</div>
            <div className="in">{DD_WORDS.map((w, i) => placed[i] === k ? <span key={w[0]} className="chip">{w[0]}</span> : null)}</div>
          </button>
        ))}
      </div>
      {Object.keys(placed).length === DD_WORDS.length && <Verdict v={true} />}
    </Eng>
  );
}

/* ---------- 5) الترتيب ---------- */
const ORDER = ['أريدُ', 'أن', 'أطلبَ', 'عصيراً'];
function Ordering() {
  const [pool, setPool] = useState(['أطلبَ', 'عصيراً', 'أريدُ', 'أن']);
  const [ans, setAns] = useState([]);
  const [v, setV] = useState(null);
  const add = (w) => { clickSound(); setAns([...ans, w]); setPool(pool.filter(x => x !== w)); };
  const reset = () => { setPool(['أطلبَ', 'عصيراً', 'أريدُ', 'أن']); setAns([]); setV(null); };
  const check = () => { const r = ans.join(' ') === ORDER.join(' '); setV(r); r ? winSound() : no(); };
  return (
    <Eng ar="الترتيب" en="Ordering 1→3" skill="grammar">
      <div className="eng-q">رتّب الكلمات لتكوّن جملة صحيحة</div>
      <div className="order-line">{ans.length ? ans.join(' ') : '… اضغط الكلمات بالترتيب'}</div>
      <div className="dd-words">
        {pool.map(w => <button key={w} className="option" onClick={() => add(w)}>{w}</button>)}
      </div>
      <div className="eng-actions">
        <button className="hint-btn" onClick={reset}>↺ إعادة</button>
        <button className="btn btn-primary btn-sm2" disabled={ans.length !== ORDER.length} onClick={check}>تحقق</button>
      </div>
      <Verdict v={v} />
    </Eng>
  );
}

/* ---------- 6) وضع التسميات ---------- */
const LABELS = [
  { ar: 'النادل', x: '30%', y: '22%' },
  { ar: 'قائمة الطعام', x: '55%', y: '55%' },
  { ar: 'المصباح', x: '80%', y: '12%' },
];
function Labeling() {
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState([]);
  const hit = (i) => {
    if (sel === null) return;
    if (sel === i) {
      const d = [...done, i]; setDone(d); setSel(null);
      d.length === LABELS.length ? winSound() : ok();
    } else no();
  };
  return (
    <Eng ar="وضع التسميات" en="Labeling" skill="vocab">
      <div className="eng-q">اضغط الاسم ثم اضغط مكانه في الصورة</div>
      <div className="dd-words">
        {LABELS.map((l, i) => !done.includes(i) && (
          <button key={l.ar} className={'option' + (sel === i ? ' selected' : '')} onClick={() => { clickSound(); setSel(i); }}>{l.ar}</button>
        ))}
      </div>
      <div className="label-scene">
        <img src="/img/scene-dinner.png" alt="" />
        {LABELS.map((l, i) => (
          <button key={l.ar} className={'lab-dot' + (done.includes(i) ? ' done' : '')} style={{ insetInlineStart: l.x, top: l.y }} onClick={() => hit(i)}>
            {done.includes(i) ? l.ar : i + 1}
          </button>
        ))}
      </div>
      {done.length === LABELS.length && <Verdict v={true} />}
    </Eng>
  );
}

/* ---------- 7) ملء الفراغات ---------- */
function FillBlanks() {
  const [t, setT] = useState('');
  const [v, setV] = useState(null);
  const check = () => { const r = ['أطلب', 'اطلب', 'أشرب', 'اشرب'].includes(t.trim().replace('َ', '')); setV(r); r ? ok() : no(); };
  return (
    <Eng ar="ملء الفراغات" en="Fill in the Blanks" skill="writing">
      <div className="eng-q" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        أريدُ أن
        <input className="eng-input" style={{ width: 110, textAlign: 'center' }} value={t} onChange={e => { setT(e.target.value); setV(null); }} placeholder="……" />
        عصيراً من فضلك
      </div>
      <div className="eng-actions"><button className="btn btn-primary btn-sm2" onClick={check}>تحقق</button></div>
      <Verdict v={v} />
    </Eng>
  );
}

/* ---------- 8) الإكمال المنسدل ---------- */
function Dropdown() {
  const [val, setVal] = useState('');
  const [v, setV] = useState(null);
  return (
    <Eng ar="الإكمال المنسدل" en="Dropdown Completion" skill="grammar">
      <div className="eng-q" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        ذهبَ أحمدُ
        <select className="eng-input" value={val} onChange={e => { setVal(e.target.value); const r = e.target.value === 'إلى'; setV(r); r ? ok() : no(); }}>
          <option value="">اختر…</option>
          <option value="في">في</option>
          <option value="إلى">إلى</option>
          <option value="عن">عن</option>
        </select>
        المطعمِ مساءً
      </div>
      <Verdict v={v} />
    </Eng>
  );
}

/* ---------- 9) إجابة نصية قصيرة ---------- */
function ShortAnswer() {
  const [t, setT] = useState('');
  const [v, setV] = useState(null);
  const check = () => { const r = t.includes('قائمة'); setV(r); r ? ok() : no(); };
  return (
    <Eng ar="إجابة نصية قصيرة" en="Short Text Answer" skill="writing">
      <div className="eng-q">ماذا أعطى النادلُ أحمدَ ليقرأ منه الأطباق؟</div>
      <input className="eng-input" style={{ width: '100%' }} value={t} onChange={e => { setT(e.target.value); setV(null); }} placeholder="اكتب إجابتك هنا…" />
      <div className="eng-actions"><button className="btn btn-primary btn-sm2" onClick={check}>تحقق</button></div>
      <Verdict v={v} />
    </Eng>
  );
}

/* ---------- 10) الكتابة الممتدة ---------- */
function ExtendedWriting() {
  const [t, setT] = useState('');
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  const target = 30;
  return (
    <Eng ar="الكتابة الممتدة" en="Extended Writing" skill="writing">
      <div className="eng-q">اكتب فقرة قصيرة عن وجبتك المفضلة (٣٠ كلمة)</div>
      <textarea className="eng-input" rows={4} style={{ width: '100%', resize: 'vertical' }} value={t} onChange={e => setT(e.target.value)} placeholder="وجبتي المفضلة هي…" />
      <div className="eng-meter">
        <div className="bar thin" style={{ flex: 1 }}><i style={{ width: Math.min(100, (words / target) * 100) + '%', background: words >= target ? 'var(--green)' : 'var(--gold)' }} /></div>
        <span className="pct">{words}/{target} كلمة</span>
      </div>
      <div className="eng-note">✍️ يُرسَل لتصحيح المعلم وفق معايير التقييم (Rubric)</div>
    </Eng>
  );
}

/* ---------- 11) تصحيح الأخطاء ---------- */
function ErrorCorrection() {
  const [found, setFound] = useState(false);
  const [v, setV] = useState(null);
  const words = ['أنا', 'يذهبُ', 'إلى', 'المطعمِ', 'كلَّ', 'جمعةٍ'];
  return (
    <Eng ar="تصحيح الأخطاء" en="Error Correction ✗→✓" skill="grammar">
      <div className="eng-q">اضغط الكلمة الخطأ في الجملة</div>
      <div className="hl-line">
        {words.map(w => (
          <button key={w} className={'hl-word' + (found && w === 'يذهبُ' ? ' wrongw' : '')}
            onClick={() => { const r = w === 'يذهبُ'; if (r) { setFound(true); ok(); } else no(); }}>{w}</button>
        ))}
      </div>
      {found && (
        <>
          <div className="eng-q" style={{ marginTop: 12 }}>ممتاز! اختر التصحيح:</div>
          <div className="dd-words">
            {['أذهبُ', 'تذهبون', 'ذهبوا'].map(o => (
              <button key={o} className={'option' + (v !== null && o === 'أذهبُ' ? ' correct' : '')} onClick={() => { const r = o === 'أذهبُ'; setV(r); r ? winSound() : no(); }}>{o}</button>
            ))}
          </div>
        </>
      )}
      <Verdict v={v} />
    </Eng>
  );
}

/* ---------- 12) النقاط التفاعلية ---------- */
const SPOTS = [
  { ar: 'قائمة الطعام', en: 'Menu', x: '52%', y: '50%', audio: '/media/word-menu.wav' },
  { ar: 'نادل', en: 'Waiter', x: '28%', y: '25%', audio: '/media/word-waiter.wav' },
  { ar: 'عصير', en: 'Juice', x: '78%', y: '65%', audio: '/media/word-juice-plain.wav' },
];
function Hotspots() {
  const [open, setOpen] = useState(null);
  return (
    <Eng ar="النقاط التفاعلية" en="Interactive Hotspots" skill="vocab">
      <div className="eng-q">اضغط النقاط المضيئة لتكتشف الكلمات وتسمعها</div>
      <div className="label-scene">
        <img src="/img/scene-menu.png" alt="" />
        {SPOTS.map((s, i) => (
          <button key={s.ar} className="hot-dot" style={{ insetInlineStart: s.x, top: s.y }}
            onClick={() => { setOpen(i); playClip(s.audio); }} aria-label={s.ar} />
        ))}
        {open !== null && (
          <div className="hot-pop" style={{ insetInlineStart: SPOTS[open].x, top: `calc(${SPOTS[open].y} + 30px)` }}>
            <b>{SPOTS[open].ar}</b> · {SPOTS[open].en} 🔊
          </div>
        )}
      </div>
    </Eng>
  );
}

/* ---------- 13) التظليل ---------- */
function Highlight() {
  const words = ['ذهبَ', 'أحمدُ', 'إلى', 'المطعمِ', 'وطلبَ', 'عصيراً'];
  const verbs = ['ذهبَ', 'وطلبَ'];
  const [hl, setHl] = useState([]);
  const [v, setV] = useState(null);
  const toggle = (w) => { clickSound(); setV(null); setHl(h => h.includes(w) ? h.filter(x => x !== w) : [...h, w]); };
  const check = () => { const r = hl.length === verbs.length && verbs.every(x => hl.includes(x)); setV(r); r ? winSound() : no(); };
  return (
    <Eng ar="التظليل" en="Highlighting" skill="grammar">
      <div className="eng-q">ظلّل الأفعال في الجملة</div>
      <div className="hl-line">
        {words.map(w => (
          <button key={w} className={'hl-word' + (hl.includes(w) ? ' hl' : '')} onClick={() => toggle(w)}>{w}</button>
        ))}
      </div>
      <div className="eng-actions"><button className="btn btn-primary btn-sm2" onClick={check}>تحقق</button></div>
      <Verdict v={v} />
    </Eng>
  );
}

/* ---------- 14) وصف الصور ---------- */
function ImageDescription() {
  const [t, setT] = useState('');
  const starters = ['في الصورة أرى…', 'العائلة…', 'النادل…'];
  return (
    <Eng ar="وصف الصور" en="Picture Description" skill="writing">
      <div className="eng-imgs" style={{ gridTemplateColumns: '1fr' }}>
        <div className="eng-img eng-img-full"><img src="/img/scene-restaurant.png" alt="" /></div>
      </div>
      <div className="dd-words" style={{ marginTop: 10 }}>
        {starters.map(s => <button key={s} className="hint-btn" onClick={() => { clickSound(); setT(x => (x ? x + ' ' : '') + s); }}>{s}</button>)}
      </div>
      <textarea className="eng-input" rows={3} style={{ width: '100%', marginTop: 10 }} value={t} onChange={e => setT(e.target.value)} placeholder="صف ما تراه في الصورة…" />
    </Eng>
  );
}

/* ---------- 15) الرسم والكتابة اليدوية ---------- */
/* الهيكل الوسطي لحرف «ع» المنفصل (شكل Ɛ): قوس علوي صغير ثم حوض سفلي كبير، كلاهما مفتوح نحو اليمين */
const TRACE_PATH = 'M340,44 C300,18 226,28 224,76 C223,108 280,116 326,104 C256,110 176,130 188,172 C200,212 306,212 356,184';
const TRACE_ARROWS = [
  { x: 262, y: 22, r: 195 },
  { x: 226, y: 94, r: 88 },
  { x: 298, y: 113, r: -8 },
  { x: 196, y: 152, r: 108 },
  { x: 300, y: 208, r: -14 },
];
const ARABIC_LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];

/* توليد الخط الوسطي لأي حرف تلقائياً: نرسم الحرف بخط المنصة على كانفاس مخفي، ننحّفه لهيكل بعرض بكسل (Zhang-Suen)،
   ثم نرتّب نقاط الهيكل من أقصى اليمين (بداية الكتابة العربية) ونأخذ نقطة كل 9 بكسل للنقاط وسهماً كل 60 بكسل. */
function letterSkeleton(letter, W = 560, H = 220) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = '#000'; c.font = '900 168px Tajawal, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(letter, W / 2, H / 2 - 4);
  const d = c.getImageData(0, 0, W, H).data;
  const img = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) img[i] = d[i * 4 + 3] > 128 ? 1 : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : img[y * W + x];
  let changed = true;
  while (changed) {
    changed = false;
    for (let step = 0; step < 2; step++) {
      const kill = [];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        if (!img[y * W + x]) continue;
        const p2 = at(x, y - 1), p3 = at(x + 1, y - 1), p4 = at(x + 1, y), p5 = at(x + 1, y + 1), p6 = at(x, y + 1), p7 = at(x - 1, y + 1), p8 = at(x - 1, y), p9 = at(x - 1, y - 1);
        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (B < 2 || B > 6) continue;
        const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
        let A = 0; for (let k = 0; k < 8; k++) if (seq[k] === 0 && seq[k + 1] === 1) A++;
        if (A !== 1) continue;
        if (step === 0 ? (p2 * p4 * p6 || p4 * p6 * p8) : (p2 * p4 * p8 || p2 * p6 * p8)) continue;
        kill.push(y * W + x);
      }
      if (kill.length) { changed = true; for (const k of kill) img[k] = 0; }
    }
  }
  const raw = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (img[y * W + x]) raw.push({ x, y });
  if (!raw.length) return { dots: [], arrows: [], start: null, end: null };
  // ملاءمة الهيكل ليملأ اللوح بحجم موحّد لكل الأحرف
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const q of raw) { if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y; }
  const sc = Math.min((W - 220) / Math.max(1, x1 - x0), (H - 44) / Math.max(1, y1 - y0), 3);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const pts = raw.map(q => ({ x: Math.round((q.x - cx) * sc + W / 2), y: Math.round((q.y - cy) * sc + H / 2) }));
  // نحدد جسم الحرف (أكبر مكوّن متصل) حتى تبدأ الكتابة منه لا من النقاط — النقاط تُكتب أخيراً
  const comp = new Int32Array(raw.length).fill(-1);
  const idxOf = new Map(raw.map((q, i) => [q.y * W + q.x, i]));
  let ncomp = 0; const sizes = [];
  for (let i = 0; i < raw.length; i++) {
    if (comp[i] >= 0) continue;
    const stack = [i]; comp[i] = ncomp; let size = 0;
    while (stack.length) {
      const k = stack.pop(); size++;
      const { x, y } = raw[k];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const j = idxOf.get((y + dy) * W + (x + dx));
        if (j !== undefined && comp[j] < 0) { comp[j] = ncomp; stack.push(j); }
      }
    }
    sizes.push(size); ncomp++;
  }
  let body = 0; for (let c = 1; c < ncomp; c++) if (sizes[c] > sizes[body]) body = c;
  const used = new Uint8Array(pts.length);
  let cur = -1;
  for (let i = 0; i < pts.length; i++) if (comp[i] === body && (cur < 0 || pts[i].x - pts[i].y * 0.35 > pts[cur].x - pts[cur].y * 0.35)) cur = i;
  const order = [];
  for (let n = 0; n < pts.length; n++) {
    used[cur] = 1; order.push(pts[cur]);
    let best = -1, bd = Infinity;
    for (let i = 0; i < pts.length; i++) if (!used[i]) { const dx = pts[i].x - pts[cur].x, dy = pts[i].y - pts[cur].y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = i; } }
    if (best < 0) break;
    cur = best;
  }
  const dots = [], arrows = [];
  let acc = 0, accA = 0;
  for (let i = 1; i < order.length; i++) {
    const a = order[i - 1], b = order[i], seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (seg > 12 * sc) { acc = 9; accA = 0; continue; }
    acc += seg; accA += seg;
    if (acc >= 9) { dots.push(b); acc = 0; }
    if (accA >= 60 && i + 6 < order.length) {
      const f = order[i + 6]; const r = Math.atan2(f.y - b.y, f.x - b.x) * 180 / Math.PI;
      if (Math.hypot(f.x - b.x, f.y - b.y) < 14 * sc) { arrows.push({ x: b.x, y: b.y, r }); accA = 0; }
    }
  }
  return { dots, arrows, start: order[0], end: order[order.length - 1] };
}

function Drawing() {
  const ref = useRef(null);
  const drawing = useRef(false);
  const [letter, setLetter] = useState('ع');
  const [sk, setSk] = useState(null);
  useEffect(() => {
    if (letter === 'ع') { setSk(null); return; }
    let alive = true;
    document.fonts.ready.then(() => { if (alive) setSk(letterSkeleton(letter)); });
    return () => { alive = false; };
  }, [letter]);
  const pick = (l) => { clickSound(); setLetter(l); const c = ref.current.getContext('2d'); c.clearRect(0, 0, ref.current.width, ref.current.height); };
  const start = (e) => { drawing.current = true; draw(e); };
  const end = () => { drawing.current = false; const c = ref.current.getContext('2d'); c.beginPath(); };
  const draw = (e) => {
    if (!drawing.current) return;
    const cv = ref.current, rect = cv.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    const x = (p.clientX - rect.left) * (cv.width / rect.width);
    const y = (p.clientY - rect.top) * (cv.height / rect.height);
    const c = cv.getContext('2d');
    c.lineWidth = 7; c.lineCap = 'round'; c.strokeStyle = '#1d6fe0';
    c.lineTo(x, y); c.stroke(); c.beginPath(); c.moveTo(x, y);
  };
  const clear = () => { clickSound(); const c = ref.current.getContext('2d'); c.clearRect(0, 0, ref.current.width, ref.current.height); };
  return (
    <Eng ar="الرسم والكتابة اليدوية" en="Drawing & Handwriting" skill="writing">
      <div className="eng-q">
        <button className="sound-btn" onClick={() => playClip(pronunciationAudio)}>🔊</button> تتبّع حرف «{letter}» بإصبعك أو بالفأرة
      </div>
      <div className="draw-wrap">
        <svg className="draw-ghost" viewBox="0 0 560 220" direction="ltr" aria-hidden="true">
          <defs>
            <pattern id="dots-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="var(--line2)" />
            </pattern>
            <marker id="trace-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M1,1 L8,5 L1,9 Z" fill="var(--brand)" />
            </marker>
          </defs>
          <rect width="560" height="220" fill="url(#dots-grid)" />
          <line x1="40" x2="520" y1="150" y2="150" stroke="var(--line2)" strokeWidth="1.5" strokeDasharray="6 6" />
          {letter === 'ع' ? <>
            <path d={TRACE_PATH} fill="none" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.5 9" opacity="0.85" />
            {TRACE_ARROWS.map((t, i) => (
              <path key={i} d="M-7,-5 L5,0 L-7,5 Z" transform={`translate(${t.x} ${t.y}) rotate(${t.r})`} fill="var(--brand)" />
            ))}
            <circle cx="340" cy="44" r="10" fill="var(--green)" />
            <text x="340" y="48" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff">1</text>
            <text x="358" y="48" textAnchor="start" fontSize="11.5" fontWeight="800" fill="var(--green-deep)">← ابدأ من هنا</text>
            <circle cx="356" cy="184" r="5" fill="var(--danger)" />
            <text x="368" y="188" textAnchor="start" fontSize="11" fontWeight="800" fill="var(--mute)">النهاية</text>
          </> : sk ? <>
            {sk.dots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.2" fill="var(--brand)" opacity="0.85" />)}
            {sk.arrows.map((t, i) => (
              <path key={i} d="M-7,-5 L5,0 L-7,5 Z" transform={`translate(${t.x} ${t.y}) rotate(${t.r})`} fill="var(--brand)" />
            ))}
            {sk.start ? <>
              <circle cx={sk.start.x} cy={sk.start.y} r="10" fill="var(--green)" />
              <text x={sk.start.x} y={sk.start.y + 4} textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff">1</text>
              <text x={sk.start.x + 16} y={sk.start.y + 4} textAnchor="start" fontSize="11.5" fontWeight="800" fill="var(--green-deep)">← ابدأ من هنا</text>
            </> : null}
            {sk.end ? <circle cx={sk.end.x} cy={sk.end.y} r="5" fill="var(--danger)" /> : null}
          </> : null}
        </svg>
        <canvas ref={ref} width={560} height={220} className="draw-canvas"
          onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={end} />
      </div>
      <div className="letters-strip" role="group" aria-label="اختر حرفاً">
        {ARABIC_LETTERS.map(l => (
          <button key={l} type="button" className={'letter-chip' + (l === letter ? ' active' : '')} onClick={() => pick(l)}>{l}</button>
        ))}
      </div>
      <div className="eng-actions"><button className="hint-btn" onClick={clear}>🧽 امسح وجرّب من جديد</button></div>
    </Eng>
  );
}

/* ---------- 16) الجداول والمنظمات ---------- */
function TableOrganizer() {
  const rows = [['تفاحة', 'food'], ['شاي', 'drink'], ['أرز', 'food']];
  const [vals, setVals] = useState({});
  const [v, setV] = useState(null);
  const check = () => { const r = rows.every((row, i) => vals[i] === row[1]); setV(r); r ? winSound() : no(); };
  return (
    <Eng ar="الجداول والمنظمات" en="Tables & Organizers" skill="vocab">
      <div className="eng-q">أكمل المنظّم: صنّف كل كلمة</div>
      <table className="eng-table">
        <thead><tr><th>الكلمة</th><th>التصنيف</th></tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[0]}>
              <td>{row[0]}</td>
              <td>
                <select className="eng-input" value={vals[i] || ''} onChange={e => { setV(null); setVals({ ...vals, [i]: e.target.value }); }}>
                  <option value="">اختر…</option>
                  <option value="food">🍽 طعام</option>
                  <option value="drink">🥤 شراب</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="eng-actions"><button className="btn btn-primary btn-sm2" onClick={check}>تحقق</button></div>
      <Verdict v={v} />
    </Eng>
  );
}

/* ---------- 17) الاستماع ---------- */
function ListeningEng() {
  const [v, setV] = useState(null);
  return (
    <Eng ar="الاستماع" en="Listening Comprehension" skill="listening">
      <div className="audio-player" style={{ marginTop: 0 }}>
        <button className="audio-play" onClick={() => playClip(dialogueAudio)}>▶</button>
        <div className="audio-track"><div className="bar"><i style={{ width: '25%' }} /></div></div>
        <span className="speed-lab">حوار المطعم</span>
      </div>
      <div className="eng-q">ماذا طلبَ الزبون؟</div>
      <div className="options" style={{ gridTemplateColumns: '1fr' }}>
        {['سمكاً مشوياً', 'أرزاً بالدجاج وعصير برتقال', 'شوربة خضار'].map((o, i) => (
          <button key={o} className={'option' + (v !== null && i === 1 ? ' correct' : '')} onClick={() => { const r = i === 1; setV(r); r ? ok() : no(); }}>
            <span className="key">{['أ', 'ب', 'ج'][i]}</span>{o}
          </button>
        ))}
      </div>
      <Verdict v={v} />
    </Eng>
  );
}

/* ---------- 18) تسجيل التحدث ---------- */
function Recording() {
  const [rec, setRec] = useState(false);
  return (
    <Eng ar="تسجيل التحدث" en="Speech Recording" skill="speaking">
      <div className="eng-q">سجّل نفسك وأنت تطلب وجبتك المفضلة</div>
      <div className="recorder" style={{ marginTop: 6 }}>
        <button className={'rec-btn' + (rec ? ' on' : '')} onClick={() => { clickSound(); setRec(r => !r); }}>{rec ? '⏹' : '🎙'}</button>
        <div className="t">{rec ? 'جارٍ التسجيل… اضغط للإيقاف' : 'اضغط وسجّل صوتك'}</div>
        <div className="timer">{rec ? '● 00:07' : '00:00'} / 01:00</div>
      </div>
      <div className="eng-note">🎧 يُرسَل تسجيلك لمعلمك ليستمع ويقيّم نطقك</div>
    </Eng>
  );
}

/* ---------- 19) القراءة الجهرية ---------- */
function ReadAloud() {
  return (
    <Eng ar="القراءة الجهرية" en="Read Aloud" skill="speaking">
      <div className="eng-q">استمع للنموذج ثم اقرأ الجملة بصوتك</div>
      <div className="passage" style={{ marginTop: 6 }}>{storyPages[0].text}</div>
      <div className="eng-actions" style={{ justifyContent: 'center', gap: 12 }}>
        <button className="btn btn-ghost" onClick={() => playClip(storyPages[0].audio)}>🔊 النموذج</button>
        <button className="btn btn-primary" onClick={clickSound}>🎙 سجّل قراءتك</button>
      </div>
    </Eng>
  );
}

/* ---------- 20) الاستجابة للوسائط ---------- */
function MediaResponse() {
  const [v, setV] = useState(null);
  return (
    <Eng ar="الاستجابة للوسائط" en="Media Response" skill="listening">
      <video src="/media/unit-intro.mp4" poster="/img/scene-restaurant.png" controls playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }} />
      <div className="eng-q">أين تجري أحداث الفيديو؟</div>
      <div className="dd-words">
        {['في المدرسة', 'في المطعم', 'في الحديقة'].map((o, i) => (
          <button key={o} className={'option' + (v !== null && i === 1 ? ' correct' : '')} onClick={() => { const r = i === 1; setV(r); r ? ok() : no(); }}>{o}</button>
        ))}
      </div>
      <Verdict v={v} />
    </Eng>
  );
}

/* ---------- 21) رفع الملفات ---------- */
function FileUpload() {
  const [name, setName] = useState(null);
  return (
    <Eng ar="رفع الملفات" en="File Upload" skill="writing">
      <div className="eng-q">صوّر واجبك الورقي وارفعه لمعلمك</div>
      <label className="dropzone">
        <input type="file" style={{ display: 'none' }} onChange={e => { ok(); setName(e.target.files[0]?.name); }} />
        {name
          ? <><span style={{ fontSize: 26 }}>📄</span><b>{name}</b><span className="eng-note">جاهز للإرسال ✓</span></>
          : <><span style={{ fontSize: 26 }}>📤</span>اضغط لاختيار ملف أو صورة<span className="eng-note">PDF · JPG · PNG</span></>}
      </label>
    </Eng>
  );
}

/* ---------- 22) السنوات المبكرة ---------- */
function EarlyYears() {
  const [v, setV] = useState(null);
  return (
    <Eng ar="السنوات المبكرة" en="Early Years — Big & Simple" skill="listening">
      <div className="eng-q" style={{ fontSize: 18, textAlign: 'center' }}>
        <button className="sound-btn" onClick={() => playClip('/media/word-juice-plain.wav')}>🔊</button> أين العصير؟
      </div>
      <div className="ey-grid">
        {[['🍎', false], ['🧃', true], ['🍞', false]].map(([e, r]) => (
          <button key={e} className={'ey-btn' + (v && r ? ' correct' : '')} onClick={() => { setV(r); r ? winSound() : no(); }}>{e}</button>
        ))}
      </div>
      {v && <Verdict v={true} />}
    </Eng>
  );
}

/* ---------- 23) حاوية التقييم التفاعلي ---------- */
function Container() {
  const [step, setStep] = useState(0);
  const steps = ['🎧 استمع', '🔤 رتّب', '🎙 سجّل'];
  return (
    <Eng ar="حاوية التقييم التفاعلي" en="Interactive Assessment Container" skill="all">
      <div className="eng-q">تجمع عدة محركات في تقييم واحد متسلسل — جرّب التنقل:</div>
      <div className="dd-words" style={{ justifyContent: 'center' }}>
        {steps.map((s, i) => (
          <button key={s} className={'option' + (step === i ? ' selected' : '')} style={{ flex: 1, justifyContent: 'center' }} onClick={() => { clickSound(); setStep(i); }}>{s}</button>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        {step === 0 && (
          <div className="audio-player" style={{ marginTop: 0 }}>
            <button className="audio-play" onClick={() => playClip(dialogueAudio)}>▶</button>
            <div className="audio-track"><div className="bar"><i style={{ width: '25%' }} /></div></div>
            <span className="speed-lab">استمع للحوار أولاً</span>
          </div>
        )}
        {step === 1 && <div className="order-line">أريدُ أن أطلبَ عصيراً — (محرك الترتيب يعمل هنا)</div>}
        {step === 2 && <div className="eng-note" style={{ textAlign: 'center', fontSize: 14 }}>🎙 ثم يسجّل الطالب إجابته — وتُرسَل درجة واحدة مجمّعة للمعلم</div>}
      </div>
    </Eng>
  );
}

/* ============================================================ */

const CATS = [
  { ico: '🃏', ar: 'الاختيارية والمطابقة', en: 'Choice & Matching', list: [MCQ, Matching, ImageChoice] },
  { ico: '🧲', ar: 'السحب والترتيب', en: 'Drag & Order', list: [DragDrop, Ordering, Labeling] },
  { ico: '✏️', ar: 'النصية', en: 'Text-based', list: [FillBlanks, Dropdown, ShortAnswer] },
  { ico: '📝', ar: 'الكتابة والتحويل', en: 'Writing', list: [ExtendedWriting] },
  { ico: '🔁', ar: 'التحويلات النحوية', en: 'Grammar Transforms', list: [ErrorCorrection] },
  { ico: '🎯', ar: 'التفاعلية والبصرية', en: 'Interactive & Visual', list: [Hotspots, Highlight, ImageDescription, Drawing, TableOrganizer] },
  { ico: '🎧', ar: 'الصوتية', en: 'Audio', list: [ListeningEng, Recording, ReadAloud, MediaResponse] },
  { ico: '📦', ar: 'أخرى', en: 'More', list: [FileUpload, EarlyYears, Container] },
];

const FILTERS = [
  { k: 'all', ar: 'الكل' },
  { k: 'reading', ar: 'قراءة' }, { k: 'listening', ar: 'استماع' },
  { k: 'speaking', ar: 'تحدث' }, { k: 'writing', ar: 'كتابة' },
  { k: 'vocab', ar: 'مفردات' }, { k: 'grammar', ar: 'قواعد' },
];

export default function Engines() {
  const [f, setF] = useState('all');
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>معرض محركات الأسئلة</h1>
          <div className="en">Question Engines Gallery — 23 محركاً حياً، جرّبها كلها</div>
        </div>
        <div className="tag">كل نموذج هنا يعمل فعلاً — هذه قدرات منصة مسار في بناء الأنشطة.</div>
      </div>
      <div className="container">
        {/* جسر للوحة المعلم: المحركات هي مادة مولّد الاختبارات */}
        <Link to="/test-builder" className="adaptive-strip" style={{ borderColor: 'var(--purple)', marginTop: 6 }}>
          <span className="tagA" style={{ background: 'var(--purple)' }}>⚡ معاينة من لوحة المعلم</span>
          <div className="why">شاهد كيف يبني المعلم اختباراً من هذه المحركات في ثوانٍ — اختر ناتج التعلم والأسئلة تظهر وحدها. <b style={{ color: 'var(--purple)' }}>جرّب المولّد ←</b></div>
        </Link>
      </div>
      <div className="container">
        <div className="filters" style={{ marginTop: 4 }}>
          {FILTERS.map(x => (
            <button key={x.k} className={'filter-pill' + (f === x.k ? ' active' : '')} onClick={() => { clickSound(); setF(x.k); }}>{x.ar}</button>
          ))}
        </div>
        {CATS.map(cat => (
          <div key={cat.ar}>
            <SecHead ico="/img/puzzle.png" ar={cat.ico + ' ' + cat.ar} en={cat.en} />
            <div className="eng-grid" data-filter={f}>
              {cat.list.map((C, i) => <C key={i} />)}
            </div>
          </div>
        ))}
      </div>
      <FooterStrip
        ar="المعلم يبني أنشطته من هذه المحركات — والطالب يتعلم وهو يستمتع"
        en="Teachers build activities from these engines — students learn while having fun!"
      />
    </div>
  );
}
