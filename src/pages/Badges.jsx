import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip, Ring, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome } from '../api/useApi.js';
import { winSound, clickSound } from '../sounds.js';
import { Confetti } from './Result.jsx';

/* الشارات — GET /badges → { summary, earned, in_progress, not_started }
   الشارات يضيفها الأدمن، ويحصل عليها الطالب تلقائياً من إنجازاته أو من معلمه/مدرسته */

const TABS = [
  { key: 'all', ar: 'الكل', en: 'All' },
  { key: 'earned', ar: 'حصلت عليها', en: 'Earned' },
  { key: 'in_progress', ar: 'قيد التقدم', en: 'In Progress' },
  { key: 'not_started', ar: 'لم تبدأ', en: 'Not Started' },
];
const SEEN_KEY = 'masar-badges-seen';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

/* صورة الشارة (أو إيموجي/أيقونة احتياطية) */
function BadgeImg({ b, size = 86, gray }) {
  const style = { width: size, height: size, objectFit: 'contain', margin: '0 auto', display: 'block', filter: gray ? 'grayscale(1)' : undefined, opacity: gray ? 0.55 : 1 };
  return b.image
    ? <img loading="lazy" decoding="async" src={b.image} alt="" style={style} />
    : <span style={{ ...style, fontSize: size * 0.62, lineHeight: size + 'px', textAlign: 'center' }}>{b.icon || '🏅'}</span>;
}

/* كيف أحصل عليها — description أو جملة من criteria_label + الهدف */
const howTo = (b) => b.description
  || (b.criteria_label ? `${b.criteria_label}${b.target_value != null ? ` ≥ ${b.target_value}${b.min_percentage != null || b.progress?.unit === '%' ? '%' : ''}` : ''}` : '')
  || 'بتكليف من معلمك';
const progressTxt = (p) => {
  if (!p) return '';
  const cur = p.current ?? 0, unit = p.unit || '';
  return `${cur}${unit} / ${p.target}${unit}${p.results_needed ? ` · ${p.results_count ?? 0} / ${p.results_needed} نتائج` : ''}`;
};
const SOURCE = { auto: 'تلقائياً حسب إنجازاتك', teacher: 'من معلمك', school: 'من مدرستك' };

