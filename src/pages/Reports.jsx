import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, Ring, SecHead, FooterStrip, Empty } from '../components.jsx';
import { SKILLS } from '../data.js';
import api from '../api/client.js';
import { useApi, SKILL_KEY } from '../api/useApi.js';
import { realImg } from '../QuestionBody.jsx';
import { clickSound, playClip } from '../sounds.js';

/* تقاريري — GET /reports?tab=overview|skills|achievements|portfolio&skill_id=&accuracy_skill_id=&period=&limit=
   العمود الجانبي (sidebar) يرجع مع كل تبويب، والمحتوى (content) حسب التبويب. لا أرقام ثابتة. */

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayLabel = (iso) => { const d = new Date(iso); return { m: `${d.getDate()} ${MONTHS_AR[d.getMonth()]}`, en: `${MONTHS_EN[d.getMonth()]} ${d.getDate()}` }; };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const ago = (d) => {
  if (!d) return '';
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  if (m < 60) return `منذ ${Math.max(m, 1)} د`;
  if (m < 1440) return `منذ ${Math.round(m / 60)} س`;
  return `منذ ${Math.round(m / 1440)} يوم`;
};
const pctTxt = (v) => (v === null || v === undefined ? '—' : Math.round(v) + '٪');
const changeTxt = (v, unit = '%') => (v === null || v === undefined ? null : `${v >= 0 ? '▲' : '▼'} ${Math.abs(v)}${unit} عن الشهر الماضي`);

/* شكل المهارة في التصميم — اللون من الـAPI أولاً */
const look = (s) => {
  const K = SKILLS[SKILL_KEY[s?.name]] || {};
  return { color: s?.color || K.color || 'var(--brand)', ico: K.ico || '/img/book.png', en: s?.name_en || K.en || '' };
};
const DOT = { success: 'var(--green)', primary: 'var(--brand)', info: 'var(--teal)', warning: 'var(--gold)', danger: 'var(--danger)' };

