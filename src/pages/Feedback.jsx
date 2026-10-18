import { useEffect, useState } from 'react';
import { clickSound } from '../sounds.js';
import { StatsBar, SecHead, FooterStrip, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome } from '../api/useApi.js';

/* ملاحظات المعلم — GET /feedback?limit=20 → { hero, counts, feedback, goals, encouragement }
   فتح الصفحة يعلّم الملاحظات مقروءة → نعيد جلب عداد الإشعارات */

const AVATAR = { female: '/img/teacher.png', male: '/img/teacher-char.jpeg' };
/* لون الهدف حسب النسبة */
const goalColor = (g) => (g.status === 'achieved' ? 'var(--green)' : g.progress >= 70 ? 'var(--brand)' : g.progress >= 50 ? 'var(--teal)' : 'var(--orange)');

export default function Feedback() {
  const [tid, setTid] = useState(null);
  const { data: D, error, loading } = useApi(() => api.feedback(20, tid), [tid]);
  const { reload: reloadHome } = useHome();
  // بعد الفتح الملاحظات صارت مقروءة → حدّث عداد الإشعارات في الهيدر
  useEffect(() => { if (D) reloadHome(); }, [D]); // eslint-disable-line react-hooks/exhaustive-deps

  const H = D?.hero || {};
  const list = D?.feedback || [];
  const goals = D?.goals || [];
  const teachers = D?.teachers || [];
  const multi = teachers.length > 1;
  const sel = D ? D.selected_teacher_id ?? null : tid;
  const Skel = () => <div className="fb-card" style={{ height: 150, background: 'var(--line2)', opacity: 0.6, marginBottom: 14 }} />;

  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>ملاحظات المعلم</h1>
          <div className="en">Teacher Feedback</div>
        </div>
        <div className="tag">
          تعليقات وتوجيهات على مهامك — نقاط قوتك وخطوتك التالية.
          {D?.counts?.new > 0 && <b style={{ color: 'var(--brand)' }}> · {D.counts.new} جديدة</b>}
        </div>
      </div>
      <div className="container">
        {error && <Empty t={error.message} e="Could not load feedback" />}

        {/* البانر */}
        {(H.title || loading) && (
          <div className="card next-card" style={{ borderTopColor: 'var(--green)' }}>
            <img src="/img/teacher-char.jpeg" alt="المعلم" style={{ width: 'min(130px, 32%)', borderRadius: 16, flexShrink: 0 }} />
            <div className="body">
              <h3>{H.title || '…'}</h3>
              {H.title_en && <div className="en">{H.title_en}</div>}
              {H.text && <div className="d">{H.text}</div>}
            </div>
          </div>
        )}

        {multi && (
          <div className="filters" style={{ marginTop: 14 }}>
            {[{ id: null, name: 'الكل' }, ...teachers].map(t => (
              <button key={t.id ?? 'all'} className={'filter' + (sel === t.id ? ' active' : '')} onClick={() => { clickSound(); setTid(t.id); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {t.id != null && <img src={t.image || '/img/teacher.png'} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />}
                <span>{t.id != null ? 'أ. ' + t.name : t.name}</span>
                {t.unread_count > 0 && <span style={{ background: 'var(--orange)', color: '#fff', borderRadius: 999, padding: '0 7px', fontSize: 11, fontWeight: 900 }}>{t.unread_count}</span>}
              </button>
            ))}
          </div>
        )}

        <div className="grid-main">
          <div className="col">
            <SecHead ico="/img/speech.png" ar={`أحدث الملاحظات${D?.counts?.total ? ` (${D.counts.total})` : ''}`} en="Latest Feedback" />
            {loading && !D && <><Skel /><Skel /></>}
            {D && !list.length && <div className="card"><Empty t="لا توجد ملاحظات بعد" e="No feedback yet" d="عندما يكتب لك معلمك ملاحظة ستظهر هنا" /></div>}
            {list.map(n => (
              <div className="fb-card" key={n.id} style={n.is_new ? { outline: '2px solid var(--brand)' } : undefined}>
                <div className="fb-head">
                  <img loading="lazy" decoding="async" src={n.teacher?.image || AVATAR[n.teacher?.gender] || '/img/teacher.png'} alt="" />
                  <div>
                    <div className="n">{n.teacher?.name ? `أ. ${n.teacher.name}` : 'معلمك'}</div>
                    <div className="unit-meta-chips" style={{ marginTop: 4 }}>
                      {n.is_new && <span className="chip" style={{ background: 'var(--brand)', color: '#fff', fontWeight: 900 }}>جديدة</span>}
                      {n.skill && <span className="chip" style={{ color: n.skill.color, background: (n.skill.color || '#888') + '18' }}>{n.skill.name}</span>}
                      {n.work?.title && <span className="chip">عن: {n.work.title}</span>}
                    </div>
                  </div>
                  <span className="when">{n.time_ago}</span>
                </div>
                {n.strengths && (
                  <div className="fb-block good">
                    <span className="l">✅ نقاط القوة</span>
                    <div style={{ whiteSpace: 'pre-line' }}>{n.strengths}</div>
                  </div>
                )}
                {n.next_step && (
                  <div className="fb-block next">
                    <span className="l">👣 الخطوة التالية</span>
                    <div style={{ whiteSpace: 'pre-line' }}>{n.next_step}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="col">
            {goals.length > 0 && (
              <div className="side-card">
                <div className="badges-head">
                  <div>
                    <h3>أهدافك الحالية</h3>
                    <div className="en">Your Current Goals</div>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  {goals.map(g => {
                    const c = goalColor(g);
                    const done = g.status === 'achieved';
                    return (
                      <div className="goal-row" key={g.id}>
                        <div className="head">
                          <span>{g.title}</span>
                          <span className="pct" style={{ color: c }}>{done ? '✓ تم تحقيقه' : `${Math.round(g.progress ?? 0)}٪`}</span>
                        </div>
                        {multi && g.teacher && <div className="en">من: أ. {typeof g.teacher === 'string' ? g.teacher : g.teacher.name}</div>}
                        <div className="bar thin"><i style={{ width: (done ? 100 : g.progress ?? 0) + '%', background: c }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {D?.encouragement && (
              <div className="mascot">
                <img src="/img/owl.png" alt="" />
                <div className="b">{D.encouragement}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <FooterStrip
        ar="كل ملاحظة من معلمك خطوة نحو الأفضل – اقرأها وطبّقها"
        en="Every note from your teacher is a step forward — read and apply!"
      />
    </div>
  );
}
