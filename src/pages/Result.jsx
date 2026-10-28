import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { StatsBar, Ring, FooterStrip } from '../components.jsx';
import { winSound } from '../sounds.js';
import { showToast } from '../toast.js';

const STARS = [
  { x: '8%', y: '18%' }, { x: '20%', y: '70%' }, { x: '45%', y: '10%' },
  { x: '72%', y: '75%' }, { x: '90%', y: '22%' }, { x: '60%', y: '85%' },
];

/* قطع الكونفيتي — مواضع وألوان وإيقاعات مُخرجة مسبقاً (بلا عشوائية وقت الرندر) */
const CONFETTI = [
  [4, '#f59e0b', 0, 2.4, 480], [12, '#16a34a', 0.15, 2.8, 620], [21, '#ec4899', 0.05, 2.5, 380],
  [30, '#1d6fe0', 0.25, 2.9, 700], [38, '#7c3aed', 0.1, 2.3, 420], [47, '#f59e0b', 0.3, 2.7, 560],
  [55, '#16a34a', 0.02, 2.5, 460], [63, '#ec4899', 0.2, 3, 640], [71, '#1d6fe0', 0.08, 2.4, 500],
  [79, '#7c3aed', 0.28, 2.8, 580], [87, '#f59e0b', 0.12, 2.6, 440], [94, '#16a34a', 0.22, 2.9, 660],
  [26, '#0891b2', 0.35, 3.1, 720], [68, '#0891b2', 0.4, 3.2, 680],
];

export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {CONFETTI.map(([x, c, w, d, r], i) => (
        <i key={i} style={{ insetInlineStart: x + '%', background: c, '--cw': w + 's', '--cd': d + 's', '--cr': r + 'deg' }} />
      ))}
    </div>
  );
}

/* محرك التكيف بالقواعد v1 — النتيجة الفعلية تحدد الخطوة المقترحة
   (نفس القواعد التي سينفذها الباك إند لاحقاً) */
function adaptivePlan(pct) {
  if (pct < 60) return {
    verdict: 'محاولة طيبة!', verdictEn: 'Good try!',
    to: '/support', label: '🛟 موارد الدعم ومعلمك', labelEn: 'Support resources', color: 'var(--teal)',
    why: `لأن نتيجتك ${pct}٪ — راجع موارد الدعم أو اسأل معلمك، ثم أعد المحاولة.`,
  };
  if (pct < 90) return {
    verdict: 'أحسنت!', verdictEn: 'Well done!',
    to: '/lesson', label: 'الانتقال إلى التالي ←', labelEn: 'Continue to Next', color: 'var(--brand)',
    why: `نتيجتك ${pct}٪ جيدة — تابع درسك، وراجع الملاحظات في «خطوتك التالية».`,
  };
  return {
    verdict: 'ممتاز!', verdictEn: 'Excellent!',
    to: '/challenges', label: '⚡ جرّب التحديات!', labelEn: 'Try the Challenges!', color: 'var(--purple)',
    why: `نتيجتك ${pct}٪ رائعة — جرّب تحديات الأسبوع لأنك جاهز لمستوى أصعب!`,
  };
}