/* ===== تطوّر التقدّم — بروح Google Finance (series من progress_over_time) ===== */
function LineChart({ pot, onPeriod }) {
  const [hi, setHi] = useState(null);
  const pts = (pot?.series || []).filter(p => p.score !== null && p.score !== undefined);
  const periodName = { '1W': 'الأسبوع', '1M': 'الشهر', '3M': 'الفصل', '1Y': 'السنة' }[pot?.period] || 'الفترة';
  const ranges = (
    <div className="gf-ranges">
      {(pot?.periods || []).map(p => (
        <button key={p.key} className={'gf-range' + (pot.period === p.key ? ' on' : '')} onClick={() => { clickSound(); setHi(null); onPeriod(p.key); }}>
          {p.label}<span>{p.key}</span>
        </button>
      ))}
    </div>
  );
  if (!pts.length) return (
    <div className="chart-wrap gf-chart">
      <div className="gf-head">{ranges}</div>
      <Empty t="لا توجد نتائج في هذه الفترة بعد" e="No results in this period" d="أكمل أنشطة لترى تطوّر تقدّمك هنا." />
    </div>
  );
  const series = pts.length === 1 ? [pts[0], pts[0]] : pts;
  const W = 680, H = 230, P = 34, TOP = 30, BOT = 44;
  const data = [...series].reverse().map(p => ({ v: Math.round(p.score), ...dayLabel(p.date) })); // الأحدث يساراً (RTL)
  const vals = data.map(p => p.v);
  const lo = Math.max(0, Math.min(...vals) - 6), hiV = Math.min(100, Math.max(...vals) + 6) || 1;
  const xs = data.map((_, i) => P + (i * (W - 2 * P)) / (data.length - 1));
  const ys = data.map(p => H - BOT - ((p.v - lo) / (hiV - lo || 1)) * (H - BOT - TOP));
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = `${d} L${xs[xs.length - 1]},${H - BOT} L${xs[0]},${H - BOT} Z`;
  const idx = hi ?? 0;
  const grid = [0.25, 0.5, 0.75].map(f => ({ y: TOP + (H - BOT - TOP) * f, v: Math.round(hiV - (hiV - lo) * f) }));
  const trend = pot.change_points ?? 0;
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0; for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
    setHi(best);
  };
  const step = Math.ceil(data.length / 8);

  return (
    <div className="chart-wrap gf-chart">
      <div className="gf-head">
        {ranges}
        <div className="gf-now">
          <span className="v">{data[idx].v}%</span>
          <span className={'delta ' + (trend >= 0 ? 'up' : 'down')}>{trend >= 0 ? '▲' : '▼'} {Math.abs(trend)} نقطة خلال {periodName}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', cursor: 'crosshair' }} onMouseMove={onMove} onMouseLeave={() => setHi(null)}>
        <defs>
          <linearGradient id="gfFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--green)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--green)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {grid.map((g, gi) => (
          <g key={gi}>
            <line x1={P} x2={W - P} y1={g.y} y2={g.y} stroke="var(--line2)" />
            <text x={W - P + 6} y={g.y + 4} fontSize="10.5" fill="var(--mute)" textAnchor="start">{g.v}</text>
          </g>
        ))}
        <path d={area} fill="url(#gfFill)" />
        <path d={d} fill="none" stroke="var(--green)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={xs[idx]} x2={xs[idx]} y1={TOP - 6} y2={H - BOT} stroke="var(--mute2)" strokeDasharray="4 4" />
        <circle cx={xs[idx]} cy={ys[idx]} r="6" fill="var(--green)" stroke="#fff" strokeWidth="2.5" />
        {(() => {
          const tw = 118, th = 30;
          let tx = xs[idx] - tw / 2; tx = Math.max(P - 20, Math.min(W - P - tw + 20, tx));
          const ty = ys[idx] - th - 14 > TOP ? ys[idx] - th - 14 : ys[idx] + 16;
          return (
            <g>
              <rect x={tx} y={ty} width={tw} height={th} rx="8" fill="var(--surface)" stroke="var(--line)" style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.12))' }} />
              <text x={tx + tw - 10} y={ty + 19} fontSize="13" fontWeight="900" fill="var(--ink)" textAnchor="end">{data[idx].v}%</text>
              <text x={tx + 10} y={ty + 19} fontSize="11" fill="var(--mute)" textAnchor="start" direction="ltr">{data[idx].en}</text>
            </g>
          );
        })()}
        {data.map((p, i) => (i % step === 0) && (
          <text key={i} x={xs[i]} y={H - 10} fontSize="11" fontWeight="700" fill={i === idx ? 'var(--ink)' : 'var(--mute)'} textAnchor="middle">{p.m}</text>
        ))}
      </svg>
      <Link to="/path" className="chart-cta">
        <span className="ic">🎯</span>
        <span className="txt">
          <b>{trend >= 0 ? 'أنت على الطريق الصحيح!' : 'لا بأس — كل يوم فرصة جديدة!'}</b> استمر في التعلم والممارسة لتحقيق أهدافك.
          <span className="e">Keep learning and practicing to reach your goals.</span>
        </span>
        <span className="btn btn-primary" style={{ background: 'var(--purple)', pointerEvents: 'none' }}>عرض خطتي · View My Plan ←</span>
      </Link>
    </div>
  );
}

