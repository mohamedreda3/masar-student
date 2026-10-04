import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, Ring, SecHead, FooterStrip } from '../components.jsx';
import {
  reportKpis, skillProgress, goals, strengths, improvements,
  progressOverTime, recentActivity, badges, SKILLS, myOutcomes,
  earnedBadges, progressBadges, portfolioWorks,
} from '../data.js';

const TABS = [
  { ar: 'نظرة عامة', en: 'Overview' },
  { ar: 'المهارات', en: 'Skills' },
  { ar: 'الإنجازات', en: 'Achievements' },
  { ar: 'الملف الشخصي', en: 'Portfolio' },
];

/* تقدمي عبر الوقت — بروح Google Finance: تدرج، مؤشر متحرك بقيمة وتاريخ، وتبويبات مدة */
const RANGES = {
  'أسبوع': { en: '1W', pts: [
    { m: 'السبت', en: 'Sat', v: 61 }, { m: 'الأحد', en: 'Sun', v: 63 }, { m: 'الاثنين', en: 'Mon', v: 62 },
    { m: 'الثلاثاء', en: 'Tue', v: 66 }, { m: 'الأربعاء', en: 'Wed', v: 64 }, { m: 'الخميس', en: 'Thu', v: 68 }, { m: 'الجمعة', en: 'Fri', v: 65 },
  ] },
  'شهر': { en: '1M', pts: [
    { m: '1 مايو', en: 'May 1', v: 58 }, { m: '5 مايو', en: 'May 5', v: 60 }, { m: '9 مايو', en: 'May 9', v: 59 }, { m: '13 مايو', en: 'May 13', v: 63 },
    { m: '17 مايو', en: 'May 17', v: 61 }, { m: '21 مايو', en: 'May 21', v: 66 }, { m: '25 مايو', en: 'May 25', v: 67 }, { m: '29 مايو', en: 'May 29', v: 65 },
  ] },
  'فصل': { en: '3M', pts: progressOverTime.slice(-4) },
  'سنة': { en: '1Y', pts: progressOverTime },
};

function LineChart() {
  const [range, setRange] = useState('سنة');
  const [hi, setHi] = useState(null);
  const pts = RANGES[range].pts;
  const W = 680, H = 230, P = 34, TOP = 30, BOT = 44;
  const data = [...pts].reverse(); // الأحدث يساراً (RTL)
  const vals = data.map(p => p.v);
  const lo = Math.max(0, Math.min(...vals) - 6), hiV = Math.min(100, Math.max(...vals) + 6);
  const xs = data.map((_, i) => P + (i * (W - 2 * P)) / (data.length - 1));
  const ys = data.map(p => H - BOT - ((p.v - lo) / (hiV - lo)) * (H - BOT - TOP));
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = `${d} L${xs[xs.length - 1]},${H - BOT} L${xs[0]},${H - BOT} Z`;
  const last = 0;
  const idx = hi ?? last;
  const grid = [0.25, 0.5, 0.75].map(f => ({ y: TOP + (H - BOT - TOP) * f, v: Math.round(hiV - (hiV - lo) * f) }));

  const onMove = (e) => {
    const svg = e.currentTarget, r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0; for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
    setHi(best);
  };
  const trend = data[0].v - data[data.length - 1].v;

  return (
    <div className="chart-wrap gf-chart">
      <div className="gf-head">
        <div className="gf-ranges">
          {Object.keys(RANGES).map(k => (
            <button key={k} className={'gf-range' + (range === k ? ' on' : '')} onClick={() => { setRange(k); setHi(null); }}>
              {k}<span>{RANGES[k].en}</span>
            </button>
          ))}
        </div>
        <div className="gf-now">
          <span className="v">{data[idx].v}%</span>
          <span className={'delta ' + (trend >= 0 ? 'up' : 'down')}>{trend >= 0 ? '▲' : '▼'} {Math.abs(trend)} نقطة خلال {range === 'أسبوع' ? 'الأسبوع' : range === 'شهر' ? 'الشهر' : range === 'فصل' ? 'الفصل' : 'السنة'}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', cursor: 'crosshair' }} onMouseMove={onMove} onMouseLeave={() => setHi(null)}>
        <defs>
          <linearGradient id="gfFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--green)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--green)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {grid.map(g => (
          <g key={g.y}>
            <line x1={P} x2={W - P} y1={g.y} y2={g.y} stroke="var(--line2)" />
            <text x={W - P + 6} y={g.y + 4} fontSize="10.5" fill="var(--mute)" textAnchor="start">{g.v}</text>
          </g>
        ))}
        <path d={area} fill="url(#gfFill)" />
        <path d={d} fill="none" stroke="var(--green)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* المؤشر */}
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
        {/* محاور X — كل التسميات للنطاقات القصيرة، ومتباعدة للطويلة */}
        {data.map((p, i) => (
          (data.length <= 8 || i % 2 === 0) && (
            <text key={i} x={xs[i]} y={H - 10} fontSize="11" fontWeight="700" fill={i === idx ? 'var(--ink)' : 'var(--mute)'} textAnchor="middle">{p.m}</text>
          )
        ))}
      </svg>
      <Link to="/path" className="chart-cta">
        <span className="ic">🎯</span>
        <span className="txt">
          <b>أنت على الطريق الصحيح!</b> استمر في التعلم والممارسة لتحقيق أهدافك.
          <span className="e">You are on the right track! Keep learning and practicing.</span>
        </span>
        <span className="btn btn-primary" style={{ background: 'var(--purple)', pointerEvents: 'none' }}>عرض خطتي · View My Plan ←</span>
      </Link>
    </div>
  );
}

