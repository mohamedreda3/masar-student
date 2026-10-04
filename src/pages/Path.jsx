import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, Ring, SecHead, FooterStrip } from '../components.jsx';
import { stations, futureStations, currentLesson, levels, healthUnit, lessonFlow, tasks } from '../data.js';

const MARK = { done: '✓', current: '!', locked: '🔒' };

/* الهيرو المدمج: مساري + مجموعتي + الاختصارات — كتلة واحدة بلا تشتت */
function Hero() {
  return (
    <div className="container">
      <div className="hero" style={{ padding: '30px 40px', flexWrap: 'wrap' }}>
        <div className="hero-img" style={{ maxWidth: 280, width: '100%' }}>
          <img src="/img/scene-journey.png" alt="" />
        </div>
        <div className="hero-txt">
          <h1 style={{ marginTop: 0 }}>مساري</h1>
          <div className="en-sub">My Path</div>
          <p>رحلتك في اللغة العربية – محطة بعد محطة، وكل محطة تفتح التي بعدها.</p>
          <div className="unit-meta-chips" style={{ marginTop: 12 }}>
            <span className="chip">سنوات دراستك للعربية: 4</span>
            <span className="chip">الصف السادس</span>
            <span className="chip">Year 7</span>
          </div>
        </div>
        <div className="level-card current" style={{ width: 190, flexShrink: 0, background: 'var(--surface)' }}>
          <div className="n">★</div>
          <h4>مجموعة المتطور</h4>
          <div className="en">Developing Group</div>
          <div className="st">تقدمك في المجموعة</div>
          <div className="bar thin"><i style={{ width: '45%' }} /></div>
        </div>
        <div className="toolkit-items" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginTop: 6, width: '100%' }}>
          <Link to="/reports" className="toolkit-item">
            <img src="/img/clipboard.png" alt="" />
            <div><div className="t">تقدمي</div><div className="e">My Progress</div></div>
          </Link>
          <Link to="/badges" className="toolkit-item">
            <img src="/img/medal.png" alt="" />
            <div><div className="t">شاراتي</div><div className="e">My Badges</div></div>
          </Link>
          <Link to="/library" className="toolkit-item">
            <img src="/img/book.png" alt="" />
            <div><div className="t">مكتبة القصص</div><div className="e">Story Library</div></div>
          </Link>
          <Link to="/extra/support" className="toolkit-item">
            <img src="/img/lamp.png" alt="" />
            <div><div className="t">أحتاج مساعدة</div><div className="e">Support</div></div>
          </Link>
          <Link to="/challenges" className="toolkit-item">
            <img src="/img/gamepad.png" alt="" />
            <div><div className="t">التحديات والألعاب</div><div className="e">Challenges &amp; Games</div></div>
          </Link>
        </div>
      </div>
    </div>
  );
}

const FILTER_ITEMS = [
  { key: 'all',     ar: 'كل المحطات', en: 'All Stations', ico: '🗂️' },
  { key: 'done',    ar: 'مكتملة', en: 'Completed', ico: '✅' },
  { key: 'current', ar: 'الحالية', en: 'In Progress', ico: '🔥' },
  { key: 'locked',  ar: 'مقفلة', en: 'Locked', ico: '💎' },
];

