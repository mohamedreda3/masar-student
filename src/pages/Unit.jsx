import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { showToast } from '../toast.js';
import { openFile } from '../FileViewer.jsx';
import { StatsBar, SecHead, FooterStrip } from '../components.jsx';
import api from '../api/client.js';
import { useApi, ST as toStatus, activityLink, unitArt, lessonArt, usePageTitle } from '../api/useApi.js';
import { clickSound } from '../sounds.js';

/* مودال الفيديو التمهيدي — فيديو الوحدة (مولّد بستايل مسار)، يُدار لاحقاً من لوحة المعلم */
const DEMO_VIDEO = '/media/unit-intro.mp4';

/* رابط يوتيوب/فيميو → رابط embed، وغير ذلك null (يُشغَّل بـ <video>) */
function embedUrl(url) {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\.|^m\./, '');
    if (h === 'youtu.be') return 'https://www.youtube.com/embed/' + u.pathname.slice(1) + '?autoplay=1&rel=0';
    if (h.endsWith('youtube.com')) {
      const id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
      return 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
    }
    if (h.endsWith('vimeo.com')) return 'https://player.vimeo.com/video/' + u.pathname.split('/').filter(Boolean).pop() + '?autoplay=1';
  } catch { /* رابط غير صالح */ }
  return null;
}

function VideoModal({ onClose, poster, src, U, title }) {
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
            <div className="t">{title || 'الفيديو التمهيدي'} — {U.ar}</div>
            <div className="e">Unit Intro Video · {U.en}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        {embedUrl(src)
          ? <iframe src={embedUrl(src)} title={title || 'video'} referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ width: '100%', aspectRatio: '16 / 9', maxHeight: '68vh', display: 'block', border: 0, borderRadius: 14, background: '#000' }} />
          : <video src={src || DEMO_VIDEO} poster={poster} controls autoPlay playsInline style={{ width: '100%', aspectRatio: '16 / 9', maxHeight: '68vh', display: 'block', borderRadius: 14, background: '#000' }} />}
        <div className="modal-foot">
          🍿 شاهد ثم ابدأ درسك — <b>ستعرف بالضبط ماذا ستتعلم!</b>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* عنوان الدرس داخل البطاقة — رقم الدرس يظهر في الشارة، فلا نكرّره في النص */
const lessonTitle = (l) => String(l.ar || '').replace(/^\s*الدرس\s+[^—–-]{1,14}[—–-]\s*/, '').trim() || l.ar;

