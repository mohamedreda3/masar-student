import { useState } from 'react';
import { Logo } from '../components.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { examSections, SKILLS, dialogueAudio } from '../data.js';
import { dingSound, winSound, playClip } from '../sounds.js';

/* الاختبار الختامي — أربعة أقسام بالمهارات الأربع، بلا صح/خطأ ظاهر أثناء الحل */
function FocusBar({ section }) {
  return (
    <div className="focus-bar">
      <div className="container in">
        <Logo h={50} />
        <div className="title">
          <div className="t">اختبار الوحدة الختامي · الاحتياجات والرغبات — {section}</div>
          <div className="e">Unit Summative Exam · Needs &amp; Wants</div>
        </div>
        <Link to="/quiz" className="focus-exit">إيقاف مؤقت ⎋</Link>
      </div>
    </div>
  );
}

const KEYS = ['أ', 'ب', 'ج', 'د'];

export default function Exam() {
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const [txt, setTxt] = useState('');
  const [speed, setSpeed] = useState('1.0x');

  const sec = examSections[i];
  const S = SKILLS[sec.skill];
  const last = i === examSections.length - 1;
  const canNext = sec.record || (sec.write ? txt.trim().length > 0 : sel !== null);

  const next = () => {
    dingSound();
    if (last) { winSound(); nav('/exam/result'); return; }
    setI(i + 1); setSel(null); setTxt('');
  };

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar section={sec.title} />
      <div className="container" style={{ maxWidth: 1060 }}>
        {/* شريط الأقسام الأربعة */}
        <div className="flow-strip" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 30 }}>
          {examSections.map((s, si) => {
            const K = SKILLS[s.skill];
            const st = si < i ? 'done' : si === i ? 'current' : 'todo';
            return (
              <div key={s.skill} className={'flow-step ' + st}>
                <div className="n">{si < i ? '✓' : si + 1}</div>
                <div className="t">{K.ar}</div>
                <div className="e">{K.en}</div>
              </div>
            );
          })}
        </div>

        <div className="card activity-card" style={{ marginTop: 20 }}>
          <span className="chip" style={{ color: S.color, background: S.color + '15', fontSize: 13 }}>
            {sec.title} · {S.en}
          </span>

          {sec.passage && (
            <div className="eng-imgs" style={{ gridTemplateColumns: '1fr', maxWidth: 460, margin: '14px auto 0' }}>
              <div className="eng-img"><img src="/img/scene-breakfast.jpeg" alt="" style={{ height: 'auto' }} /></div>
            </div>
          )}
          {sec.passage && (
            <div className="passage">
              <span className="tr-hover" data-tr={sec.passageEn}>{sec.passage}</span>
            </div>
          )}

          {sec.audio && (
            <div className="audio-player">
              <button className="audio-play" onClick={() => playClip(dialogueAudio, parseFloat(speed))}>▶</button>
              <div className="audio-track"><div className="bar"><i style={{ width: '15%' }} /></div></div>
              <span className="audio-time">0:08 / 0:50</span>
              <span className="speed-lab">سرعة التشغيل</span>
              <div className="speed-pills">
                {['0.75x', '1.0x', '1.25x'].map(s => (
                  <button key={s} className={'speed-pill' + (speed === s ? ' active' : '')} onClick={() => setSpeed(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="q-title">{sec.q}</div>
          <div className="q-en">{sec.qEn}</div>

          {sec.options && (
            <div className="options">
              {sec.options.map((o, oi) => (
                <button key={o} className={'option' + (sel === oi ? ' selected' : '')} onClick={() => setSel(oi)}>
                  <span className="key">{KEYS[oi]}</span>{o}
                </button>
              ))}
            </div>
          )}

          {sec.record && (
            <div className="recorder">
              <button className="rec-btn" onClick={(e) => { dingSound(); e.currentTarget.classList.toggle('on'); }}>🎙</button>
              <div className="t">سجّل إجابتك بصوت واضح</div>
              <div className="e">سيستمع معلمك لتسجيلك ويقيّمه وفق المعايير</div>
              <div className="timer">00:00 / 01:30</div>
            </div>
          )}

          {sec.write && (
            <>
              <textarea value={txt} onChange={e => setTxt(e.target.value)} placeholder="اكتب فقرتك هنا…"
                style={{ width: '100%', minHeight: 160, marginTop: 16, border: '2px solid var(--line)', borderRadius: 14, padding: '14px 18px', fontFamily: 'inherit', fontSize: 16, lineHeight: 2, resize: 'vertical' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--mute)', fontWeight: 700 }}>
                <span>عدد الكلمات: {txt.trim() ? txt.trim().split(/\s+/).length : 0}</span>
                <Link to="/rubric" className="link">📋 كيف يقيّم معلمك كتابتك؟</Link>
              </div>
            </>
          )}

          <div className="activity-nav">
            <span style={{ fontSize: 12.5, color: 'var(--mute)', fontWeight: 700 }}>☁ الحفظ التلقائي مفعّل · خذ وقتك</span>
            <div className="spacer" />
            <button className="btn btn-primary" onClick={next} disabled={!canNext} style={{ opacity: canNext ? 1 : 0.5 }}>
              {last ? 'إنهاء الاختبار وعرض النتيجة ←' : 'القسم التالي ←'}
            </button>
          </div>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
