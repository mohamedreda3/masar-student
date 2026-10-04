import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip, Empty } from '../components.jsx';
import { showToast } from '../toast.js';
import { portfolioWorks } from '../data.js';

const TABS = ['الكل', 'كتابة', 'تحدث', 'مشاريع', 'واجبات'];

export default function Portfolio() {
  const [tab, setTab] = useState('الكل');
  const shown = portfolioWorks.filter(w => tab === 'الكل' || w.type === tab);
  const totals = {
    works: portfolioWorks.length,
    views: portfolioWorks.reduce((a, w) => a + w.views, 0),
    likes: portfolioWorks.reduce((a, w) => a + w.likes, 0),
  };
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
        <div className="grid-main">
          <div className="col">
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
          <div className="col">
            <div className="side-card gradient-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <div className="t1">إحصائيات ملفك</div>
              <div className="en">Portfolio Stats</div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 14, textAlign: 'center' }}>
                <div><div style={{ fontSize: 24, fontWeight: 900 }}>{totals.works}</div><div style={{ fontSize: 11.5, fontWeight: 700 }}>عمل</div></div>
                <div><div style={{ fontSize: 24, fontWeight: 900 }}>{totals.views}</div><div style={{ fontSize: 11.5, fontWeight: 700 }}>مشاهدة</div></div>
                <div><div style={{ fontSize: 24, fontWeight: 900 }}>{totals.likes}</div><div style={{ fontSize: 11.5, fontWeight: 700 }}>إعجاب</div></div>
              </div>
            </div>
            <div className="side-card">
              <div className="badges-head">
                <div>
                  <h3>أضف عملاً جديداً</h3>
                  <div className="en">Add New Work</div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                <Link to="/activity/writing" className="btn btn-ghost">✍ اكتب نصاً جديداً</Link>
                <Link to="/activity/speaking" className="btn btn-ghost">🎙 سجّل تسجيلاً صوتياً</Link>
                <button className="btn btn-ghost" onClick={() => showToast('رفع الملفات يصلك في النسخة الكاملة — جرّبه في معرض المحركات!', '📎')}>📎 ارفع مشروعاً</button>
              </div>
            </div>
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