export default function Unit() {
  const [qs] = useSearchParams();
  const unitId = qs.get('id');
  const lessonParam = qs.get('lesson');
  const [video, setVideo] = useState(null); // الفيديو المفتوح في المودال
  const nav = useNavigate();
  /* «تابع» / «راجع» يفتحان صفحة الدرس (المحتوى + شريط خطواته) */
  const openLesson = (lessonId) => { clickSound(); nav('/lesson?id=' + lessonId); };
  const { data: u, error } = useApi(() => (unitId ? api.unit(unitId) : Promise.resolve(null)), [unitId]);
  // الدرس المختار (من الرابط) أو الدرس الجاري — نجلب أنشطته لرحلة الدرس
  const selId = lessonParam || u?.continue_lesson?.id;
  const { data: L } = useApi(() => (selId ? api.lesson(selId) : Promise.resolve(null)), [selId]);
  usePageTitle(u?.title && `الوحدة: ${u.title}`);
  if (!unitId) return <Navigate to="/path" replace />;
  if (error) return <div className="page"><StatsBar /><div className="container"><SecHead ar={error.message} en="" /></div></div>;
  if (!u) return <div className="page"><StatsBar /></div>;

  const U = {
    ar: u.title, en: u.title_en, img: unitArt(u.title, u.image), desc: u.description,
    stage: u.grade?.year_code || u.level?.code, grade: u.grade?.name || u.level?.name,
    lessons: (u.lessons || []).map(l => ({ id: l.id, n: l.number, ar: l.name, en: l.description, status: toStatus(l.status), pct: Math.round(l.progress_percentage || 0), img: lessonArt(l.thumbnail, l.id), done: l.activities_completed, of: l.activities_count })),
  };
  // الأهداف: items لكل درس (عربي/إنكليزي) — نسطّحها
  const unitObjectives = (u.objectives || []).flatMap(o => {
    const it = o.items?.items || (o.content ? o.content.split(/\r?\n/).filter(Boolean) : []);
    const en = o.items?.items_en || [];
    return it.map((ar, i) => ({ ar, en: en[i] || '' }));
  });
  const myOutcomes = (u.learning_outcomes || []).map(o => ({ id: o.id, ar: o.title, en: o.title_en || '', done: !!o.is_achieved }));
  const unitResources = (u.resources || []).map(r => ({ id: r.id, ar: r.title ?? r.name, en: r.title_en ?? r.type ?? '', d: r.description ?? '', url: r.file_url ?? r.url ?? r.file }));
  const exam = u.summative_exam;   // يظهر فقط لو المعلم كلّف به
  const lessonBars = (u.lessons_progress || []).map(l => ({ id: l.id, ar: l.name, pct: Math.round(l.progress_percentage || 0), status: toStatus(l.status) }));
  const nextUnit = u.next_unit;
  const iv = u.intro_video;
  const vids = [
    ...(iv?.url ? [{ id: iv.id, url: iv.url, title: iv.name || 'الفيديو التمهيدي', duration: iv.duration, thumb: iv.thumbnail, intro: true }] : []),
    ...(u.videos || []).filter(v => v.is_active !== false && v.url && v.id !== iv?.id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(v => ({ id: v.id, url: v.url, title: v.title, titleEn: v.title_en, desc: v.description, duration: v.duration_formatted, thumb: v.thumbnail })),
  ];
  const cur = U.lessons.find(l => String(l.id) === String(selId)) || U.lessons.find(l => l.status === 'current') || U.lessons[0] || {};
  const acts = L?.activities || [];
  const lessonFlow = acts.map(a => ({ n: a.index, ar: a.title, en: a.type_label, status: toStatus(a.status) === 'done' ? 'done' : toStatus(a.status) === 'current' ? 'current' : 'todo', to: activityLink(L.id, a.activity_id), locked: a.is_locked }));
  const nextAct = acts.find(a => !a.is_locked && a.status !== 'completed') || acts.find(a => !a.is_locked);
  // صفحة الدرس الجاري — ولو كل الدروس مقفلة/بلا محتوى نعطّل الزر بدل ما نرجّع الطالب
  // الدرس الجاري، وإلا (الوحدة مكتملة) أول درس مفتوح للمراجعة — والقفل فقط لو مفيش ولا درس مفتوح
  const curRow = U.lessons.find(l => String(l.id) === String(selId) && l.status !== 'locked');
  const reviewMode = !curRow && U.lessons.some(l => l.status === 'done');
  const openLessonRow = curRow || (reviewMode ? U.lessons.find(l => l.status !== 'locked') : null);
  const resume = openLessonRow ? '/lesson?id=' + openLessonRow.id : null;
  const openVideo = (v) => { clickSound(); setVideo(v); };
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
              {u.grade?.display_name && <span className="chip">{u.grade.display_name}</span>}
              {u.grade?.name && <span className="chip">{u.grade.name}</span>}
              {u.tier?.label && <span className="chip">{u.tier.label}</span>}
            </div>
            <p style={{ marginTop: 14 }}>{U.desc}</p>
            <div className="hero-actions">
              {resume ? (
                <Link to={resume} className="btn btn-primary btn-col">
                  <span>{reviewMode ? '↺ راجع دروس الوحدة' : '⏵ تابع الدرس الجاري'}</span>
                  <span className="sub">{reviewMode ? 'أكملت الوحدة 🎉 · ' + openLessonRow.ar : openLessonRow.ar}</span>
                </Link>
              ) : (
                <button className="btn btn-primary btn-col" style={{ opacity: 0.55, cursor: 'not-allowed' }}
                  onClick={() => showToast(u.has_content ? 'دروس هذه الوحدة تُفتح بتكليف من معلمك' : 'محتوى هذه الوحدة لم يُضف بعد — سنخبرك فور جاهزيته', '🔒')}>
                  <span>🔒 تابع الدرس الجاري</span>
                  <span className="sub">{u.has_content ? 'بتكليف من معلمك' : 'المحتوى قيد الإعداد'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {vids.length > 0 && <>
        <SecHead ico="/img/target.png" ar={vids[0].intro ? 'الفيديو التمهيدي للوحدة' : 'فيديوهات الوحدة'} en={vids[0].intro ? 'Unit Intro Video' : 'Unit Videos'} />
        {vids.map((v, vi) => (
        <div key={v.id ?? vi} className="card next-card" style={{ borderTopColor: 'var(--brand)', marginTop: vi ? 14 : undefined }}>
          <div style={{ position: 'relative', width: 220, borderRadius: 14, overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }} title="شغّل الفيديو" onClick={() => openVideo(v)}>
            <img src={v.thumb || U.img} alt="" style={{ width: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.28)' }}>
              <span style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--white)', display: 'grid', placeItems: 'center', fontSize: 22, color: 'var(--brand)', boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>▶</span>
            </div>
            {v.duration && <span style={{ position: 'absolute', bottom: 8, insetInlineStart: 8, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 9px', borderRadius: 8 }}>{v.duration}</span>}
          </div>
          <div className="body">
            <h3>{v.intro ? `شاهد قبل أن تبدأ: ${v.title}` : v.title}</h3>
            <div className="en">{v.titleEn || (v.intro ? "Watch first — what you'll learn in this unit" : '')}</div>
            {v.desc && <div className="d">{v.desc}</div>}
          </div>
          <div className="actions">
            <button className="btn btn-primary btn-col" onClick={() => openVideo(v)}>
              <span>▶ شاهد الفيديو</span>
              <span className="sub">{v.intro ? 'Watch Intro' : 'Watch'}</span>
            </button>
          </div>
        </div>
        ))}
        </>}

        <SecHead ico="/img/book.png" ar="دروس الوحدة" en="Unit Lessons" />
        <div className="stations-grid lessons-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {U.lessons.map(l => (
            <div key={l.n} className={'station-card lsn ' + l.status}>
              <div className="img">
                <img loading="lazy" decoding="async" src={l.img} alt="" />
                <span className={'st ' + l.status}>{ST[l.status]}</span>
                {l.status === 'locked' && <div className="lock-overlay"><span>🔒</span></div>}
              </div>
              <div className="body">
                <div className="lsn-head">
                  <span className="no">{l.n}</span>
                  <div style={{ minWidth: 0 }}>
                    <h4>{lessonTitle(l)}</h4>
                    {l.en && <div className="e">{l.en}</div>}
                  </div>
                </div>
                <div className="meta">
                  <span>{l.status === 'current' ? `أنجزت ${l.done} من ${l.of} خطوة`
                    : l.status === 'locked' ? '🔒 يُفتح بعد الدرس السابق'
                    : `✓ أنجزت ${l.of} خطوات`}</span>
                  <span className="pct">{l.pct}٪</span>
                </div>
                <div className="bar"><i style={{ width: Math.max(l.pct, l.pct ? 4 : 0) + '%' }} /></div>
                <div className="cta">
                  {l.status === 'locked'
                    ? <button className="off" disabled>🔒 مقفل</button>
                    : <button className={l.status === 'done' ? 'review' : 'continue'} onClick={() => openLesson(l.id, l.status === 'done')}>
                        {l.status === 'done' ? '↺ راجع الدرس' : '▵ تابع الدرس'}
                      </button>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <SecHead ico="/img/target.png" ar="رحلة الدرس الجاري" en="Current Lesson Journey" />
        <div className="card" style={{ padding: 26 }}>
          <div style={{ fontWeight: 900, fontSize: 17 }}>{cur.ar}</div>
          <div className="sec-en">{lessonFlow.length} خطوات — يُحدَّث تقدمك بعد كل خطوة</div>
          <div className="flow-strip" style={{ marginTop: 20 }}>
            {lessonFlow.map(s => {
              const inner = (
                <>
                  <div className="n">{s.status === 'done' ? '✓' : s.n}</div>
                  <div className="t">{s.ar}</div>
                  <div className="e">{s.en}</div>
                </>
              );
              return s.locked
                ? <div key={s.n} className={'flow-step ' + s.status} title="يُفتح بعد الخطوة السابقة">{inner}</div>
                : <Link key={s.n} to={s.to} className={'flow-step ' + s.status}>{inner}</Link>;
            })}
          </div>
        </div>

        {/* شارت تقدمك بدروس الوحدة — أعمدة سريعة القراءة */}
        <SecHead ico="/img/clipboard.png" ar="تقدمك في دروس الوحدة" en="Unit Lessons Progress" />
        <div className="card" style={{ padding: '24px 28px' }}>
          <div className="unit-bars">
            {lessonBars.map(l => (
              <div className="ub" key={l.id}>
                <div className="col-wrap">
                  <span className="pct" style={{ color: l.pct > 0 ? 'var(--brand)' : 'var(--mute2)' }}>{l.pct}٪</span>
                  <div className="col">
                    <i style={{ height: Math.max(l.pct, 4) + '%', background: l.status === 'current' ? 'var(--gold)' : l.pct === 100 ? 'var(--green)' : 'var(--line)' }} />
                  </div>
                </div>
                <div className="l">{l.ar}</div>
              </div>
            ))}
          </div>
        </div>

        {exam && <>
        <SecHead ico="/img/medal.png" ar="اختبار الوحدة الختامي" en="Unit Summative Exam" />
        <div className="card next-card" style={{ borderTopColor: 'var(--gold)' }}>
          <img src="/img/scroll.png" alt="" style={{ width: 74, height: 74, objectFit: 'contain', flexShrink: 0 }} />
          <div className="body">
            <h3>{exam.title || 'التقييم الختامي'}</h3>
            <div className="en">{exam.title_en || 'Summative Assessment'}</div>
            {exam.sections?.length > 0 && (
              <div className="unit-meta-chips" style={{ marginTop: 8 }}>
                {exam.sections.map(s => <span key={s.id} className="chip" style={s.skill?.color ? { color: s.skill.color, background: s.skill.color + '15' } : undefined}>{s.title} · {s.questions_count}</span>)}
              </div>
            )}
            <div className="d">{[
              exam.state === 'ended' ? 'انتهى الاختبار — يمكنك مراجعة نتيجتك' : 'بتكليف من معلمك',
              exam.questions_count && exam.questions_count + ' سؤالاً',
              exam.estimated_minutes && (exam.estimated_minutes.from && exam.estimated_minutes.to ? `${exam.estimated_minutes.from}–${exam.estimated_minutes.to} دقيقة` : (exam.estimated_minutes.from || exam.estimated_minutes.to) + ' دقيقة'),
              exam.due_at && 'آخر موعد: ' + new Date(exam.due_at).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long' }),
            ].filter(Boolean).join(' · ')}</div>
          </div>
          <div className="actions">
            <Link to={'/quiz?unit=' + unitId} className="btn btn-primary btn-col">
              <span>تعليمات الاختبار</span>
              <span className="sub">Exam Instructions</span>
            </Link>
          </div>
        </div>
        </>}

        {(unitObjectives.length > 0 || myOutcomes.length > 0) && <>
        <SecHead ico="/img/bulb.png" ar="أهداف الوحدة ونواتج التعلم" en="Unit Objectives & Learning Outcomes" />
        <div className="objectives-grid">
          {unitObjectives.length > 0 && <div className="card">
            <div className="badges-head">
              <div>
                <h3>الأهداف المحورية</h3>
                <div className="en">ما ستحققه في هذه الوحدة</div>
              </div>
            </div>
            <ul className="obj-list" style={{ marginTop: 10 }}>
              {unitObjectives.map((o, i) => (
                <li key={i}>
                  <span className="mark">◆</span>
                  <span>{o.ar}<span className="en">{o.en}</span></span>
                </li>
              ))}
            </ul>
          </div>}
          {myOutcomes.length > 0 && <div className="card">
            <div className="badges-head">
              <div>
                <h3>نواتج تعلمي</h3>
                <div className="en">My Outcomes — «أنا أستطيع أن…»</div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              {myOutcomes.map(o => (
                <div key={o.id} className={'outcome-row ' + (o.done ? 'done' : 'todo')}>
                  <span className="chk">{o.done ? '✓' : '•'}</span>
                  <div>
                    <div className="t">{o.ar}</div>
                    {o.en && <div className="en">{o.en}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>}
        </div>
        </>}

        {unitResources.length > 0 && <>
        <SecHead ico="/img/scroll.png" ar="مصادر الوحدة للطباعة" en="Printable Unit Resources" />
        <div className="print-grid">
          {unitResources.map(r => (
            <div className="print-row" key={r.id}>
              <img src="/img/scroll.png" alt="" />
              <div>
                <div className="t">{r.ar}</div>
                <div className="e">{r.en}</div>
                <div className="d">{r.d}</div>
              </div>
              {r.url
                ? <button className="btn-sm" onClick={() => { clickSound(); openFile({ url: r.url, name: r.ar }); }}>👁 فتح / طباعة</button>
                : <button className="btn-sm" onClick={() => { clickSound(); window.print(); }}>🖨 طباعة / تحميل</button>}
            </div>
          ))}
        </div>
        </>}
      </div>
      <FooterStrip
        ar={!nextUnit ? 'أحسنت! هذه آخر وحدة في مستواك'
          : !nextUnit.is_locked ? `الوحدة التالية «${nextUnit.title}» مفتوحة — هيا بنا!`
          : nextUnit.lessons_left_to_unlock > 0 ? `باقي ${nextUnit.lessons_left_to_unlock} دروس لتفتح «${nextUnit.title}» – أنت قريب`
          : `«${nextUnit.title}» تُفتح بتكليف من معلمك`}
        en={nextUnit?.is_locked ? 'Keep going to unlock the next unit!' : "Great work — keep going!"}
      />
      {video && <VideoModal poster={video.thumb || U.img} src={video.url} title={video.title} U={U} onClose={() => setVideo(null)} />}
    </div>
  );
}