/* ===== دونات الدقة (sidebar.accuracy) — يجلب بياناته بنفسه لو لم تُمرَّر (يُستخدم في الرئيسية أيضاً) ===== */
export function AccuracyDonut({ acc: given, onSkill }) {
  const [skillId, setSkillId] = useState(null);
  const { data } = useApi(() => (given ? Promise.resolve(null) : api.reports({ tab: 'overview', accuracy_skill_id: skillId })), [skillId, !!given]);
  const A = given || data?.sidebar?.accuracy;
  if (!A) return null;
  const pick = (v) => { const id = v === '' ? null : Number(v); clickSound(); onSkill ? onSkill(id) : setSkillId(id); };
  const ok = A.correct_percentage, has = ok !== null && ok !== undefined;
  const segs = has ? [{ l: 'صحيحة', v: ok, c: 'var(--green)' }, { l: 'خطأ', v: A.wrong_percentage ?? 100 - ok, c: 'var(--danger)' }] : [];
  const size = 128, stroke = 16, r = (size - stroke) / 2, C = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="side-card">
      <div className="badges-head" style={{ alignItems: 'flex-start', gap: 10 }}>
        <div>
          <h3>🎯 {A.skill_name ? `دقتك في ${A.skill_name}` : 'دقتك في الإجابات'}</h3>
          <div className="en">{A.answers_count ? `${A.answers_count} إجابة` : 'Accuracy'}</div>
        </div>
        <select className="skill-select" value={A.skill_id ?? ''} onChange={e => pick(e.target.value)} aria-label="اختر المهارة">
          {(A.skills || []).map(s => <option key={s.id ?? 'all'} value={s.id ?? ''}>{s.name}</option>)}
        </select>
      </div>
      {!has ? <Empty t="لا توجد إجابات بعد" e="No answers yet" /> : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 14 }}>
          <div className="ring" style={{ width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} key={A.skill_id ?? 'all'}>
              {segs.map(seg => {
                const dash = (seg.v / 100) * C;
                const el = <circle key={seg.l} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.c} strokeWidth={stroke}
                  strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-off} style={{ transition: 'stroke-dasharray 0.6s ease' }} />;
                off += dash;
                return el;
              })}
            </svg>
            <div className="val">
              <div style={{ textAlign: 'center', lineHeight: 1.25 }}>
                <div style={{ fontSize: 21, fontWeight: 900 }}>{ok}%</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mute)' }}>{A.level?.label}</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {segs.map(seg => (
              <div key={seg.l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, fontWeight: 700, color: 'var(--ink2)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: seg.c, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{seg.l}</span>
                <span style={{ fontWeight: 900 }}>{seg.v}%</span>
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 4 }}>{A.correct_count} صحيحة · {A.wrong_count} خطأ</div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 10, textAlign: 'start' }}>
        <Link to="/reports" className="link">‹ عرض التقرير التفصيلي</Link>
      </div>
    </div>
  );
}

