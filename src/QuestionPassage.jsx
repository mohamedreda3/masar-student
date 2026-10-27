import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clickSound } from './sounds.js';
import { Picture, SoundButton } from './media.jsx';

/* ============================================================
   النص القرائي: التعليمات ← النص (وصورته / صوته) ← أسئلته
   البيانات داخل كل سؤال: passage + passage_position { index, count, is_first, is_last }
   والباك اند يرسل أسئلة النص متتالية. أول سؤال يعرض النص كاملاً،
   وبقية أسئلته تعرض معاينة صغيرة وزر «📖 اقرأ النص» يفتحه في ورقة سفلية دون فقدان الإجابة.
   ============================================================ */

/* بطاقة النص كاملة */
function PassageCard({ p, pos }) {
  return (
    <div className="qp-card">
      {p.instructions && (
        <div className="qp-instr"><span aria-hidden="true">📖</span>{p.instructions}{p.instructions_en && <small>{p.instructions_en}</small>}</div>
      )}
      {p.title && <div className="qp-title">{p.title}</div>}
      <Picture src={p.image} alt={p.title || 'صورة النص'} className="qp-pic" />
      {p.audio && (
        <div className="qp-listen">
          <SoundButton src={p.audio} size="md" label={p.title || 'النص'} />
          <span>اسمع النص</span>
        </div>
      )}
      {p.text && <div className="qp-text">{p.text}</div>}
      {p.text_en && <div className="qp-text-en" dir="ltr">{p.text_en}</div>}
      {pos?.count > 0 && <div className="qp-meta">{pos.count === 1 ? 'سؤال واحد' : pos.count === 2 ? 'سؤالان' : `${pos.count} أسئلة`} على هذا النص</div>}
    </div>
  );
}

/* الورقة السفلية لإعادة قراءة النص (لوحة جانبية على الشاشات الكبيرة) */
function PassageSheet({ p, pos, timed, onClose }) {
  const box = useRef(null);
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    box.current?.focus();
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [onClose]);
  return createPortal(
    <div className="qg-bg" onClick={onClose} role="dialog" aria-modal="true" aria-label="النص">
      <div className="qg-sheet qp-sheet" ref={box} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <span className="qg-grip" aria-hidden="true" />
        <div className="qg-head">
          <div><h3>📖 النص</h3></div>
          {timed && <span className="qg-timed">⏱ الوقت مستمر</span>}
          <button type="button" className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <div className="qg-body"><PassageCard p={p} pos={pos} /></div>
      </div>
    </div>,
    document.body,
  );
}

export default function QuestionPassage({ q, timed = false }) {
  const [open, setOpen] = useState(false);
  const p = q?.passage;
  if (!p) return null;
  const pos = q.passage_position || null;
  const label = pos ? `سؤال ${pos.index} من ${pos.count} على النص` : null;

  // أول سؤال على النص: النص كاملاً
  if (!pos || pos.is_first) {
    return (
      <div className="qp-wrap">
        <PassageCard p={p} pos={pos} />
        {label && <div className="qp-step">{label}</div>}
      </div>
    );
  }

  // بقية أسئلة النص: معاينة سطرين + زر يعيد فتح النص
  const preview = p.text || p.title || p.instructions || '';
  return (
    <div className="qp-wrap">
      <button type="button" className="qp-compact" onClick={() => { clickSound(); setOpen(true); }} aria-label="اقرأ النص">
        <span className="qp-compact-h"><span aria-hidden="true">📖</span>اقرأ النص{p.title ? ` · ${p.title}` : ''}</span>
        {preview && <span className="qp-preview">{preview}</span>}
      </button>
      {label && <div className="qp-step">{label}</div>}
      {open && <PassageSheet p={p} pos={pos} timed={timed} onClose={() => setOpen(false)} />}
    </div>
  );
}
