import { useState } from 'react';
import { Logo } from '../components.jsx';
import { Link } from 'react-router-dom';
import { lessonFlow, usefulPhrases, lessonVocab, selfCheck, student, activityOutcome, pronunciationAudio, dialogueAudio, hamdanText } from '../data.js';
import { playClip, dingSound, buzzSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* شريط الجلسة المركّز — بلا نقاط ولا شارات (قاعدة العميل: لا مشتتات داخل التمرين) */
function FocusBar() {
  return (
    <div className="focus-bar">
      <div className="container in">
        <Logo h={50} />
        <div className="title">
          <div className="t">الاحتياجات والرغبات · احتياجاتنا ورغباتنا — مهارة القراءة</div>
          <div className="e">Needs &amp; Wants · Our Needs and Wants — Reading</div>
        </div>
        <Link to="/unit" className="focus-exit">خروج من الدرس ⎋</Link>
      </div>
    </div>
  );
}

function FlowStrip() {
  return (
    <div className="flow-strip" style={{ marginTop: 30 }}>
      {lessonFlow.map(s => {
        const inner = (
          <>
            <div className="n">{s.status === 'done' ? '✓' : s.n}</div>
            <div className="t">{s.ar}</div>
            <div className="e">{s.en}</div>
          </>
        );
        return <Link key={s.n} to={s.to} className={'flow-step ' + s.status}>{inner}</Link>;
      })}
    </div>
  );
}

function Activity() {
  const [speed, setSpeed] = useState('1.0x');
  const [tf, setTf] = useState({}); // إجابات صح/خطأ: {رقم: true|false}
  const answerTf = (i, val) => {
    if (tf[i] !== undefined) return;
    setTf({ ...tf, [i]: val });
    val === hamdanText.trueFalse[i].correct ? dingSound() : buzzSound();
  };
  return (
    <div className="card activity-card">
      <div className="scene">
        <img src="/img/scene-needs.png" alt="" />
      </div>
      <h2>{hamdanText.title}</h2>
      <div className="en">{hamdanText.titleEn}</div>
      <div className="outcome-banner">
        <img src="/img/target2.png" alt="" />
        <div>
          <div className="l">ناتج التعلم لهذا النشاط · Learning Outcome</div>
          <div className="t">{activityOutcome.ar}</div>
          <div className="e">{activityOutcome.en}</div>
        </div>
      </div>
      <p className="prompt">
        اقرأ النص عن حمدان وعائلته، ثم أجب عن أسئلة «صح أم خطأ».
        مرّر الماوس فوق أي فقرة لترى ترجمتها.
      </p>

      {/* نص العميل الفعلي — فقرة لكل شخصية، بترجمة هوفر */}
      {hamdanText.paragraphs.map(p => (
        <div className="passage" key={p.who} style={{ marginTop: 10 }}>
          <b style={{ display: 'block', marginBottom: 4 }}>{p.who}</b>
          <span className="tr-hover" data-tr={p.en}>{p.ar}</span>
        </div>
      ))}

      <div className="audio-player">
        <button className="audio-play" onClick={() => playClip(dialogueAudio, parseFloat(speed))}>▶</button>
        <div className="audio-track">
          <div className="bar"><i style={{ width: '35%' }} /></div>
        </div>
        <span className="speed-lab">سرعة التشغيل</span>
        <div className="speed-pills">
          {['0.75x', '1.0x', '1.25x'].map(s => (
            <button key={s} className={'speed-pill' + (speed === s ? ' active' : '')} onClick={() => setSpeed(s)}>{s}</button>
          ))}
        </div>
      </div>

      {/* المهمة الأولى من ورقة العميل: صح أم خطأ — بمفتاح إجاباته */}
      <div style={{ marginTop: 18 }}>
        <h4 style={{ fontSize: 15.5 }}>المهمة: صح أم خطأ؟ ✓✗</h4>
        <div className="en" style={{ fontSize: 11, color: 'var(--mute)' }}>Task: True or False — based on the text</div>
        {hamdanText.trueFalse.map((t, i) => {
          const answered = tf[i] !== undefined;
          const wasRight = answered && tf[i] === t.correct;
          return (
            <div key={t.s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14.5, minWidth: 200 }}>{t.s}</span>
              <button className={'option' + (answered && t.correct ? ' correct' : '') + (answered && tf[i] === true && !t.correct ? ' wrong' : '')}
                style={{ padding: '8px 18px' }} disabled={answered} onClick={() => answerTf(i, true)}>صح ✓</button>
              <button className={'option' + (answered && !t.correct ? ' correct' : '') + (answered && tf[i] === false && t.correct ? ' wrong' : '')}
                style={{ padding: '8px 18px' }} disabled={answered} onClick={() => answerTf(i, false)}>خطأ ✗</button>
              {answered && <span style={{ fontSize: 18 }}>{wasRight ? '🌟' : '👣'}</span>}
            </div>
          );
        })}
      </div>

      <div className="self-check">
        <h4>تحقق من نفسك</h4>
        <div className="e">Check yourself after reading</div>
        <div style={{ marginTop: 8 }}>
          {selfCheck.map(c => (
            <label key={c}><input type="checkbox" /> {c}</label>
          ))}
        </div>
      </div>

      <div className="activity-nav">
        <button className="hint-btn" onClick={() => showToast('اسأل نفسك: هل يستطيع حمدان العيش بدونه؟ إذا لا — فهو حاجة!', '💡')}>💡 تلميح</button>
        <Link to="/extra/support" className="hint-btn" style={{ textDecoration: 'none' }}>🛟 أحتاج مساعدة</Link>
        <div className="spacer" />
        <Link to="/activity/listening" className="btn btn-ghost">الخطوة السابقة</Link>
        <Link to="/activity/speaking" className="btn btn-primary">الخطوة التالية: مهارة التحدث ←</Link>
      </div>
    </div>
  );
}

