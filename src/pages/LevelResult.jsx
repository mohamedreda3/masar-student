import { Link } from 'react-router-dom';
import { StatsBar, Ring, FooterStrip } from '../components.jsx';
import { SKILLS, student } from '../data.js';

/* النتيجة بصياغة إيجابية — تظهر مجموعة الطالب فقط، بلا سلّم مقارنة (قرار العميل) */
const SKILL_RESULTS = [
  { skill: 'reading',   pct: 68 },
  { skill: 'listening', pct: 72 },
  { skill: 'speaking',  pct: 55 },
  { skill: 'writing',   pct: 60 },
];

export default function LevelResult() {
  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="result-hero">
          <span className="star" style={{ insetInlineStart: '10%', top: '20%' }}>🎉</span>
          <span className="star" style={{ insetInlineEnd: '10%', top: '25%' }}>⭐</span>
          <img src="/img/wellDone.png" alt="" style={{ width: 130, height: 130, objectFit: 'contain', margin: '0 auto' }}
            onError={e => { e.currentTarget.src = '/img/trophy.png'; }} />
          <h1>أهلاً بك في مجموعة المتطور!</h1>
          <div className="en">Welcome to the Emerging group, {'Ahmed'}!</div>
          <div className="unit-meta-chips" style={{ justifyContent: 'center', marginTop: 16 }}>
            <span className="chip">مجموعتك: المتطور · Developing</span>
            <span className="chip">سنوات دراستك للعربية: 3</span>
            <span className="chip">الصف السادس</span>
          </div>
          <p style={{ color: 'var(--ink2)', marginTop: 16, lineHeight: 2 }}>
            منهجك الآن مصمَّم خصيصاً لعدد سنوات دراستك — ستتعلم بالوتيرة المناسبة لك تماماً.
            <br />
            <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>Your curriculum now matches your years of studying Arabic.</span>
          </p>
        </div>

        <div className="result-cols">
          <div className="card">
            <div className="badges-head">
              <div>
                <h3>لمحة عن مهاراتك</h3>
                <div className="en">Your skills snapshot</div>
              </div>
            </div>
            <div className="rings-row" style={{ marginTop: 18 }}>
              {SKILL_RESULTS.map(r => {
                const S = SKILLS[r.skill];
                return (
                  <div className="ring-block" key={r.skill}>
                    <Ring pct={r.pct} size={86} stroke={9} color={S.color} />
                    <div className="lab" style={{ fontSize: 13 }}>{S.ar}</div>
                    <div className="en">{S.en}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="badges-head">
              <div>
                <h3>ماذا يعني هذا؟</h3>
                <div className="en">What does this mean?</div>
              </div>
            </div>
            <div className="sw-box good" style={{ marginTop: 14 }}>
              <ul>
                <li>✔ الاستماع والقراءة نقطتا قوتك — ستبدأ منهما رحلتك</li>
                <li>✔ سنقوّي التحدث والكتابة خطوة خطوة داخل الدروس</li>
                <li>✔ معلمك {student.teacher.ar} سيتابع تقدمك ويوجهك</li>
              </ul>
            </div>
            <div className="mascot" style={{ marginTop: 14, marginBottom: 0 }}>
              <img src="/img/owl.png" alt="" />
              <div className="b">أداء رائع يا {student.first}! رحلتك جاهزة — وحدتك الأولى بانتظارك.</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Link to="/path" className="btn btn-primary" style={{ fontSize: 17, padding: '15px 48px' }}>
            🚀 ابدأ رحلتك في مساري
          </Link>
        </div>
      </div>
      <FooterStrip
        ar="هذه نقطة البداية – وكل يوم ستصبح أفضل من الأمس"
        en="This is your starting point — every day you'll get better!"
      />
    </div>
  );
}
