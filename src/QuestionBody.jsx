import { useLayoutEffect, useRef, useState } from 'react';
import { playClip, clickSound } from './sounds.js';
import { NEW_TYPES, OWN_IMAGE, OWN_TITLE, OWN_AUDIO, missingData, MissingData } from './QTypes.jsx';

/* جسم السؤال المشترك (النشاط + الاختبار الختامي) — نفس كلاسات تصميم الكويز
   الأنواع: mcq · tf · arrange · match · fill_in_blank · short_answer · article (+ أي نص)
   الإجابة المرسلة: mcq=option id · tf="true"/"false" · arrange=[ids] · match=[{left_id,right_id}] · نص */

/* الصور المولّدة (بطاقة SVG فيها نص السؤال) تكرار للنص — نعرض الصور الحقيقية فقط */
export const realImg = (src) => (typeof src === 'string' && src.trim() ? src : null);   // الصورة كما ترجع — null فقط عند غيابها

const asItem = (x, i) => (typeof x === 'string' ? { id: i, text: x } : { id: x.id ?? i, text: x.text ?? x.label ?? x.value, image: x.image });
export const arrangeItems = (q) => (q.items || q.options || q.words || []).map(asItem);
export const matchSides = (q) => {
  const side = (s) => (q.options || []).filter(o => o.side === s).map(asItem);
  const rights = (q.right_items || q.rights || (q.pairs || []).map(p => p.right) || []).map(asItem);
  const lefts = (q.left_items || q.lefts || (q.pairs || []).map(p => p.left) || []).map(asItem);
  return { rights: rights.length ? rights : side('right'), lefts: lefts.length ? lefts : side('left') };
};

/* هل أجاب الطالب على السؤال كاملاً؟ */
export function isAnswered(q, v) {
  if (q.type === 'arrange') return Array.isArray(v) && v.length === arrangeItems(q).length;
  if (q.type === 'match') return Array.isArray(v) && v.length === matchSides(q).rights.length;
  if (NEW_TYPES[q.type] && missingData(q)) return true;   // سؤال ناقص البيانات لا يوقف الطالب
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return String(v).trim() !== '';
}

const KEYS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