function Tools() {
  return (
    <div className="col">
      <div className="mascot">
        <img src="/img/owl.png" alt="" />
        <div className="b">أحسنت يا {student.first}! اقرأ كل فقرة بهدوء واسأل نفسك: هل هذا شيء <b>يحتاجه</b> أم <b>يريده</b>؟</div>
      </div>

      <div className="side-card tool-card">
        <div className="head">
          <img src="/img/speech.png" alt="" />
          <div>
            <h3>عبارات مفيدة</h3>
            <div className="en">Useful Phrases</div>
          </div>
        </div>
        {usefulPhrases.map(p => (
          <div className="phrase-row" key={p.ar}>
            <button className="sound-btn" onClick={() => playClip(p.audio)} aria-label={'استمع: ' + p.ar}>🔊</button>
            <div className="txt">
              <div className="ar">{p.ar}</div>
              <div className="tr">{p.en}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="side-card tool-card">
        <div className="head">
          <img src="/img/flashcards.png" alt="" />
          <div>
            <h3>بنك المفردات</h3>
            <div className="en">Vocabulary Bank</div>
          </div>
        </div>
        <div className="vocab-grid">
          {lessonVocab.map(v => (
            <div className="vocab-card" key={v.ar}>
              <div className="img"><img loading="lazy" decoding="async" src={v.img} alt="" /></div>
              <div className="ar">{v.ar}</div>
              <div className="tr">{v.en}</div>
              <button className="sound-btn" onClick={() => playClip(v.audio)} aria-label={'استمع: ' + v.ar}>🔊</button>
            </div>
          ))}
        </div>
      </div>

      <div className="side-card tool-card">
        <div className="head">
          <img src="/img/mic.png" alt="" />
          <div>
            <h3>دعم النطق</h3>
            <div className="en">Pronunciation Support</div>
          </div>
        </div>
        <div style={{ background: 'var(--lav-soft)', borderRadius: 14, padding: '16px 18px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="audio-play" style={{ width: 52, height: 52, flexShrink: 0 }} aria-label="استمع للنطق" onClick={() => playClip(pronunciationAudio)}>🔊</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 22 }}>الهواء</div>
            <div style={{ fontSize: 13, color: 'var(--mute)', direction: 'ltr' }}>[al-ha-waa']</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5, fontWeight: 700, color: 'var(--brand-ink)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px' }}>
          <span>🗣</span> الهمزة الممدودة في آخر «الهواء» — أطِل الألف قبلها
        </div>
      </div>

      <div className="side-card tool-card">
        <div className="head">
          <img src="/img/book.png" alt="" />
          <div>
            <h3>القاعدة المساعدة</h3>
            <div className="en">Grammar Helper</div>
          </div>
        </div>
        <div className="grammar-box">
          <div className="rule">لبيان السبب نستخدم: «لـ + فعل مضارع» أو «لأنَّ»: أحتاجُ إلى الماءِ لأشرب</div>
          <div className="ex">
            <span className="ok">✔ أحتاجُ إلى الكتبِ لأتعلَّم</span><br />
            <span className="no">✘ أحتاجُ إلى الكتب أتعلم</span>
          </div>
          <div className="warn">خطأ شائع: نسيان «لـ» قبل فعل السبب.</div>
        </div>
      </div>
    </div>
  );
}

function ToolkitBar() {
  const items = [
    { t: 'بطاقات المفردات', e: 'Flashcards',      ico: '/img/flashcards.png', cnt: 4, to: '/activity/vocab' },
    { t: 'قواعد اللغة',     e: 'Grammar Toolkit', ico: '/img/book.png',       cnt: 1, to: '/activity/grammar' },
    { t: 'عبارات مساعدة',   e: 'Helping Phrases', ico: '/img/speech.png',     cnt: 4, to: '/activity/speaking' },
    { t: 'دعم المستوى',     e: 'Support',         ico: '/img/headphones.png',         to: '/extra/support' },
  ];
  return (
    <div className="toolkit-bar">
      <div className="head">أدوات مساعدة</div>
      <div className="en">Helpful Tools — حقيبة أدواتك في كل درس</div>
      <div className="toolkit-items">
        {items.map(i => (
          <Link to={i.to} className="toolkit-item" key={i.t}>
            {i.cnt && <span className="cnt">{i.cnt}</span>}
            <img src={i.ico} alt="" />
            <div>
              <div className="t">{i.t}</div>
              <div className="e">{i.e}</div>
            </div>
          </Link>
        ))}
      </div>
      <div className="lesson-nav-bar">
        <button className="btn btn-ghost" onClick={() => showToast('هذا أول درس في الوحدة — أنت في البداية!', '🌱')}>→ الدرس السابق</button>
        <div className="mid">
          <div className="t">الدرس 1: احتياجاتنا ورغباتنا</div>
          <div className="e">Our Needs and Wants</div>
        </div>
        <button className="btn btn-primary" onClick={() => showToast('الدرس التالي «حوار الحاجات والرغبات» يُفتح بتكليف من معلمك', '🔒')}>الدرس التالي ←</button>
      </div>
    </div>
  );
}

export default function Lesson() {
  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar />
      <div className="container">
        <FlowStrip />
        <div className="lesson-grid">
          <div className="col">
            <Activity />
            <ToolkitBar />
          </div>
          <Tools />
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}

