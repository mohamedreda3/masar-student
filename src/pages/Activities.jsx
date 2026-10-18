import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ActivityLibrary from './ActivityLibrary.jsx';
import { StatsBar, Ring, SecHead, FooterStrip, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { clickSound } from '../sounds.js';

/* أنشطتي / اختباراتي وواجباتي — تكليفات المعلم فقط
   المصدر: GET /assignments → { statuses[], items[] }
   التبويبات من statuses (مطلوب / قيد الحل / بانتظار التصحيح / تم التصحيح / فات موعده) */

/* شكل كل نوع تكليف (بدل مهارة التصميم) */
const KIND = {
  activity: { ar: 'نشاط', en: 'Activity', color: '#0891b2', ico: '/img/clipboard.png' },
  homework: { ar: 'واجب', en: 'Homework', color: '#db2777', ico: '/img/pencil.png' },
  paper: { ar: 'واجب ورقي', en: 'Paper Homework', color: '#b45309', ico: '/img/scroll.png' },
  exam: { ar: 'اختبار', en: 'Exam', color: '#7c3aed', ico: '/img/target.png' },
  unit_exam: { ar: 'اختبار الوحدة', en: 'Unit Exam', color: '#ea580c', ico: '/img/scroll.png' },
};

const MODES = {
  activities: {
    tabs: [{ key: 'teacher', ar: 'أنشطة المعلم', en: "Teacher's" }],
    load: () => api.assignments({ kind: 'work', type: 'activity' }),
    match: (t) => t.type === 'activity',
    title: 'أنشطتي', en: 'My Activities', tag: 'الأنشطة التي كلّفك بها معلمك.',
    sec: 'أنشطة المعلم', secEn: "Teacher's Activities",
    empty: 'لا توجد أنشطة من معلمك الآن', emptyEn: 'No activities from your teacher',
    other: { to: '/assignments', label: '📝 اختباراتي وواجباتي' },
    footer: ['كل نشاط تنجزه خطوة أقرب نحو إتقان العربية – واصل التقدّم', 'Every activity you complete brings you closer to mastering Arabic!'],
  },
  assignments: {
    tabs: [{ key: 'work', ar: 'واجباتي', en: 'My Work' }, { key: 'exams', ar: 'اختباراتي', en: 'My Exams' }],
    match: (t) => t.type !== 'activity',   // واجبات + اختبارات (exam / unit_exam / is_exam)
    title: 'اختباراتي وواجباتي', en: 'My Exams & Homework', tag: 'الواجبات والاختبارات التي كلّفك بها معلمك.',
    sec: 'واجبات واختبارات المعلم', secEn: 'Homework & Exams',
    empty: 'لا توجد واجبات أو اختبارات الآن', emptyEn: 'No homework or exams right now',
    other: { to: '/activities', label: '✏️ أنشطتي' },
    footer: ['التزامك بواجباتك واختباراتك يصنع تقدّمك – أنت تستطيع', 'Keeping up with homework and exams builds your progress!'],
  },
};

const fmtDue = (d) => (d ? new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long' }) : '');
/* شارة الحالة (كلاسات st-chip الموجودة) + نسبة الشريط */
const ST_LOOK = { pending: ['قادمة', 0], in_progress: ['جارية', 50], submitted: ['جارية', 90], graded: ['مكتملة', 100], missed: ['مقفلة', 0] };

function toRow(t) {
  const [chip, pct] = ST_LOOK[t.status] || ['قادمة', 0];
  const left = t.due_at ? Math.ceil((new Date(t.due_at) - Date.now()) / 86400000) : null;
  return {
    key: t.type + '-' + t.id, id: t.id, kind: KIND[t.type] || (t.is_exam ? KIND.exam : KIND.activity), type: t.type,
    ar: t.title, en: [t.type_label, t.teacher?.name && 'أ. ' + t.teacher.name].filter(Boolean).join(' · '),
    d: [
      t.description,
      t.due_at && 'آخر موعد: ' + fmtDue(t.due_at),
      left != null && left >= 0 && t.status === 'pending' && `متبقٍ ${left} يوم`,
      t.duration_minutes && t.duration_minutes + ' دقيقة',
      t.total_grade != null && 'الدرجة: ' + t.total_grade,
    ].filter(Boolean).join(' · '),
    status: t.status, label: t.status_label, chip, pct,
    score: t.submission?.score,
    cta: t.status === 'graded' || t.status === 'submitted' ? 'راجع' : t.status === 'in_progress' ? 'تابع' : t.status === 'missed' ? 'عرض' : 'ابدأ',
  };
}

function PageHead({ M }) {
  return (
    <div className="container page-head">
      <div>
        <h1>{M.title}</h1>
        <div className="en">{M.en}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span className="tag">{M.tag}</span>
        <Link to={M.other.to} className="btn btn-ghost" style={{ padding: '9px 20px', fontSize: 13.5 }}>{M.other.label}</Link>
      </div>
    </div>
  );
}

export default function Activities({ mode = 'activities' }) {
  const M = MODES[mode];
  const nav = useNavigate();
  // التبويب الفرعي من الرابط (?tab=) — أنشطتي: المعلم/المنصة · اختباراتي وواجباتي: واجباتي/اختباراتي
  const [qs, setQs] = useSearchParams();
  const tab = M.tabs.some(t => t.key === qs.get('tab')) ? qs.get('tab') : M.tabs[0].key;
  const setTab = (k) => { clickSound(); setQs({ tab: k }, { replace: true }); setFilter('all'); };
  const { data, loading, error } = useApi(() => (
    tab === 'library' ? Promise.resolve(null)
      : tab === 'exams' ? api.exams()
        : tab === 'work' ? api.assignments({ kind: 'work' })
          : api.assignments({ kind: 'work', type: 'activity' })), [tab]);
  const [filter, setFilter] = useState('all');

  const all = (data?.items || []).filter(tab === 'exams' ? () => true : M.match).map(toRow);
  const statuses = [{ key: 'all', label: 'الكل', label_en: 'All' }, ...(data?.statuses || [])];
  const shown = all.filter(a => filter === 'all' || a.status === filter);
  const doneCount = all.filter(a => a.status === 'graded' || a.status === 'submitted').length;
  const dist = Object.values(all.reduce((m, a) => ({ ...m, [a.kind.en]: { kind: a.kind, n: (m[a.kind.en]?.n || 0) + 1 } }), {}));
  const open = (a) => { clickSound(); nav('/assignment?id=' + a.id); };

  return (
    <div className="page">
      <StatsBar />
      <PageHead M={M} />
      <div className="container">
        {/* التبديل بين القسمين */}
        <div className="unit-meta-chips" style={{ marginBottom: 14 }}>
          {M.tabs.map(t => (
            <button key={t.key} className="btn btn-ghost" onClick={() => setTab(t.key)}
              style={{ padding: '9px 22px', fontSize: 14.5, ...(tab === t.key ? { background: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' } : {}) }}>
              {t.ar} <span style={{ fontSize: 10.5, opacity: 0.8 }}>· {t.en}</span>
            </button>
          ))}
        </div>
        {tab === 'library' ? <ActivityLibrary /> : <>
          <div className="filters">
            {statuses.map(f => (
              <button key={f.key} className={'filter' + (filter === f.key ? ' active' : '')} onClick={() => setFilter(f.key)}>
                <span>{f.label} ({f.key === 'all' ? all.length : all.filter(a => a.status === f.key).length})<span className="en">{f.label_en}</span></span>
              </button>
            ))}
          </div>
          <div className="grid-main">
            <div className="col">
              <SecHead ico="/img/clipboard.png" ar={M.sec} en={M.secEn} />
              {error && <Empty t={error.message} e="Could not load assignments" />}
              {!loading && !error && !shown.length && <Empty t={M.empty} e={M.emptyEn} d="سيظهر هنا كل ما يكلّفك به معلمك." />}
              {shown.map(a => (
                <div className="act-row" key={a.key} style={{ '--edge': a.kind.color }}>
                  <div className="ico" style={{ background: a.kind.color + '18' }}><img src={a.kind.ico} alt="" /></div>
                  <div className="body">
                    <h4>{a.ar}</h4>
                    <div className="en">{a.en}</div>
                    <div className="d">{a.d}</div>
                  </div>
                  <span className={'st-chip ' + a.chip}>{a.label}</span>
                  <div className="prog">
                    <div className="lab">{a.score != null ? `الدرجة: ${a.score}` : a.label}</div>
                    <div className="bar thin"><i style={{ width: a.pct + '%', background: a.kind.color }} /></div>
                  </div>
                  <div className="act" style={{ minWidth: 84, textAlign: 'center' }}>
                    <button className={'btn-sm' + (a.cta === 'ابدأ' ? ' pink' : '')} onClick={() => open(a)}>{a.cta}</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="col">
              <div className="side-card gradient-card">
                <Ring pct={all.length ? Math.round((doneCount / all.length) * 100) : 0} size={96} color="#f59e0b" track="rgba(255,255,255,0.25)">
                  <span style={{ color: '#fff', fontSize: 15 }}>{doneCount}/{all.length}</span>
                </Ring>
                <div>
                  <div className="t1">أدِّ أفضل ما لديك</div>
                  <div className="en">Do your best</div>
                  <div className="t2">سلّمت {doneCount} من {all.length}</div>
                  <div className="t3">{all.length - doneCount > 0 ? `باقي ${all.length - doneCount} — واصل!` : 'أنجزت كل شيء 🎉'}</div>
                </div>
              </div>
              {dist.length > 0 && (
                <div className="side-card">
                  <div className="badges-head">
                    <div>
                      <h3>التوزيع حسب النوع</h3>
                      <div className="en">By Type</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {dist.map(d => {
                      const max = Math.max(...dist.map(x => x.n));
                      return (
                        <div className="dist-row" key={d.kind.en}>
                          <span className="lab"><img src={d.kind.ico} alt="" />{d.kind.ar}</span>
                          <div className="bar thin"><i style={{ width: (d.n / max) * 100 + '%', background: d.kind.color }} /></div>
                          <span className="n">{d.n}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>}
      </div>
      <FooterStrip ar={M.footer[0]} en={M.footer[1]} />
    </div>
  );
}