/* ===== رادار المهارات الفرعية (sub_skills) ===== */
function SubSkillsRadar({ subs, skill }) {
  const axes = subs.filter(s => s.score !== null).slice(0, 8);
  const L = look(skill);
  const head = (
    <div className="badges-head">
      <div>
        <h3>🧭 مهاراتك الفرعية في {skill?.name}</h3>
        <div className="en">Sub-skills by question type</div>
      </div>
    </div>
  );
  if (axes.length < 3) return (
    <div className="card" style={{ marginTop: 26 }}>
      {head}
      {!axes.length ? <Empty t="لا توجد بيانات كافية بعد" e="Not enough data yet" /> : (
        <div style={{ marginTop: 12 }}>
          {axes.map(a => (
            <div className="goal-row" key={a.key}>
              <div className="head"><span>{a.label}</span><span className="pct" style={{ color: L.color }}>{a.score}٪</span></div>
              <div className="en">{a.label_en} · {a.answers_count} إجابة</div>
              <div className="bar thin"><i style={{ width: a.score + '%', background: L.color }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  const size = 300, cx = size / 2, cy = size / 2, R = 92, n = axes.length;
  const pt = (i, f) => { const a = ((2 * Math.PI) / n) * i - Math.PI / 2; return [cx + R * f * Math.cos(a), cy + R * f * Math.sin(a)]; };
  const poly = f => axes.map((_, i) => pt(i, f).map(v => v.toFixed(1)).join(',')).join(' ');
  const data = axes.map((ax, i) => pt(i, Math.max(ax.score, 3) / 100).map(v => v.toFixed(1)).join(',')).join(' ');
  return (
    <div className="card" style={{ marginTop: 26 }}>
      {head}
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 360, margin: '10px auto 0', display: 'block' }}>
        {[0.33, 0.66, 1].map(f => <polygon key={f} points={poly(f)} fill="none" stroke="var(--line)" strokeWidth="1" />)}
        {axes.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" />; })}
        <polygon points={data} fill={L.color} fillOpacity="0.3" stroke={L.color} strokeWidth="2.5" strokeLinejoin="round" />
        {axes.map((ax, i) => {
          const [x, y] = pt(i, 1.3);
          const [dx, dy] = pt(i, Math.max(ax.score, 3) / 100);
          return (
            <g key={ax.key}>
              <circle cx={dx} cy={dy} r="3.5" fill="var(--surface)" stroke={L.color} strokeWidth="2" />
              <text x={x} y={y} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink2)">{ax.label} {ax.score}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ===== تحليلات المهارة المختارة — آخر 4 أسابيع (analytics.weeks) ===== */
function SkillAnalytics({ an, skill }) {
  const L = look(skill);
  const weeks = an?.weeks || [];
  const known = weeks.map((w, i) => ({ ...w, i })).filter(w => w.score !== null);
  const W = 420, H = 150, P = 30;
  const xs = weeks.map((_, i) => W - P - (i * (W - 2 * P)) / Math.max(weeks.length - 1, 1)); // RTL: الأقدم يميناً
  const vals = known.map(w => w.score);
  const lo = Math.max(0, Math.min(...vals, 100) - 10), hiV = Math.min(100, Math.max(...vals, 0) + 10);
  const y = (v) => H - P - ((v - lo) / (hiV - lo || 1)) * (H - 2 * P);
  const d = known.map((w, k) => `${k ? 'L' : 'M'}${xs[w.i]},${y(w.score)}`).join(' ');
  return (
    <div className="card" style={{ marginTop: 26 }}>
      <div className="badges-head">
        <div>
          <h3>📚 تحليلات تقدّمي في {skill?.name}</h3>
          <div className="en">{L.en} progress analytics</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 14, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink2)', marginBottom: 8 }}>متوسط نتائجك</div>
          <Ring pct={an?.score ?? 0} size={110} stroke={12} color={L.color}>{an?.score != null ? an.score + '%' : '—'}</Ring>
          <div style={{ fontSize: 12, fontWeight: 800, color: (an?.change_points ?? 0) >= 0 ? 'var(--green)' : 'var(--danger)', marginTop: 8 }}>
            {an?.change_points != null ? `${an.change_points >= 0 ? '▲ +' : '▼ '}${an.change_points}% عن الأسبوع الماضي` : an?.level?.label}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink2)' }}>التطوّر الأسبوعي</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
            {known.length > 1 && <path d={d} fill="none" stroke={L.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            {weeks.map((w, i) => (
              <g key={w.key}>
                {w.score !== null && <circle cx={xs[i]} cy={y(w.score)} r="5" fill={L.color} />}
                {w.score !== null && <text x={xs[i]} y={y(w.score) - 12} textAnchor="middle" fontSize="12.5" fontWeight="800" fill="var(--ink)">{w.score}%</text>}
                {w.score === null && <text x={xs[i]} y={H / 2} textAnchor="middle" fontSize="12" fill="var(--mute2)">—</text>}
                <text x={xs[i]} y={H - 8} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--mute)">{w.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ===== نقاط القوة والتحسين ===== */
function StrengthsBox({ strengths = [], needs = [], showEn }) {
  const row = (s, ok) => (
    <div className="row" key={s.key}>
      <span className={'mk ' + (ok ? 'ok' : 'no')}>✓</span>
      <span className="ar">{s.label} · {s.score}٪</span>
      {showEn && <span className="en">{s.label_en}</span>}
    </div>
  );
  return (
    <>
      <div className="si-box good">
        <div className="head"><span className="tag">📗 نقاط القوة<span className="e">Strengths</span></span></div>
        <div className="rows">{strengths.length ? strengths.map(s => row(s, true)) : <div className="row"><span className="ar" style={{ color: 'var(--mute)' }}>تظهر بعد إجابات أكثر</span></div>}</div>
        <img className="ill" src="/img/trophy.png" alt="" />
      </div>
      <div className="si-box bad">
        <div className="head"><span className="tag">📕 يحتاج إلى تحسين<span className="e">Needs Improvement</span></span></div>
        <div className="rows">{needs.length ? needs.map(s => row(s, false)) : <div className="row"><span className="ar" style={{ color: 'var(--mute)' }}>لا شيء الآن — أحسنت!</span></div>}</div>
        <img className="ill" src="/img/target2.png" alt="" />
      </div>
    </>
  );
}

/* حلقات المهارات */
function SkillRings({ skills, size = 104, selectedId, onPick }) {
  return (
    <div className="card">
      <div className="rings-row">
        {skills.map(s => {
          const L = look(s);
          return (
            <div className="ring-block" key={s.id} onClick={onPick ? () => { clickSound(); onPick(s.id); } : undefined}
              style={{ cursor: onPick ? 'pointer' : undefined, opacity: selectedId && selectedId !== s.id ? 0.55 : 1 }}>
              <Ring pct={s.score ?? 0} size={size} stroke={10} color={L.color}>{s.score != null ? s.score + '%' : '—'}</Ring>
              <div className="lab"><img src={L.ico} alt="" />{s.name}</div>
              <div className="en">{L.en}</div>
              <div className="verdict">{s.level?.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalRows({ goals, thin }) {
  return goals.map(g => {
    const L = look({ name: SKILL_NAME_BY_ID[g.skill_id], color: g.color });
    return (
      <div className="goal-row" key={g.skill_id}>
        <div className="head">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{!thin && <img src={L.ico} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}{g.title}</span>
          <span className="pct" style={{ color: L.color }}>{g.has_data ? g.progress_percentage + '٪' : '—'}</span>
        </div>
        <div className="en">{g.has_data ? g.title_en : 'لا توجد بيانات بعد'}</div>
        <div className={'bar' + (thin ? ' thin' : '')}><i style={{ width: g.progress_percentage + '%', background: L.color }} /></div>
      </div>
    );
  });
}
let SKILL_NAME_BY_ID = {}; // يُملأ من accuracy.skills لربط الهدف بأيقونة المهارة

/* ===== التبويبات ===== */
function OverviewTab({ c, onPeriod }) {
  const K = c.cards || {};
  const kpis = [
    { ar: 'ساعات التعلم', en: 'This Month', n: K.learning_hours?.value ?? 0, sub: K.learning_hours?.unit, delta: changeTxt(K.learning_hours?.change_percentage), ico: '/img/clipboard.png' },
    { ar: 'المهام المكتملة', en: 'Completed Tasks', n: K.completed_tasks?.value ?? 0, sub: K.completed_tasks?.total != null ? `من أصل ${K.completed_tasks.total}` : '', delta: changeTxt(K.completed_tasks?.change_percentage), ico: '/img/clipboard.png' },
    { ar: 'نسبة التقدم', en: 'Overall Progress', n: pctTxt(K.overall_progress?.value), sub: '', delta: K.overall_progress?.change_points != null ? changeTxt(K.overall_progress.change_points, ' نقطة') : null, ico: '/img/target.png' },
    { ar: 'النقاط المكتسبة', en: 'Points Earned', n: K.points?.value ?? 0, sub: K.points?.unit, delta: changeTxt(K.points?.change_percentage), ico: '/img/points.png' },
  ];
  return (
    <>
      <SecHead ico="/img/target.png" ar="نظرة عامة على تقدمي" en="Overview" />
      <div className="kpi-grid">
        {kpis.map(k => (
          <div className="kpi" key={k.ar}>
            <div className="head">
              <div><h4>{k.ar}</h4><div className="en">{k.en}</div></div>
              <img src={k.ico} alt="" />
            </div>
            <div className="n">{k.n} {k.sub && <small>{k.sub}</small>}</div>
            {k.delta && <div className="delta" style={k.delta.startsWith('▼') ? { color: 'var(--danger)' } : undefined}>{k.delta}</div>}
          </div>
        ))}
      </div>

      <SecHead ico="/img/bulb.png" ar="نواتج التعلم" en="Learning Outcomes" />
      <div className="card">
        {!c.outcomes?.length && <Empty t="لا توجد نواتج تعلم بعد" e="No outcomes yet" />}
        {(c.outcomes || []).map(o => (
          <div key={o.id} className={'outcome-row ' + (o.status === 'achieved' ? 'done' : 'todo')}>
            <span className="chk">{o.status === 'achieved' ? '✓' : '•'}</span>
            <div style={{ flex: 1 }}>
              <div className="t">{o.title}</div>
              {o.mastery_percentage != null && <div className="en">إتقان {o.mastery_percentage}٪</div>}
            </div>
            <span className={'st-chip ' + (o.status === 'achieved' ? 'مكتملة' : 'قادمة')}>{o.status_label}</span>
          </div>
        ))}
      </div>

      <SecHead ico="/img/book.png" ar="تقدّم المهارات" en="Skills Progress" />
      <SkillRings skills={c.skills || []} />

      <div className="result-cols" style={{ marginTop: 26 }}>
        <div className="card">
          <div className="badges-head"><div><h3>تطوّر التقدّم</h3><div className="en">Progress Over Time</div></div></div>
          <div style={{ marginTop: 14 }}><LineChart pot={c.progress_over_time} onPeriod={onPeriod} /></div>
        </div>
        <div className="card">
          <div className="badges-head"><div><h3>نقاط القوة والتحسين</h3><div className="en">Strengths &amp; Improvements</div></div></div>
          <StrengthsBox strengths={c.strengths} needs={c.needs_improvement} />
        </div>
      </div>
    </>
  );
}

function SkillsTab({ c, onSkill }) {
  return (
    <>
      <SecHead ico="/img/book.png" ar="مهاراتي بالتفصيل" en="My Skills — tap a skill" />
      <SkillRings skills={c.skills || []} size={116} selectedId={c.selected_skill?.id} onPick={onSkill} />
      <SecHead ico="/img/target.png" ar="أهدافي حسب المهارة" en="Goals by Skill" />
      <div className="card"><GoalRows goals={c.goals || []} /></div>
      {c.selected_skill && <>
        <SubSkillsRadar subs={c.sub_skills || []} skill={c.selected_skill} />
        <SkillAnalytics an={c.analytics} skill={c.selected_skill} />
        <div className="card" style={{ marginTop: 26 }}>
          <div className="badges-head"><div><h3>نقاط القوة والتحسين في {c.selected_skill.name}</h3><div className="en">Strengths &amp; Improvements</div></div></div>
          <StrengthsBox strengths={c.strengths} needs={c.needs_improvement} showEn />
        </div>
      </>}
    </>
  );
}

const BadgeIcon = ({ b, size = 54, gray }) => (
  b.image
    ? <img loading="lazy" decoding="async" src={b.image} alt="" style={{ width: size, height: size, objectFit: 'contain', display: 'block', margin: '0 auto', filter: gray ? 'grayscale(1)' : undefined, opacity: gray ? 0.55 : 1 }} />
    : <span style={{ fontSize: size * 0.7, width: size, height: size, display: 'grid', placeItems: 'center', margin: '0 auto', filter: gray ? 'grayscale(1)' : undefined, opacity: gray ? 0.55 : 1 }}>{b.icon || '🏅'}</span>
);

function AchievementsTab({ c }) {
  return (
    <>
      <SecHead ico="/img/medal.png" ar={`شارات حقّقتها (${c.earned_badges?.length || 0})`} en="Earned Badges" />
      {!c.earned_badges?.length && <Empty t="لم تحقق شارات بعد — أنت قريب!" e="No badges yet" />}
      <div className="earned-grid">
        {(c.earned_badges || []).map(b => (
          <div className="earned-card" key={b.id ?? b.key}>
            <BadgeIcon b={b} />
            <div className="t">{b.name ?? b.title}</div>
            <div className="e">{b.name_en ?? b.title_en}</div>
            <div className="d">{fmtDate(b.earned_at)}</div>
          </div>
        ))}
      </div>
      {c.in_progress_badges?.length > 0 && <>
        <SecHead ico="/img/star.png" ar="شارات قيد التقدم" en="In Progress" />
        <div className="wip-grid">
          {c.in_progress_badges.map(b => (
            <div className="wip-card" key={b.id ?? b.key}>
              <div className="head">
                <BadgeIcon b={b} size={46} />
                <div><h4>{b.name ?? b.title}</h4><div className="en">{b.description ?? b.rule}</div></div>
              </div>
              <div className="pct">أنجزت {Math.round(b.progress?.percentage ?? b.progress_percentage ?? 0)}٪ من الشرط{b.progress?.target != null ? ` · ${b.progress.current ?? 0}${b.progress.unit || ''} / ${b.progress.target}${b.progress.unit || ''}` : ''}</div>
              <div className="bar thin"><i style={{ width: (b.progress?.percentage ?? b.progress_percentage ?? 0) + '%', background: b.color || undefined }} /></div>
            </div>
          ))}
        </div>
      </>}
      {c.locked_badges?.length > 0 && <>
        <SecHead ico="/img/shield.png" ar="شارات مقفلة" en="Locked" />
        <div className="wip-grid">
          {c.locked_badges.map(b => (
            <div className="wip-card" key={b.id ?? b.key} style={{ opacity: 0.75 }}>
              <div className="head">
                <BadgeIcon b={b} size={46} gray />
                <div><h4>{b.name ?? b.title}</h4><div className="en">🔒 {b.description ?? b.rule}</div></div>
              </div>
            </div>
          ))}
        </div>
      </>}
      <SecHead ico="/img/bulb.png" ar="نواتج تعلم حقّقتها" en="Achieved Outcomes" />
      <div className="card">
        {!c.achieved_outcomes?.length && <Empty t="لم تحقق نواتج تعلم بعد" e="No achieved outcomes yet" d="تُحتسب مع تقدّمك في الدروس والاختبارات." />}
        {(c.achieved_outcomes || []).map(o => (
          <div key={o.id} className="outcome-row done">
            <span className="chk">✓</span>
            <div style={{ flex: 1 }}>
              <div className="t">{o.title}</div>
              {o.mastery_percentage != null && <div className="en">إتقان {o.mastery_percentage}٪</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const CAT_IMG = { writing: '/img/scene-story.png', speaking: '/img/scene-discover.png', homework: '/img/scene-read.png', project: '/img/scene-journey.png' };
function PortfolioTab({ c, full, onFull }) {
  const [cat, setCat] = useState('all');
  const items = (c.items || []).filter(i => cat === 'all' || i.category === cat);
  return (
    <>
      <SecHead ico="/img/folderStar.png" ar={`من ملف أعمالي (${c.total ?? 0})`} en="From My Portfolio"
        link={!full && (c.total ?? 0) > (c.items?.length ?? 0) ? 'افتح الملف كاملاً' : undefined} onLink={onFull} />
      <div className="unit-meta-chips" style={{ marginBottom: 14 }}>
        {(c.categories || []).map(k => (
          <button key={k.key} className="chip" onClick={() => { clickSound(); setCat(k.key); }}
            style={{ cursor: 'pointer', border: 0, ...(cat === k.key ? { background: 'var(--brand)', color: '#fff' } : {}) }}>{k.label} ({k.count})</button>
        ))}
      </div>
      {!items.length && <Empty t="لا توجد أعمال هنا بعد" e="No work yet" d="تظهر هنا واجباتك ومشاريعك وتسجيلاتك وكتاباتك." />}
      <div className="works-grid">
        {items.map(w => (
          <a className="work-card" key={w.id} href={w.open_api ? '#' + workRoute(w.open_api) : undefined}>
            <div className="img">
              <img loading="lazy" decoding="async" src={realImg(w.image) || CAT_IMG[w.category] || '/img/scene-journey.png'} alt="" />
              <span className="type">{w.category_label}</span>
              {w.audio && <span className="audio-chip" onClick={(e) => { e.preventDefault(); e.stopPropagation(); playClip(w.audio); }}>🔊 استمع</span>}
            </div>
            <div className="body">
              <h4>{w.title}</h4>
              {w.description && <div className="e">{w.description}</div>}
              <div className="meta">
                {w.score != null && <span>🎯 {Math.round(w.score * 100) / 100} / {w.total_grade}</span>}
                {w.files?.length > 0 && <span>📎 {w.files.length}</span>}
                <span>{fmtDate(w.date)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
      {!full && (c.total ?? 0) > (c.items?.length ?? 0) && (
        <div style={{ marginTop: 22, textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={onFull}>افتح ملف أعمالي كاملاً ←</button>
        </div>
      )}
    </>
  );
}
/* open_api → شاشة الفرونت */
const workRoute = (u) => {
  let m;
  if ((m = u.match(/\/(assignments|exams)\/(\d+)/))) return '/assignment?id=' + m[2];
  if ((m = u.match(/\/activities\/(\d+)(?:\?lesson_id=(\d+))?/))) return `/quiz/run?lesson=${m[2] ?? ''}&activity=${m[1]}&library=1`;
  return '/reports';
};

export default function Reports() {
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState('1M');
  const [skillId, setSkillId] = useState(null);
  const [accSkill, setAccSkill] = useState(null);
  const [full, setFull] = useState(false);
  const { data: D, error } = useApi(
    () => api.reports({ tab, period, skill_id: skillId, accuracy_skill_id: accSkill, limit: full ? 50 : undefined }),
    [tab, period, skillId, accSkill, full],
  );
  const sb = D?.sidebar;
  if (sb?.accuracy?.skills) SKILL_NAME_BY_ID = Object.fromEntries(sb.accuracy.skills.filter(s => s.id).map(s => [s.id, s.name]));
  const c = D?.tab === tab ? D.content : null; // تجاهل محتوى تبويب سابق أثناء التحميل

  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div><h1>تقاريري</h1><div className="en">My Reports</div></div>
        <div className="tag">الملف الأكاديمي والتقدم.</div>
      </div>
      <div className="container">
        <div className="filters">
          {(D?.tabs || [{ key: 'overview', label: 'نظرة عامة', label_en: 'Overview' }]).map(t => (
            <button key={t.key} className={'filter' + (tab === t.key ? ' active' : '')} onClick={() => { clickSound(); setTab(t.key); }}>
              <span>{t.label}<span className="en">{t.label_en}</span></span>
            </button>
          ))}
        </div>
        {error && <Empty t={error.message} e="Could not load reports" />}

        <div className="grid-main">
          <div className="col">
            {c && tab === 'overview' && <OverviewTab c={c} onPeriod={setPeriod} />}
            {c && tab === 'skills' && <SkillsTab c={c} onSkill={setSkillId} />}
            {c && tab === 'achievements' && <AchievementsTab c={c} />}
            {c && tab === 'portfolio' && <PortfolioTab c={c} full={full} onFull={() => { clickSound(); setFull(true); }} />}
          </div>

          {sb && (
            <div className="col">
              <AccuracyDonut acc={sb.accuracy} onSkill={setAccSkill} />
              <div className="side-card">
                <div className="badges-head">
                  <div><h3>أهدافي</h3><div className="en">My Goals</div></div>
                  <button className="btn-sm" onClick={() => setTab('skills')}>عرض الكل</button>
                </div>
                <div style={{ marginTop: 16 }}><GoalRows goals={sb.goals || []} thin /></div>
              </div>
              <div className="side-card">
                <div className="badges-head">
                  <div><h3>شاراتي ({sb.badges_count ?? 0})</h3><div className="en">My Badges</div></div>
                  <Link to="/badges"><button className="btn-sm">عرض الكل</button></Link>
                </div>
                {!sb.badges?.length && <Empty t="لا شارات بعد" e="No badges yet" />}
                <div className="badges-grid">
                  {(sb.badges || []).map(b => (
                    <div className="badge-item" key={b.id ?? b.key}>
                      <BadgeIcon b={b} size={48} />
                      <div className="t">{b.name ?? b.title}</div>
                      <div className="e">{b.name_en ?? b.title_en}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="side-card">
                <div className="badges-head"><div><h3>أحدث الأنشطة</h3><div className="en">Recent Activity</div></div></div>
                <div style={{ marginTop: 10 }}>
                  {!sb.recent_activity?.length && <Empty t="لا نشاط بعد" e="No activity yet" />}
                  {(sb.recent_activity || []).map((r, i) => (
                    <div className="recent-row" key={i}>
                      <span className="dot" style={{ background: DOT[r.color] || 'var(--brand)' }}>✓</span>
                      <div><div className="t">{r.title}</div><div className="e">{r.title_en}</div></div>
                      <span className="when">{ago(r.at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <FooterStrip
        ar="أداؤك في تحسّن مستمر – استمر بنفس الوتيرة لتصل لمستوى أعلى"
        en="Your performance keeps improving — keep it up to reach the next level!"
      />
    </div>
  );
}