function Filters({ value, onChange }) {
  return (
    <div className="container">
      <div className="filters">
        {FILTER_ITEMS.map(f => (
          <button key={f.key} className={'filter' + (value === f.key ? ' active' : '')} onClick={() => onChange(f.key)}>
            <span>{f.ico}</span>
            <span>
              {f.ar}
              <span className="en">{f.en}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* الطالب يرى مجموعته فقط — لا سلّم المستويات الكامل (قرار العميل: «حتى ما يحبط»).
   السلّم الكامل يظهر للمعلم وحده، وهو من يرفع المتفوق لمجموعة أعلى. */
function MyGroup() {
  const g = levels.find(l => l.status === 'current');
  return (
    <div className="container">
      <SecHead ico="/img/medal.png" ar="مجموعتي" en="My Group" />
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '26px 30px', flexWrap: 'wrap' }}>
        <div className="level-card current" style={{ minWidth: 190, boxShadow: 'none' }}>
          <div className="n">★</div>
          <h4>مجموعة {g.ar}</h4>
          <div className="en">{g.en}</div>
          <div className="st">تقدمك في المجموعة</div>
          <div className="bar thin"><i style={{ width: g.pct + '%' }} /></div>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="unit-meta-chips">
            <span className="chip">سنوات دراستك للعربية: 4</span>
            <span className="chip">{'الصف السادس'}</span>
            <span className="chip">Year 7</span>
          </div>
          <p style={{ color: 'var(--ink2)', fontSize: 14, marginTop: 14, lineHeight: 1.9 }}>
            منهجك مصمَّم خصيصاً لعدد سنوات دراستك للعربية — كل سنة دراسية جديدة ترفعك خطوة.
          </p>
          <div className="toolkit-items" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginTop: 16 }}>
            <Link to="/reports" className="toolkit-item">
              <img src="/img/clipboard.png" alt="" />
              <div><div className="t">تقدمي</div><div className="e">My Progress</div></div>
            </Link>
            <Link to="/badges" className="toolkit-item">
              <img src="/img/medal.png" alt="" />
              <div><div className="t">شاراتي</div><div className="e">My Badges</div></div>
            </Link>
            <Link to="/library" className="toolkit-item">
              <img src="/img/book.png" alt="" />
              <div><div className="t">مكتبة القصص</div><div className="e">Story Library</div></div>
            </Link>
            <Link to="/extra/support" className="toolkit-item">
              <img src="/img/lamp.png" alt="" />
              <div><div className="t">أحتاج مساعدة</div><div className="e">Support</div></div>
            </Link>
            <Link to="/challenges" className="toolkit-item">
              <img src="/img/gamepad.png" alt="" />
              <div><div className="t">التحديات والألعاب</div><div className="e">Challenges &amp; Games</div></div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyMap({ filter = 'all' }) {
  return (
    <div className="container">
      <div className="card map-card" style={{ marginTop: 20 }}>
        <div className="sec-title" style={{ justifyContent: 'flex-start' }}>
          <span>وحدات مستواك — المتطور</span>
        </div>
        <div className="sec-en">Developing Level Units</div>
        <div className="map-note">
          أنجزت محطتين من ست
          <div className="bar thin"><i style={{ width: '33%' }} /></div>
        </div>
        <div className="map-scroll">
          <div className="map-track">
            {/* خط المسار المتموج — متحرك، والمقطع المنجز يُرسم أخضر */}
            <svg className="map-svg" viewBox="0 0 1200 150" preserveAspectRatio="none" aria-hidden="true">
              <path className="map-wave-base"
                d="M1155 45 C 1080 45, 1010 95, 935 95 S 790 45, 715 45 S 570 95, 495 95 S 350 45, 275 45 S 130 95, 55 95" />
              <path className="map-wave-done" pathLength="100"
                d="M1155 45 C 1080 45, 1010 95, 935 95 S 790 45, 715 45" />
            </svg>
            {stations.map((s, i) => {
              const body = (
                <>
                  <div className="pin">
                    <img loading="lazy" decoding="async" src={s.img} alt="" />
                  </div>
                  <span className="mark">{MARK[s.status]}</span>
                  <div className="t">{s.ar}</div>
                  <div className="e">{s.en}</div>
                </>
              );
              const st = { marginTop: i % 2 ? 46 : 0, opacity: filter === 'all' || s.status === filter ? 1 : 0.25, transition: 'opacity 0.2s' };
              return s.status === 'locked'
                ? <div key={s.ar} className={'station ' + s.status} style={st} title="بتكليف من معلمك">{body}</div>
                : (
                  <Link key={s.ar} to="/unit" className="station-link">
                    <div className={'station ' + s.status} style={st}>{body}</div>
                  </Link>
                );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentStation() {
  const U = healthUnit;
  const cur = U.lessons.find(l => l.status === 'current');
  return (
    <div className="container">
      <SecHead ico="/img/flame.png" ar="وحدتك الحالية" en="Current Unit" />
      <div style={{ marginTop: 0 }}>
        <div className="card station-detail">
          <div className="unit-media">
            <div className="img" style={{ width: '100%' }}>
              <img src={U.img} alt="" />
              <span className="tag">الوحدة الجارية</span>
            </div>
            <Link to="/lesson" className="btn btn-primary btn-col" style={{ width: '100%' }}>
              <span>⏵ تابع الدرس الجاري</span>
              <span className="sub">Continue — Reading step</span>
            </Link>
            <Link to="/unit" className="btn btn-ghost btn-col" style={{ width: '100%' }}>
              <span>لوحة الوحدة</span>
              <span className="sub">Unit Board</span>
            </Link>
            {/* إنجازك في المسار — مدمج تحت الصورة */}
            <div className="progress-side" style={{ padding: '18px 16px', borderRadius: 'var(--r-md)', flex: 1 }}>
              <h3 style={{ fontSize: 15.5 }}>تقدمي</h3>
              <div className="en">My Progress</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12, position: 'relative', zIndex: 1 }}>
                <Ring pct={33} size={72} stroke={8} color="#f59e0b" track="rgba(255,255,255,0.25)">
                  <span style={{ color: '#fff', fontSize: 15 }}>33%</span>
                </Ring>
                <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 900 }}>2</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>محطات مكتملة</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 900 }}>24</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>دروس أنهيتها</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="body">
            <h3>{U.ar}</h3>
            <div className="en">{U.en}</div>
            <div className="unit-meta-chips">
              <span className="chip">{U.stage}</span>
              <span className="chip">{U.grade}</span>
              <span className="chip">المستوى: المتطور</span>
            </div>
            <p>{U.desc}<br />
              <span style={{ color: 'var(--mute)', fontSize: 11.5 }}>{U.descEn}</span>
            </p>
            <div className="unit-lessons">
              {U.lessons.map(l => {
                const card = (
                  <div className={'lesson-mini ' + l.status}>
                    <div className="img">
                      <img loading="lazy" decoding="async" src={l.img} alt="" />
                      <span className="num">{l.n}</span>
                    </div>
                    <div className="body">
                      <h5>{l.ar}</h5>
                      <div className="e">{l.en}</div>
                      <div className="bar thin">
                        <i style={{ width: l.pct + '%', background: l.status === 'current' ? 'var(--gold)' : 'var(--green)' }} />
                      </div>
                    </div>
                  </div>
                );
                return l.status === 'locked'
                  ? <div key={l.n} title="يُفتح بعد الدرس السابق">{card}</div>
                  : <Link key={l.n} to="/lesson">{card}</Link>;
              })}
            </div>
            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 900, fontSize: 15 }}>رحلة الدرس الجاري — {cur.ar}</div>
              <div className="sec-en">Lesson journey — the eight steps</div>
              <div className="flow-strip">
                {lessonFlow.map(s => {
                  const inner = (
                    <>
                      <div className="n">{s.status === 'done' ? '✓' : s.n}</div>
                      <div className="t">{s.ar}</div>
                      <div className="e">{s.en}</div>
                    </>
                  );
                  return <Link key={s.n} to={s.to} className={'flow-step ' + s.status}>{inner}</Link>;
                })}
              </div>
              <div className="lesson-foot" style={{ paddingTop: 16 }}>
                <span className="pct">تقدمك في الدرس</span>
                <div className="bar"><i style={{ width: '67%' }} /></div>
                <span className="pct">67٪</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AllStations({ filter = 'all' }) {
  const ST_AR = { done: 'مكتملة', current: 'الحالية', locked: 'مقفلة' };
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? [...stations, ...futureStations] : stations;
  const shown = list.filter(s => filter === 'all' || s.status === filter);
  return (
    <div className="container">
      <SecHead ico="/img/book.png" ar="كل وحدات المستوى" en="All Units"
        link={showAll ? 'وحدات مستواي فقط' : 'عرض الكل (+ السنوات القادمة)'}
        onLink={() => setShowAll(v => !v)} />
      <div className="stations-grid">
        {shown.map(s => (
          <div key={s.ar} className={'station-card ' + s.status}>
            <div className="img">
              <img loading="lazy" decoding="async" src={s.img} alt="" />
              <span className={'st ' + s.status}>{ST_AR[s.status]}</span>
              {s.status === 'locked' && <div className="lock-overlay"><span>🔒</span></div>}
            </div>
            <div className="body">
              <h4>{s.ar}</h4>
              <div className="e">{s.en}</div>
              <div className="meta">
                <span>{s.meta}</span>
                <span>{s.pct}٪</span>
              </div>
              <div className="bar thin">
                <i style={{ width: s.pct + '%', background: s.status === 'done' ? 'var(--green)' : 'var(--gold)' }} />
              </div>
              <div className="cta">
                {s.status === 'locked'
                  ? <button className="off" disabled>مقفلة</button>
                  : <Link to="/unit"><button className={s.status === 'current' ? 'continue' : 'go'} style={{ width: '100%' }}>{s.status === 'current' ? 'تابع' : 'راجع'}</button></Link>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* الحل الوسط: جسر بين مساري وأنشطتي — شريط مهام مصغّر بلا بلع صفحة بصفحة */
function MyTasksStrip() {
  const open = tasks.filter(t => t.done < t.of).length;
  return (
    <div className="container">
      <SecHead ico="/img/clipboard.png" ar={`مهامك الجارية (${open})`} en="Your Open Tasks" link="كل أنشطتي" to="/activities" />
      <div className="tasks-strip">
        {tasks.map(t => (
          <Link to={'/activity/' + t.skill} className="task-mini" key={t.ar} style={{ '--tc': t.color }}>
            <div className="ico" style={{ background: t.soft }}><img src={t.ico} alt="" /></div>
            <div className="body">
              <div className="t">{t.ar}</div>
              <div className="e">{t.d}</div>
              <div className="bar thin"><i style={{ width: (t.done / t.of) * 100 + '%', background: t.color }} /></div>
            </div>
            <span className="cta">{t.done === 0 ? 'ابدأ' : `${t.done}/${t.of}`} ←</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function NextStep() {
  return (
    <div className="container">
      <SecHead ico="/img/target.png" ar="خطوتك التالية" en="Your Next Step" />
      <div className="card next-card">
        <div className="img"><img src="/img/scene-needs.png" alt="" /></div>
        <div className="body">
          <h3>{currentLesson.lessonAr}</h3>
          <div className="en">{currentLesson.lessonEn}</div>
          <div className="d">مهارتا القراءة والاستماع · مدة الدرس نحو 20 دقيقة</div>
        </div>
        <div className="actions">
          <Link to="/unit" className="btn btn-ghost btn-col">
            <span>لوحة الوحدة</span>
            <span className="sub">Unit Board</span>
          </Link>
          <Link to="/lesson" className="btn btn-primary btn-col">
            <span>⏵ ابدأ الدرس</span>
            <span className="sub">Start Lesson</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Path() {
  const [filter, setFilter] = useState('all');
  return (
    <div className="page">
      <StatsBar />
      <Hero />
      <Filters value={filter} onChange={setFilter} />
      <JourneyMap filter={filter} />
      <CurrentStation />
      <MyTasksStrip />
      <AllStations filter={filter} />
      <NextStep />
      <FooterStrip
        ar="كل محطة تقطعها تقرّبك خطوة من إتقان العربية – واصل رحلتك"
        en="Every station you pass brings you closer to mastering Arabic — keep going!"
      />
    </div>
  );
}

