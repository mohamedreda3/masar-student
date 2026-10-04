import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip } from '../components.jsx';
import { allGames, gameStats } from '../data.js';

const FILTERS = [
  { ar: 'الكل', en: 'All' },
  { ar: 'استماع', en: 'Listening' },
  { ar: 'قواعد', en: 'Grammar' },
  { ar: 'مفردات', en: 'Vocabulary' },
];

export default function Games() {
  const [filter, setFilter] = useState('الكل');
  const shown = allGames.filter(g => filter === 'الكل' || g.cat === filter);
  const featured = allGames[0];

  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>ألعابي</h1>
          <div className="en">My Games</div>
        </div>
        <div className="tag">تعلّم وأنت تلعب – ألعاب مرتبطة بوحداتك.</div>
      </div>
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
            <SecHead ico="/img/gamepad.png" ar="كل الألعاب" en="All Games" />
            <div className="games-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {shown.map(g => (
                <div key={g.ar} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="game-card" style={{ height: 150 }}>
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
        ar="العب وتعلّم! كل لعبة تُتقنها تقرّبك خطوة من إتقان العربية"
        en="Play and learn! Every game you master brings you closer to fluency."
      />
    </div>
  );
}

