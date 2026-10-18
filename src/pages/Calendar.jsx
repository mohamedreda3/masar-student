import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { clickSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* التقويم والمهام — GET /calendar?month=YYYY-MM&category=
   كل شيء من الرد: الأسبوع، الأيام، الأحداث، المفتاح، جدول اليوم، المهام القادمة */

/* حالة الحدث → كلاس شارة الحالة في التصميم */
const ST_CHIP = { ongoing: 'جارية', upcoming: 'قادمة', waiting: 'جارية', completed: 'مكتملة', missed: 'مقفلة', open: 'جارية' };

/* الدرس المفتوح (status=open) بلون الـAPI، والدرس المجدول (لم يُفتح بعد) بلون مختلف */
const SCHEDULED = { color: '#0891B2', label: 'درس مجدول', label_en: 'Scheduled lesson' };
const isScheduled = (e) => e.kind === 'lesson' && e.status !== 'open';
const colorOf = (e) => (isScheduled(e) ? SCHEDULED.color : e.color);

/* «16:30» → «4:30 م» (12 ساعة — أرقام إنكليزية) */
const AR = (n) => String(n);
export const time12 = (t) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
  if (!m) return t || '';
  const h = +m[1], h12 = h % 12 || 12;
  return `${AR(h12)}:${AR(m[2])} ${h < 12 ? 'ص' : 'م'}`;
};
const byTime = (a, b) => String(a.time || '').localeCompare(String(b.time || ''));

/* open_api → شاشة الفرونت */
function routeOf(api) {
  if (!api) return null;
  let m;
  if ((m = api.match(/\/(assignments|exams)\/(\d+)/))) return '/assignment?id=' + m[2];
  if ((m = api.match(/\/path\/units\/(\d+)\/exam/))) return '/quiz?unit=' + m[1];
  if ((m = api.match(/\/path\/lessons\/(\d+)/))) return '/lesson?id=' + m[1];
  if ((m = api.match(/\/path\/units\/(\d+)/))) return '/unit?id=' + m[1];
  return null;
}

