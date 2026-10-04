import { useState } from 'react';
import { Logo } from '../components.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { quizQuestions, SKILLS } from '../data.js';
import { dingSound, buzzSound, winSound, playClip } from '../sounds.js';
import { showToast } from '../toast.js';

const KEYS = ['أ', 'ب', 'ج', 'د'];
const TOTAL_PTS = quizQuestions.reduce((a, q) => a + q.pts, 0);

function FocusBar() {
  return (
    <div className="focus-bar">
      <div className="container in">
        <Logo h={50} />
        <div className="title">
          <div className="t">اختبار قصير · احتياجاتنا ورغباتنا — عشر درجات</div>
          <div className="e">Quick Quiz · Our Needs and Wants — 10 marks</div>
        </div>
        <Link to="/lesson" className="focus-exit">خروج ⎋</Link>
      </div>
    </div>
  );
}

export default function QuizRun() {
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);      // mcq/listen: رقم الخيار
  const [txt, setTxt] = useState('');        // input: نص الإجابة
  const [order, setOrder] = useState([]);    // order: الكلمات المرتّبة
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const q = quizQuestions[i];
  const S = SKILLS[q.skill];
  const last = i === quizQuestions.length - 1;
  const type = q.type || 'mcq';

  const isCorrect =
    type === 'input' ? q.accept.some(a => txt.replace(/[ًٌٍَُِّْ]/g, '').includes(a)) :
    type === 'order' ? order.join(' ') === q.answer.join(' ') :
    sel === q.correct;

  const canCheck =
    type === 'input' ? txt.trim().length > 0 :
    type === 'order' ? order.length === q.answer.length :
    sel !== null;

  const check = () => {
    if (!canCheck) return;
    setChecked(true);
    isCorrect ? dingSound() : buzzSound();
    if (isCorrect) setScore(s => s + q.pts);
  };
  const next = () => {
    if (last) {
      winSound();
      // التكيف يبدأ هنا: النتيجة الفعلية تُمرَّر لتحدد الخطوة التالية المقترحة
      nav('/result', { state: { pct: Math.round((score / TOTAL_PTS) * 100) } });
      return;
    }
    setI(i + 1); setSel(null); setTxt(''); setOrder([]); setChecked(false);
  };

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar />
      <div className="container">
        <div className="quiz-progress">
          <span className="lab">السؤال {i + 1} من {quizQuestions.length}</span>
          <div className="bar"><i style={{ width: ((i + (checked ? 1 : 0)) / quizQuestions.length) * 100 + '%' }} /></div>
          <span className="pts">درجة السؤال {q.pts} · مجموع الكويز {TOTAL_PTS}</span>
        </div>

        <div className="card activity-card" style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="chip" style={{ color: S.color, background: S.color + '15', fontSize: 13 }}>
                مهارة {S.ar} · {S.en}
              </span>
              {/* شارة محرك السؤال — نفس تسمية شاشة «إضافة اختبار» عند المعلم */}
              <span className="chip" style={{ color: 'var(--purple)', background: 'var(--lav-soft)', fontSize: 12.5 }}>
                ⚙ {q.engine}
              </span>
            </span>
            <button className="hint-btn" onClick={() => showToast('تذكر: الحاجة شيء لا نستطيع العيش بدونه، والرغبة شيء نحبه فقط', '💡')}>💡 تلميح</button>
          </div>

          {q.passage && (
            <div className="passage">
              <span className="tr-hover" data-tr={q.passageEn || 'Hover translation'}>{q.passage}</span>
            </div>
          )}
          {q.img && <div className="q-img"><img loading="lazy" decoding="async" src={q.img} alt="" /></div>}

          {q.audio && (
            <div className="audio-player">
              <button className="audio-play" onClick={() => playClip(q.audio)}>▶</button>
              <div className="audio-track"><div className="bar"><i style={{ width: '25%' }} /></div></div>
              <span className="speed-lab">استمع جيداً قبل الإجابة</span>
            </div>
          )}

          <div className="q-title">{q.q}</div>
          <div className="q-en">{q.qEn}</div>

          {(type === 'mcq' || type === 'listen') && (
            <div className="options">
              {q.options.map((o, oi) => {
                let cls = 'option';
                if (!checked && sel === oi) cls += ' selected';
                if (checked && oi === q.correct) cls += ' correct';
                if (checked && sel === oi && oi !== q.correct) cls += ' wrong';
                return (
                  <button key={o} className={cls} disabled={checked} onClick={() => setSel(oi)}>
                    <span className="key">{KEYS[oi]}</span>
                    {o}
                  </button>
                );
              })}
            </div>
          )}

          {type === 'order' && (
            <>
              <div className="order-line" style={{ marginTop: 14 }}>
                {order.length ? order.join(' ') : '… اضغط الكلمات بالترتيب الصحيح'}
              </div>
              <div className="dd-words">
                {q.words.filter(w => !order.includes(w)).map(w => (
                  <button key={w} className="option" disabled={checked} onClick={() => setOrder([...order, w])}>{w}</button>
                ))}
                {order.length > 0 && !checked && (
                  <button className="hint-btn" onClick={() => setOrder([])}>↺ إعادة</button>
                )}
              </div>
            </>
          )}

          {type === 'input' && (
            <>
              <input
                className="eng-input" dir="rtl"
                style={{ width: '100%', marginTop: 14, fontSize: 17, textAlign: 'center' }}
                value={txt} disabled={checked}
                onChange={e => setTxt(e.target.value)}
                placeholder="اكتب الجملة المحوَّلة هنا…"
              />
              {checked && (
                <div className="eng-note" style={{ textAlign: 'center', fontSize: 13, marginTop: 8 }}>
                  الإجابة النموذجية: <b style={{ color: 'var(--green-deep)' }}>{q.model}</b>
                </div>
              )}
            </>
          )}

          {checked && (
            <div className={'explain-box ' + (isCorrect ? 'ok' : 'no')}>
              <img src="/img/owl.png" alt="" />
              <div>
                <span className="h">{isCorrect ? 'إجابة صحيحة! أحسنت' : 'إجابة غير صحيحة — لا بأس، هكذا نتعلم'}</span>
                {q.explain}
              </div>
            </div>
          )}

          <div className="activity-nav">
            <div className="spacer" />
            {!checked
              ? <button className="btn btn-primary" onClick={check} style={{ opacity: canCheck ? 1 : 0.5 }}>تحقق من إجابتي</button>
              : <button className="btn btn-primary" onClick={next}>{last ? 'عرض النتيجة ←' : 'السؤال التالي ←'}</button>}
          </div>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}

