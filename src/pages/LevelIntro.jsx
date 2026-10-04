import { Link } from 'react-router-dom';
import { StatsBar, SecHead } from '../components.jsx';
import { SKILLS, student } from '../data.js';

const CHECKS = [
  { skill: 'reading',   d: 'فهم الكلمات والجمل',   de: 'Understand words and sentences' },
  { skill: 'listening', d: 'فهم الحديث والمقاطع',  de: 'Understand spoken audio' },
  { skill: 'writing',   d: 'كتابة الجمل والأفكار', de: 'Write sentences and ideas' },
  { skill: 'speaking',  d: 'التعبير عن الأفكار',   de: 'Express ideas and opinions' },
];

const INFO = [
  { ico: '/img/stopwatch.png', ar: 'المدة التقريبية', d: '20–25 دقيقة', en: 'Approx. duration' },
  { ico: '/img/cloudDone.png', ar: 'حفظ التقدم', d: 'يُحفظ تقدمك تلقائياً', en: 'Autosave is on' },
  { ico: '/img/shield.png',    ar: 'تجربة داعمة وآمنة', d: 'أنت في مساحة مشجعة', en: 'Safe & supportive' },
];

export default function LevelIntro() {
  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="hero" style={{ padding: '34px 40px' }}>
          <div className="hero-img" style={{ maxWidth: 300, width: '100%' }}>
            <img src="/img/scene-journey.png" alt="" />
          </div>
          <div className="hero-txt">
            <span className="hero-chip">👋 !Ready? لنبدأ معاً</span>
            <h1 style={{ fontSize: 34 }}>تحديد المستوى — المقدمة</h1>
            <div className="en-sub" style={{ fontSize: 15, fontWeight: 700 }}>Level Check — Introduction</div>
            <p style={{ lineHeight: 2 }}>
              مرحباً {student.first}! 👋 هذا النشاط يساعدنا على معرفة مستواك الحالي في اللغة العربية.
              لا تقلق — ليست اختباراً للنجاح أو الفشل، بل خطوة لفهم نقاط قوتك ولمساعدتك على التعلم بشكل أفضل.
            </p>
            <div className="en-sub" style={{ lineHeight: 1.8 }}>
              This activity helps us understand your current Arabic level. Don't worry — it's not a pass or fail test.
            </div>
          </div>
        </div>

        <SecHead ico="/img/target.png" ar="المهارات التي سنقيّمها" en="Skills We'll Check" />
        <div className="kpi-grid">
          {CHECKS.map(c => {
            const S = SKILLS[c.skill];
            return (
              <div className="kpi" key={c.skill} style={{ textAlign: 'center', borderTop: '4px solid ' + S.color }}>
                <img src={S.ico} alt="" style={{ width: 52, height: 52, objectFit: 'contain', margin: '0 auto' }} />
                <h4 style={{ fontSize: 17, marginTop: 10 }}>{S.ar}</h4>
                <div className="en">{S.en}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink2)', marginTop: 8 }}>{c.d}</div>
                <div style={{ fontSize: 10, color: 'var(--mute2)', direction: 'ltr' }}>{c.de}</div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: 30, padding: '24px 30px' }}>
          <div className="toolkit-items" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 0 }}>
            {INFO.map(i => (
              <div className="toolkit-item" key={i.ar} style={{ cursor: 'default' }}>
                <img src={i.ico} alt="" style={{ width: 44, height: 44 }} />
                <div>
                  <div className="t">{i.ar}</div>
                  <div className="e">{i.en}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 2 }}>{i.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 26 }}>
            <Link to="/level-check/question" className="btn btn-primary" style={{ fontSize: 17, padding: '15px 46px' }}>
              🚀 ابدأ تحديد المستوى / Start Level Check
            </Link>
            <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 12 }}>
              🛡 يمكنك التوقف في أي وقت، وسنحفظ تقدمك · You can stop anytime, and we'll save your progress.
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 50 }} />
    </div>
  );
}
