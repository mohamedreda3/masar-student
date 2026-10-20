import { useEffect, useRef, useState } from 'react';
import { clickSound } from './sounds.js';

/* خريطة الأسئلة — شريط مدمج (سطر واحد قابل للتمرير، الحالي في المنتصف) يتوسّع لشبكة عند الطلب
   الحالات: الحالي · مُجاب · غير مُجاب · مُعلَّم للمراجعة · cells = [{ answered, flagged }] */
export default function QMap({ cells, current, onJump, onFlag }) {
  const [full, setFull] = useState(false);
  const strip = useRef(null);
  const done = cells.filter(c => c.answered).length;
  const flagged = cells.filter(c => c.flagged).length;
  const cur = cells[current];

  // أبقِ السؤال الحالي في منتصف الشريط
  useEffect(() => {
    const el = strip.current?.querySelector('.cur');
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [current, full]);

  const jump = (k) => { if (k !== current) { clickSound(); onJump(k); } };
  const nextFlag = () => { const k = cells.findIndex((c, i) => c.flagged && i > current); const f = k >= 0 ? k : cells.findIndex(c => c.flagged); if (f >= 0) jump(f); };

  return (
    <div className="qmap">
      <div className="qmap-ring" style={{ '--p': (done / cells.length) * 100 }} title={`${done} من ${cells.length} مُجاب`}>
        <b>{done}</b><small>/{cells.length}</small>
      </div>

      <div ref={strip} className={'qmap-strip' + (full ? ' full' : '')}>
        {cells.map((c, k) => (
          <button key={k} type="button" title={c.flagged ? 'مُعلَّم للمراجعة' : c.answered ? 'تمت الإجابة' : 'لم تُجب بعد'}
            className={'qmap-n' + (k === current ? ' cur' : '') + (c.answered ? ' ok' : '') + (c.flagged ? ' fl' : '')}
            onClick={() => jump(k)}>
            {k + 1}
          </button>
        ))}
      </div>

      <div className="qmap-act">
        {onFlag && cur && (
          <button type="button" className={'qmap-ic' + (cur.flagged ? ' on' : '')} title={cur.flagged ? 'إلغاء التمييز' : 'ميّز للمراجعة'} onClick={() => { clickSound(); onFlag(current); }}>🚩</button>
        )}
        {flagged > 0 && <button type="button" className="qmap-ic txt" title="انتقل للسؤال المُعلَّم التالي" onClick={nextFlag}>{flagged} ↩</button>}
        <button type="button" className="qmap-ic" title={full ? 'تصغير' : 'عرض كل الأسئلة'} onClick={() => { clickSound(); setFull(f => !f); }}>{full ? '▴' : '▦'}</button>
      </div>
    </div>
  );
}