export default function Result() {
  const { state } = useLocation();
  // only the result of a real activity / story (sent in the navigation state) — no result: back to the path
  const pct = state?.pct ?? 0;
  const plan = adaptivePlan(pct);
  // بعد نشاط حقيقي: الزر الرئيسي دائماً «النشاط التالي» (next_step من الباك اند) — وإعادة المحاولة زر مستقل بجانبه
  if (state?.next) Object.assign(plan, {
    to: state.next, label: 'النشاط التالي ←', labelEn: 'Next Activity', color: 'var(--brand)',
    why: pct < 60
      ? `نتيجتك ${pct}٪ — يمكنك إعادة المحاولة لتقوّي فهمك، أو المتابعة إلى النشاط التالي.`
      : `نتيجتك ${pct}٪ — ${pct >= 90 ? 'رائعة! ' : ''}تابع إلى خطوتك التالية في المسار.`,
  });
  const story = state?.story;                    // نتيجة قصة (POST /stories/:id/submit)
  if (story) Object.assign(plan, {
    verdict: story.rating?.label || plan.verdict, verdictEn: story.rating?.label_en || plan.verdictEn,
    ...(state.next ? { label: 'القصة التالية ←', labelEn: 'Next Story', color: 'var(--brand)', to: state.next, why: `نتيجتك ${pct}٪ — تابع إلى القصة التالية في مكتبتك.` }
      : { label: 'العودة لمكتبة القصص ←', labelEn: 'Story Library', color: 'var(--brand)', to: '/library', why: `نتيجتك ${pct}٪ — اختر قصتك التالية من المكتبة.` }),
  });
  const reward = state?.reward;                  // مكافأة الباك اند: points_earned, total_points, level_up…
  const pts = reward ? reward.points_earned ?? 0 : 0;
  // stars from the result itself (the mastery scale: 90+ / 75+ / 50+)
  const stars = story ? story.rating?.stars ?? 0 : pct >= 90 ? 3 : pct >= 75 ? 2 : pct >= 50 ? 1 : 0;
  useEffect(() => {
    if (!state) return;
    if (reward?.level_up) { winSound(); showToast(`مبروك! وصلت إلى المستوى ${reward.current_level ?? reward.level ?? ''}`, '🎉'); }
    else if (pct >= 60 && pts > 0) { winSound(); showToast(`+${pts} نقطة! أُضيفت لرصيدك`); }
    else if (pct >= 60) winSound();
    else showToast('أكملت النشاط — نشاط الدعم بانتظارك', '💪');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!state) return <Navigate to="/path" replace />;
  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="result-hero">
          {pct >= 60 && <Confetti />}
          {STARS.map((s, i) => (
            <span key={i} className="star" style={{ insetInlineStart: s.x, top: s.y }}>{i % 2 ? '⭐' : '🎉'}</span>
          ))}
          <div className="result-top">
            <img className="celebrate pop-in" src="/img/wellDone.png" alt="" style={{ '--rd': '0.1s' }} />
            <div className="mid">
              <h1 className="reveal" style={{ '--rd': '0.35s' }}>{story ? 'أحسنت! لقد أكملت القصة' : 'أحسنت! لقد أكملت النشاط'}</h1>
              <div className="en reveal" style={{ '--rd': '0.45s' }}>{story ? 'Great job! You finished the story' : 'Great job! You completed the activity'}</div>
              <div className="reveal" style={{ '--rd': '0.55s', fontWeight: 800, color: 'var(--ink2)', marginTop: 8 }}>
                التغذية الراجعة <span style={{ fontSize: 11, color: 'var(--mute)' }}>· Feedback</span>
              </div>
            </div>
            <div className="pop-in" style={{ display: 'grid', placeItems: 'center', '--rd': '0.15s' }}>
              <Ring pct={pct} size={150} stroke={13} color="var(--purple)">
                <div style={{ color: 'var(--brand-ink)' }}>
                  {pct}%
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)' }}>{plan.verdict}</div>
                  <div style={{ fontSize: 9, fontWeight: 400 }}>{plan.verdictEn}</div>
                </div>
              </Ring>
              <div className="ring-stars reveal" style={{ '--rd': '0.7s' }}>{'⭐'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars))}</div>
            </div>
          </div>

          <div className="result-stats">
            <div className="result-stat">
              <img src="/img/target2.png" alt="" />
              <div className="n">{pct}%</div>
              <div className="l">دقة الإجابات</div>
              <div className="e">Accuracy</div>
            </div>
            <div className="result-stat">
              <img src="/img/stopwatch.png" alt="" />
              <div className="n">{state?.time ?? '—'}</div>
              <div className="l">الوقت المستغرق</div>
              <div className="e">Time Spent</div>
            </div>
            <div className="result-stat">
              <img src="/img/clipboard.png" alt="" />
              <div className="n" style={{ direction: 'rtl' }}>{state?.correct ?? '—'}</div>
              <div className="l">إجابات صحيحة</div>
              <div className="e">Correct Answers</div>
            </div>
            <div className="result-stat">
              <img src="/img/points.png" alt="" />
              <div className="n">+{pts}</div>
              <div className="l">نقاط كسبتها</div>
              <div className="e">Points Earned</div>
            </div>
          </div>
        </div>

        {story && !story.no_questions && (story.did_well?.length > 0 || story.to_improve?.length > 0) && (
          <div className="result-cols reveal" style={{ '--rd': '1.15s' }}>
            <div className="card result-info">
              <div className="badges-head">
                <div><h3>✅ ما الذي أتقنته اليوم</h3><div className="en">What you did well</div></div>
                <img className="side-ill" src="/img/clipboard.png" alt="" />
              </div>
              <div className="sw-box good" style={{ marginTop: 14 }}>
                <ul>{story.did_well?.length ? story.did_well.map(m => <li key={m.key}>✔ {m.label} — {m.correct}/{m.total}</li>) : <li>واصل — ستظهر هنا نقاط قوتك</li>}</ul>
              </div>
            </div>
            <div className="card result-info">
              <div className="badges-head">
                <div><h3>⬆ خطواتك التالية للتحسين</h3><div className="en">Your next improvement steps</div></div>
                <img className="side-ill" src="/img/target2.png" alt="" />
              </div>
              <div className="sw-box bad" style={{ marginTop: 14, background: 'var(--gold-soft)' }}>
                <ul>{story.to_improve?.length ? story.to_improve.map(m => <li key={m.key}>👣 {m.label} — {m.correct}/{m.total}</li>) : <li>رائع! لا شيء يحتاج تحسيناً الآن 🌟</li>}</ul>
              </div>
            </div>
          </div>
        )}

        <div className="result-cols reveal" style={{ marginTop: 26, '--rd': '1.35s' }}>
          {/* إنجاز جديد عند التفوق — وتشجيع البومة عند التعثر (لا شارات على نتيجة ضعيفة) */}
          {reward?.level_up ? (
            <div className="card result-info unlock-card">
              <div className="badges-head">
                <div>
                  <h3>🎁 إنجاز جديد</h3>
                  <div className="en">New Achievement</div>
                </div>
              </div>
              <div className="unlock-body">
                <img src="/img/shield.png" alt="" className="pop-in" style={{ '--rd': '1.6s' }} />
                <div>
                  <div className="t">{`المستوى ${reward.level ?? reward.current_level}`}</div>
                  <div className="e">Level Up!</div>
                  <div className="d">{`مبروك! وصلت إلى المستوى ${reward.level ?? reward.current_level} — واصل جمع النقاط.`}</div>
                  <Link to="/badges" className="link" style={{ fontSize: 12.5 }}>شاهد شاراتك ←</Link>
                </div>
              </div>
            </div>
          ) : pct >= 90 ? null : (
            <div className="card result-info" style={{ borderTop: '4px solid var(--teal)' }}>
              <div className="badges-head">
                <div>
                  <h3>💪 لا بأس أبداً</h3>
                  <div className="en">Keep going!</div>
                </div>
              </div>
              <div className="mascot" style={{ marginTop: 12 }}>
                <img src="/img/owl.png" alt="" />
                <div className="b">
                  {pct < 60
                    ? 'التعثر جزء من التعلم! أعد المحاولة وسترى الفرق بنفسك — أو تابع وارجع لها لاحقاً.'
                    : 'اقتربت من الممتاز! أعد المحاولة لترفع نتيجتك.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* التوجيه التكيفي — الخطوة المقترحة تتغير حسب نتيجتك الفعلية */}
        <div className="adaptive-strip reveal" style={{ '--rd': '1.45s', borderColor: plan.color }}>
          <span className="tagA" style={{ background: plan.color }}>🧭 مسار يقترح لك</span>
          <div className="why">{plan.why}</div>
        </div>

        {/* شريط الإجراءات الختامي */}
        <div className="result-actions reveal" style={{ '--rd': '1.5s' }}>
          <Link to={state?.retry || '/path'} className="btn btn-ghost btn-col">
            <span>{story ? '📖 إعادة القراءة' : '🔁 إعادة المحاولة'}</span>
            <span className="sub">Retry</span>
          </Link>
          <Link to="/challenges" className="btn btn-ghost btn-col">
            <span>🎮 تدريب سريع</span>
            <span className="sub">Quick Practice</span>
          </Link>
          <Link to={plan.to} className="btn btn-primary btn-col" style={{ flex: 1.4, background: plan.color }}>
            <span>{plan.label}</span>
            <span className="sub">{plan.labelEn}</span>
          </Link>
        </div>
      </div>
      <FooterStrip
        ar="نتيجة رائعة! كل نشاط تنهيه يبني مهاراتك خطوة خطوة"
        en="Great result! Every activity builds your skills step by step."
      />
    </div>
  );
}
