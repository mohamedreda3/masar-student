import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, Ring, FooterStrip } from '../components.jsx';
import { examResult as R, SKILLS } from '../data.js';
import { winSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* نتيجة الاختبار الختامي — درجة لكل مهارة + النواتج المحققة + طريق الشهادة */
export default function ExamResult() {
  useEffect(() => { winSound(); showToast('أنهيت اختبار الوحدة! +200 نقطة'); }, []);
  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="result-hero">
          <div className="pop-in" style={{ display: 'grid', placeItems: 'center', '--rd': '0.15s' }}>
            <Ring pct={R.total} size={150} stroke={13} color="var(--gold)">
              <div style={{ color: 'var(--brand-ink)' }}>{R.total}%<div style={{ fontSize: 10, fontWeight: 400 }}>النتيجة</div></div>
            </Ring>
          </div>
          <h1 className="reveal" style={{ '--rd': '0.35s' }}>{R.verdict}</h1>
          <div className="en reveal" style={{ '--rd': '0.45s' }}>Unit Summative Exam — Health Unit</div>

          <div className="result-stats">
            {R.skills.map(s => {
              const K = SKILLS[s.skill];
              return (
                <div className="result-stat" key={s.skill}>
                  <img src={K.ico} alt="" />
                  <div className="n">{s.pct}%</div>
                  <div className="l">{K.ar}</div>
                  <div className="e">{s.note || K.en}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="result-cols reveal" style={{ '--rd': '1.1s' }}>
          <div className="card">
            <div className="badges-head">
              <div>
                <h3>نواتج تعلم حققتها في هذه الوحدة</h3>
                <div className="en">Outcomes you achieved</div>
              </div>
            </div>
            <div className="sw-box good" style={{ marginTop: 14 }}>
              <ul>{R.outcomes.map(o => <li key={o}>✔ أستطيع أن {o}</li>)}</ul>
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <img src="/img/scroll.png" alt="" style={{ width: 84, height: 84, objectFit: 'contain', margin: '0 auto' }} />
            <h3 style={{ fontSize: 19, fontWeight: 900, marginTop: 12 }}>مبروك! استحقيت شهادة الوحدة</h3>
            <div className="en" style={{ color: 'var(--mute)', fontSize: 11 }}>You earned the unit certificate!</div>
            <Link to="/certificate" className="btn btn-primary" style={{ marginTop: 18, alignSelf: 'center' }}>
              🎓 اعرض شهادتك
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Link to="/path" className="btn btn-ghost">العودة إلى مساري — وحدة السوق بانتظارك ←</Link>
        </div>
      </div>
      <FooterStrip
        ar="أتممت وحدة كاملة – هذه خطوة كبيرة في رحلتك"
        en="You completed a whole unit — a big step in your journey!"
      />
    </div>
  );
}
