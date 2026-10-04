import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip } from '../components.jsx';
import { healthUnit, lessonFlow, unitResources, unitObjectives, myOutcomes } from '../data.js';
import { clickSound } from '../sounds.js';

/* مودال الفيديو التمهيدي — فيديو الوحدة (مولّد بستايل مسار)، يُدار لاحقاً من لوحة المعلم */
const DEMO_VIDEO = '/media/unit-intro.mp4';

function VideoModal({ onClose, poster }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [onClose]);
  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="الفيديو التمهيدي للوحدة">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="t">الفيديو التمهيدي — {healthUnit.ar}</div>
            <div className="e">Unit Intro Video · {healthUnit.en}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <video src={DEMO_VIDEO} poster={poster} controls autoPlay playsInline style={{ width: '100%', aspectRatio: '16 / 9', maxHeight: '68vh', display: 'block', borderRadius: 14, background: '#000' }} />
        <div className="modal-foot">
          🍿 شاهد ثم ابدأ درسك — <b>ستعرف بالضبط ماذا ستتعلم!</b>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Unit() {
  const U = healthUnit;
  const cur = U.lessons.find(l => l.status === 'current');
  const [video, setVideo] = useState(false);
  const openVideo = () => { clickSound(); setVideo(true); };
  const ST = { current: 'الدرس الجاري', locked: 'يُفتح لاحقاً', done: 'مكتمل' };

  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="hero" style={{ padding: '30px 40px' }}>
          <div className="hero-img" style={{ maxWidth: 300, width: '100%' }}>
            <img src={U.img} alt="" />
          </div>
          <div className="hero-txt">
            <span className="hero-chip">📚 الوحدة الجارية</span>
            <h1 style={{ marginTop: 12 }}>{U.ar}</h1>
            <div className="en-sub">{U.en}</div>
            <div className="unit-meta-chips" style={{ marginTop: 14 }}>
              <span className="chip">{U.stage}</span>
              <span className="chip">{U.grade}</span>
              <span className="chip">المستوى: المتطور</span>
            </div>
            <p style={{ marginTop: 14 }}>{U.desc}</p>
            <div className="hero-actions">
              <Link to="/lesson" className="btn btn-primary btn-col">
                <span>⏵ تابع الدرس الجاري</span>
                <span className="sub">{cur.en}</span>
              </Link>
            </div>
          </div>
        </div>

        <SecHead ico="/img/target.png" ar="الفيديو التمهيدي للوحدة" en="Unit Intro Video" />
        <div className="card next-card" style={{ borderTopColor: 'var(--brand)' }}>
          <div style={{ position: 'relative', width: 220, borderRadius: 14, overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }} title="شغّل الفيديو" onClick={openVideo}>
            <img src={U.img} alt="" style={{ width: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.28)' }}>
              <span style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--white)', display: 'grid', placeItems: 'center', fontSize: 22, color: 'var(--brand)', boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>▶</span>
            </div>
            <span style={{ position: 'absolute', bottom: 8, insetInlineStart: 8, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 9px', borderRadius: 8 }}>2:40</span>
          </div>
          <div className="body">
            <h3>شاهد قبل أن تبدأ: ماذا ستتعلم في وحدة {U.ar}؟</h3>
            <div className="en">Watch first — what you'll learn in this unit</div>
            <div className="d">دقيقتان تتعرّف فيهما على موضوع الوحدة ومفرداتها وما ستستطيع فعله في نهايتها.</div>
          </div>
          <div className="actions">
            <button className="btn btn-primary btn-col" onClick={openVideo}>
              <span>▶ شاهد الفيديو</span>
              <span className="sub">Watch Intro</span>
            </button>
          </div>
        </div>

        <SecHead ico="/img/book.png" ar="دروس الوحدة" en="Unit Lessons" />
        <div className="stations-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {U.lessons.map(l => (
            <div key={l.n} className={'station-card ' + l.status}>
              <div className="img" style={{ height: 150 }}>
                <img loading="lazy" decoding="async" src={l.img} alt="" />
                <span className={'st ' + l.status}>{ST[l.status]}</span>
                {l.status === 'locked' && <div className="lock-overlay"><span>🔒</span></div>}
              </div>
              <div className="body" style={{ padding: '16px 18px 18px' }}>
                <h4 style={{ fontSize: 17 }}>الدرس {l.n} — {l.ar}</h4>
                <div className="e">{l.en}</div>
                <div className="meta">
                  <span>{l.status === 'current' ? 'أنجزت 5 خطوات من 8' : l.status === 'locked' ? 'يُفتح بعد الدرس السابق' : 'مكتمل'}</span>
                  <span>{l.pct}٪</span>
                </div>
                <div className="bar thin"><i style={{ width: l.pct + '%', background: 'var(--gold)' }} /></div>
                <div className="cta">
                  {l.status === 'locked'
                    ? <button className="off" disabled>مقفل</button>
                    : <Link to="/lesson"><button className="continue" style={{ width: '100%' }}>تابع</button></Link>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <SecHead ico="/img/target.png" ar="رحلة الدرس الجاري" en="Current Lesson Journey" />
        <div className="card" style={{ padding: 26 }}>
          <div style={{ fontWeight: 900, fontSize: 17 }}>{cur.ar}</div>
          <div className="sec-en">ثماني خطوات — ثم اختبار قصير يُحدَّث بعده تقدمك</div>
          <div className="flow-strip" style={{ marginTop: 20 }}>
            {lessonFlow.map(s => (
              <Link key={s.n} to={s.to} className={'flow-step ' + s.status}>
                <div className="n">{s.status === 'done' ? '✓' : s.n}</div>
                <div className="t">{s.ar}</div>
                <div className="e">{s.en}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* شارت تقدمك بدروس الوحدة — أعمدة سريعة القراءة */}
        <SecHead ico="/img/clipboard.png" ar="تقدمك في دروس الوحدة" en="Unit Lessons Progress" />
        <div className="card" style={{ padding: '24px 28px' }}>
          <div className="unit-bars">
            {U.lessons.map(l => (
              <div className="ub" key={l.n}>
                <div className="col-wrap">
                  <span className="pct" style={{ color: l.pct > 0 ? 'var(--brand)' : 'var(--mute2)' }}>{l.pct}٪</span>
                  <div className="col">
                    <i style={{ height: Math.max(l.pct, 4) + '%', background: l.status === 'current' ? 'var(--gold)' : l.pct === 100 ? 'var(--green)' : 'var(--line)' }} />
                  </div>
                </div>
                <div className="l">{l.ar}</div>
                <div className="e">{l.en}</div>
              </div>
            ))}
          </div>
        </div>

        <SecHead ico="/img/medal.png" ar="اختبار الوحدة الختامي" en="Unit Summative Exam" />
        <div className="card next-card" style={{ borderTopColor: 'var(--gold)' }}>
          <img src="/img/scroll.png" alt="" style={{ width: 74, height: 74, objectFit: 'contain', flexShrink: 0 }} />
          <div className="body">
            <h3>التقييم الختامي — بالمهارات الأربع</h3>
            <div className="en">Summative Assessment · Reading, Listening, Speaking, Writing</div>
            <div className="d">يُفتح بعد إنهاء دروس الوحدة أو بتكليف من معلمك · كويز صغير في نهاية كل درس</div>
          </div>
          <div className="actions">
            <Link to="/quiz" className="btn btn-primary btn-col">
              <span>تعليمات الاختبار</span>
              <span className="sub">Exam Instructions</span>
            </Link>
          </div>
        </div>

        <SecHead ico="/img/bulb.png" ar="أهداف الوحدة ونواتج التعلم" en="Unit Objectives & Learning Outcomes" />
        <div className="objectives-grid">
          <div className="card">
            <div className="badges-head">
              <div>
                <h3>الأهداف المحورية</h3>
                <div className="en">ما ستحققه في هذه الوحدة</div>
              </div>
            </div>
            <ul className="obj-list" style={{ marginTop: 10 }}>
              {unitObjectives.map(o => (
                <li key={o.ar}>
                  <span className="mark">◆</span>
                  <span>{o.ar}<span className="en">{o.en}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="badges-head">
              <div>
                <h3>نواتج تعلمي</h3>
                <div className="en">My Outcomes — «أنا أستطيع أن…»</div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              {myOutcomes.map(o => (
                <div key={o.ar} className={'outcome-row ' + (o.done ? 'done' : 'todo')}>
                  <span className="chk">{o.done ? '✓' : '•'}</span>
                  <div>
                    <div className="t">{o.ar}</div>
                    <div className="en">{o.en}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SecHead ico="/img/scroll.png" ar="مصادر الوحدة للطباعة" en="Printable Unit Resources" />
        <div className="print-grid">
          {unitResources.map(r => (
            <div className="print-row" key={r.ar}>
              <img src={r.ico} alt="" />
              <div>
                <div className="t">{r.ar}</div>
                <div className="e">{r.en}</div>
                <div className="d">{r.d}</div>
              </div>
              <button className="btn-sm" onClick={() => { clickSound(); window.print(); }}>🖨 طباعة / تحميل</button>
            </div>
          ))}
        </div>
      </div>
      <FooterStrip
        ar="أنهِ دروس الوحدة الثلاثة لتفتح وحدة السوق – أنت قريب"
        en="Finish all three lessons to unlock the next unit — you're close!"
      />
      {video && <VideoModal poster={U.img} onClose={() => setVideo(false)} />}
    </div>
  );
}

