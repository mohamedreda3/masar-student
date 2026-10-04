import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, Ring, SecHead, FooterStrip } from '../components.jsx';
import { student, currentLesson, tasks, games, badges, lessonVocab, usefulPhrases, pronunciationAudio, skillProgress, SKILLS } from '../data.js';
import { clickSound, playClip } from '../sounds.js';
import { AccuracyDonut } from './Reports.jsx';
import { Sparkline, SPARKS, SPARK_VARIANT } from '../Sparkline.jsx';

/* دعم النطق — كلمة اليوم بنقحرتها ونصيحة المخرج */
function Pronunciation() {
  return (
    <div className="side-card tool-card">
      <div className="head">
        <img src="/img/mic.png" alt="" />
        <div>
          <h3>دعم النطق</h3>
          <div className="en">Pronunciation Support</div>
        </div>
      </div>
      <div style={{ background: 'var(--lav-soft)', borderRadius: 14, padding: '16px 18px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="audio-play" style={{ width: 52, height: 52, flexShrink: 0 }} onClick={() => playClip(pronunciationAudio)} aria-label="استمع للنطق">🔊</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>الهواء</div>
          <div style={{ fontSize: 13, color: 'var(--mute)', direction: 'ltr' }}>[al-ha-waa']</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5, fontWeight: 700, color: 'var(--brand-ink)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px' }}>
        <span>🗣</span> الهمزة الممدودة في آخر «الهواء» — أطِل الألف قبلها
      </div>
    </div>
  );
}

/* مفردات اليوم — بطاقات مصورة بصوت */
function DailyVocab() {
  return (
    <>
      <SecHead ico="/img/flashcards.png" ar="مفردات اليوم" en="Today's Words" link="عرض الكل" to="/activity/vocab" />
      <div className="dv-grid">
        {lessonVocab.map(v => (
          <div className="dv-card" key={v.ar}>
            <div className="img"><img loading="lazy" decoding="async" src={v.img} alt="" /></div>
            <div className="ar">{v.ar}</div>
            <div className="tr">{v.en}</div>
            <button className="sound-btn" onClick={() => playClip(v.audio)} aria-label={'استمع: ' + v.ar}>🔊</button>
          </div>
        ))}
      </div>
    </>
  );
}

/* عبارات مفيدة — بصوت ومفضلة */
function UsefulPhrases() {
  const [favs, setFavs] = useState([]);
  const toggleFav = (ar) => {
    clickSound();
    setFavs(f => f.includes(ar) ? f.filter(x => x !== ar) : [...f, ar]);
  };
  return (
    <>
      <SecHead ico="/img/speech.png" ar="عبارات مفيدة" en="Useful Phrases" link="عرض الكل" to="/activity/speaking" />
      {usefulPhrases.map(p => (
        <div className="up-row" key={p.ar}>
          <button className="sound-btn" onClick={() => playClip(p.audio)} aria-label={'استمع: ' + p.ar}>🔊</button>
          <div className="txt">
            <div className="ar">{p.ar}</div>
            <div className="tr">{p.en}</div>
          </div>
          <button className={'fav-btn' + (favs.includes(p.ar) ? ' on' : '')} onClick={() => toggleFav(p.ar)} aria-label="أضف للمفضلة">
            {favs.includes(p.ar) ? '❤' : '♡'}
          </button>
        </div>
      ))}
      <div className="tip-strip">
        <img src="/img/bulb.png" alt="" />
        <span className="l">💡 نصيحة لغوية</span>
        <div>
          <div className="t">استخدم «من فضلك» و«شكراً» في طلباتك — الكلمات المهذبة تفتح القلوب!</div>
          <div className="e">Polite words open hearts — use them in your requests.</div>
        </div>
      </div>
    </>
  );
}

function Hero() {
  return (
    <div className="container">
      <div className="hero">
        <div className="hero-txt">
          <span className="hero-chip">🌟 رحلة اليوم</span>
          <h1>هيّا نُكمل رحلتك</h1>
          <svg className="path-underline" viewBox="0 0 300 26" aria-hidden="true">
            <path className="trail" d="M296 8 C 240 24, 190 2, 140 14 C 100 23, 60 6, 8 14" />
            <circle className="stop" cx="245" cy="15" r="4.5" />
            <circle className="stop" cx="140" cy="14" r="4.5" />
            <circle className="stop" cx="70" cy="12" r="4.5" />
            <path className="goal" d="M8 4 l2.6 5.3 5.9 .9 -4.2 4.1 1 5.8 -5.3 -2.7 -5.2 2.7 1 -5.8 -4.3 -4.1 5.9 -.9 z" />
          </svg>
          <div className="en-sub">Let's continue your journey</div>
          <p>تعلّم كل يوم خطوة، واكسب النقاط والشارات مع مسار.</p>
          <div className="hero-actions">
            <Link to="/lesson" className="btn btn-primary btn-col">
              <span>⏵ تابع الدرس</span>
              <span className="sub">Resume Lesson</span>
            </Link>
            <Link to="/path" className="btn btn-ghost btn-col">
              <span>رحلة اليوم</span>
              <span className="sub">Today's Path</span>
            </Link>
          </div>
        </div>
        <div className="week-card">
          <Ring pct={68} />
          <div>
            <div className="t1">تقدّم الأسبوع</div>
            <div className="te">Weekly Progress</div>
            <div className="t2">أكملت 9 مهام<br /><span style={{ fontWeight: 400, color: 'var(--mute)' }}>of 15 tasks</span></div>
            <div className="ok">✓ أنت في الطريق الصحيح</div>
          </div>
        </div>
        <div className="hero-img"><img src="/img/scene-play.png" alt="" /></div>
      </div>
    </div>
  );
}

function ContinueLearning() {
  const L = currentLesson;
  return (
    <>
      <SecHead ico="/img/book.png" ar="تابع التعلّم" en="Continue Learning" />
      <div className="card lesson-card">
        <div className="lesson-img">
          <img src="/img/scene-needs.png" alt="" />
          <span className="tag">{L.unitTag}</span>
        </div>
        <div className="lesson-body">
          <h3>{L.unitAr}</h3>
          <div className="en">{L.unitEn}</div>
          <div className="sub">{L.lessonAr}</div>
          <div className="en">{L.lessonEn}</div>
          <div className="chips">
            {L.skills.map(s => (
              <span key={s.ar} className="chip" style={{ color: s.color, background: s.soft }}>{s.ar}</span>
            ))}
          </div>
          <div className="lesson-foot">
            <Link to="/lesson" className="btn btn-primary" style={{ padding: '10px 24px' }}>تابع الآن</Link>
            <div className="bar"><i style={{ width: L.pct + '%' }} /></div>
            <span className="pct">{L.pct}٪</span>
          </div>
        </div>
      </div>
    </>
  );
}

function Tasks() {
  return (
    <>
      <SecHead ico="/img/clipboard.png" ar="مهام اليوم" en="Today's Tasks" />
      {tasks.map(t => (
        <div className="task" key={t.ar}>
          <div className="ico" style={{ background: t.soft }}><img src={t.ico} alt="" /></div>
          <div className="body">
            <h4>{t.ar}</h4>
            <div className="en">{t.en}</div>
            <div className="d">{t.d}</div>
          </div>
          <div className="prog">
            <div className="lab">{t.done === 0 ? 'لم تبدأ بعد' : `أنجزت ${t.done} من ${t.of}`}</div>
            <div className="bar thin"><i style={{ width: (t.done / t.of) * 100 + '%', background: t.color }} /></div>
          </div>
          <div className="act">
            <Link to={'/activity/' + t.skill}><button className={'btn-sm' + (t.pink ? ' pink' : '')}>{t.cta}</button></Link>
          </div>
        </div>
      ))}
    </>
  );
}

function MySkills() {
  const weakest = [...skillProgress].sort((a, b) => a.pct - b.pct)[0];
  const W = SKILLS[weakest.skill];
  return (
    <>
      <SecHead ico="/img/target2.png" ar="مهاراتي الأربع" en="My Four Skills" link="مركز المهارات" to="/skills" />
      <Link to={'/activity/' + weakest.skill} className="adaptive-strip" style={{ borderColor: W.color, marginBottom: 14 }}>
        <span className="tagA" style={{ background: W.color }}>🧭 مقترح لك اليوم</span>
        <div className="why">
          نشاط {W.ar} — لأنها مهارتك الأقل هذا الأسبوع ({weakest.pct}٪)، تدريب قصير يرفعها. <b style={{ color: W.color }}>ابدأ ←</b>
        </div>
      </Link>
      <div className="home-skills">
        {skillProgress.map(sp => {
          const S = SKILLS[sp.skill];
          return (
            <Link to={'/activity/' + sp.skill} className="home-skill" key={sp.skill} style={{ '--sc': S.color }}>
              <div className="hs-side">
                <div className="hs-head">
                  <img src={S.ico} alt="" />
                  <div>
                    <div className="t">{S.ar}</div>
                    <div className="e">{S.en}</div>
                  </div>
                </div>
                <Ring pct={sp.pct} size={96} stroke={10} color={S.color} track="var(--line2)">
                  <div style={{ color: S.color, fontWeight: 900, fontSize: 19, lineHeight: 1.1 }}>
                    {sp.pct}%<div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--mute)' }}>{sp.verdict}</div>
                  </div>
                </Ring>
                <span className="go">تدرّب ←</span>
              </div>
              <div className="hs-chart">
                {(() => { const d = SPARKS[sp.skill]; const delta = d[d.length - 1] - d[0]; return (
                  <div className="hs-trend">
                    <span className="lbl">تفاعلك اليومي · آخر شهر</span>
                    <span className={'delta ' + (delta >= 0 ? 'up' : 'down')}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} نقطة</span>
                  </div>
                ); })()}
                <Sparkline data={SPARKS[sp.skill]} color={S.color} id={sp.skill} variant={SPARK_VARIANT[sp.skill]} />
                              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function Games() {
  return (
    <>
      <SecHead ico="/img/gamepad.png" ar="الألعاب التعليمية" en="Educational Games" />
      <div className="games-grid">
        {games.map(g => (
          <Link to={g.to} className="game-card" key={g.ar}>
            <img className="bg" loading="lazy" decoding="async" src={g.img} alt="" />
            <div className="overlay">
              <div className="t">{g.ar}</div>
              <div className="e">{g.en}</div>
            </div>
            <span className="play-btn">▶</span>
            <span className="rate">★ {g.rate}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ملخص رحلتك — ودجت العميل: مستوى + XP + شارات + مدة، بجانب الرئيسية */
function JourneySummary() {
  const rows = [
    { ic: '🎓', ar: 'مستواك',       en: 'Your Level',        v: 'Year 7' },
    { ic: '⭐', ar: 'نقاط الخبرة',  en: 'Experience Points', v: '360 / 500 XP', bar: student.levelPct },
    { ic: '🏅', ar: 'الشارات',      en: 'Badges Earned',     v: '12' },
    { ic: '⏱', ar: 'المدة الكلية', en: 'Total Study Time',  v: '18h 45m' },
  ];
  return (
    <div className="side-card journey-sum">
      <div className="badges-head">
        <div>
          <h3>ملخص رحلتك</h3>
          <div className="en">Your Journey Summary</div>
        </div>
      </div>
      <div style={{ marginTop: 6 }}>
        {rows.map(r => (
          <div className="js-row" key={r.ar}>
            <span className="ic">{r.ic}</span>
            <div className="body">
              <div className="t">{r.ar}</div>
              <div className="e">{r.en}</div>
              {r.bar !== undefined && <div className="bar thin" style={{ marginTop: 6 }}><i style={{ width: r.bar + '%', background: 'var(--purple)' }} /></div>}
            </div>
            <span className="v">{r.v}</span>
          </div>
        ))}
      </div>
      <Link to="/reports" className="js-more">عرض التفاصيل · View Details ←</Link>
    </div>
  );
}

function SideColumn() {
  return (
    <div className="col">
      <JourneySummary />
      <div className="side-card challenge">
        <div className="head">
          <img src="/img/target.png" alt="" />
          <div>
            <h3>تحدي اليوم</h3>
            <div className="en">Today's Challenge</div>
          </div>
        </div>
        <div className="goal">
          أكمل 15 كلمة جديدة
          <span className="en" style={{ fontSize: 11, opacity: 0.85 }}>Learn 15 new words today</span>
        </div>
        <div className="cnt">9 / 15</div>
        <div className="bar"><i style={{ width: '60%' }} /></div>
        <Link to="/challenges" className="btn">ابدأ التحدي</Link>
      </div>

      <div className="side-card note-card">
        <div className="note-head">
          <img src="/img/teacher.png" alt="" />
          <div>
            <h3>ملاحظة معلمتك</h3>
            <div className="en">Teacher's Note</div>
          </div>
        </div>
        <div className="note-body">
          أداؤك في الاستماع ممتاز يا أحمد. ركِّز هذا الأسبوع على مهمة التحدث.
        </div>
        <div className="note-sign">{student.teacher.ar}</div>
      </div>

      {/* ابق على اطلاع — ودجت العميل: البومة تدعو لمتابعة الإشعارات */}
      <Link to="/notifications" className="side-card stay-informed">
        <span className="spark s1">✦</span>
        <span className="spark s2">🔔</span>
        <span className="spark s3">✧</span>
        <img src="/img/owl.png" alt="" className="owl" />
        <div className="t">ابقَ على اطلاع دائم!</div>
        <div className="d">لا تفوّت أي تحديث مهم.</div>
        <div className="e">Stay informed!<br />Don't miss any important updates.</div>
      </Link>

      <Pronunciation />
      <AccuracyDonut />

      <div className="side-card">
        <div className="badges-head">
          <div>
            <h3>شاراتك الأخيرة</h3>
            <div className="en">Recent Badges</div>
          </div>
          <Link to="/badges"><button className="btn-sm">عرض الكل</button></Link>
        </div>
        <div className="badges-grid">
          {badges.map(b => (
            <div className="badge-item" key={b.ar}>
              <img loading="lazy" decoding="async" src={b.img} alt="" />
              <div className="t">{b.ar}</div>
              <div className="e">{b.en}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="page">
      <StatsBar />
      <Hero />
      <div className="container">
        <div className="grid-main">
          <div className="col">
            <ContinueLearning />
            <MySkills />
            <Tasks />
            <DailyVocab />
            <UsefulPhrases />
            <Games />
          </div>
          <SideColumn />
        </div>
      </div>
      <FooterStrip
        ar="استمر في التعلّم، فكل إنجاز اليوم يصنع مستقبلك المشرق"
        en="Keep learning — every achievement today builds your bright future!"
      />
    </div>
  );
}

