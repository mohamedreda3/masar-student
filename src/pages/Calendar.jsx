import { StatsBar, SecHead, FooterStrip } from '../components.jsx';
import { calendarEvents, todaySchedule, upcomingTasks } from '../data.js';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const TODAY = 16;

export default function Calendar() {
  const evByDay = Object.fromEntries(calendarEvents.map(e => [e.d, e.type]));
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>التقويم والمهام</h1>
          <div className="en">Calendar &amp; Tasks</div>
        </div>
        <div className="tag">مواعيد التسليم والاختبارات والأنشطة — شهر مايو.</div>
      </div>
      <div className="container">
        <div className="grid-main">
          <div className="col">
            <SecHead ico="/img/calendar.png" ar="تقويم الشهر" en="Monthly View" />
            <div className="card">
              <div className="cal-grid">
                {DAYS.map(d => <div className="cal-head" key={d}>{d}</div>)}
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <div key={d} className={'cal-day' + (d === TODAY ? ' today' : '')}>
                    {d}
                    {evByDay[d] && <span className={'ev ' + evByDay[d]}>{evByDay[d]}</span>}
                  </div>
                ))}
              </div>
              <div className="cal-legend">
                <span><i style={{ background: 'var(--green)' }} />واجب</span>
                <span><i style={{ background: 'var(--gold)' }} />كويز</span>
                <span><i style={{ background: 'var(--purple)' }} />نشاط</span>
                <span><i style={{ background: 'var(--danger)' }} />اختبار ختامي</span>
              </div>
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
                {todaySchedule.map(s => (
                  <div className="sched-row" key={s.t}>
                    <span className="tm">{s.t}</span>
                    <span className="t">{s.ar}</span>
                    <span className={'st-chip ' + s.st}>{s.st}</span>
                  </div>
                ))}
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
                {upcomingTasks.map(t => (
                  <div className="sched-row" key={t.ar}>
                    <span className="tm" style={{ minWidth: 84, fontSize: 11.5 }}>{t.d}</span>
                    <span className="t">{t.ar}</span>
                  </div>
                ))}
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
