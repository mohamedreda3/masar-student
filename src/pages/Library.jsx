import { Link } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip } from '../components.jsx';
import { stories } from '../data.js';

export default function Library() {
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>مكتبة القصص</h1>
          <div className="en">Story Library</div>
        </div>
        <div className="tag">قصص مختارة لمجموعتك — اقرأ أو استمع، بالوتيرة التي تحبها.</div>
      </div>
      <div className="container">
        <div className="unit-meta-chips" style={{ marginTop: 20 }}>
          <span className="chip">مناسبة لمجموعتك: المتطور</span>
          <span className="chip">سنوات دراستك: 3</span>
        </div>
        <SecHead ico="/img/bookOpenGold.png" ar="قصص مختارة لك" en="Stories for You" />
        <div className="stations-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {stories.map(s => (
            <div key={s.ar} className="station-card">
              <div className="img">
                <img loading="lazy" decoding="async" src={s.img} alt="" />
                {s.tag && <span className="st current">{s.tag}</span>}
                {s.audio && (
                  <span style={{ position: 'absolute', bottom: 10, insetInlineEnd: 10, background: 'var(--white)', borderRadius: 99, padding: '5px 12px', fontSize: 11.5, fontWeight: 800, color: 'var(--brand)', boxShadow: 'var(--shadow-sm)' }}>
                    🔊 بالصوت
                  </span>
                )}
              </div>
              <div className="body" style={{ padding: '14px 16px 16px' }}>
                <h4 style={{ fontSize: 16 }}>{s.ar}</h4>
                <div className="e">{s.en}</div>
                <div className="meta">
                  <span>⏱ نحو {s.mins} دقائق</span>
                  <span>الكلمات {s.words}</span>
                </div>
                <div className="cta">
                  <Link to="/story"><button className="continue" style={{ width: '100%' }}>📖 اقرأ القصة</button></Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mascot" style={{ marginTop: 30 }}>
          <img src="/img/owl.png" alt="" />
          <div className="b">كل قصة تقرؤها تضيف كلمات جديدة لقاموسك — اقترح قصة على معلمك واربح نقاطاً!</div>
        </div>
      </div>
      <FooterStrip
        ar="القراءة مغامرة – كل قصة رحلة جديدة"
        en="Reading is an adventure — every story is a new journey!"
      />
    </div>
  );
}

