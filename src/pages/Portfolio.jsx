import { useState } from 'react';
import { StatsBar, SecHead, FooterStrip, Empty } from '../components.jsx';
import { portfolioWorks } from '../data.js';

const TABS = ['الكل', 'كتابة', 'تحدث', 'مشاريع', 'واجبات'];

export default function Portfolio() {
  const [tab, setTab] = useState('الكل');
  const shown = portfolioWorks.filter(w => tab === 'الكل' || w.type === tab);
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>ملف أعمالي</h1>
          <div className="en">My Portfolio</div>
        </div>
        <div className="tag">كتاباتك وتسجيلاتك ومشاريعك — إبداعك محفوظ هنا.</div>
      </div>
      <div className="container">
        <div className="filters">
          {TABS.map(t => (
            <button key={t} className={'filter' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>
              <span>{t}</span>
            </button>
          ))}
        </div>
        <div>
            <SecHead ico="/img/folderStar.png" ar="أعمالي" en="My Works" />
            {shown.length === 0 && (
              <div className="card">
                <Empty t="لا أعمال في هذا التصنيف بعد" e="Nothing here yet" d="أنجز نشاطاً أو سجّل تسجيلاً وسيظهر هنا تلقائياً!" />
              </div>
            )}
            <div className="works-grid">
              {shown.map(w => (
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
                      <span>👁 {w.views} مشاهدة</span>
                      <span>❤ {w.likes} إعجاب</span>
                      <span>{w.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>
      <FooterStrip
        ar="ملفك يكبر مع كل عمل – افتخر بما صنعت"
        en="Your portfolio grows with every work — be proud of what you make!"
      />
    </div>
  );
}

