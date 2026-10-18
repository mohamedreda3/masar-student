import { useState } from 'react';
import { Ring, SecHead } from '../components.jsx';
import { realImg } from '../QuestionBody.jsx';
import { playClip, clickSound } from '../sounds.js';
import { openFile } from '../FileViewer.jsx';

/* نتيجة الواجب / الاختبار المصحَّح — data.result من GET /assignments/:id (أفضل محاولة مصحَّحة)
   كل قيمة null أو فارغة تُخفى */

const fmtDate = (d) => (d ? new Date(d).toLocaleString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '');
const mmss = (s) => (s == null ? null : `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const num = (n) => (n == null ? '' : Math.round(n * 100) / 100);

/* شارة نتيجة السؤال */
const RES = {
  correct:        { t: '✓ صحيحة', c: 'var(--green-deep)', bg: 'var(--green-soft)' },
  wrong:          { t: '✗ خاطئة', c: 'var(--danger)', bg: '#fdecec' },
  partial:        { t: '◐ جزئية', c: 'var(--orange)', bg: 'var(--orange-soft)' },
  unanswered:     { t: '— لم تُجب', c: 'var(--mute)', bg: 'var(--line2)' },
  teacher_graded: { t: '👩‍🏫 صححها المعلم', c: 'var(--brand)', bg: 'var(--lav-soft)' },
};
const Badge = ({ q }) => {
  const R = RES[q.result] || RES.unanswered;
  return <span className="chip" style={{ color: R.c, background: R.bg, fontWeight: 900 }}>{q.result_label || R.t}</span>;
};

/* عرض إجابة (نص / قائمة مرتبة / أزواج توصيل) */
function AnswerView({ v }) {
  if (v == null || v === '') return <span style={{ color: 'var(--mute)' }}>—</span>;
  if (Array.isArray(v)) {
    if (v.length && typeof v[0] === 'object') // توصيل: [{ left, right }]
      return <div style={{ display: 'grid', gap: 4 }}>{v.map((p, i) => <div key={i}>{p.left ?? p.left_text} ⟵ {p.right ?? p.right_text}</div>)}</div>;
    return <ol style={{ margin: 0, paddingInlineStart: 20 }}>{v.map((x, i) => <li key={i}>{x}</li>)}</ol>;
  }
  return <span>{String(v)}</span>;
}

/* الإجابة النموذجية حسب النوع */
function ModelAnswer({ q }) {
  const m = q.model_answer;
  if (!m) return null;
  let body;
  if (q.type === 'mcq') body = null; // تُلوَّن في الخيارات
  else if (q.type === 'arrange') body = <AnswerView v={m.items} />;
  else if (q.type === 'match') body = <AnswerView v={m.pairs} />;
  else if (m.answers?.length) body = <span>{m.answers.join(' · ')}{m.answers.length > 1 && <span style={{ color: 'var(--mute)', fontSize: 12 }}> (أيٌّ منها مقبول)</span>}</span>;
  else body = <span>{m.text}</span>;
  if (body === null) return null;
  return (
    <div className="explain-box ok" style={{ marginTop: 10 }}>
      <div style={{ flex: 1 }}><span className="h">{q.type === 'article' ? 'دليل الإجابة من المعلم' : 'الإجابة النموذجية'}</span>{body}</div>
    </div>
  );
}

/* بطاقة سؤال (قراءة فقط) */
function QuestionCard({ q, showModel }) {
  const Q = q.question || {};
  const modelIds = q.model_answer?.option_ids || [];
  return (
    <div style={{ borderTop: q.number > 1 ? '1px dashed var(--line)' : 0, paddingTop: q.number > 1 ? 20 : 0, marginTop: q.number > 1 ? 20 : 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--mute)' }}>سؤال {q.number}{q.type_label ? ` · ${q.type_label}` : ''}{q.max_points != null ? ` · ${num(q.points)}/${num(q.max_points)}` : ''}</span>
        <Badge q={q} />
      </div>
      {realImg(Q.image) && <div className="q-img"><img loading="lazy" decoding="async" src={Q.image} alt="" /></div>}
      {Q.audio && (
        <div className="audio-player">
          <button className="audio-play" onClick={() => playClip(Q.audio)}>▶</button>
          <div className="audio-track"><div className="bar"><i style={{ width: '25%' }} /></div></div>
          <span className="speed-lab">استمع للسؤال</span>
        </div>
      )}
      <div className="q-title">{Q.text}</div>
      {Q.text_en && <div className="q-en">{Q.text_en}</div>}

      {/* اختيار من متعدد: إجابتي + الصحيحة في الخيارات */}
      {q.type === 'mcq' && (Q.options || []).length > 0 ? (
        <div className="options">
          {Q.options.map(o => {
            const mine = o.id === q.my_answer;
            const right = showModel && modelIds.includes(o.id);
            const cls = right ? ' correct' : mine ? (q.is_correct ? ' correct' : ' wrong') : '';
            return (
              <button key={o.id} className={'option' + cls} disabled>
                {o.text}{mine && <span style={{ marginInlineStart: 'auto', fontSize: 11, fontWeight: 900 }}>إجابتي</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="eng-note" style={{ marginTop: 10, background: 'var(--wash)', borderRadius: 12, padding: '10px 14px' }}>
          <b style={{ display: 'block', fontSize: 12, color: 'var(--mute)' }}>إجابتي</b>
          <AnswerView v={q.my_answer_text ?? q.my_answer} />
        </div>
      )}
      {showModel && <ModelAnswer q={q} />}
    </div>
  );
}

export default function AssignmentResult({ r, W = 'الواجب' }) {
  const [oneByOne, setOneByOne] = useState(false);
  const [qi, setQi] = useState(0);
  const S = r.summary || {};
  const qs = r.questions || [];
  const color = r.passed === false ? 'var(--danger)' : 'var(--green)';
  const chips = [
    ['صحيحة', S.correct, 'var(--green-soft)'], ['خاطئة', S.wrong, '#fdecec'],
    ['جزئية', S.partial, 'var(--orange-soft)'], ['لم تُجب', S.unanswered, 'var(--line2)'],
  ].filter(([, v]) => v);

  return (
    <>
      {/* 1) رأس النتيجة */}
      <div className="card" style={{ marginTop: 22, padding: '24px 28px', display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap', borderTop: `4px solid ${color}` }}>
        <Ring pct={Math.round(r.percentage ?? 0)} size={130} stroke={12} color={color}>
          <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{Math.round(r.percentage ?? 0)}%</div>
            <div style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 700 }}>{num(r.score)} من {num(r.total_grade)}</div>
          </div>
        </Ring>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 21 }}>نتيجتك في {W}</h2>
            {r.passed === true && <span className="chip" style={{ background: 'var(--green-soft)', color: 'var(--green-deep)', fontWeight: 900 }}>✓ ناجح</span>}
            {r.passed === false && <span className="chip" style={{ background: '#fdecec', color: 'var(--danger)', fontWeight: 900 }}>✗ لم يجتز</span>}
          </div>
          <div className="unit-meta-chips" style={{ marginTop: 10 }}>
            {r.graded_by?.label && <span className="chip">{r.graded_by.label}{r.graded_by.teacher?.name ? ` · أ. ${r.graded_by.teacher.name}` : ''}</span>}
            {r.graded_at && <span className="chip">📅 {fmtDate(r.graded_at)}</span>}
            {r.pass_percentage != null && <span className="chip">النجاح من {r.pass_percentage}٪</span>}
            {r.is_late && <span className="chip" style={{ background: 'var(--orange-soft)' }}>⏰ متأخر</span>}
            {mmss(r.time_spent_seconds) && <span className="chip">⏱ {mmss(r.time_spent_seconds)}</span>}
          </div>
          {/* 2) ملخص الأسئلة */}
          {chips.length > 0 && (
            <div className="unit-meta-chips" style={{ marginTop: 10 }}>
              {chips.map(([l, v, bg]) => <span key={l} className="chip" style={{ background: bg, fontWeight: 900 }}>{l}: {v}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* 4) ملاحظة المعلم + صوته */}
      {(r.feedback || r.teacher_audio) && (
        <div className="card" style={{ marginTop: 18, padding: '18px 22px', borderTop: '4px solid var(--pink)' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>💬 ملاحظة المعلم</h3>
          {r.feedback && <div style={{ fontSize: 14.5, lineHeight: 2, marginTop: 8 }}>{r.feedback}</div>}
          {r.teacher_audio && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--mute)', marginBottom: 6 }}>🎙 ملاحظة صوتية من المعلم</div>
              <audio src={r.teacher_audio} controls preload="none" style={{ width: '100%' }} />
            </div>
          )}
        </div>
      )}

      <div className="result-cols" style={{ marginTop: 18 }}>
        {/* 3) حسب نوع السؤال */}
        {r.by_type?.length > 0 && (
          <div className="card" style={{ padding: '18px 22px' }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>📊 حسب نوع السؤال</h3>
            <div style={{ marginTop: 10 }}>
              {r.by_type.map(t => (
                <div className="goal-row" key={t.type}>
                  <div className="head"><span>{t.label}</span><span className="pct">{Math.round(t.percentage ?? 0)}٪</span></div>
                  <div className="en">{t.correct}/{t.total} صحيحة · {num(t.points)}/{num(t.max_points)} درجة</div>
                  <div className="bar thin"><i style={{ width: (t.percentage ?? 0) + '%', background: (t.percentage ?? 0) >= 60 ? 'var(--green)' : 'var(--orange)' }} /></div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* 5) معايير التقييم */}
        {r.rubric?.length > 0 && (
          <div className="card" style={{ padding: '18px 22px' }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>📋 معايير التقييم</h3>
            <div style={{ marginTop: 10 }}>
              {r.rubric.map(k => (
                <div className="goal-row" key={k.key}>
                  <div className="head"><span>{k.name}{k.weight ? <span style={{ color: 'var(--mute)', fontSize: 11 }}> · {k.weight}٪</span> : null}</span><span className="pct">{num(k.score)}/{k.out_of ?? 5}</span></div>
                  <div className="bar thin"><i style={{ width: (k.percentage ?? 0) + '%', background: 'var(--purple)' }} /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6) مراجعة الأسئلة */}
      {qs.length > 0 && <>
        <SecHead ico="/img/target2.png" ar={`مراجعة الأسئلة (${qs.length})`} en="Question Review" link={oneByOne ? 'عرض الكل' : 'سؤالاً سؤالاً'} onLink={() => { clickSound(); setOneByOne(v => !v); setQi(0); }} />
        <div className="card activity-card">
          {(oneByOne ? [qs[qi]] : qs).map(q => <QuestionCard key={q.question_id} q={{ ...q, number: oneByOne ? 1 : q.number }} showModel={r.show_model_answers !== false} />)}
          {oneByOne && (
            <div className="activity-nav">
              <button className="btn btn-ghost" disabled={qi === 0} onClick={() => setQi(qi - 1)} style={{ opacity: qi === 0 ? 0.4 : 1 }}>→ السابق</button>
              <div className="spacer" />
              <span style={{ fontWeight: 800, color: 'var(--mute)' }}>{qi + 1} / {qs.length}</span>
              <div className="spacer" />
              <button className="btn btn-primary" disabled={qi === qs.length - 1} onClick={() => setQi(qi + 1)} style={{ opacity: qi === qs.length - 1 ? 0.4 : 1 }}>التالي ←</button>
            </div>
          )}
        </div>
      </>}

      {/* 7) أنشطة الواجب */}
      {r.activities?.length > 0 && <>
        <SecHead ico="/img/clipboard.png" ar={`أنشطة ${W} (${r.activities.length})`} en="Activities" />
        {r.activities.map(a => (
          <div className="act-row" key={a.activity_id} style={{ '--edge': (a.percentage ?? 0) >= 60 ? 'var(--green)' : 'var(--orange)' }}>
            <div className="ico" style={{ background: 'var(--lav-soft)' }}><img src="/img/clipboard.png" alt="" /></div>
            <div className="body"><h4>{a.title}</h4></div>
            <div className="prog">
              <div className="lab">{a.score != null ? `${num(a.score)} / ${num(a.max_score)}` : '—'}{a.percentage != null ? ` · ${Math.round(a.percentage)}٪` : ''}</div>
              <div className="bar thin"><i style={{ width: (a.percentage ?? 0) + '%', background: 'var(--green)' }} /></div>
            </div>
          </div>
        ))}
      </>}

      {/* 8) ملفاتي المرفوعة */}
      {r.files?.length > 0 && <>
        <SecHead ico="/img/scroll.png" ar={`ملفاتي المرفوعة (${r.files.length})`} en="My Uploaded Files" />
        <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {r.files.map(f => (f.mime_type || '').startsWith('image/')
            ? <img key={f.url} src={f.url} alt={f.name} onClick={() => openFile(f)} style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--line)', cursor: 'zoom-in' }} />
            : <button key={f.url} onClick={() => openFile(f)} className="chip" style={{ cursor: 'pointer', border: 0 }}>📎 {f.name}</button>)}
        </div>
      </>}
    </>
  );
}
