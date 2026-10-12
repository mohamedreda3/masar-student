import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsBar, Ring, SecHead, FooterStrip, Empty } from '../components.jsx';
import { Sparkline, SPARK_VARIANT } from '../Sparkline.jsx';
import { SKILLS, skillFooters } from '../data.js';
import api from '../api/client.js';
import { useApi, SKILL_KEY } from '../api/useApi.js';
import { realImg } from '../QuestionBody.jsx';
import { clickSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* مركز المهارات — GET /skills?skill_id=&tab=&days=30 (بطاقات المهارات + الشارت + التبويبات + العناصر) */

const ST_ICON = { completed: '✅', in_progress: '⏳', not_started: '⭕', locked: '🔒' };

/* action.api (رابط الباك اند) → شاشة الفرونت المقابلة */
function routeOf(apiUrl) {
  if (!apiUrl) return null;
  const u = new URL(apiUrl, 'http://x');
  const p = u.pathname.replace(/^\/(backend\/)?api\/student/, '');
  let m;
  if ((m = p.match(/^\/path\/lessons\/(\d+)\/page/))) return '/lesson?id=' + m[1];
  if ((m = p.match(/^\/path\/lessons\/(\d+)\/activities\/(\d+)/))) return `/quiz/run?lesson=${m[1]}&activity=${m[2]}`;
  if ((m = p.match(/^\/activities\/(\d+)/))) return `/quiz/run?lesson=${u.searchParams.get('lesson_id') ?? ''}&activity=${m[1]}&library=1`;
  if ((m = p.match(/^\/(assignments|exams)\/(\d+)/))) return '/assignment?id=' + m[2];
  if ((m = p.match(/^\/path\/units\/(\d+)\/exam\/sections\/(\d+)/))) return `/exam?unit=${m[1]}&section=${m[2]}`;
  if ((m = p.match(/^\/path\/units\/(\d+)\/exam/))) return '/quiz?unit=' + m[1];
  if ((m = p.match(/^\/path\/units\/(\d+)/))) return '/unit?id=' + m[1];
  return null;
}

/* شكل المهارة في التصميم (أيقونة/إنكليزي) — اللون من الـAPI أولاً */
const look = (s) => {
  const K = SKILLS[SKILL_KEY[s.name]] || {};
  return { key: SKILL_KEY[s.name] || 'reading', color: s.color || K.color || 'var(--brand)', ico: K.ico || '/img/book.png', en: s.name_en || K.en || '' };
};

export default function SkillsHub() {
  const nav = useNavigate();
  const [skillId, setSkillId] = useState(null);   // null = الافتراضي من الباك اند
  const [tab, setTab] = useState('all');
  const { data: D, error } = useApi(() => api.skills({ skill_id: skillId, tab, days: 30 }), [skillId, tab]);

  if (error) return <div className="page"><StatsBar /><div className="container"><Empty t={error.message} e="Could not load skills" /></div></div>;
  const skills = D?.skills || [];
  const sel = skills.find(s => s.is_selected) || skills[0];
  const S = sel ? look(sel) : { color: 'var(--brand)', ico: '/img/book.png', en: '' };
  const foot = skillFooters[S.key] || { ar: 'كل نشاط تنجزه يقوّي مهارتك — واصل!', en: 'Every activity builds your skill — keep going!' };

  const open = (it) => {
    clickSound();
    if (it.status === 'locked') return showToast(it.locked_reason || 'هذا العنصر مقفل — يُفتح بتكليف من معلمك', '🔒');
    const to = routeOf(it.action?.api);
    to ? nav(to) : showToast('لا يمكن فتح هذا العنصر الآن', 'ℹ️');
  };

  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>{skills.length === 4 ? 'مهاراتي الأربع' : 'مهاراتي'}</h1>
          <div className="en">My Skills</div>
        </div>
        <div className="tag">اختر مهارة لترى دروسها وتدريباتها وتحدياتها.</div>
      </div>

      <div className="container">
        {/* بطاقات المهارات — قابلة للاختيار */}
        <div className="home-skills" style={{ marginTop: 20 }}>
          {skills.map(s => {
            const K = look(s);
            const active = s.is_selected;
            // الشارت: الأيام قبل أول نتيجة = null → نبدأ من أول نتيجة
            const pts = (s.chart?.points || []).map(p => p.score).filter(v => v !== null && v !== undefined);
            const data = pts.length > 1 ? pts : pts.length === 1 ? [pts[0], pts[0]] : [0, 0];
            const gained = s.points_gained ?? 0;
            return (
              <button type="button" key={s.id} className={'home-skill' + (active ? ' active' : '')} style={{ '--sc': K.color }}
                onClick={() => { clickSound(); setSkillId(s.id); setTab('all'); }}>
                <div className="hs-side">
                  <div className="hs-head">
                    <img src={K.ico} alt="" />
                    <div>
                      <div className="t">{s.name}</div>
                      <div className="e">{K.en}</div>
                    </div>
                  </div>
                  <Ring pct={s.score ?? 0} size={96} stroke={10} color={K.color} track="var(--line2)">
                    <div style={{ color: K.color, fontWeight: 900, fontSize: 19, lineHeight: 1.1 }}>
                      {s.score != null ? Math.round(s.score) + '%' : '—'}
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--mute)' }}>{s.level?.label}</div>
                    </div>
                  </Ring>
                  <span className="go">{active ? '✓ محددة' : 'اختر ←'}</span>
                </div>
                <div className="hs-chart">
                  <div className="hs-trend">
                    <span className="lbl">تفاعلك اليومي · آخر {s.chart?.days === 30 ? 'شهر' : `${s.chart?.days ?? 30} يوماً`}</span>
                    <span className={'delta ' + (gained >= 0 ? 'up' : 'down')}>{gained >= 0 ? '▲' : '▼'} {Math.abs(gained)} نقطة</span>
                  </div>
                  {pts.length
                    ? <Sparkline data={data} color={K.color} id={'hub-' + s.id} variant={SPARK_VARIANT[K.key] || 'wave'} />
                    : <div style={{ display: 'grid', placeItems: 'center', height: 150, color: 'var(--mute)', fontSize: 13, fontWeight: 700 }}>لا توجد نتائج بعد — ابدأ أول نشاط!</div>}
                </div>
              </button>
            );
          })}
        </div>

        {sel && <>
          <SecHead ico={S.ico} ar={`أنشطتي ومهامي في مهارة ${sel.name}`} en={`My Activities & Tasks in ${S.en}`} link="عرض الكل" onLink={() => setTab('all')} />
          <div className="filters" style={{ marginTop: 0 }}>
            {(D?.tabs || []).map(t => (
              <button key={t.key} className={'filter' + (tab === t.key ? ' active' : '')} onClick={() => { clickSound(); setTab(t.key); }}>
                <span>{t.label} ({t.count})<span className="en">{t.label_en}</span></span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            {D && !D.items?.length && <Empty t="لا توجد عناصر هنا" e="Nothing here yet" />}
            {(D?.items || []).map(r => (
              <div className="act-row" key={r.kind + '-' + r.id} style={{ '--edge': S.color, opacity: r.status === 'locked' ? 0.72 : 1 }}>
                <span style={{ fontSize: 20, marginInlineStart: 12 }}>{ST_ICON[r.status] || '⭕'}</span>
                <div style={{ width: 78, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                  <img loading="lazy" decoding="async" src={realImg(r.image) || S.ico} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
                <div className="body" style={{ flex: 1 }}>
                  <h4>{r.title}</h4>
                  <div className="en">{r.title_en}</div>
                  <div className="chips" style={{ marginTop: 8 }}>
                    <span className="chip" style={{ background: 'var(--lav-soft)', color: 'var(--brand-ink)' }}>{r.kind_label}</span>
                    {r.duration_minutes ? <span className="chip" style={{ background: 'var(--line2)', color: 'var(--ink2)' }}>⏱ {r.duration_minutes} دقيقة</span> : null}
                    <span className="chip" style={{ background: r.progress_percentage > 0 ? 'var(--green-soft)' : 'var(--line2)', color: r.progress_percentage > 0 ? 'var(--green)' : 'var(--mute)' }}>
                      {r.status_label} · {Math.round(r.progress_percentage || 0)}%
                    </span>
                  </div>
                </div>
                <div style={{ minWidth: 96, textAlign: 'center' }}>
                  {r.status === 'locked'
                    ? <button className="btn-sm" onClick={() => open(r)} style={{ borderColor: 'var(--line)', color: 'var(--mute2)', cursor: 'not-allowed' }}>🔒 {r.action?.label || 'مقفل'}</button>
                    : <button className="btn-sm" onClick={() => open(r)} style={{ borderColor: S.color, color: S.color }}>{r.action?.label || 'ابدأ'} ←</button>}
                </div>
              </div>
            ))}
          </div>

          <div className="tip-strip" style={{ marginTop: 26 }}>
            <img src={S.ico} alt="" />
            <div>
              <div className="t">{foot.ar}</div>
              <div className="e">{foot.en}</div>
            </div>
          </div>
        </>}
      </div>
      <FooterStrip ar={foot.ar} en={foot.en} />
    </div>
  );
}
