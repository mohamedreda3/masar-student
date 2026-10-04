import { Link } from 'react-router-dom';
import { StatsBar, FooterStrip } from '../components.jsx';
import { moreLinks } from '../data.js';

export default function More() {
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>المزيد</h1>
          <div className="en">More</div>
        </div>
        <div className="tag">كل ما تحتاجه خارج رحلتك اليومية، منظّماً في مكان واحد.</div>
      </div>
      <div className="container" style={{ marginTop: 26 }}>
        <div className="more-grid">
          {moreLinks.map(m => (
            <Link to={m.to} key={m.ar} className="more-card">
              <div className="head">
                <div className="ico"><img src={m.ico} alt="" /></div>
                <div>
                  <h3>{m.ar}</h3>
                  <div className="en">{m.en}</div>
                </div>
              </div>
              <div className="d">{m.d}</div>
              <div className="arr">‹</div>
            </Link>
          ))}
        </div>
      </div>
      <FooterStrip
        ar="كل ما تحتاجه في مكان واحد – استكشف واستفد"
        en="Everything you need in one place — explore and make the most of it!"
      />
    </div>
  );
}
