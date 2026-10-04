import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, Ring, SecHead, FooterStrip } from '../components.jsx';
import { activities, SKILLS, skillDistribution } from '../data.js';

const FILTERS = [
  { ar: 'الكل', en: 'All' },
  { ar: 'قادمة', en: 'Upcoming' },
  { ar: 'جارية', en: 'In Progress' },
  { ar: 'مكتملة', en: 'Completed' },
];

function PageHead() {
  return (
    <div className="container page-head">
      <div>
        <h1>أنشطتي</h1>
        <div className="en">My Activities</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span className="tag">كل الدروس والتمارين – مكتملة أو تنتظرك.</span>
        <Link to="/skills" className="btn btn-ghost" style={{ padding: '9px 20px', fontSize: 13.5 }}>🎯 مهاراتي الأربع</Link>
      </div>
    </div>
  );
}

export default function Activities() {
  const [filter, setFilter] = useState('الكل');
  const shown = activities.filter(a => filter === 'الكل' || a.status === filter);
  const doneToday = activities.filter(a => a.status === 'مكتملة').length;

  return (
    <div className="page">
      <StatsBar />
      <PageHead />
      <div className="container">
        <div className="filters">
          {FILTERS.map(f => (
            <button key={f.ar} className={'filter' + (filter === f.ar ? ' active' : '')} onClick={() => setFilter(f.ar)}>
              <span>{f.ar}<span className="en">{f.en}</span></span>
            </button>
          ))}
        </div>
        <div className="grid-main">
          <div className="col">
            <SecHead ico="/img/clipboard.png" ar="أنشطة اليوم" en="Today's Activities" />
            {shown.map(a => {
              const S = SKILLS[a.skill];
              return (
                <div className="act-row" key={a.ar} style={{ '--edge': S.color }}>
                  <div className="ico" style={{ background: S.color + '18' }}><img src={S.ico} alt="" /></div>
                  <div className="body">
                    <h4>{a.ar}</h4>
                    <div className="en">{a.en}</div>
                    <div className="d">{a.d}</div>
                  </div>
                  <span className={'st-chip ' + a.status}>{a.status}</span>
                  <div className="prog">
                    <div className="lab">
                      {a.done === 0 ? 'لم تبدأ بعد' : a.done === a.of ? 'اكتملت' : `أنجزت ${a.done} من ${a.of}`}
                    </div>
                    <div className="bar thin"><i style={{ width: (a.done / a.of) * 100 + '%', background: S.color }} /></div>
                  </div>
                  <div className="act" style={{ minWidth: 84, textAlign: 'center' }}>
                    <Link to={a.cta === 'راجع' ? '/result' : '/activity/' + a.skill}>
                      <button className={'btn-sm' + (a.cta === 'ابدأ' ? ' pink' : '')}>{a.cta}</button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="col">
            <div className="side-card gradient-card">
              <Ring pct={Math.round((doneToday / activities.length) * 100)} size={96} color="#f59e0b" track="rgba(255,255,255,0.25)">
                <span style={{ color: '#fff', fontSize: 15 }}>{doneToday}/{activities.length}</span>
              </Ring>
              <div>
                <div className="t1">أدِّ أفضل ما لديك</div>
                <div className="en">Do your best</div>
                <div className="t2">أنجزت نشاطين مكتملين اليوم</div>
                <div className="t3">نصف أنشطة اليوم — واصل!</div>
              </div>
            </div>
            <div className="side-card">
              <div className="badges-head">
                <div>
                  <h3>توزيع المهارات</h3>
                  <div className="en">Skill Distribution</div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                {skillDistribution.map(d => {
                  const S = SKILLS[d.skill];
                  const max = Math.max(...skillDistribution.map(x => x.n));
                  return (
                    <div className="dist-row" key={d.skill}>
                      <span className="lab"><img src={S.ico} alt="" />{S.ar}</span>
                      <div className="bar thin"><i style={{ width: (d.n / max) * 100 + '%', background: S.color }} /></div>
                      <span className="n">{d.n}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="كل نشاط تنجزه خطوة أقرب نحو إتقان العربية – واصل التقدّم"
        en="Every activity you complete brings you closer to mastering Arabic!"
      />
    </div>
  );
}