/* دونات الدقة — بقائمة منسدلة تختار المهارة (نمط ودجت العميل) */
const ACCURACY_BY_SKILL = {
  reading:   { title: 'دقتك في القراءة',  en: 'Reading accuracy',  label: 'دقة عالية',  segs: [{ l: 'صحيحة', v: 87, c: 'var(--green)' }, { l: 'خطأ', v: 13, c: 'var(--danger)' }] },
  listening: { title: 'دقتك في الاستماع', en: 'Listening accuracy', label: 'دقة جيدة',  segs: [{ l: 'صحيحة', v: 80, c: 'var(--green)' }, { l: 'خطأ', v: 20, c: 'var(--danger)' }] },
  speaking:  { title: 'دقتك في التحدث',   en: 'Speaking accuracy',  label: 'قيد التطوير', segs: [{ l: 'صحيحة', v: 71, c: 'var(--green)' }, { l: 'خطأ', v: 29, c: 'var(--danger)' }] },
  writing:   { title: 'دقتك في بناء الجمل', en: 'Sentence-building accuracy', label: 'دقة عالية', segs: [{ l: 'صحيحة', v: 83, c: 'var(--green)' }, { l: 'خطأ', v: 17, c: 'var(--danger)' }] },
};

export function AccuracyDonut() {
  const [skill, setSkill] = useState('writing');
  const A = ACCURACY_BY_SKILL[skill];
  const size = 128, stroke = 16, r = (size - stroke) / 2, C = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="side-card">
      <div className="badges-head" style={{ alignItems: 'flex-start', gap: 10 }}>
        <div>
          <h3>🎯 {A.title}</h3>
          <div className="en">{A.en}</div>
        </div>
        <select className="skill-select" value={skill} onChange={e => setSkill(e.target.value)} aria-label="اختر المهارة">
          {Object.keys(ACCURACY_BY_SKILL).map(k => <option key={k} value={k}>{SKILLS[k].ar}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 14 }}>
        <div className="ring" style={{ width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} key={skill}>
            {A.segs.map(seg => {
              const dash = (seg.v / 100) * C;
              const el = (
                <circle key={seg.l} cx={size / 2} cy={size / 2} r={r} fill="none"
                  stroke={seg.c} strokeWidth={stroke}
                  strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-off} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
              );
              off += dash;
              return el;
            })}
          </svg>
          <div className="val">
            <div style={{ textAlign: 'center', lineHeight: 1.25 }}>
              <div style={{ fontSize: 21, fontWeight: 900 }}>{A.segs[0].v}%</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mute)' }}>{A.label}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {A.segs.map(seg => (
            <div key={seg.l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, fontWeight: 700, color: 'var(--ink2)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: seg.c, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{seg.l}</span>
              <span style={{ fontWeight: 900 }}>{seg.v}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 10, textAlign: 'start' }}>
        <Link to="/skills" className="link">‹ عرض التقرير التفصيلي</Link>
      </div>
    </div>
  );
}

