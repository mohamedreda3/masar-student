import { createContext, useContext, useEffect, useRef, useState } from 'react';

/* داخل GameShell (صفحة اللعب) تعرض الصفحة شاشة الاحتفال، فتختفي شاشة النهاية الداخلية */
export const ShellCtx = createContext(false);
import { winSound } from './sounds.js';

/* أدوات مشتركة لمحركات الألعاب: خلط · تطبيع · مؤقت · شريط اللعبة · شاشة النهاية · منع تكرار الإنهاء */

/* normalizeArabic (للإجابات المكتوبة): بلا تشكيل/تطويل، أ إ آ → ا، ى → ي، ة → ه، بلا ترقيم، مسافات موحّدة */
export const normAr = (s) => String(s ?? '').replace(/[ً-ْٰـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[.,،؛;:!?؟"'«»()]/g, '').replace(/s+/g, ' ').trim().toLowerCase();
export const pickN = (arr, n) => shuffle(arr).slice(0, n);

export const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const norm = (s) => String(s ?? '').replace(/[ً-ْ]/g, '').replace(/[أإآ]/g, 'ا').trim();
export const ZONE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6'];

/* مؤقت تنازلي اختياري + عدّاد الوقت المستغرق */
export function useClock(limit, onTimeout) {
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
export function Clock({ left, total }) {
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
export function Hud({ label, done, total, clock }) {
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

export function DoneBox({ r }) {
  if (useContext(ShellCtx)) return null;   // eslint-disable-line react-hooks/rules-of-hooks
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
export function useFinish(onDone) {
  const [res, setRes] = useState(null);
  const finish = (r) => { if (res) return; setRes(r); winSound(); onDone(r); };
  return [res, finish];
}

