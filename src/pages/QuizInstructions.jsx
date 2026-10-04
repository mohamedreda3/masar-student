import { Link } from 'react-router-dom';
import { StatsBar, SecHead } from '../components.jsx';
import { SKILLS } from '../data.js';

/* كل اختبار يضم المهارات الأربع — لكل مهارة زر بدء وحالة (قرار العميل) */
const QUIZ_SKILLS = [
  { skill: 'reading',   d: 'فهم الكلمات والجمل',    de: 'Understand words and sentences', status: 'done',    pct: 100 },
  { skill: 'listening', d: 'فهم الحديث والمقاطع',   de: 'Understand spoken audio',        status: 'started', pct: 40 },
  { skill: 'speaking',  d: 'التعبير عن الأفكار',    de: 'Express ideas and opinions',     status: 'todo',    pct: 0 },
  { skill: 'writing',   d: 'كتابة الجمل والأفكار',  de: 'Write sentences and ideas',      status: 'todo',    pct: 0 },
];

const GUIDES = [
  { n: 1, ar: 'اقرأ الأسئلة بعناية', en: 'Read Carefully',      d: 'اقرأ كل سؤال بعناية وتأكد من فهم المطلوب قبل الإجابة.',        de: 'Read each question and make sure you understand it.', ico: '/img/book.png' },
  { n: 2, ar: 'استخدم السماعات',     en: 'Use Headphones',      d: 'ارتدِ السماعات للاستماع إلى المقاطع الصوتية بوضوح.',            de: 'Wear headphones to hear the audio clearly.',          ico: '/img/headphones.png' },
  { n: 3, ar: 'سجّل إجاباتك بوضوح',  en: 'Record Clearly',      d: 'تحدث بوضوح عند تسجيل إجاباتك الصوتية.',                        de: 'Speak clearly when recording your answers.',          ico: '/img/mic.png' },
  { n: 4, ar: 'راجع قبل الإرسال',    en: 'Review Before Submit', d: 'راجع إجاباتك وتأكد من اكتمالها قبل إرسال التقييم.',            de: 'Review your answers before submitting.',              ico: '/img/clipboard.png' },
  { n: 5, ar: 'الحفظ التلقائي مفعّل', en: 'Autosave is On',      d: 'سيتم حفظ تقدمك تلقائياً — يمكنك العودة والمتابعة لاحقاً.',      de: 'Your progress is saved automatically.',               ico: '/img/cloudDone.png' },
];

export default function QuizInstructions() {
  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="hero" style={{ padding: '34px 40px' }}>
          <div className="hero-img" style={{ maxWidth: 280, width: '100%' }}>
            <img src="/img/scene-read.png" alt="" />
          </div>
          <div className="hero-txt" style={{ textAlign: 'center' }}>
            <h1 style={{ marginTop: 0 }}>اختبار الوحدة — التقييم الختامي</h1>
            <div className="en-sub" style={{ fontSize: 16, fontWeight: 700 }}>Unit Exam — Summative Assessment</div>
            <div className="unit-meta-chips" style={{ justifyContent: 'center', marginTop: 12 }}>
              <span className="chip">نهاية وحدة الاحتياجات والرغبات</span>
              <span className="chip">بالمهارات الأربع</span>
              <span className="chip">بتكليف من معلمك</span>
            </div>
            <p style={{ marginTop: 14 }}>قبل أن تبدأ، يُرجى قراءة التعليمات التالية بعناية.</p>
            <div className="en-sub">Before you start, please read the following instructions carefully.</div>
          </div>
          <img src="/img/clipboard.png" alt="" className="hide-xs" style={{ width: 120, height: 120, objectFit: 'contain', flexShrink: 0 }} />
        </div>

        <SecHead ico="/img/target2.png" ar="مهارات الاختبار الأربع" en="Skills We'll Check" />
        <div className="stations-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {QUIZ_SKILLS.map(q => {
            const S = SKILLS[q.skill];
            return (
              <div key={q.skill} className="card" style={{ textAlign: 'center', padding: '22px 18px', borderTop: `4px solid ${S.color}` }}>
                <img src={S.ico} alt="" style={{ width: 54, height: 54, objectFit: 'contain', margin: '0 auto' }} />
                <div style={{ fontWeight: 900, fontSize: 17, marginTop: 10 }}>{S.ar}</div>
                <div style={{ fontSize: 10.5, color: 'var(--mute)' }}>{S.en}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink2)', marginTop: 8, lineHeight: 1.7 }}>{q.d}</div>
                <div style={{ fontSize: 9.5, color: 'var(--mute2)', direction: 'ltr' }}>{q.de}</div>
                <div className="bar thin" style={{ marginTop: 12 }}>
                  <i style={{ width: q.pct + '%', background: S.color }} />
                </div>
                <div style={{ marginTop: 12 }}>
                  {q.status === 'done' && <span className="st-chip مكتملة">اكتملت ✓</span>}
                  {q.status === 'started' && (
                    <Link to="/exam" className="btn-sm" style={{ display: 'block', width: '100%', borderColor: S.color, color: S.color, textAlign: 'center' }}>
                      بدأت — أكمل ({q.pct}٪)
                    </Link>
                  )}
                  {q.status === 'todo' && (
                    <Link to="/exam" className="btn-sm" style={{ display: 'block', width: '100%', textAlign: 'center' }}>ابدأ</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: 34, padding: '30px 34px', textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 19 }}>لتحقيق أفضل نتيجة، اتبع الإرشادات التالية:</div>
          <div className="sec-en">To achieve the best result, please follow these guidelines:</div>
          <div className="toolkit-items" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginTop: 26 }}>
            {GUIDES.map(g => (
              <div key={g.n} className="toolkit-item" style={{ flexDirection: 'column', textAlign: 'center', gap: 8, padding: '20px 14px', cursor: 'default' }}>
                <span className="cnt">{g.n}</span>
                <img src={g.ico} alt="" style={{ width: 56, height: 56 }} />
                <div>
                  <div className="t" style={{ fontSize: 15 }}>{g.ar}</div>
                  <div className="e" style={{ fontSize: 10.5 }}>{g.en}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.8 }}>{g.d}</div>
                <div style={{ fontSize: 9.5, color: 'var(--mute2)', direction: 'ltr' }}>{g.de}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 30, flexWrap: 'wrap' }}>
            <div className="mascot" style={{ margin: 0, flex: 1, minWidth: 240 }}>
              <img src="/img/owl.png" alt="" />
              <div className="b">تذكّر: خذ وقتك، وثق بقدراتك!<br />
                <span style={{ fontSize: 10.5, color: 'var(--mute)', direction: 'ltr', display: 'block', textAlign: 'end' }}>Take your time, believe in yourself!</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Link to="/exam" className="btn btn-primary" style={{ fontSize: 17, padding: '15px 44px' }}>
                🚀 ابدأ التقييم / Start Assessment
              </Link>
              <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 10 }}>
                ⏱ المدة التقريبية: 20–30 دقيقة · Estimated time: 20–30 minutes
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 50 }} />
    </div>
  );
}
