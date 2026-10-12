import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatsBar, Ring, SecHead, FooterStrip, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { realImg } from '../QuestionBody.jsx';
import { clickSound } from '../sounds.js';

/* التحديات والألعاب — GET /challenges?category= (تحدي الأسبوع + التحديات + الألعاب + الإحصائيات)
   تفاصيل التحدي: GET /challenges/:key · اللعب: /play?game=:id */

const CH_LOOK = {
  weekly_tasks:     { ico: '/img/trophy.png',     color: 'var(--brand)' },
  daily_vocabulary: { ico: '/img/flashcards.png', color: 'var(--green)' },
  focus:            { ico: '/img/target2.png',    color: 'var(--purple)' },
  consistency:      { ico: '/img/flame.png',      color: 'var(--orange)' },
  games:            { ico: '/img/gamepad.png',    color: 'var(--pink)' },
};
const GAME_IMG = { memory_match: '/img/scene-cards.png', word_builder: '/img/needs-words.png', drag_drop: '/img/scene-market.png', puzzle: '/img/scene-story.png', speed_quiz: '/img/scene-discover.png', custom: '/img/scene-garden.png' };
const gameImg = (g) => realImg(g?.image) || GAME_IMG[g?.game_type] || '/img/scene-cards.png';
const ST_AR = { completed: 'اكتمل ✓', in_progress: 'جارٍ', not_started: 'لم يبدأ' };

