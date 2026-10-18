import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome, unitArt } from '../api/useApi.js';
import { realImg } from '../QuestionBody.jsx';
import { clickSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* مكتبة القصص — GET /stories?status=&search= → { summary, statuses, items }
   القصص مفتوحة دائماً — المقفلة فقط ما أغلقه المعلم للطالب (is_locked) */

const ST_CLASS = { completed: 'done', reading: 'current', not_started: 'current', locked: 'locked' };

/* بطاقة قصة — تُستخدم أيضاً في «قصص الدرس» بصفحة الدرس */
export function StoryCard({ s }) {
  const nav = useNavigate();
  const locked = s.is_locked;
  const open = () => {
    clickSound();
    if (locked) return showToast(s.status_label || 'مقفلة — أغلقها معلمك', '🔒');
    nav('/story?id=' + s.id);
  };
  const cta = locked ? 'مقفلة 🔒' : s.status === 'reading' ? `📖 تابع من الصفحة ${s.last_page || 1}` : s.status === 'completed' ? '🔁 اقرأ مرة أخرى' : '📖 اقرأ القصة';
  return (
    <div className={'station-card' + (locked ? ' locked' : '')}>
      <div className="img">
        <img loading="lazy" decoding="async" src={s.cover_image || unitArt(s.unit?.title)} alt="" />
        {s.status_label && <span className={'st ' + (ST_CLASS[s.status] || 'current')}>{s.status_label}</span>}
        {locked && <div className="lock-overlay"><span>🔒</span></div>}
        {s.status === 'completed' && s.best_percentage != null && (
          <span style={{ position: 'absolute', bottom: 10, insetInlineEnd: 10, background: 'var(--white)', borderRadius: 99, padding: '5px 12px', fontSize: 11.5, fontWeight: 800, color: 'var(--green-deep)', boxShadow: 'var(--shadow-sm)' }}>
            🏆 أفضل نتيجة {Math.round(s.best_percentage)}%
          </span>
        )}
      </div>
      <div className="body" style={{ padding: '14px 16px 16px' }}>
        <h4 style={{ fontSize: 16 }}>{s.title}</h4>
        {s.title_en && <div className="e">{s.title_en}</div>}
        {(s.lesson?.name || s.unit?.title) && <div className="e" style={{ marginTop: 2 }}>{[s.unit?.title, s.lesson?.name].filter(Boolean).join(' · ')}</div>}
        <div className="meta">
          <span>{s.pages_count ? `📄 ${s.pages_count} صفحات` : ''}{s.duration_minutes ? ` · ⏱ ${s.duration_minutes} د` : ''}</span>
          {s.points ? <span>⭐ {s.points} نقطة</span> : <span />}
        </div>
        {locked && <div className="e" style={{ color: 'var(--mute)', marginTop: 4 }}>أغلقها معلمك — تُفتح عندما يتيحها لك</div>}
        <div className="cta">
          <button className={locked ? 'off' : 'continue'} disabled={locked} onClick={open} style={{ width: '100%' }}>{cta}</button>
        </div>
      </div>
    </div>
  );
}

export default function Library() {
  const tier = useHome().home?.tier;
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const { data: D, error, loading } = useApi(() => api.stories({ status, search: q }), [status, q]);
  const items = D?.items || [];
  const sm = D?.summary || {};
  const tabs = [{ key: 'all', label: 'الكل', label_en: 'All', count: sm.total ?? 0 }, ...(D?.statuses || [])];

  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>مكتبة القصص</h1>
          <div className="en">Story Library</div>
        </div>
        <div className="tag">قصص مختارة لمستواك — اقرأ أو استمع، بالوتيرة التي تحبها.</div>
      </div>
      <div className="container">
        <div className="unit-meta-chips" style={{ marginTop: 20 }}>
          {tier?.label && <span className="chip">مناسبة لمستواك: {tier.label}</span>}
          <span className="chip">القصص: {sm.total ?? 0}</span>
          {sm.completed ? <span className="chip">أنهيت: {sm.completed}</span> : null}
          {sm.reading ? <span className="chip">تقرأ الآن: {sm.reading}</span> : null}
        </div>
        <div className="filters" style={{ marginTop: 16 }}>
          {tabs.map(t => (
            <button key={t.key} className={'filter' + (status === t.key ? ' active' : '')} onClick={() => { clickSound(); setStatus(t.key); }}>
              <span>{t.label} ({t.count})<span className="en">{t.label_en}</span></span>
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQ(search.trim()); }} style={{ marginTop: 12 }}>
          <input className="eng-input" dir="rtl" placeholder="🔍 ابحث عن قصة… (Enter)" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
        </form>

        <SecHead ico="/img/bookOpenGold.png" ar="قصص مختارة لك" en="Stories for You" />
        {error && <Empty t={error.message} e="Could not load stories" />}
        {!loading && !error && !items.length && (
          <Empty t={sm.total ? 'لا توجد قصص بهذا الفلتر' : 'لا توجد قصص متاحة لك بعد'} e="No stories yet" d="ستظهر هنا قصص مستواك فور إضافتها." />
        )}
        <div className="stations-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {items.map(s => <StoryCard key={s.id} s={s} />)}
        </div>
        <div className="mascot" style={{ marginTop: 30 }}>
          <img src="/img/owl.png" alt="" />
          <div className="b">كل قصة تقرؤها تضيف كلمات جديدة لقاموسك — وتكسبك نقاطاً!</div>
        </div>
      </div>
      <FooterStrip
        ar="القراءة مغامرة – كل قصة رحلة جديدة"
        en="Reading is an adventure — every story is a new journey!"
      />
    </div>
  );
}
