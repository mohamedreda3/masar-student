import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, Ring, SecHead, FooterStrip } from '../components.jsx';
import { Sparkline, SPARKS, SPARK_VARIANT } from '../Sparkline.jsx';
import { SKILLS, skillsHub, skillFooters, skillProgress } from '../data.js';
import { clickSound } from '../sounds.js';
import { ListeningRadar } from './Reports.jsx';

/* مركز المهارات الأربع — قلب المنصة (نمط مرجع العميل) */
const TABS = ['الكل', 'درس', 'تدريب', 'مهمة', 'تحدي'];
const TAB_EN = { 'الكل': 'All', 'درس': 'Lessons', 'تدريب': 'Practice', 'مهمة': 'Tasks', 'تحدي': 'Challenges' };
const ST_ICON = { done: '✅', current: '⏳', todo: '⭕', locked: '🔒' };
const CTA = { done: 'راجع', current: 'متابعة', todo: 'ابدأ', locked: 'مقفل' };

export default function SkillsHub() {
  const [skill, setSkill] = useState('reading');
  const [tab, setTab] = useState('الكل');
  const S = SKILLS[skill];
  const rows = skillsHub[skill].filter(r => tab === 'الكل' || r.type === tab);
  const foot = skillFooters[skill];

  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>مهاراتي الأربع</h1>
          <div className="en">My Four Skills</div>
        </div>
        <div className="tag">اختر مهارة لترى دروسها وتدريباتها وتحدياتها.</div>
      </div>

      <div className="container">
        {/* بطاقات المهارات الأربع — قابلة للاختيار */}
        <div className="home-skills" style={{ marginTop: 20 }}>
          {skillProgress.map(sp => {
            const K = SKILLS[sp.skill];
            const active = skill === sp.skill;
            const d = SPARKS[sp.skill]; const delta = d[d.length - 1] - d[0];
            return (
              <button type="button" key={sp.skill} className={'home-skill' + (active ? ' active' : '')} style={{ '--sc': K.color }}
                onClick={() => { clickSound(); setSkill(sp.skill); setTab('الكل'); }}>
                <div className="hs-side">
                  <div className="hs-head">
                    <img src={K.ico} alt="" />
                    <div>
                      <div className="t">{K.ar}</div>
                      <div className="e">{K.en}</div>
                    </div>
                  </div>
                  <Ring pct={sp.pct} size={96} stroke={10} color={K.color} track="var(--line2)">
                    <div style={{ color: K.color, fontWeight: 900, fontSize: 19, lineHeight: 1.1 }}>
                      {sp.pct}%<div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--mute)' }}>{sp.verdict}</div>
                    </div>
                  </Ring>
                  <span className="go">{active ? '✓ محددة' : 'اختر ←'}</span>
                </div>
                <div className="hs-chart">
                  <div className="hs-trend">
                    <span className="lbl">تفاعلك اليومي · آخر شهر</span>
                    <span className={'delta ' + (delta >= 0 ? 'up' : 'down')}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} نقطة</span>
                  </div>
                  <Sparkline data={d} color={K.color} id={'hub-' + sp.skill} variant={SPARK_VARIANT[sp.skill]} />
                </div>
              </button>
            );
          })}
        </div>

        <SecHead ico={S.ico} ar={`أنشطتي ومهامي في مهارة ${S.ar}`} en={`My Activities & Tasks in ${S.en}`} link="عرض الكل" onLink={() => setTab('الكل')} />
        <div className="filters" style={{ marginTop: 0 }}>
          {TABS.map(t => (
            <button key={t} className={'filter' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>
              <span>{t === 'الكل' ? t : t === 'درس' ? 'الدروس' : t === 'تدريب' ? 'التدريبات' : t === 'مهمة' ? 'المهام' : 'التحديات'}
                <span className="en">{TAB_EN[t]}</span>
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          {rows.map(r => (
            <div className="act-row" key={r.ar} style={{ '--edge': S.color, opacity: r.status === 'locked' ? 0.72 : 1 }}>
              <span style={{ fontSize: 20, marginInlineStart: 12 }}>{ST_ICON[r.status]}</span>
              <div style={{ width: 78, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                <img loading="lazy" decoding="async" src={r.img} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
              <div className="body" style={{ flex: 1 }}>
                <h4>{r.ar}</h4>
                <div className="en">{r.en}</div>
                <div className="chips" style={{ marginTop: 8 }}>
                  <span className="chip" style={{ background: 'var(--lav-soft)', color: 'var(--brand-ink)' }}>{r.type}</span>
                  <span className="chip" style={{ background: 'var(--line2)', color: 'var(--ink2)' }}>⏱ {r.mins} دقيقة</span>
                  <span className="chip" style={{ background: r.pct > 0 ? 'var(--green-soft)' : 'var(--line2)', color: r.pct > 0 ? 'var(--green)' : 'var(--mute)' }}>
                    مكتمل {r.pct}%
                  </span>
                </div>
              </div>
              <div style={{ minWidth: 96, textAlign: 'center' }}>
                {r.status === 'locked'
                  ? <button className="btn-sm" disabled style={{ borderColor: 'var(--line)', color: 'var(--mute2)', cursor: 'not-allowed' }}>🔒 {CTA.locked}</button>
                  : <Link to={'/activity/' + skill}><button className="btn-sm" style={{ borderColor: S.color, color: S.color }}>{CTA[r.status]} ←</button></Link>}
              </div>
            </div>
          ))}
        </div>

        {/* رادار المهارات الفرعية — يظهر عند اختيار الاستماع (ودجت العميل) */}
        {skill === 'listening' && (
          <div style={{ maxWidth: 520, margin: '26px auto 0' }}>
            <ListeningRadar />
          </div>
        )}

        <div className="tip-strip" style={{ marginTop: 26 }}>
          <img src={S.ico} alt="" />
          <div>
            <div className="t">{foot.ar}</div>
            <div className="e">{foot.en}</div>
          </div>
        </div>
      </div>
      <FooterStrip ar={foot.ar} en={foot.en} />
    </div>
  );
}
