import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, Ring, SecHead, FooterStrip, Empty } from '../components.jsx';
import { SKILLS } from '../data.js';
import { realImg } from '../QuestionBody.jsx';
import { useHome, SKILL_KEY, unitArt } from '../api/useApi.js';
import { clickSound, playClip } from '../sounds.js';
import { AccuracyDonut } from './Reports.jsx';
import { Sparkline, SPARK_VARIANT } from '../Sparkline.jsx';

/* دعم النطق — كلمة اليوم بنقحرتها ونصيحة المخرج */
function Pronunciation() {
  const w = useHome().home?.vocabulary?.[0];
  if (!w) return null;
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
        <button className="audio-play" style={{ width: 52, height: 52, flexShrink: 0 }} onClick={() => playClip(w.audio)} aria-label="استمع للنطق">🔊</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>{w.word}</div>
          <div style={{ fontSize: 13, color: 'var(--mute)', direction: 'ltr' }}>{w.word_en}</div>
        </div>
      </div>
      {w.meaning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5, fontWeight: 700, color: 'var(--brand-ink)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px' }}>
          <span>🗣</span> {w.meaning} — استمع ثم ردّدها بصوت واضح
        </div>
      )}
    </div>
  );
}

/* مفردات اليوم — بطاقات مصورة بصوت */
function DailyVocab() {
  const lessonVocab = (useHome().home?.vocabulary || []).map(v => ({ ar: v.word, en: v.word_en, img: v.image || '/img/logo-masar.svg', audio: v.audio }));
  return (
    <>
      <SecHead ico="/img/flashcards.png" ar="مفردات اليوم" en="Today's Words" link="عرض الكل" to="/activity/vocab" />
      {!lessonVocab.length && <Empty t="لا مفردات اليوم" e="No words today" />}
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
  const usefulPhrases = (useHome().home?.useful_phrases || []).map(p => ({ ar: p.phrase ?? p.text ?? p.ar, en: p.phrase_en ?? p.text_en ?? p.en, audio: p.audio }));
  const toggleFav = (ar) => {
    clickSound();
    setFavs(f => f.includes(ar) ? f.filter(x => x !== ar) : [...f, ar]);
  };
  return (
    <>
      <SecHead ico="/img/speech.png" ar="عبارات مفيدة" en="Useful Phrases" link="عرض الكل" to="/activity/speaking" />
      {!usefulPhrases.length && <Empty t="لا عبارات بعد" e="No phrases yet" />}
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
  const h = useHome().home;
  const wp = h?.weekly_progress || { completed_tasks: 0, total_tasks: 0, percentage: 0 };
  const unitId = h?.continue_learning?.activity?.unit?.id;
  const resume = unitId ? '/unit?id=' + unitId : '/path';
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
            <Link to={resume} className="btn btn-primary btn-col">
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
          <Ring pct={Math.round(wp.percentage)} />
          <div>
            <div className="t1">تقدّم الأسبوع</div>
            <div className="te">Weekly Progress</div>
            <div className="t2">أكملت {wp.completed_tasks} مهام<br /><span style={{ fontWeight: 400, color: 'var(--mute)' }}>of {wp.total_tasks} tasks</span></div>
            <div className="ok">✓ أنت في الطريق الصحيح</div>
          </div>
        </div>
        <div className="hero-img"><img src="/img/scene-play.png" alt="" /></div>
      </div>
    </div>
  );
}

function ContinueLearning() {
  const c = useHome().home?.continue_learning;
  if (!c) return null;
  const A = c.activity;
  const L = {
    unitAr: A.unit?.name, unitEn: '', unitTag: A.type_label || 'نشاط', lessonAr: A.title, lessonEn: A.description,
    pct: Math.round(c.progress || 0), img: unitArt(A.unit?.name, A.thumbnail),
    skills: A.skill ? [{ ar: A.skill.name, color: A.skill.color, soft: A.skill.color + '1f' }] : [],
  };
  const to = A.unit?.id ? '/unit?id=' + A.unit.id : '/path';
  return (
    <>
      <SecHead ico="/img/book.png" ar="تابع التعلّم" en="Continue Learning" />
      <div className="card lesson-card">
        <div className="lesson-img">
          <img src={L.img || '/img/logo-masar.svg'} alt="" />
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
            <Link to={to} className="btn btn-primary" style={{ padding: '10px 24px' }}>تابع الآن</Link>
            <div className="bar"><i style={{ width: L.pct + '%' }} /></div>
            <span className="pct">{L.pct}٪</span>
          </div>
        </div>
      </div>
    </>
  );
}

const TASK_LOOK = [
  { color: 'var(--teal)', soft: '#e0f4f8', ico: '/img/headphones.png' },
  { color: 'var(--orange)', soft: 'var(--orange-soft)', ico: '/img/mic.png' },
  { color: 'var(--pink)', soft: 'var(--pink-soft)', ico: '/img/pencil.png', pink: true },
];
function Tasks() {
  const tasks = (useHome().home?.today_tasks || []).map((t, i) => ({
    ...TASK_LOOK[i % 3], ar: t.title, en: t.type_label, d: t.description || (t.remaining_days != null ? `متبقٍ ${t.remaining_days} يوم · ${t.duration_minutes} دقيقة` : ''),
    done: t.completed_count, of: t.total_count, pct: Math.round(t.progress || 0), cta: t.status === 'not_started' ? 'ابدأ' : 'تابع',
    to: t.type === 'activity' ? '/activities' : '/assignments',
  }));
  return (
    <>
      <SecHead ico="/img/clipboard.png" ar="مهام اليوم" en="Today's Tasks" />
      {!tasks.length && <Empty t="لا مهام اليوم" e="No tasks today" />}
      {tasks.map(t => (
        <div className="task" key={t.ar}>
          <div className="ico" style={{ background: t.soft }}><img src={t.ico} alt="" /></div>
          <div className="body">
            <h4>{t.ar}</h4>
            <div className="en">{t.en}</div>
            <div className="d">{t.d}</div>
          </div>
          <div className="prog">
            <div className="lab">{!t.done ? 'لم تبدأ بعد' : `أنجزت ${t.done} من ${t.of}`}</div>
            <div className="bar thin"><i style={{ width: t.pct + '%', background: t.color }} /></div>
          </div>
          <div className="act">
            <Link to={t.to}><button className={'btn-sm' + (t.pink ? ' pink' : '')}>{t.cta}</button></Link>
          </div>
        </div>
      ))}
    </>
  );
}

const verdictOf = (p) => (p >= 85 ? 'ممتاز' : p >= 70 ? 'جيد جداً' : p >= 55 ? 'جيد' : 'يحتاج تطوير');
function MySkills() {
  const skillProgress = (useHome().home?.skills || [])
    .map(s => ({ skill: SKILL_KEY[s.name], pct: Math.round(s.score || 0), verdict: verdictOf(s.score || 0),
      spark: (s.history || []).map(x => (typeof x === 'number' ? x : x.score ?? 0)), change: s.change || 0 }))
    .filter(s => s.skill && SKILLS[s.skill]);
  if (!skillProgress.length) return null;
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
                {(() => { const delta = sp.change; return (
                  <div className="hs-trend">
                    <span className="lbl">تفاعلك اليومي · آخر شهر</span>
                    <span className={'delta ' + (delta >= 0 ? 'up' : 'down')}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} نقطة</span>
                  </div>
                ); })()}
                <Sparkline data={sp.spark.length > 1 ? sp.spark : [sp.pct, sp.pct]} color={S.color} id={sp.skill} variant={SPARK_VARIANT[sp.skill] || 'wave'} />
                              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

const GAME_IMG = { memory_match: '/img/scene-cards.png', word_builder: '/img/needs-words.png', drag_drop: '/img/scene-market.png', puzzle: '/img/scene-story.png', speed_quiz: '/img/scene-discover.png', custom: '/img/scene-garden.png' };
function Games() {
  const games = (useHome().home?.games || []).slice(0, 4);
  if (!games.length) return null;
  return (
    <>
      <SecHead ico="/img/gamepad.png" ar="الألعاب التعليمية" en="Educational Games" link="كل الألعاب" to="/challenges" />
      <div className="games-grid">
        {games.map(g => (
          <Link to={'/play?game=' + g.id} className="game-card" key={g.id}>
            <img className="bg" loading="lazy" decoding="async" src={realImg(g.image) || GAME_IMG[g.game_type] || '/img/scene-cards.png'} alt="" />
            <div className="overlay">
              <div className="t">{g.title}</div>
              <div className="e">{g.game_type_label}</div>
            </div>
            <span className="play-btn">▶</span>
            {g.rating != null && <span className="rate">★ {g.rating}</span>}
          </Link>
        ))}
      </div>
    </>
  );
}

/* ملخص رحلتك — ودجت العميل: مستوى + XP + شارات + مدة، بجانب الرئيسية */
function JourneySummary() {
  const j = useHome().home?.journey_summary || {};
  const mins = j.total_study_minutes || 0;
  const rows = [
    { ic: '🎓', ar: 'مستواك',       en: 'Your Level',        v: j.level?.code || '—' },
    { ic: '⭐', ar: 'نقاط الخبرة',  en: 'Experience Points', v: `${j.xp ?? 0} / ${j.xp_target ?? 0} XP`, bar: j.xp_target ? Math.round((j.xp / j.xp_target) * 100) : 0 },
    { ic: '🏅', ar: 'الشارات',      en: 'Badges Earned',     v: String(j.badges_count ?? 0) },
    { ic: '⏱', ar: 'المدة الكلية', en: 'Total Study Time',  v: `${Math.floor(mins / 60)}h ${mins % 60}m` },
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
  const h = useHome().home || {};
  const ch = h.daily_challenge;
  const note = h.teacher_note;
  const badges = (h.recent_badges || []).map(b => ({ ar: b.name ?? b.title, en: b.name_en ?? b.title_en ?? '', icon: b.icon, img: b.image }));
  return (
    <div className="col">
      <JourneySummary />
      {ch && <div className="side-card challenge">
        <div className="head">
          <img src="/img/target.png" alt="" />
          <div>
            <h3>تحدي اليوم</h3>
            <div className="en">Today's Challenge</div>
          </div>
        </div>
        <div className="goal">
          {ch.icon} {ch.title} — {ch.goal}
          <span className="en" style={{ fontSize: 11, opacity: 0.85 }}>{ch.goal_en}{ch.accuracy_percentage != null ? ` · دقتك ${ch.accuracy_percentage}٪` : ''}</span>
        </div>
        <div className="cnt" style={{ direction: 'ltr' }}>{ch.current} / {ch.target}</div>
        <div className="bar"><i style={{ width: Math.round(ch.progress_percentage ?? 0) + '%' }} /></div>
        <Link to="/challenges" className="btn">{ch.status === 'completed' ? `🎉 أكملته (+${ch.reward_points})` : ch.status === 'in_progress' ? 'تابع التحدي' : 'ابدأ التحدي'}</Link>
      </div>}

      {note && <div className="side-card note-card">
        <div className="note-head">
          <img src="/img/teacher.png" alt="" />
          <div>
            <h3>ملاحظة معلمتك</h3>
            <div className="en">Teacher's Note</div>
          </div>
        </div>
        <div className="note-body">
          {note.text ?? note.note ?? note.content ?? note}
        </div>
        <div className="note-sign">{note.teacher_name ?? note.teacher?.name}</div>
      </div>}

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
        {!badges.length && <Empty t="لا شارات بعد" e="No badges yet" />}
        <div className="badges-grid">
          {badges.map(b => (
            <div className="badge-item" key={b.ar}>
              {b.img ? <img loading="lazy" decoding="async" src={b.img} alt="" /> : <span style={{ fontSize: 40, lineHeight: 1.3, display: 'block' }}>{b.icon || '🏅'}</span>}
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