export default function QuestionBody({ q, value, onChange, readOnly = false, showImage = true, model }) {
  const set = (v) => { if (readOnly) return; clickSound(); onChange(v); };
  const NT = NEW_TYPES[q.type];
  const titled = (!OWN_TITLE.includes(q.type) || missingData(q)) && !!q.text;
  const en = q.text_en && !(q.type === 'highlight' && !missingData(q));
  return (
    <div className="duo-q">
      {NT && (q.type_label || q.auto_graded === false) && (
        <div className="qt-head">
          {q.type_label && <span className="chip qt-type">{q.type_label}</span>}
          {q.auto_graded === false && <span className="chip qt-teacher">👩‍🏫 يصحّحها المعلم</span>}
        </div>
      )}
      {showImage && !OWN_IMAGE.includes(q.type) && q.image && <div className="q-img"><img loading="lazy" decoding="async" src={q.image} alt="" /></div>}
      {q.audio && !OWN_AUDIO.includes(q.type) && !titled && (
        <div className="audio-player">
          <button className="audio-play" onClick={() => playClip(q.audio)}>▶</button>
          <div className="audio-track"><div className="bar"><i style={{ width: '25%' }} /></div></div>
          <span className="speed-lab">استمع جيداً قبل الإجابة</span>
        </div>
      )}
      {/* على طريقة Duolingo: البومة وفقاعة السؤال (+ زر الصوت داخل الفقاعة) */}
      {titled ? (
        <div className="duo-ask">
          <img src="/img/owl.png" alt="" className="duo-owl" />
          <div className="duo-bubble">
            {q.audio && !OWN_AUDIO.includes(q.type) && <button type="button" className="duo-spk" title="استمع" onClick={() => playClip(q.audio)}>🔊</button>}
            <div>
              <div className="q-title">{q.text}</div>
              {en && <div className="q-en">{q.text_en}</div>}
            </div>
          </div>
        </div>
      ) : en && <div className="q-en">{q.text_en}</div>}

      {q.type === 'mcq' && (
        <div className="options">
          {(q.options || []).map((o, oi) => (
            <button key={o.id} className={'option' + (value === o.id ? ' selected' : '')} disabled={readOnly} onClick={() => set(o.id)}>
              <span className="key">{KEYS[oi]}</span>
              {o.image && <img src={o.image} alt="" className="qt-opt-img" />}
              {o.text}
            </button>
          ))}
        </div>
      )}

      {q.type === 'tf' && (
        <div className="options">
          {(q.options || []).map((o, oi) => (
            <button key={o.value} className={'option' + (value === o.value ? ' selected' : '')} disabled={readOnly} onClick={() => set(o.value)}>
              <span className="key">{KEYS[oi]}</span>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* ترتيب: اضغط العناصر بالترتيب → answer = [ids] */}
      {q.type === 'arrange' && <ArrangeBoard items={arrangeItems(q)} value={value} onChange={onChange} readOnly={readOnly} />}

      {/* توصيل: لكل عنصر اختر ما يقابله → answer = [{ left_id, right_id }] */}
      {q.type === 'match' && <MatchBoard q={q} value={value} onChange={onChange} readOnly={readOnly} />}

      {/* نصي: fill_in_blank / short_answer / article (المقالي يصحّحه المعلم) */}
      {NT && <div className="qt-body">{missingData(q) ? <MissingData /> : <NT q={q} value={value} onChange={onChange} readOnly={readOnly} model={model} />}</div>}

      {!NT && !['mcq', 'tf', 'arrange', 'match'].includes(q.type) && (
        <textarea
          className="eng-input" dir="rtl" rows={q.type === 'article' || q.type === 'essay' ? 6 : 2}
          readOnly={readOnly}
          style={{ width: '100%', marginTop: 14, fontSize: 17, textAlign: q.type === 'article' || q.type === 'essay' ? 'start' : 'center', lineHeight: 1.9 }}
          value={value ?? ''} onChange={e => onChange(e.target.value)}
          placeholder={q.type === 'article' || q.type === 'essay' ? 'اكتب فقرتك هنا… (يقيّمها معلمك)' : 'اكتب إجابتك هنا…'}
        />
      )}
    </div>
  );
}

/* توصيل تفاعلي: اضغط عنصراً من اليمين ثم ما يقابله من اليسار (أو العكس) → خط ملوّن بينهما
   الضغط على عنصر موصول يفكّ توصيله · answer = [{ left_id, right_id }] */
const PAIR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#6366f1'];
function MatchBoard({ q, value, onChange, readOnly }) {
  const { rights, lefts } = matchSides(q);
  const pairs = Array.isArray(value) ? value : [];
  const [sel, setSel] = useState(null); // { side, id }
  const box = useRef(null);
  const refs = useRef({});
  const [lines, setLines] = useState([]);
  const pairIdx = (side, id) => pairs.findIndex(p => (side === 'r' ? p.right_id : p.left_id) === id);
  const colorOf = (side, id) => { const i = pairIdx(side, id); return i < 0 ? null : PAIR_COLORS[rights.findIndex(r => r.id === pairs[i].right_id) % PAIR_COLORS.length]; };

  const connect = (rid, lid) => { onChange([...pairs.filter(p => p.right_id !== rid && p.left_id !== lid), { left_id: lid, right_id: rid }]); setSel(null); };
  // سحب خط بالإصبع/الماوس من عنصر إلى ما يقابله (والضغط العادي يعمل كما هو)
  const [drag, setDrag] = useState(null);
  const startDrag = (e, side, id) => {
    if (readOnly) return;
    e.preventDefault();
    const B = box.current.getBoundingClientRect(), R = e.currentTarget.getBoundingClientRect();
    const x1 = (side === 'r' ? R.left : R.right) - B.left, y1 = R.top + R.height / 2 - B.top;
    setDrag({ side, id, x1, y1, x: x1, y: y1, c: PAIR_COLORS[(side === 'r' ? rights.findIndex(r => r.id === id) : pairs.length) % PAIR_COLORS.length] });
    const move = (ev) => { const b = box.current.getBoundingClientRect(); setDrag(d => d && { ...d, x: ev.clientX - b.left, y: ev.clientY - b.top }); };
    const up = (ev) => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      setDrag(null);
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-mk]');
      if (!el) return;
      const [s2, k] = [el.dataset.mk[0], el.dataset.mk.slice(1)];
      const id2 = (s2 === 'r' ? rights : lefts).find(x => String(x.id) === k)?.id;
      if (s2 === side && String(id2) === String(id)) tap(side, id);           // ضغطة عادية
      else if (s2 !== side) { clickSound(); side === 'r' ? connect(id, id2) : connect(id2, id); }
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  const tap = (side, id) => {
    if (readOnly) return;
    clickSound();
    if (pairIdx(side, id) >= 0) { onChange(pairs.filter(p => (side === 'r' ? p.right_id : p.left_id) !== id)); setSel(null); return; }
    if (!sel || sel.side === side) { setSel(sel?.id === id && sel.side === side ? null : { side, id }); return; }
    const rid = side === 'r' ? id : sel.id, lid = side === 'l' ? id : sel.id;
    onChange([...pairs.filter(p => p.right_id !== rid && p.left_id !== lid), { left_id: lid, right_id: rid }]);
    setSel(null);
  };

  // رسم الخطوط بين العناصر الموصولة (يُعاد عند تغيّر المقاس)
  useLayoutEffect(() => {
    const draw = () => {
      const B = box.current?.getBoundingClientRect(); if (!B) return;
      setLines(pairs.map(p => {
        const r = refs.current['r' + p.right_id]?.getBoundingClientRect(), l = refs.current['l' + p.left_id]?.getBoundingClientRect();
        if (!r || !l) return null;
        return { x1: r.left - B.left, y1: r.top + r.height / 2 - B.top, x2: l.right - B.left, y2: l.top + l.height / 2 - B.top, c: colorOf('r', p.right_id), k: p.right_id + '-' + p.left_id };
      }).filter(Boolean));
    };
    draw();
    const ro = new ResizeObserver(draw); if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [JSON.stringify(pairs)]); // eslint-disable-line react-hooks/exhaustive-deps

  const Item = ({ side, it }) => {
    const c = colorOf(side, it.id);
    const on = sel?.side === side && sel.id === it.id;
    return (
      <button key={side + it.id} type="button" className={'mb-item' + (c ? ' linked' : '') + (on ? ' picked' : '')} ref={el => { refs.current[side + it.id] = el; }} data-mk={side + it.id} onPointerDown={e => startDrag(e, side, it.id)} disabled={readOnly}
        style={{ width: '100%', minHeight: 54, padding: '10px 14px', borderRadius: 14, fontFamily: 'inherit', fontWeight: 800, fontSize: 'clamp(13px, 3.4vw, 16px)', cursor: readOnly ? 'default' : 'grab', touchAction: 'none', userSelect: 'none', textAlign: 'center', wordBreak: 'break-word', transition: 'all .15s',
          border: '2px solid ' + (c || (on ? 'var(--brand)' : 'var(--line)')), background: c ? c + '18' : on ? 'var(--sky-soft, #e8f1ff)' : 'var(--card, #fff)', color: c || 'inherit', transform: on ? 'scale(1.03)' : 'none', boxShadow: on ? '0 4px 14px rgba(59,130,246,.25)' : 'none' }}>
        {it.image && <img src={it.image} alt="" style={{ display: 'block', maxWidth: '100%', maxHeight: 70, margin: '0 auto 6px', borderRadius: 8 }} />}
        <span dir="auto">{it.text}</span>
      </button>
    );
  };

  return (
    <div style={{ marginTop: 14 }}>
      {!readOnly && <div style={{ fontSize: 12.5, color: 'var(--mute)', marginBottom: 10 }}>👆 اسحب خطاً من الكلمة إلى ما يقابلها (أو اضغط الاثنين) · اضغط عنصراً موصولاً لفكّه ({pairs.length}/{rights.length})</div>}
      <div ref={box} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr minmax(28px, 18%) 1fr', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 10 }}>{rights.map(r => Item({ side: 'r', it: r }))}</div>
        <div />
        <div style={{ display: 'grid', gap: 10 }}>{lefts.map(l => Item({ side: 'l', it: l }))}</div>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
          {lines.map((L, i) => (
            <g key={L.k}>
              <path className="mb-line" pathLength="1" d={`M${L.x1},${L.y1} C${(L.x1 + L.x2) / 2},${L.y1} ${(L.x1 + L.x2) / 2},${L.y2} ${L.x2},${L.y2}`} stroke={L.c} strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle className="mb-dot" cx={L.x1} cy={L.y1} r="5" fill={L.c} /><circle className="mb-dot" cx={L.x2} cy={L.y2} r="5" fill={L.c} />
            </g>
          ))}
          {drag && <g><line x1={drag.x1} y1={drag.y1} x2={drag.x} y2={drag.y} stroke={drag.c} strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" /><circle cx={drag.x1} cy={drag.y1} r="5" fill={drag.c} /><circle cx={drag.x} cy={drag.y} r="7" fill={drag.c} opacity=".5" /></g>}
        </svg>
      </div>
    </div>
  );
}

/* ترتيب بالسحب والإفلات: اسحب البطاقات إلى سطر الإجابة وأعد ترتيبها بالسحب، أو اضغط للإضافة/الإزالة
   answer = [ids] بالترتيب */
export function ArrangeBoard({ items, value, onChange, readOnly }) {
  const order = Array.isArray(value) ? value : [];
  const byId = (id) => items.find(x => x.id === id);
  const ansRef = useRef(null);
  const [drag, setDrag] = useState(null); // { id, x, y, dx, dy, w, h, over }
  const emit = (o) => { clickSound(); onChange(o.length ? o : undefined); };

  // موضع الإدراج في سطر الإجابة حسب مكان المؤشر (RTL: الأول على اليمين)
  const insertAt = (x, y, id) => {
    const box = ansRef.current; if (!box) return null;
    const B = box.getBoundingClientRect();
    if (x < B.left - 20 || x > B.right + 20 || y < B.top - 30 || y > B.bottom + 30) return null;
    const chips = [...box.querySelectorAll('[data-ar]')].filter(el => el.dataset.ar !== String(id));
    let i = 0;
    for (const el of chips) {
      const r = el.getBoundingClientRect();
      if (y > r.bottom || (y >= r.top && x < r.left + r.width / 2)) i++;
    }
    return i;
  };

  const start = (e, id, from) => {
    if (readOnly) return;
    e.preventDefault();
    const R = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    let moved = false, last = null;
    const d0 = { id, x: sx, y: sy, dx: sx - R.left, dy: sy - R.top, w: R.width, h: R.height, over: null };
    const move = (ev) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
      moved = true;
      last = { ...d0, x: ev.clientX, y: ev.clientY, over: insertAt(ev.clientX, ev.clientY, id) };
      setDrag(last);
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      setDrag(null);
      const rest = order.filter(x => x !== id);
      if (!moved) return emit(from === 'bank' ? [...order, id] : rest);      // ضغطة: إضافة/إزالة
      if (last?.over == null) { if (from === 'ans') emit(rest); return; }     // أُفلت خارج السطر
      emit([...rest.slice(0, last.over), id, ...rest.slice(last.over)]);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  // سطر الإجابة مع فراغ في مكان الإدراج
  const shown = order.filter(id => id !== drag?.id);
  const gap = <span key="gap" className="ar-gap" style={{ width: drag?.w }} />;
  const slots = [];
  shown.forEach((id, i) => {
    if (drag?.over === i) slots.push(gap);
    slots.push(
      <button key={id} type="button" data-ar={id} className="ar-chip in" onPointerDown={e => start(e, id, 'ans')} disabled={readOnly}>
        <span className="n">{i + 1}</span>{byId(id)?.image && <img src={byId(id).image} alt="" className="qt-chip-img" />}{byId(id)?.text}
      </button>
    );
  });
  if (drag && drag.over != null && drag.over >= shown.length) slots.push(gap);
  const bank = items.filter(x => !order.includes(x.id));
  const full = order.length === items.length;

  return (
    <div style={{ marginTop: 14 }}>
      <div ref={ansRef} className={'ar-line' + (drag?.over != null ? ' hot' : '') + (full ? ' full' : '')}>
        {slots.length ? slots : <span className="ar-ph">↓ اسحب البطاقات إلى هنا بالترتيب الصحيح</span>}
      </div>
      {!readOnly && (
        <div className="ar-bank">
          {bank.map(x => (
            <button key={x.id} type="button" className={'ar-chip' + (drag?.id === x.id ? ' ghosted' : '')} onPointerDown={e => start(e, x.id, 'bank')}>{x.image && <img src={x.image} alt="" className="qt-chip-img" />}{x.text}</button>
          ))}
          {order.length > 0 && <button type="button" className="hint-btn" onClick={() => emit([])}>↺ إعادة</button>}
        </div>
      )}
      {drag && (
        <div className="ar-chip floating" style={{ position: 'fixed', left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.w, height: drag.h }}>{byId(drag.id)?.text}</div>
      )}
    </div>
  );
}
