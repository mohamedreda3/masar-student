import { StatsBar, SecHead, FooterStrip } from '../components.jsx';
import { teacherNotes, goals, SKILLS } from '../data.js';

export default function Feedback() {
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>ملاحظات المعلم</h1>
          <div className="en">Teacher Feedback</div>
        </div>
        <div className="tag">تعليقات وتوجيهات على مهامك — نقاط قوتك وخطوتك التالية.</div>
      </div>
      <div className="container">
        {/* شخصية المعلم بالزي العربي — من أصول العميل الرسمية */}
        <div className="card next-card" style={{ borderTopColor: 'var(--green)' }}>
          <img src="/img/teacher-char.jpeg" alt="المعلم" style={{ width: 'min(130px, 32%)', borderRadius: 16, flexShrink: 0 }} />
          <div className="body">
            <h3>معلمك يتابع رحلتك خطوة بخطوة</h3>
            <div className="en">Your teacher follows your journey step by step</div>
            <div className="d">كل ملاحظة هنا مكتوبة لك خصيصاً: ماذا أتقنت، وما خطوتك التالية — اقرأها وطبّقها في درسك القادم.</div>
          </div>
        </div>

        <div className="grid-main">
          <div className="col">
            <SecHead ico="/img/speech.png" ar="أحدث الملاحظات" en="Latest Feedback" />
            {teacherNotes.map(n => (
              <div className="fb-card" key={n.name + n.date}>
                <div className="fb-head">
                  <img loading="lazy" decoding="async" src={n.img} alt="" />
                  <div>
                    <div className="n">{n.name}</div>
                    <div className="e">{n.en}</div>
                  </div>
                  <span className="when">{n.date}</span>
                </div>
                <div className="fb-block good">
                  <span className="l">✅ نقاط القوة</span>
                  {n.strengths}
                </div>
                <div className="fb-block next">
                  <span className="l">👣 الخطوة التالية</span>
                  {n.next}
                </div>
              </div>
            ))}
          </div>
          <div className="col">
            <div className="side-card">
              <div className="badges-head">
                <div>
                  <h3>أهدافك الحالية</h3>
                  <div className="en">Your Current Goals</div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                {goals.slice(0, 3).map(g => {
                  const S = SKILLS[g.skill];
                  return (
                    <div className="goal-row" key={g.ar}>
                      <div className="head">
                        <span>{g.ar}</span>
                        <span className="pct" style={{ color: S.color }}>{g.pct}٪</span>
                      </div>
                      <div className="bar thin"><i style={{ width: g.pct + '%', background: S.color }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mascot">
              <img src="/img/owl.png" alt="" />
              <div className="b">معلّموك معجبون بتقدمك يا أحمد — كل ملاحظة هي هدية تساعدك تتطور!</div>
            </div>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="كل ملاحظة من معلمك خطوة نحو الأفضل – اقرأها وطبّقها"
        en="Every note from your teacher is a step forward — read and apply!"
      />
    </div>
  );
}