/* تفاصيل تحدٍّ — طريقة الحساب + أنشطة مقترحة + آخر 4 أسابيع */
function ChallengeDetails({ k, onClose }) {
  const nav = useNavigate();
  const { data: D, error } = useApi(() => api.challenge(k), [k]);
  const L = CH_LOOK[k] || CH_LOOK.weekly_tasks;
  const open = (s) => {
    clickSound();
    if (s.game_id) return nav('/play?game=' + s.game_id);
    nav(`/quiz/run?lesson=${s.lesson_id ?? ''}&activity=${s.activity_id}&library=1`);
  };
  return (
    <div className="card" style={{ marginTop: 18, borderTop: `4px solid ${L.color}`, padding: '22px 26px' }}>
      {error && <Empty t={error.message} e="Could not load challenge" />}
      {!D ? null : <>
        <div className="badges-head">
          <div>
            <h3>{D.challenge.icon} {D.challenge.title}</h3>
            <div className="en">{D.challenge.goal} · باقي {D.week.days_left} أيام في الأسبوع</div>
          </div>
          <button className="btn-sm" onClick={() => { clickSound(); onClose(); }}>✕ إغلاق</button>
        </div>
        <div className="lesson-foot" style={{ paddingTop: 14 }}>
          <span className="pct">{D.challenge.current}/{D.challenge.target}</span>
          <div className="bar"><i style={{ width: D.challenge.progress_percentage + '%', background: L.color }} /></div>
          <span className="pct">🎁 {D.challenge.reward_points} نقطة{D.challenge.reward_given ? ' ✓' : ''}</span>
        </div>
        {D.challenge.accuracy_percentage != null && <div className="eng-note" style={{ marginTop: 6 }}>دقتك هذا الأسبوع: {D.challenge.accuracy_percentage}٪ (المطلوب {D.challenge.required_accuracy}٪)</div>}
        {D.how_it_counts && <div className="tip-strip" style={{ marginTop: 14 }}><img src="/img/bulb.png" alt="" /><div><div className="t">كيف يُحسب؟</div><div className="e">{D.how_it_counts}</div></div></div>}

        {D.suggestions?.length > 0 && <>
          <SecHead ico="/img/target.png" ar="ابدأ من هنا" en="Suggested to move this challenge" />
          {D.suggestions.map(s => (
            <div className="act-row" key={(s.game_id ? 'g' : 'a') + (s.game_id || s.activity_id)} style={{ '--edge': L.color }}>
              <div className="ico" style={{ background: 'var(--lav-soft)' }}><img src={s.game_id ? '/img/gamepad.png' : '/img/clipboard.png'} alt="" /></div>
              <div className="body">
                <h4>{s.title}</h4>
                <div className="d">{[s.type === 'game' ? 'لعبة' : s.type, s.duration_minutes && s.duration_minutes + ' دقيقة'].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="act" style={{ minWidth: 84, textAlign: 'center' }}><button className="btn-sm pink" onClick={() => open(s)}>ابدأ</button></div>
            </div>
          ))}
        </>}

        {D.history?.length > 0 && (
          <div className="unit-meta-chips" style={{ marginTop: 16 }}>
            {D.history.map(h => (
              <span key={h.week_start} className="chip" style={h.completed ? { background: 'var(--green-soft)', color: 'var(--green-deep)' } : undefined}>
                أسبوع {new Date(h.week_start).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}: {h.completed ? `✓ +${h.points}` : '—'}
              </span>
            ))}
          </div>
        )}
      </>}
    </div>
  );
}

export default function Challenges() {
  const nav = useNavigate();
  const [category, setCategory] = useState('all');
  const [openKey, setOpenKey] = useState(null);
  const { data: D, error } = useApi(() => api.challenges({ category }), [category]);
  const W = D?.weekly_challenge;
  const G = D?.games || {};
  const S = D?.stats || {};
  const play = (g) => { clickSound(); nav('/play?game=' + g.id); };
  const stats = [
    { ar: 'ألعاب لعبتها', en: 'Games Played', n: S.games_played ?? 0, ico: '/img/target.png' },
    { ar: 'أفضل نتيجة', en: 'Best Score', n: S.best_percentage != null ? Math.round(S.best_percentage) + '%' : '—', ico: '/img/badge-reader.png' },
    { ar: 'نقاط مكتسبة', en: 'Points Earned', n: Math.round(S.points_earned ?? 0), ico: '/img/points.png' },
  ];

  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="challenge-hero">
          <div className="img"><img src="/img/scene-discover.png" alt="" /></div>
          <div>
            <h1>التحديات والألعاب</h1>
            <div className="en-sub" style={{ color: 'rgba(255,255,255,0.8)' }}>Challenges &amp; Games</div>
            <p>تحدَّ نفسك والعب — كل لعبة تُتقنها تقرّبك من إكمال تحدياتك!</p>
            <p style={{ fontSize: 11, opacity: 0.8 }}>Challenge yourself and play — every game completes your challenges!</p>
          </div>
          {W && (
            <div className="week" onClick={() => { clickSound(); setOpenKey(W.key); }} style={{ cursor: 'pointer' }} title="تفاصيل التحدي">
              <div className="t">{W.title}</div>
              <div className="e">{W.title_en}</div>
              <div style={{ marginTop: 10, display: 'grid', placeItems: 'center' }}>
                <Ring pct={W.progress_percentage} size={86} stroke={9} />
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink2)', marginTop: 8 }}>
                {W.status === 'completed' ? `🎉 أكملته! +${W.reward_points}` : `أنجزت ${W.current} من ${W.target} مهمة`}
              </div>
              {D?.week && <div style={{ fontSize: 10.5, color: 'var(--mute)', marginTop: 2 }}>باقي {D.week.days_left} أيام</div>}
            </div>
          )}
        </div>
        {error && <Empty t={error.message} e="Could not load challenges" />}

        <SecHead ico="/img/target.png" ar="التحديات الحالية" en="Current Challenges" />
        <div className="challenges-grid">
          {(D?.challenges || []).map(c => {
            const L = CH_LOOK[c.key] || CH_LOOK.weekly_tasks;
            return (
              <div className="chal-card" key={c.key} onClick={() => { clickSound(); setOpenKey(openKey === c.key ? null : c.key); }}
                style={{ cursor: 'pointer', outline: openKey === c.key ? `2px solid ${L.color}` : undefined }}>
                <div className="head">
                  <img src={L.ico} alt="" />
                  <div>
                    <h4>{c.title}</h4>
                    <div className="en">{c.title_en}</div>
                  </div>
                </div>
                <div className="d">{c.goal}</div>
                <div className="en2">{c.goal_en}</div>
                <div className="cnt">
                  <span>{c.current}/{c.target}</span>
                  <span style={{ fontSize: 11, color: c.status === 'completed' ? 'var(--green-deep)' : 'var(--mute)' }}>{ST_AR[c.status]}</span>
                </div>
                <div className="bar thin"><i style={{ width: c.progress_percentage + '%', background: L.color }} /></div>
                <span className="pts">🎁 {c.reward_points} نقطة {c.reward_given ? '— حصلت عليها ✓' : 'عند الاكتمال'}</span>
              </div>
            );
          })}
        </div>
        {openKey && <ChallengeDetails k={openKey} onClose={() => setOpenKey(null)} />}

        <div className="grid-main">
          <div className="col">
            <SecHead ico="/img/gamepad.png" ar="الألعاب التعليمية" en="Educational Games — العب لتُنجز تحدياتك" />
            {G.new_game && (
              <a href="#!" onClick={(e) => { e.preventDefault(); play(G.new_game); }} className="adaptive-strip" style={{ borderColor: 'var(--green)', marginTop: 0, marginBottom: 14 }}>
                <span className="tagA" style={{ background: 'var(--green)' }}>🎮 لعبة جديدة</span>
                <div className="why">{G.new_game.message || G.new_game.title} <b style={{ color: 'var(--green-deep)' }}>العب ←</b></div>
              </a>
            )}
            <div className="filters" style={{ marginTop: 0 }}>
              {(G.categories || []).map(f => (
                <button key={f.key} className={'filter' + (category === f.key ? ' active' : '')} onClick={() => { clickSound(); setCategory(f.key); }}>
                  <span>{f.label} ({f.count})<span className="en">{f.label_en}</span></span>
                </button>
              ))}
            </div>
            {D && !G.items?.length && <Empty t="لا توجد ألعاب في هذا القسم بعد" e="No games here yet" />}
            <div className="games-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {(G.items || []).map(g => (
                <div key={g.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="game-card" onClick={() => play(g)} style={{ cursor: 'pointer' }}>
                    <img className="bg" loading="lazy" decoding="async" src={gameImg(g)} alt="" />
                    <div className="overlay" />
                    <span className="play-btn">▶</span>
                    {g.rating != null && <span className="rate" style={{ top: 12, bottom: 'auto' }}>★ {g.rating}</span>}
                    {g.is_new && <span className="rate" style={{ top: 12, bottom: 'auto', insetInlineStart: 12, insetInlineEnd: 'auto', background: 'var(--green)', color: '#fff' }}>جديدة</span>}
                  </div>
                  <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '12px 14px', textAlign: 'center', flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{g.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--mute2)' }}>{g.game_type_label} · {g.category_label}</div>
                    {g.my_best_percentage != null && <div style={{ fontSize: 11, color: 'var(--green-deep)', fontWeight: 800, marginTop: 4 }}>أفضل نتيجة: {Math.round(g.my_best_percentage)}%</div>}
                    <button className="btn-sm" onClick={() => play(g)} style={{ marginTop: 10, width: '100%' }}>{g.my_plays ? 'العب مجدداً' : 'العب'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col">
            {G.featured && (
              <div className="side-card featured-game" onClick={() => play(G.featured)} style={{ cursor: 'pointer' }}>
                <span className="tagf">اللعبة المميّزة</span>
                <div className="img"><img src={gameImg(G.featured)} alt="" /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="t">{G.featured.title}</div>
                  {G.featured.rating != null && <div className="rate">★ {G.featured.rating}</div>}
                </div>
              </div>
            )}
            <div className="side-card stats-list">
              <div className="badges-head">
                <div>
                  <h3>إحصائيات الألعاب</h3>
                  <div className="en">Games Stats</div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                {stats.map(s => (
                  <div className="row" key={s.ar}>
                    <img src={s.ico} alt="" />
                    <div>
                      <div className="t">{s.ar}</div>
                      <div className="e">{s.en}</div>
                    </div>
                    <div className="n">{s.n}</div>
                  </div>
                ))}
              </div>
            </div>
            <Link to="/activities?tab=library" className="side-card" style={{ display: 'block', textAlign: 'center', fontWeight: 800 }}>📚 كل أنشطة المنصة ←</Link>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="كل تحدٍّ تخطوه يقرّبك من هدفك! العب، تعلّم، وكن أفضل من نفسك"
        en="Every challenge brings you closer to your goal! Play, learn, and beat your best."
      />
    </div>
  );
}
