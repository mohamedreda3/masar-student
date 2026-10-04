import { useState } from 'react';
import { Logo } from '../components.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { lessonVocab } from '../data.js';
import { dingSound, buzzSound, winSound, playClip } from '../sounds.js';

/* لعبة مطابقة المفردات — اضغط الكلمة ثم صورتها (قواعد العميل: مساعدة دائمة، بلا شارات داخل اللعبة) */
function FocusBar() {
  return (
    <div className="focus-bar">
      <div className="container in">
        <Logo h={50} />
        <div className="title">
          <div className="t">لعبة مطابقة المفردات · كلمات الحاجات والرغبات</div>
          <div className="e">Vocabulary Match · Needs &amp; Wants Words</div>
        </div>
        <Link to="/challenges" className="focus-exit">خروج ⎋</Link>
      </div>
    </div>
  );
}

/* ترتيب صور مختلف عن ترتيب الكلمات حتى تكون لعبة فعلاً */
const IMGS = [2, 0, 3, 1];

export default function Game() {
  const nav = useNavigate();
  const [selWord, setSelWord] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const done = matched.length === lessonVocab.length;

  const pickImage = (vi) => {
    if (selWord === null || matched.includes(vi)) return;
    if (vi === selWord) {
      matched.length + 1 === lessonVocab.length ? winSound() : dingSound();
      setMatched(m => [...m, vi]);
      setSelWord(null);
      setWrong(null);
    } else {
      buzzSound();
      setWrong(vi);
      setTimeout(() => setWrong(null), 700);
    }
  };

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar />
      <div className="container">
        <div className="quiz-progress">
          <span className="lab">طابقت {matched.length} من {lessonVocab.length}</span>
          <div className="bar"><i style={{ width: (matched.length / lessonVocab.length) * 100 + '%', background: 'var(--green)' }} /></div>
          <button className="hint-btn" onClick={() => setShowHint(h => !h)}>💡 تلميح</button>
        </div>

        {showHint && (
          <div className="mascot" style={{ marginTop: 16 }}>
            <img src="/img/owl.png" alt="" />
            <div className="b">جرّب أن تنطق الكلمة بصوت عالٍ قبل اختيار صورتها — واسأل نفسك: هل هي حاجة أم رغبة؟</div>
          </div>
        )}

        <div className="card activity-card" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>اضغط الكلمة ثم اضغط صورتها الصحيحة</h2>
          <div className="en">Tap the word, then tap its picture</div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
            {lessonVocab.map((v, wi) => (
              <button
                key={v.ar}
                className={'option' + (selWord === wi ? ' selected' : '') + (matched.includes(wi) ? ' correct' : '')}
                disabled={matched.includes(wi)}
                onClick={() => { setSelWord(wi); playClip(v.audio); }}
                style={{ flex: '1 1 150px', justifyContent: 'center' }}
              >
                🔊 {v.ar}
                <span style={{ fontSize: 10.5, color: 'var(--mute)', direction: 'ltr' }}>{v.en}</span>
              </button>
            ))}
          </div>

          <div className="games-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 22 }}>
            {IMGS.map(vi => {
              const v = lessonVocab[vi];
              const ok = matched.includes(vi);
              return (
                <button
                  key={v.ar}
                  onClick={() => pickImage(vi)}
                  style={{
                    border: '3px solid ' + (ok ? 'var(--green)' : wrong === vi ? 'var(--danger)' : 'var(--line)'),
                    borderRadius: 16, overflow: 'hidden', background: 'var(--white)', padding: 0,
                    opacity: ok ? 0.85 : 1, position: 'relative',
                  }}
                >
                  <img loading="lazy" decoding="async" src={v.img} alt="" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
                  {ok && (
                    <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(240,253,244,0.7)', fontSize: 30 }}>
                      ✅
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {done && (
            <div className="explain-box ok" style={{ marginTop: 24 }}>
              <img src="/img/owl.png" alt="" />
              <div>
                <span className="h">🎉 أحسنت! طابقت كل الكلمات</span>
                أتقنت مفردات الحاجات الأساسية — جاهز لعرض نتيجتك.
              </div>
            </div>
          )}

          <div className="activity-nav">
            <div className="spacer" />
            {done
              ? <button className="btn btn-primary" onClick={() => nav('/result')}>عرض النتيجة ←</button>
              : <span style={{ fontSize: 12.5, color: 'var(--mute)', fontWeight: 700 }}>
                  {selWord !== null ? 'الآن اضغط الصورة المناسبة' : 'ابدأ باختيار كلمة'}
                </span>}
          </div>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}

