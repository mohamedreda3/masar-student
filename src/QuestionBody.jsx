import { playClip, clickSound } from './sounds.js';

/* جسم السؤال المشترك (النشاط + الاختبار الختامي) — نفس كلاسات تصميم الكويز
   الأنواع: mcq · tf · arrange · match · fill_in_blank · short_answer · article (+ أي نص)
   الإجابة المرسلة: mcq=option id · tf="true"/"false" · arrange=[ids] · match=[{left_id,right_id}] · نص */

/* الصور المولّدة (بطاقة SVG فيها نص السؤال) تكرار للنص — نعرض الصور الحقيقية فقط */
export const realImg = (src) => (src && !src.startsWith('data:image/svg') ? src : null);

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
  return v !== undefined && v !== null && String(v).trim() !== '';
}

const KEYS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

export default function QuestionBody({ q, value, onChange, readOnly = false, showImage = true }) {
  const set = (v) => { if (readOnly) return; clickSound(); onChange(v); };
  return (
    <>
      {showImage && realImg(q.image) && <div className="q-img"><img loading="lazy" decoding="async" src={q.image} alt="" /></div>}
      {q.audio && (
        <div className="audio-player">
          <button className="audio-play" onClick={() => playClip(q.audio)}>▶</button>
          <div className="audio-track"><div className="bar"><i style={{ width: '25%' }} /></div></div>
          <span className="speed-lab">استمع جيداً قبل الإجابة</span>
        </div>
      )}
      <div className="q-title">{q.text}</div>
      {q.text_en && <div className="q-en">{q.text_en}</div>}

      {q.type === 'mcq' && (
        <div className="options">
          {(q.options || []).map((o, oi) => (
            <button key={o.id} className={'option' + (value === o.id ? ' selected' : '')} disabled={readOnly} onClick={() => set(o.id)}>
              <span className="key">{KEYS[oi]}</span>
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
      {q.type === 'arrange' && (() => {
        const items = arrangeItems(q);
        const order = Array.isArray(value) ? value : [];
        return (
          <>
            <div className="order-line" style={{ marginTop: 14 }}>
              {order.length ? order.map(id => items.find(x => x.id === id)?.text).join(' ') : '… اضغط العناصر بالترتيب الصحيح'}
            </div>
            {!readOnly && (
              <div className="dd-words">
                {items.filter(x => !order.includes(x.id)).map(x => (
                  <button key={x.id} className="option" onClick={() => set([...order, x.id])}>{x.text}</button>
                ))}
                {order.length > 0 && <button className="hint-btn" onClick={() => set(undefined)}>↺ إعادة</button>}
              </div>
            )}
          </>
        );
      })()}

      {/* توصيل: لكل عنصر اختر ما يقابله → answer = [{ left_id, right_id }] */}
      {q.type === 'match' && (() => {
        const { rights, lefts } = matchSides(q);
        const pairs = Array.isArray(value) ? value : [];
        const leftOf = (rid) => pairs.find(p => p.right_id === rid)?.left_id ?? '';
        const pick = (rid, lid) => onChange([...pairs.filter(p => p.right_id !== rid), ...(lid !== null ? [{ left_id: lid, right_id: rid }] : [])]);
        return (
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {rights.map(r => (
              <div key={r.id} className="option" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'default' }}>
                <span style={{ flex: 1, fontWeight: 800 }}>{r.text}</span>
                <select className="eng-input" value={leftOf(r.id)} disabled={readOnly} style={{ minWidth: 180 }}
                  onChange={e => pick(r.id, e.target.value === '' ? null : (isNaN(e.target.value) ? e.target.value : Number(e.target.value)))}>
                  <option value="">اختر…</option>
                  {lefts.map(l => <option key={l.id} value={l.id}>{l.text}</option>)}
                </select>
              </div>
            ))}
          </div>
        );
      })()}

      {/* نصي: fill_in_blank / short_answer / article (المقالي يصحّحه المعلم) */}
      {!['mcq', 'tf', 'arrange', 'match'].includes(q.type) && (
        <textarea
          className="eng-input" dir="rtl" rows={q.type === 'article' || q.type === 'essay' ? 6 : 2}
          readOnly={readOnly}
          style={{ width: '100%', marginTop: 14, fontSize: 17, textAlign: q.type === 'article' || q.type === 'essay' ? 'start' : 'center', lineHeight: 1.9 }}
          value={value ?? ''} onChange={e => onChange(e.target.value)}
          placeholder={q.type === 'article' || q.type === 'essay' ? 'اكتب فقرتك هنا… (يقيّمها معلمك)' : 'اكتب إجابتك هنا…'}
        />
      )}
    </>
  );
}
