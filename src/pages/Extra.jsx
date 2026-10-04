import { useState } from 'react';
import { Logo } from '../components.jsx';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { dingSound, buzzSound, winSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* «أحتاج مساعدة» (زر داخل المهارات الأربع) والتحدي (خطوة 7 برحلة الدرس)
   المساعدة: أسهل + التلميح مفتوح دائماً · التحدي: أصعب + مؤقت وبلا تلميح */
const MODES = {
  support: {
    ar: 'أحتاج مساعدة', en: 'I Need Help — Support', color: 'var(--teal)',
    q: 'اختر الكلمة الصحيحة: نقرأ أسماء الأطباق من ……',
    options: ['قائمة الطعام', 'الكرسي', 'النافذة'],
    correct: 0,
    hint: 'هي التي أعطاها النادل لأحمد أول ما جلس — فيها الأسماء والأسعار!',
  },
  challenge: {
    ar: 'أنشطة التحدي', en: 'Challenge Activities', color: 'var(--purple)',
    q: 'رتّب ذهنياً ثم اختر الجملة الأصح والأكمل:',
    options: [
      'أودّ أن أطلب أرزاً بالدجاج وعصير برتقال من فضلك',
      'أريد أرز ودجاج وعصير هات',
      'أن أطلب أود أرزاً',
    ],
    correct: 0,
  },
};

export default function Extra() {
  const { mode } = useParams();
  const nav = useNavigate();
  const M = MODES[mode];
  const [sel, setSel] = useState(null);
  const [checked, setChecked] = useState(false);
  if (!M) return <Navigate to="/lesson" replace />;
  const isCorrect = sel === M.correct;

  const check = () => {
    if (sel === null) return;
    setChecked(true);
    sel === M.correct ? dingSound() : buzzSound();
  };
  const finish = () => {
    winSound();
    showToast(mode === 'challenge' ? 'تحدٍّ مكتمل! أنت مميز' : 'أحسنت! الدعم قوّاك', mode === 'challenge' ? '🏆' : '💪');
    nav('/lesson');
  };

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <div className="focus-bar">
        <div className="container in">
        <Logo h={50} />
          <div className="title">
            <div className="t">{M.ar} · احتياجاتنا ورغباتنا</div>
            <div className="e">{M.en}</div>
          </div>
          <Link to="/lesson" className="focus-exit">خروج ⎋</Link>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 860 }}>
        {mode === 'challenge' && (
          <div className="quiz-progress" style={{ marginTop: 26 }}>
            <span className="lab">⚡ وضع التحدي</span>
            <div className="spacer" style={{ flex: 1 }} />
            <span className="pts" style={{ color: 'var(--purple)', fontWeight: 900 }}>⏱ 02:00</span>
          </div>
        )}

        {mode === 'support' && (
          <div className="mascot" style={{ marginTop: 26 }}>
            <img src="/img/owl.png" alt="" />
            <div className="b"><b>تلميحك جاهز من البداية:</b> {M.hint}</div>
          </div>
        )}

        <div className="card activity-card" style={{ marginTop: 18, borderTop: '4px solid ' + M.color }}>
          <h2 style={{ marginTop: 0 }}>{M.q}</h2>
          <div className="options" style={{ gridTemplateColumns: '1fr' }}>
            {M.options.map((o, oi) => {
              let cls = 'option';
              if (!checked && sel === oi) cls += ' selected';
              if (checked && oi === M.correct) cls += ' correct';
              if (checked && sel === oi && oi !== M.correct) cls += ' wrong';
              return (
                <button key={o} className={cls} disabled={checked} onClick={() => setSel(oi)}>
                  <span className="key">{['أ', 'ب', 'ج'][oi]}</span>{o}
                </button>
              );
            })}
          </div>

          {checked && (
            <div className={'explain-box ' + (isCorrect ? 'ok' : 'no')}>
              <img src="/img/owl.png" alt="" />
              <div>
                <span className="h">{isCorrect ? 'ممتاز!' : 'قريبة — جرّب مرة أخرى لاحقاً'}</span>
                {mode === 'support'
                  ? 'قائمة الطعام هي التي نقرأ منها الأطباق — صرت جاهزاً تكمل درسك بثقة.'
                  : 'الجملة الكاملة المهذبة تجمع: أودّ أن + الطلب + من فضلك.'}
              </div>
            </div>
          )}

          <div className="activity-nav">
            <div className="spacer" />
            {!checked
              ? <button className="btn btn-primary" onClick={check} style={{ opacity: sel === null ? 0.5 : 1 }}>تحقق من إجابتي</button>
              : <button className="btn btn-primary" onClick={finish}>العودة لرحلة الدرس ←</button>}
          </div>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
