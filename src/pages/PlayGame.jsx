import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome, usePageTitle } from '../api/useApi.js';
import GamePlayer, { GAMES } from '../games.jsx';
import { clickSound, levelSound, isMuted, setMuted } from '../sounds.js';
import { showToast } from '../toast.js';
import { catColor, engineOf, starsOf } from '../gameMeta.js';
import { Picture, SoundButton } from '../media.jsx';
import { photoOnly } from '../api/useApi.js';

/* صفحة اللعب — GameShell: هوية التصنيف · «كيف ألعب؟» · كتم · إعادة · تأكيد الخروج · شاشة احتفال
   GET /games/:id → GamePlayer → POST /games/:id/play مرة واحدة { score, max_score, mistakes, time_spent_seconds, completed } */

/* عدّ تصاعدي للأرقام */
function CountUp({ to, ms = 900 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf; const t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / ms); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <>{n}</>;
}

export default function PlayGame() {
  const [qs] = useSearchParams();
  const id = qs.get('game');
  const nav = useNavigate();
  const { reload: reloadHome } = useHome();
  const { data: D, error, reload } = useApi(() => (id ? api.game(id) : Promise.resolve(null)), [id]);
  usePageTitle(D?.game?.title && `لعبة: ${D.game.title}`);
  const [res, setRes] = useState(null);      // رد POST play
  const [mine, setMine] = useState(null);    // نتيجتي المحلية
  const [run, setRun] = useState(0);
  const [mute, setMute] = useState(isMuted());
  const [how, setHow] = useState(false);
  const [leave, setLeave] = useState(null);  // وجهة الخروج المعلّقة
  const posted = useRef(false);
  const G = D?.game;
  const E = engineOf(G?.game_type);
  const color = catColor(G?.category);
  const known = !!GAMES[G?.game_type];
  const playing = !!G && known && !mine;

  // «كيف ألعب؟» يظهر تلقائياً أول مرة لكل محرك
  useEffect(() => {
    if (!G) return;
    try { const k = 'masar-how-' + G.game_type; if (!localStorage.getItem(k)) { setHow(true); localStorage.setItem(k, '1'); } } catch { /* */ }
  }, [G?.game_type]); // eslint-disable-line react-hooks/exhaustive-deps
  // تحذير المتصفح عند المغادرة أثناء اللعب
  useEffect(() => {
    if (!playing) return;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [playing]);

  if (!id) return <Navigate to="/challenges" replace />;

  const done = async (r) => {
    setMine(r);
    if (posted.current) return;
    posted.current = true;
    try {
      const out = await api.playGame(id, { completed: true, ...r });
      setRes(out);
      if (out.is_new_best) levelSound();
      if (out.reward?.level_up) showToast(`مبروك! وصلت إلى المستوى ${out.reward.level}`, '🎉');
      else if (out.reward?.points_earned) showToast(`+${Math.round(out.reward.points_earned)} نقطة!`, '⭐');
      reloadHome();
    } catch (ex) { showToast(ex.message, '⚠️'); }
  };
  const restart = () => { clickSound(); posted.current = false; setRes(null); setMine(null); setRun(n => n + 1); };
  const again = () => { restart(); reload(); };
  const go = (to) => { clickSound(); if (playing) setLeave(to); else nav(to); };
  const toggleMute = () => { const m = !mute; setMuted(m); setMute(m); if (!m) clickSound(); };
  const pct = mine ? (mine.max_score ? Math.round((mine.score / mine.max_score) * 100) : 0) : 0;
  const stars = starsOf(mine ? pct : null);
  const howText = G?.instructions || E?.how || G?.description;

  return (
    <div className="page gs-page" style={{ '--cat': color }}>
      <div className="focus-bar gs-bar">
        <div className="container in">
          <Logo h={50} />
          <div className="title">
            <div className="t">{G ? <>{E?.ico} {G.title}</> : '…'}</div>
            <div className="e">{G?.title_en || (G?.unit ? G.unit.title : '')}</div>
          </div>
          <button type="button" className="focus-exit" onClick={() => go('/challenges')}>خروج ⎋</button>
        </div>
      </div>
      <div className="container">
        {error && <Empty t={error.message} e="Game not available" />}
        {G && (
          <>
            <div className="gs-hud">
              <span className="chip gs-chip">{E?.ico} {G.game_type_label}</span>
              <span className="chip gs-chip soft">{G.category_label}</span>
              {G.my_best_percentage != null && <span className="gs-best">🏆 أفضل نتيجة {Math.round(G.my_best_percentage)}%</span>}
              <span style={{ flex: 1 }} />
              <button type="button" className="gs-ic" title="كيف ألعب؟" onClick={() => { clickSound(); setHow(true); }}>❓</button>
              <button type="button" className="gs-ic" title={mute ? 'تشغيل الصوت' : 'كتم الصوت'} onClick={toggleMute}>{mute ? '🔇' : '🔊'}</button>
              {known && <button type="button" className="gs-ic" title="إعادة اللعبة" onClick={restart}>↺</button>}
            </div>
            {(howText || G.audio) && (
              <div className="gs-how-line">
                <SoundButton src={G.audio} size="sm" label="طريقة اللعب" />
                {howText}
              </div>
            )}

            <div className="card activity-card gs-stage">
              {known
                ? <GamePlayer key={run} shell game={G} onDone={done} />
                : <Empty t="هذه اللعبة قادمة قريباً!" e="Coming soon" d="نجهّزها لك الآن — جرّب لعبة أخرى 🎮" />}

              {mine && (
                <div className="gs-win">
                  <img src="/img/owl.png" alt="" className="gs-owl" />
                  <div className="gs-stars">{[0, 1, 2].map(k => <span key={k} className={k < stars ? 'on' : ''} style={{ animationDelay: 0.2 + k * 0.25 + 's' }}>★</span>)}</div>
                  {res?.is_new_best && <div className="gs-record">🏅 رقم قياسي جديد!</div>}
                  <div className="gs-score"><b><CountUp to={pct} /></b>%<small>{mine.score} / {mine.max_score}</small></div>
                  <div className="g-done-row">
                    {mine.mistakes > 0 && <span><b>{mine.mistakes}</b><small>أخطاء</small></span>}
                    {mine.time_spent_seconds != null && <span><b>{mine.time_spent_seconds}</b><small>ثانية</small></span>}
                    {res?.reward?.points_earned > 0 && <span><b>+<CountUp to={Math.round(res.reward.points_earned)} /></b><small>نقطة</small></span>}
                  </div>
                  {res?.activity_completed && <div className="gs-banner">🎉 أنهيت كل ألعاب النشاط!</div>}
                  {(res?.challenges || []).filter(c => c.status !== 'completed').slice(0, 2).map(c => (
                    <div key={c.key} className="qt-muted">🎯 {c.title}: {c.current}/{c.target}</div>
                  ))}
                  <div className="gs-actions">
                    <button className="btn btn-ghost gs-big" onClick={again}>🔁 العب مرة أخرى</button>
                    {D.next_game && <button className="btn btn-primary gs-big" onClick={() => { clickSound(); posted.current = false; setRes(null); setMine(null); nav('/play?game=' + D.next_game.id); }}>اللعبة التالية ←</button>}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* كيف ألعب؟ */}
      {how && G && (
        <div className="gs-sheet-bg" onClick={() => setHow(false)}>
          <div className="gs-sheet" onClick={e => e.stopPropagation()}>
            {photoOnly(G.image) || photoOnly(G.activity?.thumbnail) || photoOnly(G.unit?.image)
              ? <Picture src={photoOnly(G.image) || photoOnly(G.activity?.thumbnail) || photoOnly(G.unit?.image)} alt={G.title} className="gs-cover" />
              : <div className="gs-sheet-ico">{E?.ico || '🎮'}</div>}
            <h3>كيف ألعب؟</h3>
            <p>{howText || 'اتبع التعليمات على الشاشة.'}</p>
            {G.instructions_en && <p className="en" dir="ltr">{G.instructions_en}</p>}
            {G.audio && (
              <div className="gs-how-audio">
                <SoundButton src={G.audio} size="lg" label="طريقة اللعب" />
                <span>اسمع طريقة اللعب · Listen</span>
              </div>
            )}
            <button className="btn btn-primary gs-big" onClick={() => { clickSound(); setHow(false); }}>فهمت 👍</button>
          </div>
        </div>
      )}
      {/* تأكيد الخروج أثناء اللعب */}
      {leave && (
        <div className="gs-sheet-bg" onClick={() => setLeave(null)}>
          <div className="gs-sheet" onClick={e => e.stopPropagation()}>
            <div className="gs-sheet-ico">🚪</div>
            <h3>تخرج من اللعبة؟</h3>
            <p>لن تُحفظ هذه الجولة.</p>
            <div className="gs-actions">
              <button className="btn btn-primary gs-big" onClick={() => setLeave(null)}>أكمل اللعب</button>
              <button className="btn btn-ghost gs-big" onClick={() => { const to = leave; setLeave(null); nav(to); }}>خروج</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ height: 40 }} />
    </div>
  );
}