/* رادار نمو المهارات الاستماعية — ست محاور فرعية */
const RADAR_AXES = [
  { l: 'فهم الفكرة العامة', v: 0.85 },
  { l: 'التعرف على التفاصيل', v: 0.6 },
  { l: 'الاستنتاج', v: 0.9 },
  { l: 'تمييز المتحدثين', v: 0.55 },
  { l: 'فهم التسلسل', v: 0.7 },
  { l: 'فهم المعاني الضمنية', v: 0.5 },
];

export function ListeningRadar() {
  const size = 300, cx = size / 2, cy = size / 2, R = 92;
  const pt = (i, f) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + R * f * Math.cos(a), cy + R * f * Math.sin(a)];
  };
  const poly = f => RADAR_AXES.map((_, i) => pt(i, f).map(n => n.toFixed(1)).join(',')).join(' ');
  const data = RADAR_AXES.map((ax, i) => pt(i, ax.v).map(n => n.toFixed(1)).join(',')).join(' ');
  return (
    <div className="card" style={{ marginTop: 26 }}>
      <div className="badges-head">
        <div>
          <h3>🎧 نمو مهاراتك الاستماعية</h3>
          <div className="en">Listening sub-skills growth</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 360, margin: '10px auto 0', display: 'block' }}>
        {[0.33, 0.66, 1].map(f => (
          <polygon key={f} points={poly(f)} fill="none" stroke="var(--line)" strokeWidth="1" />
        ))}
        {RADAR_AXES.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" />;
        })}
        <polygon points={data} fill="var(--purple)" fillOpacity="0.35" stroke="var(--purple)" strokeWidth="2.5" strokeLinejoin="round" />
        {RADAR_AXES.map((ax, i) => {
          const [x, y] = pt(i, 1.28);
          const [dx, dy] = pt(i, 1);
          return (
            <g key={ax.l}>
              <circle cx={dx} cy={dy} r="3.5" fill="var(--surface)" stroke="var(--purple)" strokeWidth="2" />
              <text x={x} y={y} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="var(--ink2)">{ax.l}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* تحليلات تقدمي في القراءة — معدل الفهم + تطوره أسبوعياً */
const COMP_WEEKS = [
  { l: 'الأسبوع 1', v: 65 }, { l: 'الأسبوع 2', v: 70 }, { l: 'الأسبوع 3', v: 76 }, { l: 'هذا الأسبوع', v: 82 },
];

function ReadingAnalytics() {
  const W = 420, H = 150, P = 30;
  const xs = COMP_WEEKS.map((_, i) => W - P - (i * (W - 2 * P)) / (COMP_WEEKS.length - 1)); // RTL: الأقدم يميناً
  const ys = COMP_WEEKS.map(w => H - P - ((w.v - 55) / 35) * (H - 2 * P));
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x},${ys[i]}`).join(' ');
  const area = d + ` L${xs[xs.length - 1]},${H - P} L${xs[0]},${H - P} Z`;
  return (
    <div className="card" style={{ marginTop: 26 }}>
      <div className="badges-head">
        <div>
          <h3>📚 تحليلات تقدّمي في القراءة</h3>
          <div className="en">Reading progress analytics</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 14, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink2)', marginBottom: 8 }}>معدل الفهم</div>
          <Ring pct={82} size={110} stroke={12} color="var(--green)" />
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--green)', marginTop: 8 }}>▲ +6% عن الأسبوع الماضي</div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink2)' }}>تطوّر الفهم</div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
            <path d={area} fill="var(--purple)" fillOpacity="0.12" />
            <path d={d} fill="none" stroke="var(--purple)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {xs.map((x, i) => (
              <g key={i}>
                <circle cx={x} cy={ys[i]} r="5" fill="var(--purple)" />
                <text x={x} y={ys[i] - 12} textAnchor="middle" fontSize="12.5" fontWeight="800" fill="var(--ink)">{COMP_WEEKS[i].v}%</text>
                <text x={x} y={H - 8} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--mute)">{COMP_WEEKS[i].l}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* تبويب المهارات */
function SkillsTab() {
  return (
    <>
      <SecHead ico="/img/book.png" ar="مهاراتي الأربع بالتفصيل" en="My Four Skills" />
      <div className="card">
        <div className="rings-row">
          {skillProgress.map(s => {
            const S = SKILLS[s.skill];
            return (
              <div className="ring-block" key={s.skill}>
                <Ring pct={s.pct} size={116} stroke={11} color={S.color} />
                <div className="lab"><img src={S.ico} alt="" />{S.ar}</div>
                <div className="en">{S.en}</div>
                <div className="verdict">{s.verdict}</div>
              </div>
            );
          })}
        </div>
      </div>
      <SecHead ico="/img/target.png" ar="أهدافي حسب المهارة" en="Goals by Skill" />
      <div className="card">
        {goals.map(g => {
          const S = SKILLS[g.skill];
          return (
            <div className="goal-row" key={g.ar}>
              <div className="head">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><img src={S.ico} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />{g.ar}</span>
                <span className="pct" style={{ color: S.color }}>{g.pct}٪</span>
              </div>
              <div className="en">{g.en}</div>
              <div className="bar"><i style={{ width: g.pct + '%', background: S.color }} /></div>
            </div>
          );
        })}
      </div>
      <ListeningRadar />
      <ReadingAnalytics />
      {/* نقاط القوة والتحسين — بنمط ودجت العميل */}
      <div className="card" style={{ marginTop: 26 }}>
        <div className="badges-head">
          <div>
            <h3>نقاط القوة والتحسين</h3>
            <div className="en">Strengths &amp; Improvements</div>
          </div>
        </div>
        <div className="si-box good">
          <div className="head"><span className="tag">📗 نقاط القوة<span className="e">Strengths</span></span></div>
          <div className="rows">
            {strengths.map(s => (
              <div className="row" key={s.ar}>
                <span className="mk ok">✓</span>
                <span className="ar">{s.ar}</span>
                <span className="en">{s.en}</span>
              </div>
            ))}
          </div>
          <img className="ill" src="/img/trophy.png" alt="" />
        </div>
        <div className="si-box bad">
          <div className="head"><span className="tag">📕 يحتاج إلى تحسين<span className="e">Needs Improvement</span></span></div>
          <div className="rows">
            {improvements.map(s => (
              <div className="row" key={s.ar}>
                <span className="mk no">✓</span>
                <span className="ar">{s.ar}</span>
                <span className="en">{s.en}</span>
              </div>
            ))}
          </div>
          <img className="ill" src="/img/target2.png" alt="" />
        </div>
      </div>
    </>
  );
}

/* تبويب الإنجازات */
function AchievementsTab() {
  return (
    <>
      <SecHead ico="/img/medal.png" ar="شارات حقّقتها" en="Earned Badges" />
      <div className="earned-grid">
        {earnedBadges.map(b => (
          <div className="earned-card" key={b.ar}>
            <img loading="lazy" decoding="async" src={b.img} alt="" />
            <div className="t">{b.ar}</div>
            <div className="e">{b.en}</div>
            <div className="d">{b.date}</div>
          </div>
        ))}
      </div>
      <SecHead ico="/img/star.png" ar="شارات قيد التقدم" en="In Progress" />
      <div className="wip-grid">
        {progressBadges.map(b => (
          <div className="wip-card" key={b.ar}>
            <div className="head">
              <img loading="lazy" decoding="async" src={b.img} alt="" />
              <div>
                <h4>{b.ar}</h4>
                <div className="en">{b.en}</div>
              </div>
            </div>
            <div className="pct">أنجزت {b.pct}٪ من الشرط</div>
            <div className="bar thin"><i style={{ width: b.pct + '%' }} /></div>
          </div>
        ))}
      </div>
      <SecHead ico="/img/bulb.png" ar="نواتج تعلم حقّقتها" en="Achieved Outcomes" />
      <div className="card">
        {myOutcomes.filter(o => o.done).map(o => (
          <div key={o.ar} className="outcome-row done">
            <span className="chk">✓</span>
            <div style={{ flex: 1 }}>
              <div className="t">{o.ar}</div>
              <div className="en">{o.en}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* تبويب الملف الشخصي */
function PortfolioTab() {
  return (
    <>
      <SecHead ico="/img/folderStar.png" ar="من ملف أعمالي" en="From My Portfolio" link="افتح الملف كاملاً" />
      <div className="works-grid">
        {portfolioWorks.map(w => (
          <div className="work-card" key={w.ar}>
            <div className="img">
              <img loading="lazy" decoding="async" src={w.img} alt="" />
              <span className="type">{w.type}</span>
              {w.audio && <span className="audio-chip">🔊 استمع</span>}
            </div>
            <div className="body">
              <h4>{w.ar}</h4>
              <div className="e">{w.en}</div>
              <div className="meta">
                <span>👁 {w.views}</span>
                <span>❤ {w.likes}</span>
                <span>{w.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, textAlign: 'center' }}>
        <Link to="/portfolio" className="btn btn-primary">افتح ملف أعمالي كاملاً ←</Link>
      </div>
    </>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('نظرة عامة');
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>تقاريري</h1>
          <div className="en">My Reports</div>
        </div>
        <div className="tag">الملف الأكاديمي والتقدم.</div>
      </div>
      <div className="container">
        <div className="filters">
          {TABS.map(t => (
            <button key={t.ar} className={'filter' + (tab === t.ar ? ' active' : '')} onClick={() => setTab(t.ar)}>
              <span>{t.ar}<span className="en">{t.en}</span></span>
            </button>
          ))}
        </div>

        <div className="grid-main">
          <div className="col">
            {tab === 'المهارات' && <SkillsTab />}
            {tab === 'الإنجازات' && <AchievementsTab />}
            {tab === 'الملف الشخصي' && <PortfolioTab />}
            {tab === 'نظرة عامة' && <>
            <SecHead ico="/img/target.png" ar="نظرة عامة على تقدمي" en="Overview" />
            <div className="kpi-grid">
              {reportKpis.map(k => (
                <div className="kpi" key={k.ar}>
                  <div className="head">
                    <div>
                      <h4>{k.ar}</h4>
                      <div className="en">{k.en}</div>
                    </div>
                    <img src={k.ico} alt="" />
                  </div>
                  <div className="n">{k.n} {k.sub && <small>{k.sub}</small>}</div>
                  <div className="delta">▲ {k.delta}</div>
                </div>
              ))}
            </div>

            <SecHead ico="/img/bulb.png" ar="نواتج التعلم التي حققتها" en="My Achieved Outcomes" />
            <div className="card">
              {myOutcomes.map(o => (
                <div key={o.ar} className={'outcome-row ' + (o.done ? 'done' : 'todo')}>
                  <span className="chk">{o.done ? '✓' : '•'}</span>
                  <div style={{ flex: 1 }}>
                    <div className="t">{o.ar}</div>
                    <div className="en">{o.en}</div>
                  </div>
                  {o.done
                    ? <span className="st-chip مكتملة">محقّق</span>
                    : <span className="st-chip قادمة">قيد التعلم</span>}
                </div>
              ))}
            </div>

            <SecHead ico="/img/book.png" ar="تقدّم المهارات" en="Skills Progress" />
            <div className="card">
              <div className="rings-row">
                {skillProgress.map(s => {
                  const S = SKILLS[s.skill];
                  return (
                    <div className="ring-block" key={s.skill}>
                      <Ring pct={s.pct} size={104} stroke={10} color={S.color} />
                      <div className="lab"><img src={S.ico} alt="" />{S.ar}</div>
                      <div className="en">{S.en}</div>
                      <div className="verdict">{s.verdict}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="result-cols" style={{ marginTop: 26 }}>
              <div className="card">
                <div className="badges-head">
                  <div>
                    <h3>تطوّر التقدّم</h3>
                    <div className="en">Progress Over Time</div>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}><LineChart /></div>
              </div>
              <div className="card">
                <div className="badges-head">
                  <div>
                    <h3>نقاط القوة والتحسين</h3>
                    <div className="en">Strengths &amp; Improvements</div>
                  </div>
                </div>
                <div className="si-box good">
                  <div className="head"><span className="tag">نقاط القوة<span className="e">Strengths</span></span></div>
                  <div className="rows">
                    {strengths.map(s => (
                      <div className="row" key={s.ar}>
                        <span className="mk ok">✓</span>
                        <span className="ar">{s.ar}</span>
                      </div>
                    ))}
                  </div>
                  <img className="ill" src="/img/trophy.png" alt="" />
                </div>
                <div className="si-box bad">
                  <div className="head"><span className="tag">يحتاج إلى تحسين<span className="e">Needs Improvement</span></span></div>
                  <div className="rows">
                    {improvements.map(s => (
                      <div className="row" key={s.ar}>
                        <span className="mk no">✓</span>
                        <span className="ar">{s.ar}</span>
                      </div>
                    ))}
                  </div>
                  <img className="ill" src="/img/target2.png" alt="" />
                </div>
              </div>
            </div>
            </>}
          </div>

          <div className="col">
            <AccuracyDonut />
            <div className="side-card">
              <div className="badges-head">
                <div>
                  <h3>أهدافي</h3>
                  <div className="en">My Goals</div>
                </div>
                <Link to="/feedback"><button className="btn-sm">عرض الكل</button></Link>
              </div>
              <div style={{ marginTop: 16 }}>
                {goals.map(g => {
                  const S = SKILLS[g.skill];
                  return (
                    <div className="goal-row" key={g.ar}>
                      <div className="head">
                        <span>{g.ar}</span>
                        <span className="pct" style={{ color: S.color }}>{g.pct}٪</span>
                      </div>
                      <div className="en">{g.en}</div>
                      <div className="bar thin"><i style={{ width: g.pct + '%', background: S.color }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="side-card">
              <div className="badges-head">
                <div>
                  <h3>شاراتي</h3>
                  <div className="en">My Badges</div>
                </div>
                <Link to="/badges"><button className="btn-sm">عرض الكل</button></Link>
              </div>
              <div className="badges-grid">
                {badges.map(b => (
                  <div className="badge-item" key={b.ar}>
                    <img loading="lazy" decoding="async" src={b.img} alt="" />
                    <div className="t">{b.ar}</div>
                    <div className="e">{b.en}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="side-card">
              <div className="badges-head">
                <div>
                  <h3>أحدث الأنشطة</h3>
                  <div className="en">Recent Activity</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                {recentActivity.map(r => (
                  <div className="recent-row" key={r.ar}>
                    <span className="dot" style={{ background: r.c }}>✓</span>
                    <div>
                      <div className="t">{r.ar}</div>
                      <div className="e">{r.en}</div>
                    </div>
                    <span className="when">{r.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="أداؤك في تحسّن مستمر – استمر بنفس الوتيرة لتصل لمستوى أعلى"
        en="Your performance keeps improving — keep it up to reach the next level!"
      />
    </div>
  );
}

