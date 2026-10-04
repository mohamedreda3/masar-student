import { useState } from 'react';
import { Logo } from '../components.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { dingSound, buzzSound, winSound, clickSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* ============================================================
   لعبة البحث عن الكلمات — بمفردات وحدة الاحتياجات والرغبات
   (ودجت العميل: شبكة حروف، الكلمات الموجودة تتلون، وعدّاد أسفلها)
   الطريقة: اضغط أول حرف الكلمة ثم آخر حرفها
   ============================================================ */

const GRID = [
  ['م','ل','ا','ب','س','ن','ي','ر','ه'],
  ['ق','ط','ب','ع','ت','م','ض','ك','ا'],
  ['ز','ش','ط','ع','ا','م','س','ج','ت'],
  ['ع','خ','ل','ن','ص','ي','ف','د','ف'],
  ['د','و','ا','ء','ب','ت','ر','ح','ن'],
  ['س','ذ','غ','ص','ت','م','ل','و','ب'],
  ['و','ض','ث','ك','ت','ب','ا','خ','ي'],
  ['ق','ص','ج','ح','ذ','ل','ز','ء','ت'],
  ['ن','م','ا','ل','د','ه','و','ا','ء'],
];

const WORDS = [
  { w: 'ملابس', color: '#c4b5fd' },
  { w: 'طعام',  color: '#86efac' },
  { w: 'هاتف',  color: '#bfdbfe' },
  { w: 'دواء',  color: '#fda4af' },
  { w: 'سوق',   color: '#fde68a' },
  { w: 'كتب',   color: '#99f6e4' },
  { w: 'ماء',   color: '#f9a8d4' },
  { w: 'مال',   color: '#a5f3fc' },
  { w: 'سفر',   color: '#fdba74' },
  { w: 'هواء',  color: '#bbf7d0' },
];

/* استخراج خط مستقيم بين خليتين (أفقي/عمودي/قطري) */
function lineCells(a, b) {
  const dr = Math.sign(b[0] - a[0]), dc = Math.sign(b[1] - a[1]);
  const len = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) + 1;
  if (dr !== 0 && dc !== 0 && Math.abs(b[0] - a[0]) !== Math.abs(b[1] - a[1])) return null;
  const cells = [];
  for (let i = 0; i < len; i++) cells.push([a[0] + dr * i, a[1] + dc * i]);
  return cells;
}

export default function WordSearch() {
  const nav = useNavigate();
  const [first, setFirst] = useState(null);
  const [found, setFound] = useState({});   // word → cells
  const [flash, setFlash] = useState(null); // خلايا ترفض مؤقتاً
  const foundCount = Object.keys(found).length;
  const done = foundCount === WORDS.length;

  const cellColor = (r, c) => {
    for (const [w, cells] of Object.entries(found))
      if (cells.some(([rr, cc]) => rr === r && cc === c))
        return WORDS.find(x => x.w === w)?.color;
    return null;
  };

  const pick = (r, c) => {
    if (done) return;
    if (!first) { clickSound(); setFirst([r, c]); return; }
    const cells = lineCells(first, [r, c]);
    setFirst(null);
    if (!cells) { buzzSound(); return; }
    const letters = cells.map(([rr, cc]) => GRID[rr][cc]).join('');
    const rev = [...letters].reverse().join('');
    const hit = WORDS.find(x => !(x.w in found) && (x.w === letters || x.w === rev));
    if (hit) {
      const nf = { ...found, [hit.w]: cells };
      setFound(nf);
      if (Object.keys(nf).length === WORDS.length) { winSound(); showToast('وجدت كل الكلمات! أنت بطل المفردات', '🏆'); }
      else dingSound();
    } else {
      buzzSound();
      setFlash(cells); setTimeout(() => setFlash(null), 500);
    }
  };

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <div className="focus-bar">
        <div className="container in">
          <Logo h={50} />
          <div className="title">
            <div className="t">لعبة البحث عن الكلمات · مفردات الحاجات والرغبات</div>
            <div className="e">Word Search · Needs &amp; Wants Vocabulary</div>
          </div>
          <Link to="/challenges" className="focus-exit">خروج ⎋</Link>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 760 }}>
        <div className="quiz-progress" style={{ marginTop: 26 }}>
          <span className="lab">اضغط أول حرف الكلمة ثم آخر حرفها</span>
          <div className="bar"><i style={{ width: (foundCount / WORDS.length) * 100 + '%', background: 'var(--green)' }} /></div>
          <span className="pts">وجدت {foundCount} من {WORDS.length}</span>
        </div>

        <div className="card activity-card" style={{ marginTop: 18 }}>
          <div className="ws-grid" style={{ gridTemplateColumns: `repeat(${GRID[0].length}, 1fr)` }}>
            {GRID.map((row, r) => row.map((ch, c) => {
              const col = cellColor(r, c);
              const isFirst = first && first[0] === r && first[1] === c;
              const isFlash = flash?.some(([rr, cc]) => rr === r && cc === c);
              return (
                <button key={r + '-' + c} className={'ws-cell' + (isFirst ? ' first' : '') + (isFlash ? ' flash' : '')}
                  style={col ? { background: col, borderColor: col } : undefined}
                  onClick={() => pick(r, c)}>
                  {ch}
                </button>
              );
            }))}
          </div>

          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 14.5 }}>الكلمات التي تم العثور عليها ({foundCount} / {WORDS.length})</div>
            <div className="ws-words">
              {WORDS.map(x => (
                <span key={x.w} className="chip" style={{
                  background: x.w in found ? x.color : 'var(--line2)',
                  color: x.w in found ? 'var(--ink)' : 'var(--mute)',
                  textDecoration: x.w in found ? 'none' : undefined,
                  fontWeight: 800,
                }}>
                  {x.w in found ? '✓ ' : ''}{x.w}
                </span>
              ))}
            </div>
          </div>

          <div className={'explain-box ' + (done ? 'ok' : '')} style={{ marginTop: 16, background: done ? undefined : 'var(--lav-soft)' }}>
            <img src="/img/owl.png" alt="" />
            <div>
              {done
                ? <><span className="h">🏆 مذهل! وجدت الكلمات العشر كلها</span>مفردات الوحدة صارت في جيبك — اعرض نتيجتك!</>
                : <><span className="h">🌟 أحسنت! واصل البحث عن باقي الكلمات</span>تلميح: الكلمات أفقية وعمودية وقطرية — وبالاتجاهين.</>}
            </div>
          </div>

          <div className="activity-nav">
            <div className="spacer" />
            {done
              ? <button className="btn btn-primary" onClick={() => nav('/result')}>عرض النتيجة ←</button>
              : <span style={{ fontSize: 12.5, color: 'var(--mute)', fontWeight: 700 }}>{first ? 'الآن اضغط آخر حرف الكلمة' : 'ابدأ بأول حرف'}</span>}
          </div>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
