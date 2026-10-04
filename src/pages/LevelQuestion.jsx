import { useState } from 'react';
import { Logo } from '../components.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { SKILLS, dialogueAudio } from '../data.js';
import { playClip, clickSound } from '../sounds.js';

/* تحديد المستوى: بلا صح/خطأ ظاهر — تقييم داعم، الإجابة تُسجَّل ونتابع */
const QUESTIONS = [
  {
    skill: 'listening', audio: true,
    q: 'استمع إلى الفقرة: ماذا يفعلُ المتحدثُ في الصباح؟',
    qEn: 'Listen: what does the speaker do in the morning?',
    options: ['يشربُ الماءَ', 'يمارسُ الرياضةَ', 'يقرأُ كتاباً', 'يذهبُ إلى السوق'],
  },
  {
    skill: 'reading',
    passage: 'أنا اسمي سارة. أذهب إلى المدرسة كل صباح، وأحب حصة اللغة العربية كثيراً.',
    q: 'ماذا تحب سارة؟',
    qEn: 'What does Sara like?',
    options: ['حصة الرياضيات', 'حصة اللغة العربية', 'حصة العلوم', 'حصة الرسم'],
  },
  {
    skill: 'speaking', record: true,
    q: 'قدّم نفسك بثلاث جمل: اسمك، وعمرك، وماذا تحب.',
    qEn: 'Introduce yourself in three sentences.',
  },
];

function FocusBar() {
  return (
    <div className="focus-bar">
      <div className="container in">
        <Logo h={50} />
        <div className="title">
          <div className="t">تحديد المستوى — خذ وقتك، لا يوجد نجاح أو فشل</div>
          <div className="e">Level Check — take your time, no pass or fail</div>
        </div>
        <Link to="/level-check" className="focus-exit">إيقاف مؤقت ⎋</Link>
      </div>
    </div>
  );
}

const KEYS = ['أ', 'ب', 'ج', 'د'];

export default function LevelQuestion() {
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const [speed, setSpeed] = useState('1.0x');

  const q = QUESTIONS[i];
  const S = SKILLS[q.skill];
  const last = i === QUESTIONS.length - 1;
  const canNext = q.record || sel !== null;

  const next = () => {
    if (last) { nav('/level-check/result'); return; }
    setI(i + 1); setSel(null);
  };

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar />
      <div className="container">
        <div className="quiz-progress">
          <span className="lab">السؤال {i + 1} من {QUESTIONS.length}</span>
          <div className="bar"><i style={{ width: ((i + 1) / QUESTIONS.length) * 100 + '%' }} /></div>
          <span className="pts">☁ الحفظ التلقائي مفعّل</span>
        </div>

        <div className="card activity-card" style={{ marginTop: 22 }}>
          <span className="chip" style={{ color: S.color, background: S.color + '15', fontSize: 13 }}>
            مهارة {S.ar} · {S.en}
          </span>

          {q.passage && <div className="passage">{q.passage}</div>}

          {q.audio && (
            <div className="audio-player">
              <button className="audio-play" onClick={() => playClip(dialogueAudio, parseFloat(speed))}>▶</button>
              <div className="audio-track"><div className="bar"><i style={{ width: '20%' }} /></div></div>
              <span className="audio-time">0:12 / 0:45</span>
              <span className="speed-lab">سرعة التشغيل</span>
              <div className="speed-pills">
                {['0.75x', '1.0x', '1.25x'].map(s => (
                  <button key={s} className={'speed-pill' + (speed === s ? ' active' : '')} onClick={() => setSpeed(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="q-title">{q.q}</div>
          <div className="q-en">{q.qEn}</div>

          {q.options && (
            <div className="options">
              {q.options.map((o, oi) => (
                <button key={o} className={'option' + (sel === oi ? ' selected' : '')} onClick={() => setSel(oi)}>
                  <span className="key">{KEYS[oi]}</span>
                  {o}
                </button>
              ))}
            </div>
          )}

          {q.record && (
            <div className="recorder">
              <button className="rec-btn" onClick={(e) => { clickSound(); e.currentTarget.classList.toggle('on'); }}>🎙</button>
              <div className="t">اضغط وسجّل إجابتك بصوت واضح</div>
              <div className="e">Press and record your answer clearly — up to 60 seconds</div>
              <div className="timer">00:00 / 01:00</div>
            </div>
          )}

          <div className="activity-nav">
            <span style={{ fontSize: 12.5, color: 'var(--mute)', fontWeight: 700 }}>💙 خذ وقتك، وثق بقدراتك</span>
            <div className="spacer" />
            <button className="btn btn-primary" onClick={next} style={{ opacity: canNext ? 1 : 0.5 }} disabled={!canNext}>
              {last ? 'إنهاء وعرض النتيجة ←' : 'السؤال التالي ←'}
            </button>
          </div>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
