import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, Ring, SecHead, FooterStrip } from '../components.jsx';
import { challenges, allGames, gameStats } from '../data.js';
import { clickSound } from '../sounds.js';

/* التحديات والألعاب — صفحة واحدة مدمجة (كانتا صفحتين متداخلتين):
   التحديات تكسب النقاط، والألعاب هي أداة إنجازها */

const FILTERS = [
  { ar: 'الكل', en: 'All' },
  { ar: 'استماع', en: 'Listening' },
  { ar: 'قواعد', en: 'Grammar' },
  { ar: 'مفردات', en: 'Vocabulary' },
];

export default function Challenges() {
  const [filter, setFilter] = useState('الكل');
  const shown = allGames.filter(g => filter === 'الكل' || g.cat === filter);
  const featured = allGames[0];

  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="challenge-hero">
          <div className="img"><img src="/img/scene-discover.png" alt="" /></div>
          <div>
            <h1>التحديات والألعاب</h1>
            <div className="en-sub" style={{ color: 'rgba(255,255,255,0.8)' }}>Challenges &amp; Games</div>
            <p>تحدَّ نفسك والعب — كل لعبة تُتقنها تقرّبك من إكمال تحدياتك!</p>
            <p style={{ fontSize: 11, opacity: 0.8 }}>Challenge yourself and play — every game completes your challenges!</p>
          </div>
          <div className="week">
            <div className="t">تحدي الأسبوع</div>
            <div className="e">Weekly Challenge</div>
            <div style={{ marginTop: 10, display: 'grid', placeItems: 'center' }}>
              <Ring pct={60} size={86} stroke={9} />
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink2)', marginTop: 8 }}>أنجزت 9 من 15 مهمة</div>
          </div>
        </div>

        <SecHead ico="/img/target.png" ar="التحديات الحالية" en="Current Challenges" />
        <div className="challenges-grid">
          {challenges.map(c => (
            <div className="chal-card" key={c.ar}>
              <div className="head">
                <img src={c.ico} alt="" />
                <div>
                  <h4>{c.ar}</h4>
                  <div className="en">{c.en}</div>
                </div>
              </div>
              <div className="d">{c.d}</div>
              <div className="en2">{c.en2}</div>
              <div className="cnt">
                <span>{c.done}/{c.of}</span>
              </div>
              <div className="bar thin"><i style={{ width: (c.done / c.of) * 100 + '%', background: c.color }} /></div>
              <span className="pts">🎁 {c.pts} نقطة عند الاكتمال</span>
            </div>
          ))}
        </div>

        <div className="grid-main">
          <div className="col">
            <SecHead ico="/img/gamepad.png" ar="الألعاب التعليمية" en="Educational Games — العب لتُنجز تحدياتك" />
            <Link to="/game/wordsearch" className="adaptive-strip" style={{ borderColor: 'var(--green)', marginTop: 0, marginBottom: 14 }}>
              <span className="tagA" style={{ background: 'var(--green)' }}>🔍 لعبة جديدة</span>
              <div className="why">البحث عن الكلمات — جد مفردات وحدتك العشر مخبأة في شبكة الحروف! <b style={{ color: 'var(--green-deep)' }}>العب ←</b></div>
            </Link>
            <div className="filters" style={{ marginTop: 0 }}>
              {FILTERS.map(f => (
                <button key={f.ar} className={'filter' + (filter === f.ar ? ' active' : '')} onClick={() => { clickSound(); setFilter(f.ar); }}>
                  <span>{f.ar}<span className="en">{f.en}</span></span>
                </button>
              ))}
            </div>
            <div className="games-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {shown.map(g => (
                <div key={g.ar} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="game-card">
                    <img className="bg" loading="lazy" decoding="async" src={g.img} alt="" />
                    <div className="overlay" />
                    <span className="play-btn">▶</span>
                    <span className="rate" style={{ top: 12, bottom: 'auto' }}>★ {g.rate}</span>
                  </div>
                  <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{g.ar}</div>
                    <div style={{ fontSize: 10, color: 'var(--mute2)' }}>{g.en}</div>
                    <Link to="/game"><button className="btn-sm" style={{ marginTop: 10, width: '100%' }}>العب</button></Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col">
            <div className="side-card featured-game">
              <span className="tagf">اللعبة المميّزة</span>
              <div className="img"><img src={featured.img} alt="" /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="t">{featured.ar}</div>
                <div className="rate">★ {featured.rate}</div>
              </div>
            </div>
            <div className="side-card stats-list">
              <div className="badges-head">
                <div>
                  <h3>إحصائيات الألعاب</h3>
                  <div className="en">Games Stats</div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                {gameStats.map(s => (
                  <div className="row" key={s.ar}>
                    <img src={s.ico} alt="" />
                    <div>
                      <div className="t">{s.ar}</div>
                      <div className="e">{s.en}</div>
                    </div>
                    <div className="n">{s.n}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="كل تحدٍّ تخطوه يقرّبك من هدفك! العب، تعلّم، وكن أفضل من نفسك"
        en="Every challenge brings you closer to your goal! Play, learn, and beat your best."
      />
    </div>
  );
}