export default function Calendar() {
  const nav = useNavigate();
  const [month, setMonth] = useState(null);       // null = الشهر الحالي
  const [category, setCategory] = useState(null);
  const [day, setDay] = useState(null);           // اليوم المفتوح
  const { data: D, error, loading } = useApi(() => api.calendar({ month, category }), [month, category]);

  const open = (e) => {
    clickSound();
    const to = routeOf(e.open_api);
    to ? nav(to) : showToast('لا يمكن فتح هذا الموعد الآن', 'ℹ️');
  };
  const go = (m) => { clickSound(); setDay(null); setMonth(m); };
  const M = D?.month;
  const days = D?.days || [];
  const selected = day && days.find(d => d.date === day);

  const EventRow = ({ e, withDay }) => (
    <div className="sched-row" onClick={() => open(e)} style={{ cursor: 'pointer' }}>
      <span className="tm" style={withDay ? { minWidth: 84, fontSize: 11.5 } : undefined}>{withDay ? (e.day?.label || e.date) : (e.time ? time12(e.time) : '—')}</span>
      <span className="t">
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 3, background: colorOf(e), marginInlineEnd: 6 }} />
        {isScheduled(e) && <span style={{ fontSize: 11, color: SCHEDULED.color, fontWeight: 800 }}>🗓 مجدول · </span>}{e.title}
        {(e.teacher || (withDay && e.time)) && <span style={{ display: 'block', fontSize: 11, color: 'var(--mute)', fontWeight: 600 }}>{[withDay && e.time && time12(e.time), e.teacher].filter(Boolean).join(' · ')}</span>}
      </span>
      {!withDay && <span className={'st-chip ' + (ST_CHIP[e.status] || 'قادمة')}>{e.status_label}</span>}
      {withDay && e.score != null && <span className="st-chip مكتملة">{e.score}/{e.total_grade}</span>}
    </div>
  );

  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>التقويم والمهام</h1>
          <div className="en">Calendar &amp; Tasks</div>
        </div>
        <div className="tag">مواعيد التسليم والاختبارات والأنشطة{M ? ` — شهر ${M.label}` : ''}.</div>
      </div>
      <div className="container">
        {error && <Empty t={error.message} e="Could not load calendar" />}
        <div className="grid-main">
          <div className="col">
            <SecHead ico="/img/calendar.png" ar="تقويم الشهر" en={M?.label_en || 'Monthly View'} />
            <div className="card">
              {/* التنقل بين الشهور */}
              {M && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <button className="btn-sm" onClick={() => go(M.previous)} aria-label="الشهر السابق">→ {M.previous}</button>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: 17 }}>{M.label}</div>
                    {month && <button className="link" style={{ background: 'none', fontSize: 12 }} onClick={() => go(null)}>اليوم</button>}
                  </div>
                  <button className="btn-sm" onClick={() => go(M.next)} aria-label="الشهر التالي">{M.next} ←</button>
                </div>
              )}
              <div className="cal-grid">
                {(D?.weekdays || []).map(w => <div className="cal-head" key={w.index}>{w.label}</div>)}
                {M && Array.from({ length: M.first_weekday }, (_, i) => <div key={'e' + i} />)}
                {days.map(d => {
                  const evs = d.events || [];
                  return (
                    <div key={d.date} className={'cal-day' + (d.is_today ? ' today' : '')}
                      onClick={() => { clickSound(); setDay(day === d.date ? null : d.date); }}
                      style={{ cursor: 'pointer', opacity: d.is_past && !d.is_today ? 0.6 : 1, outline: day === d.date ? '2px solid var(--brand)' : undefined }}>
                      {d.day}
                      {evs.length > 0 && (
                        <span className="cal-evs">
                          {[...evs].sort(byTime).map(e => (
                            <span key={e.id} className="cal-ev" title={e.category_label} onClick={(ev) => { ev.stopPropagation(); open(e); }}>
                              <i className="dot" style={{ background: colorOf(e) }} />
                              <span className="nm">{isScheduled(e) ? '🗓 ' : ''}{e.title}</span>
                              {e.time && <span className="tm">{time12(e.time)}</span>}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* أحداث اليوم المختار */}
              {selected && (
                <div className="card" style={{ marginTop: 14, padding: '14px 18px', background: 'var(--wash)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b>{selected.weekday_label} {selected.day} {M?.label}</b>
                    <button className="btn-sm" onClick={() => setDay(null)}>✕</button>
                  </div>
                  {!selected.events?.length && <div style={{ color: 'var(--mute)', fontSize: 13, marginTop: 8 }}>لا توجد مواعيد في هذا اليوم</div>}
                  {[...(selected.events || [])].sort(byTime).map(e => <EventRow key={e.id} e={e} />)}
                </div>
              )}

              {/* المفتاح — يُفلتر بالنقر */}
              <div className="cal-legend">
                {(D?.legend || []).map(l => (
                  <span key={l.key} onClick={() => { clickSound(); setDay(null); setCategory(category === l.key ? null : l.key); }}
                    style={{ cursor: 'pointer', opacity: category && category !== l.key ? 0.4 : 1, textDecoration: category === l.key ? 'underline' : undefined }}>
                    <i style={{ background: l.color }} />{l.label}{l.count != null ? ` (${l.count})` : ''}
                  </span>
                ))}
              </div>
              {days.some(d => (d.events || []).some(isScheduled)) && (
                <div className="cal-legend" style={{ marginTop: 6 }}>
                  <span><i style={{ background: SCHEDULED.color }} />{SCHEDULED.label} (لم يُفتح بعد)</span>
                </div>
              )}
              {D?.summary && (
                <div className="unit-meta-chips" style={{ marginTop: 12 }}>
                  <span className="chip">مواعيد الشهر: {D.summary.month_events}</span>
                  <span className="chip">مكتملة: {D.summary.month_completed}</span>
                  {D.summary.month_missed ? <span className="chip">فاتت: {D.summary.month_missed}</span> : null}
                </div>
              )}
            </div>
          </div>
          <div className="col">
            <div className="side-card">
              <div className="badges-head">
                <div>
                  <h3>جدول اليوم</h3>
                  <div className="en">Today's Schedule</div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                {!loading && !D?.today_schedule?.length && <Empty t="لا توجد مهام اليوم 🎉" e="Nothing today" />}
                {(D?.today_schedule || []).map(e => <EventRow key={e.id} e={e} />)}
              </div>
            </div>
            <div className="side-card">
              <div className="badges-head">
                <div>
                  <h3>المهام القادمة</h3>
                  <div className="en">Upcoming Tasks</div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                {!loading && !D?.upcoming_tasks?.length && <Empty t="لا توجد مهام قادمة" e="No upcoming tasks" />}
                {(D?.upcoming_tasks || []).map(e => <EventRow key={e.id} e={e} withDay />)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="نظّم وقتك تربح يومك – خطوة كل يوم توصلك بعيداً"
        en="Organise your time and win your day!"
      />
    </div>
  );
}