/* نافذة تفاصيل الشارة — وتُستخدم للاحتفال أيضاً */
function BadgeModal({ b, celebrate, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [onClose]);
  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={b.name}>
      {celebrate && <Confetti />}
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, textAlign: 'center' }}>
        <div className="modal-head">
          <div>
            <div className="t">{celebrate ? '🎉 مبروك! شارة جديدة' : b.name}</div>
            <div className="e">{celebrate ? 'New badge earned!' : b.name_en}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <div style={{ padding: '6px 10px 4px' }}>
          <BadgeImg b={b} size={130} gray={!b.is_earned} />
          <div style={{ fontWeight: 900, fontSize: 21, marginTop: 10 }}>{b.name}</div>
          {b.name_en && <div style={{ fontSize: 12, color: 'var(--mute)' }}>{b.name_en}</div>}
          <div style={{ fontSize: 14, color: 'var(--ink2)', marginTop: 10, lineHeight: 1.8 }}>{howTo(b)}</div>
          {b.description_en && <div style={{ fontSize: 11, color: 'var(--mute2)', direction: 'ltr' }}>{b.description_en}</div>}
          <div className="unit-meta-chips" style={{ justifyContent: 'center', marginTop: 12 }}>
            {b.points_reward ? <span className="chip">⭐ +{b.points_reward} نقطة</span> : null}
            {b.is_earned && <span className="chip">📅 {fmtDate(b.earned_at)}</span>}
            {b.is_earned && b.awarded_by_type && <span className="chip">{b.awarded_by_label || SOURCE[b.awarded_by_type]}{b.awarded_by_name ? ` · ${b.awarded_by_name}` : ''}</span>}
          </div>
          {!b.is_earned && b.progress && (
            <div style={{ marginTop: 14 }}>
              <div className="bar thin"><i style={{ width: (b.progress.percentage || 0) + '%', background: b.color || 'var(--brand)' }} /></div>
              <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 6 }}>{progressTxt(b.progress)}</div>
            </div>
          )}
          {b.note && <div className="explain-box ok" style={{ marginTop: 14, textAlign: 'start' }}><div>💬 «{b.note}»</div></div>}
        </div>
        <div className="modal-foot">
          {celebrate ? <button className="btn btn-primary" onClick={onClose}>رائع! 🎉</button> : <Link to="/path" className="link">واصل التعلّم لتجمع المزيد ←</Link>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function Badges() {
  const st = useHome().home?.stats || {};
  const { data: D, error, loading } = useApi(() => api.badges(), []);
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(null);       // الشارة المفتوحة
  const [party, setParty] = useState(null);     // شارة للاحتفال

  const S = D?.summary || { earned: 0, in_progress: 0, total: 0 };
  const earned = D?.earned || [], wip = D?.in_progress || [], todo = D?.not_started || [];

  // احتفال: شارة earned_at أحدث من آخر زيارة (localStorage)
  useEffect(() => {
    if (!D) return;
    let seen = 0;
    try { seen = Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { /* بلا تخزين */ }
    const fresh = earned.filter(b => b.earned_at && new Date(b.earned_at).getTime() > seen)
      .sort((a, b) => new Date(b.earned_at) - new Date(a.earned_at))[0];
    if (fresh && seen) { winSound(); setParty(fresh); }
    try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* بلا تخزين */ }
  }, [D]); // eslint-disable-line react-hooks/exhaustive-deps

  const show = (k) => tab === 'all' || tab === k;
  const pick = (b) => { clickSound(); setOpen(b); };

  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="badge-hero">
          <div className="img"><img src="/img/scene-play.png" alt="" /></div>
          <div className="mid">
            <h1>شاراتي</h1>
            <div className="en-sub">My Badges</div>
            <p style={{ color: 'var(--ink2)', marginTop: 10 }}>كل شارة هي خطوة نحو إتقانك وتطوّرك!</p>
            <div className="unit-meta-chips" style={{ marginTop: 10 }}>
              <span className="chip">حصلت عليها: {S.earned}</span>
              <span className="chip">قيد التقدم: {S.in_progress}</span>
              <span className="chip">المجموع: {S.total}</span>
            </div>
          </div>
          <div className="stats">
            <div className="b">
              <Ring pct={S.total ? Math.round((S.earned / S.total) * 100) : 0} size={74} stroke={8}>
                <span style={{ fontSize: 14 }}>{S.earned}/{S.total}</span>
              </Ring>
              <div className="l">شارة</div>
            </div>
            <div className="b">
              <img src="/img/points.png" alt="" />
              <div className="n">{(st.points ?? 0).toLocaleString('en')}</div>
              <div className="l">نقطة</div>
            </div>
            <div className="b">
              <img src="/img/shield.png" alt="" />
              <div className="n">{st.current_level ?? '—'}</div>
              <div className="l">المستوى</div>
            </div>
          </div>
        </div>

        <div className="filters" style={{ marginTop: 22 }}>
          {TABS.map(t => (
            <button key={t.key} className={'filter' + (tab === t.key ? ' active' : '')} onClick={() => { clickSound(); setTab(t.key); }}>
              <span>{t.ar} ({t.key === 'all' ? S.total : t.key === 'earned' ? earned.length : t.key === 'in_progress' ? wip.length : todo.length})<span className="en">{t.en}</span></span>
            </button>
          ))}
        </div>

        {error && <Empty t={error.message} e="Could not load badges" />}
        {!loading && !error && S.total === 0 && <Empty t="لا توجد شارات متاحة لك بعد" e="No badges available yet" d="ستظهر هنا الشارات التي تناسب مرحلتك فور إضافتها." />}

        {S.total > 0 && show('earned') && <>
          <SecHead ico="/img/medal.png" ar="شارات حصلت عليها" en="Earned Badges" />
          {!earned.length && <Empty t="ابدأ أنشطتك لتحصل على أول شارة!" e="Start your activities to earn your first badge" />}
          <div className="earned-grid">
            {earned.map(b => (
              <div className="earned-card" key={b.id} onClick={() => pick(b)} style={{ cursor: 'pointer' }}>
                <BadgeImg b={b} />
                <div className="t">{b.name}</div>
                {b.name_en && <div className="e">{b.name_en}</div>}
                <div className="d">{fmtDate(b.earned_at)}</div>
                <div className="unit-meta-chips" style={{ justifyContent: 'center', marginTop: 6 }}>
                  <span className="chip" style={{ fontSize: 10.5 }}>{b.awarded_by_label || SOURCE[b.awarded_by_type] || ''}{b.awarded_by_name ? ` · ${b.awarded_by_name}` : ''}</span>
                  {b.points_reward ? <span className="chip" style={{ fontSize: 10.5 }}>+{b.points_reward} نقطة</span> : null}
                </div>
                {b.note && <div className="d" style={{ fontStyle: 'italic' }}>«{b.note}»</div>}
              </div>
            ))}
          </div>
        </>}

        {S.total > 0 && show('in_progress') && wip.length > 0 && <>
          <SecHead ico="/img/star.png" ar="شارات قيد التقدم" en="Badges in Progress" />
          <div className="wip-grid">
            {wip.map(b => (
              <div className="wip-card" key={b.id} onClick={() => pick(b)} style={{ cursor: 'pointer' }}>
                <div className="head">
                  <BadgeImg b={b} size={56} gray />
                  <div>
                    <h4>{b.name}</h4>
                    <div className="en">{howTo(b)}</div>
                  </div>
                </div>
                <div className="pct">أنجزت {Math.round(b.progress?.percentage ?? 0)}٪ · {progressTxt(b.progress)}</div>
                <div className="bar thin"><i style={{ width: (b.progress?.percentage ?? 0) + '%', background: b.color || undefined }} /></div>
              </div>
            ))}
          </div>
        </>}

        {S.total > 0 && show('not_started') && todo.length > 0 && <>
          <SecHead ico="/img/shield.png" ar="شارات لم تبدأها بعد" en="Not Started — اجمعها كلها!" />
          <div className="earned-grid">
            {todo.map(b => (
              <div className="earned-card locked-badge" key={b.id} title={howTo(b)} onClick={() => pick(b)} style={{ cursor: 'pointer' }}>
                <BadgeImg b={b} gray />
                <span className="lock">🔒</span>
                <div className="t">{b.name}</div>
                {b.name_en && <div className="e">{b.name_en}</div>}
                <div className="d how">{howTo(b)}</div>
              </div>
            ))}
          </div>
        </>}
      </div>
      <FooterStrip
        ar="استمر في التعلّم، فكل إنجاز اليوم يصنع مستقبلك المشرق"
        en="Keep learning — every achievement today builds your bright future!"
      />
      {open && <BadgeModal b={open} onClose={() => setOpen(null)} />}
      {party && !open && <BadgeModal b={party} celebrate onClose={() => setParty(null)} />}
    </div>
  );
}
