import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SecHead, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, unitArt } from '../api/useApi.js';
import { realImg } from '../QuestionBody.jsx';
import { clickSound } from '../sounds.js';

/* مكتبة أنشطة المنصة (من الأدمن، لا تُقفل) — GET /activities?type=&status=&search=
   الوحدات → الدروس → بطاقات الأنشطة (act-row) — نفس كلاسات صفحة أنشطتي */

const TYPE_LOOK = {
  exercise:      { color: '#2563eb', ico: '/img/clipboard.png' },
  flashcard:     { color: '#16a34a', ico: '/img/flashcards.png' },
  game:          { color: '#ea580c', ico: '/img/gamepad.png' },
  pronunciation: { color: '#db2777', ico: '/img/mic.png' },
};
const STATUS = [
  { key: 'all', ar: 'الكل', en: 'All' },
  { key: 'not_started', ar: 'لم تبدأ', en: 'Not started' },
  { key: 'in_progress', ar: 'جارية', en: 'In progress' },
  { key: 'completed', ar: 'مكتملة', en: 'Completed' },
];
const CHIP = { completed: 'مكتملة', in_progress: 'جارية', not_started: 'قادمة' };

/* رابط النشاط داخل المكتبة: نفس مشغّل الأنشطة، بوضع «مكتبة» (مسارات /activities) */
const openLink = (a) => `/quiz/run?lesson=${a.lesson_id ?? ''}&activity=${a.activity_id}&library=1`;

/* lessonId: عرض أنشطة درس واحد (يُستخدم بدل صفحة الدرس لو كانت مقفلة في المسار) */
export default function ActivityLibrary({ lessonId }) {
  const nav = useNavigate();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');                 // البحث بعد التوقف عن الكتابة
  const [openUnit, setOpenUnit] = useState(null); // الوحدة المفتوحة (أكورديون)
  useEffect(() => { const t = setTimeout(() => setQ(search.trim()), 400); return () => clearTimeout(t); }, [search]);

  const { data: D, loading, error } = useApi(() => api.library({ lesson_id: lessonId, type, status, search: q }), [lessonId, type, status, q]);
  const S = D?.summary || {};
  const units = D?.units || [];
  useEffect(() => { if (units.length && !units.some(u => u.id === openUnit)) setOpenUnit(units[0].id); }, [D]); // eslint-disable-line react-hooks/exhaustive-deps

  const row = (a) => {
    const L = TYPE_LOOK[a.type] || TYPE_LOOK.exercise;
    const pct = a.percentage != null ? Math.round(a.percentage) : a.status === 'completed' ? 100 : 0;
    return (
      <div className="act-row" key={a.activity_id + '-' + a.lesson_id} style={{ '--edge': L.color }}>
        <div className="ico" style={{ background: L.color + '18' }}><img src={realImg(a.thumbnail) || L.ico} alt="" /></div>
        <div className="body">
          <h4>{a.title}</h4>
          <div className="en">{a.title_en}</div>
          <div className="d">{[a.type_label, a.duration_minutes && a.duration_minutes + ' دقيقة', a.points && a.points + ' نقطة', a.items_count && a.items_count + ' عناصر'].filter(Boolean).join(' · ')}</div>
        </div>
        <span className={'st-chip ' + (CHIP[a.status] || 'قادمة')}>{a.status_label}</span>
        <div className="prog">
          <div className="lab">{a.score != null ? `${a.score} / ${a.max_score} (${pct}٪)` : a.status === 'completed' ? 'اكتملت' : 'لم تبدأ بعد'}</div>
          <div className="bar thin"><i style={{ width: pct + '%', background: L.color }} /></div>
        </div>
        <div className="act" style={{ minWidth: 84, textAlign: 'center' }}>
          <button className={'btn-sm' + (a.status === 'not_started' ? ' pink' : '')} onClick={() => { clickSound(); nav(openLink(a)); }}>
            {a.status === 'completed' ? 'أعد' : a.status === 'in_progress' ? 'تابع' : 'ابدأ'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* العدّادات */}
      <div className="unit-meta-chips" style={{ marginTop: 6 }}>
        <span className="chip">الكل: {S.total ?? '—'}</span>
        <span className="chip">مكتملة: {S.completed ?? '—'}</span>
        <span className="chip">جارية: {S.in_progress ?? '—'}</span>
        <span className="chip">لم تبدأ: {S.not_started ?? '—'}</span>
        {D && D.filtered_count !== S.total && <span className="chip" style={{ background: 'var(--lav-soft)' }}>النتائج: {D.filtered_count}</span>}
      </div>

      {/* الفلاتر: الحالة + النوع + البحث */}
      <div className="filters" style={{ marginTop: 14 }}>
        {STATUS.map(f => (
          <button key={f.key} className={'filter' + (status === f.key ? ' active' : '')} onClick={() => { clickSound(); setStatus(f.key); }}>
            <span>{f.ar}<span className="en">{f.en}</span></span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
        <button className={'chip'} onClick={() => setType('')} style={{ cursor: 'pointer', border: 0, ...(type === '' ? { background: 'var(--brand)', color: '#fff' } : {}) }}>كل الأنواع</button>
        {(D?.types || []).map(t => (
          <button key={t.key} className="chip" onClick={() => { clickSound(); setType(t.key); }}
            style={{ cursor: 'pointer', border: 0, ...(type === t.key ? { background: (TYPE_LOOK[t.key] || {}).color || 'var(--brand)', color: '#fff' } : {}) }}>{t.label}</button>
        ))}
        <input className="eng-input" dir="rtl" placeholder="🔍 ابحث في عناوين الأنشطة…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
      </div>

      {error && <Empty t={error.message} e="Could not load activities" />}
      {!loading && !error && !units.length && <Empty t="لا توجد أنشطة بهذه الفلاتر" e="No activities match" />}

      {/* الوحدات (أكورديون) → الدروس → الأنشطة */}
      {units.map(u => {
        const open = openUnit === u.id;
        const us = u.summary || {};
        return (
          <div key={u.id} style={{ marginTop: 18 }}>
            <button className="card" onClick={() => { clickSound(); setOpenUnit(open ? null : u.id); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', textAlign: 'start', cursor: 'pointer', border: 0 }}>
              <img src={unitArt(u.title, u.image)} alt="" style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 10 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 16.5 }}>{u.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--mute)' }}>{u.title_en} · أنجزت {us.completed ?? 0} من {us.total ?? 0}</div>
                <div className="bar thin" style={{ marginTop: 6 }}><i style={{ width: (us.total ? (us.completed / us.total) * 100 : 0) + '%', background: 'var(--green)' }} /></div>
              </div>
              <span style={{ fontSize: 20, color: 'var(--mute)' }}>{open ? '▴' : '▾'}</span>
            </button>
            {open && (
              <>
                {(u.lessons || []).map(l => (
                  <div key={l.id}>
                    <SecHead ico="/img/book.png" ar={l.name} en={`${l.activities.length} نشاط`} />
                    {l.activities.map(row)}
                  </div>
                ))}
                {u.unit_activities?.length > 0 && (
                  <>
                    <SecHead ico="/img/clipboard.png" ar="أنشطة عامة في الوحدة" en="Unit activities" />
                    {u.unit_activities.map(row)}
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
