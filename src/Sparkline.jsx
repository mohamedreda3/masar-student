import { useState } from 'react';

/* شارت يومي بأسلوب Google Finance — 21 يوماً: بداية أضعف، هبوط واضح، ثم تعافٍ حتى أعلى نقطة اليوم */
/* كل مهارة قصة أرقام مختلفة، وكلها تنتهي بأعلى قيمة اليوم */
export const SPARKS = {
  reading:   [50, 52, 51, 55, 54, 57, 56, 53, 58, 60, 62, 61, 64, 63, 66, 60, 58, 65, 68, 70, 69, 72, 71, 70, 73, 72, 74, 73, 74, 75],
  listening: [42, 44, 43, 46, 45, 48, 47, 45, 50, 52, 51, 54, 53, 56, 55, 52, 50, 57, 59, 61, 60, 63, 62, 61, 64, 63, 65, 64, 66, 67],
  speaking:  [40, 39, 38, 40, 37, 36, 38, 37, 35, 36, 34, 37, 39, 42, 44, 47, 49, 52, 54, 55, 57, 58, 59, 57, 58, 60, 59, 60, 59, 60],
  writing:   [55, 58, 62, 65, 67, 70, 68, 66, 63, 60, 57, 55, 58, 62, 66, 69, 72, 70, 74, 76, 75, 78, 77, 76, 78, 79, 77, 79, 78, 80],
};
export const SPARK_VARIANT = { reading: 'wave', listening: 'wave', speaking: 'wave', writing: 'wave' };
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const dateOf = (back) => { const d = new Date(); d.setDate(d.getDate() - back); return d; };
const fmtDay = (d) => `${DAYS_AR[d.getDay()]} ${d.getDate()} ${MONTHS_AR[d.getMonth()]}`;

export function Sparkline({ data, color, id, variant = 'area' }) {
  const [hi, setHi] = useState(null);
  const n = data.length;
  const W = 360, H = 150, PL = 30, PR = 14, PT = 12, PB = 26;
  const min = Math.min(...data) - 2, max = Math.max(...data) + 2;
  const xs = data.map((_, i) => PL + (i * (W - PL - PR)) / (n - 1));           // الأقدم يساراً، اليوم يميناً (اتجاه الشارتات العالمي)
  const ys = data.map(v => H - PB - ((v - min) / (max - min)) * (H - PT - PB));
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const smooth = xs.map((x, i) => i === 0 ? `M${x},${ys[0].toFixed(1)}` : `C${(xs[i - 1] + x) / 2},${ys[i - 1].toFixed(1)} ${(xs[i - 1] + x) / 2},${ys[i].toFixed(1)} ${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const stepD = xs.map((x, i) => i === 0 ? `M${x},${ys[0].toFixed(1)}` : `H${x.toFixed(1)} V${ys[i].toFixed(1)}`).join(' ');
  const idx = hi ?? n - 1;
  const px = xs[idx], py = ys[idx], pv = data[idx];
  const ticks = [max - 2, Math.round((max + min) / 2), min + 2];
  const yOf = v => H - PB - ((v - min) / (max - min)) * (H - PT - PB);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0; for (let i = 1; i < n; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
    setHi(best);
  };
  const tw = 150, th = 26;
  const tx = Math.min(W - PR - tw, Math.max(PL, px - tw + 10));
  const ty = PT;
  return (
    <svg className="skill-spark" viewBox={`0 0 ${W} ${H}`} direction="ltr" aria-hidden="true"
      onMouseMove={onMove} onMouseLeave={() => setHi(null)} onClick={e => e.preventDefault()}>
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.34" />
          <stop offset="1" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {ticks.map(v => (
        <g key={v}>
          <line x1={PL} x2={W - PR} y1={yOf(v)} y2={yOf(v)} stroke="var(--line2)" />
          <text x={PL - 6} y={yOf(v) + 4} fontSize="10" fill="var(--mute)" textAnchor="end">{v}</text>
        </g>
      ))}
      <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="var(--line)" />
      {variant === 'bars' ? data.map((v, i) => {
        const bw = (W - PL - PR) / n * 0.62;
        const up = i === 0 || v >= data[i - 1];
        return <rect key={i} x={xs[i] - bw / 2} y={ys[i]} width={bw} height={H - PB - ys[i]} rx={bw / 2}
          fill={up ? color : 'var(--danger)'} opacity={i === idx ? 1 : 0.55} />;
      }) : null}
      {variant === 'area' || variant === 'wave' ? (
        <path d={`${variant === 'wave' ? smooth : d} L${xs[n - 1]},${H - PB} L${xs[0]},${H - PB} Z`} fill={`url(#sg-${id})`} />
      ) : null}
      {variant === 'area' ? <path d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" /> : null}
      {variant === 'wave' ? <path d={smooth} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" /> : null}
      {variant === 'steps' ? <>
        <path d={stepD} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeDasharray="0" />
        {data.map((v, i) => <circle key={i} cx={xs[i]} cy={ys[i]} r={i === idx ? 4.5 : 3} fill={i === 0 || v >= data[i - 1] ? color : 'var(--danger)'} stroke="var(--surface)" strokeWidth="1.5" />)}
      </> : null}
      {[Math.floor(n * 0.3), Math.floor(n * 0.7)].map(i => (
        <text key={i} x={xs[i]} y={H - 8} fontSize="10" fill="var(--mute)" textAnchor="middle">{dateOf(n - 1 - i).getDate()} {MONTHS_AR[dateOf(n - 1 - i).getMonth()]}</text>
      ))}
      {variant !== 'steps' && variant !== 'bars' ? <circle cx={xs[n - 1]} cy={ys[n - 1]} r="4.5" fill={color} stroke="#fff" strokeWidth="2" /> : null}
      {hi === null ? null : <>
      <line x1={px} x2={px} y1={PT} y2={H - PB} stroke="var(--mute2)" strokeDasharray="3 3" />
      <circle cx={px} cy={py} r="5" fill={color} stroke="#fff" strokeWidth="2" />
      <g transform={`translate(${tx}, ${ty})`}>
        <rect x="0" y="0" width={tw} height={th} rx="6" fill="var(--surface)" stroke="var(--line)" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.14))' }} />
        <text x="10" y="17" fontSize="12.5" fontWeight="900" fill="var(--ink)" textAnchor="start">{pv}%</text>
        <text x={tw - 10} y="17" fontSize="10.5" fill="var(--mute)" textAnchor="end">{idx === n - 1 ? 'اليوم · ' : ''}{fmtDay(dateOf(n - 1 - idx))}</text>
      </g>
      </>}
    </svg>
  );
}

/* مهاراتي الأربع — تركيز المنصة، من الرئيسية مباشرة لمركز المهارات
   + توصية تكيفية: أضعف مهارة تُقترح تلقائياً (نفس قاعدة الباك إند القادمة) */
