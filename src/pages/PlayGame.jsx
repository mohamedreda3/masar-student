import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome } from '../api/useApi.js';
import GamePlayer from '../games.jsx';
import { clickSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* صفحة لعب لعبة من «التحديات والألعاب» — GET /games/:id → GamePlayer → POST /games/:id/play
   { score, max_score, mistakes, time_spent_seconds } → نقاط + تحديثات التحديات + اللعبة التالية */

export default function PlayGame() {
  const [qs] = useSearchParams();
  const id = qs.get('game');
  const nav = useNavigate();
  const { reload: reloadHome } = useHome();
  const { data: D, error, reload } = useApi(() => (id ? api.game(id) : Promise.resolve(null)), [id]);
  const [res, setRes] = useState(null);   // رد POST play
  const [run, setRun] = useState(0);      // إعادة اللعب
  if (!id) return <Navigate to="/challenges" replace />;

  const done = async (r) => {
    try {
      const out = await api.playGame(id, r);
      setRes(out);
      if (out.reward?.level_up) showToast(`مبروك! وصلت إلى المستوى ${out.reward.level}`, '🎉');
      else if (out.reward?.points_earned) showToast(`+${Math.round(out.reward.points_earned)} نقطة!`, '⭐');
      if (out.is_new_best && D?.game?.my_plays) showToast('رقم قياسي جديد لك! 🏆', '🏆');
      reloadHome();
    } catch (ex) { showToast(ex.message, '⚠️'); }
  };
  const again = () => { clickSound(); setRes(null); setRun(n => n + 1); reload(); };
  const G = D?.game;

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <div className="focus-bar">
        <div className="container in">
          <Logo h={50} />
          <div className="title">
            <div className="t">{G ? `${G.game_type_label} · ${G.title}` : '…'}</div>
            <div className="e">{G?.title_en || (G?.unit ? G.unit.title : '')}</div>
          </div>
          <Link to="/challenges" className="focus-exit">خروج ⎋</Link>
        </div>
      </div>
      <div className="container">
        {error && <Empty t={error.message} e="Game not available" />}
        {G && (
          <>
            <div className="quiz-progress">
              <span className="lab">{G.category_label}{G.unit ? ` · ${G.unit.title}` : ''}</span>
              <div className="bar"><i style={{ width: (G.my_best_percentage ?? 0) + '%' }} /></div>
              <span className="pts">{G.my_best_percentage != null ? `أفضل نتيجة لك: ${Math.round(G.my_best_percentage)}%` : 'أول مرة تلعبها!'}{G.rating != null ? ` · ★ ${G.rating}` : ''}</span>
            </div>
            <div className="card activity-card" style={{ marginTop: 22 }}>
              <GamePlayer key={run} game={{ ...G, instructions: G.instructions || G.description }} onDone={done} />

              {res && (
                <div className="explain-box ok" style={{ marginTop: 16 }}>
                  <img src="/img/owl.png" alt="" />
                  <div style={{ flex: 1 }}>
                    <span className="h">
                      نتيجتك {Math.round(res.play.percentage)}% · أفضل نتيجة {Math.round(res.best_percentage)}%
                      {res.reward?.points_earned ? ` · +${Math.round(res.reward.points_earned)} نقطة` : ''}
                    </span>
                    {res.activity_completed && <div>✓ أكملت كل ألعاب هذا النشاط — أُضيف لإنجازاتك في مساري</div>}
                    {(res.challenges || []).filter(c => c.status !== 'completed').slice(0, 3).map(c => (
                      <div key={c.key} style={{ fontSize: 12.5, marginTop: 4 }}>🎯 {c.title}: {c.current}/{c.target}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="activity-nav">
                <button className="btn btn-ghost" onClick={() => { clickSound(); nav('/challenges'); }}>→ كل الألعاب</button>
                <div className="spacer" />
                {res && <button className="btn btn-ghost" onClick={again}>🔁 العب مجدداً</button>}
                {res && D.next_game && <button className="btn btn-primary" onClick={() => { clickSound(); setRes(null); nav('/play?game=' + D.next_game.id); }}>اللعبة التالية: {D.next_game.title} ←</button>}
              </div>
            </div>

            {D.my_history?.length > 0 && (
              <div className="unit-meta-chips" style={{ marginTop: 16 }}>
                {D.my_history.slice(0, 6).map((h, i) => (
                  <span key={i} className="chip">{Math.round(h.percentage)}% · {h.mistakes ?? 0} أخطاء · {h.time_spent_seconds ?? '—'}ث</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
