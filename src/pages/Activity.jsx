import { useState } from 'react';
import { Logo } from '../components.jsx';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { SKILLS, usefulPhrases, selfCheck, dialogueAudio } from '../data.js';
import { playClip, clickSound, dingSound } from '../sounds.js';

/* شاشة نشاط لكل مهارة — أدوات كل نوع بحسب تأشيرات العميل */

function FocusBar({ title, en }) {
  return (
    <div className="focus-bar">
      <div className="container in">
        <Logo h={50} />
        <div className="title">
          <div className="t">{title}</div>
          <div className="e">{en}</div>
        </div>
        <Link to="/activities" className="focus-exit">خروج ⎋</Link>
      </div>
    </div>
  );
}

function AudioBar() {
  const [speed, setSpeed] = useState('1.0x');
  return (
    <div className="audio-player">
      <button className="audio-play" onClick={() => playClip(dialogueAudio, parseFloat(speed))}>▶</button>
      <div className="audio-track"><div className="bar"><i style={{ width: '30%' }} /></div></div>
      <span className="audio-time">0:14 / 0:48</span>
      <span className="speed-lab">سرعة التشغيل</span>
      <div className="speed-pills">
        {['0.75x', '1.0x', '1.25x'].map(s => (
          <button key={s} className={'speed-pill' + (speed === s ? ' active' : '')} onClick={() => setSpeed(s)}>{s}</button>
        ))}
      </div>
    </div>
  );
}

function FinishBar({ hint }) {
  const nav = useNavigate();
  return (
    <div className="activity-nav">
      <button className="hint-btn">💡 {hint || 'تلميح'}</button>
      <button className="hint-btn" onClick={() => nav('/extra/support')}>🛟 أحتاج مساعدة</button>
      <div className="spacer" />
      <button className="btn btn-primary" onClick={() => nav('/result')}>إنهاء النشاط ←</button>
    </div>
  );
}

/* ---- استماع: مشغل بسرعات + سؤال + النص الكامل مقفل ---- */
function Listening() {
  const [sel, setSel] = useState(null);
  const opts = ['يمارسُ الرياضةَ', 'يشربُ الماءَ', 'يذهبُ إلى السوقِ', 'ينامُ باكراً'];
  return (
    <div className="card activity-card">
      <h2 style={{ marginTop: 0 }}>استمع إلى فقرة: روتيني اليومي</h2>
      <div className="en">Listening: my daily routine</div>
      <AudioBar />
      <div className="q-title">ماذا يفعلُ المتحدثُ في المساء؟</div>
      <div className="options">
        {opts.map((o, i) => (
          <button key={o} className={'option' + (sel === i ? ' selected' : '')} onClick={() => setSel(i)}>
            <span className="key">{['أ', 'ب', 'ج', 'د'][i]}</span>{o}
          </button>
        ))}
      </div>
      <div className="sw-box" style={{ background: 'var(--line2)', marginTop: 18 }}>
        <h4 style={{ color: 'var(--mute)' }}>🔒 النص الكامل للفقرة</h4>
        <li style={{ listStyle: 'none' }}>يُفتح بعد إكمال الاستماع والإجابة — استمع أولاً بأذنيك!</li>
      </div>
      <FinishBar hint="ركّز على جملة «في المساء»" />
    </div>
  );
}

/* عجلة المواضيع — ودجت العميل: كل موضوع جديد فرصة لتتحدث أفضل */
const WHEEL_TOPICS = [
  { ar: 'في المطعم', e: '🍽️', c: '#f43f5e' },
  { ar: 'في المدرسة', e: '🎒', c: '#22c55e' },
  { ar: 'في السوق',  e: '🧺', c: '#3b82f6' },
  { ar: 'في البيت',  e: '🏠', c: '#14b8a6' },
  { ar: 'الهوايات',  e: '🎨', c: '#f59e0b' },
];
function TopicWheel() {
  const [deg, setDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState(null);
  const seg = 360 / WHEEL_TOPICS.length;
  const spin = () => {
    if (spinning) return;
    clickSound(); setSpinning(true); setPicked(null);
    const idx = Math.floor(Math.random() * WHEEL_TOPICS.length);
    // ندوّر 4 لفات + نوقف بحيث يقع منتصف القطاع idx تحت المؤشر العلوي
    const target = 360 * 4 + (360 - (idx * seg + seg / 2));
    setDeg(d => d + target - (d % 360));
    setTimeout(() => { setSpinning(false); setPicked(WHEEL_TOPICS[idx]); dingSound(); }, 3100);
  };
  const R = 130, cx = 150, cy = 150;
  const arc = (i) => {
    const a0 = ((i * seg - 90) * Math.PI) / 180, a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    return `M ${cx} ${cy} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`;
  };
  const labelPos = (i) => {
    const a = ((i * seg + seg / 2 - 90) * Math.PI) / 180;
    return [cx + R * 0.62 * Math.cos(a), cy + R * 0.62 * Math.sin(a)];
  };
  return (
    <div className="topic-wheel">
      <div className="wheel-wrap">
        <span className="wheel-pin">📍</span>
        <svg className="wheel-svg" viewBox="0 0 300 300" style={{ transform: `rotate(${deg}deg)` }}>
          <circle cx={cx} cy={cy} r={R + 6} fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
          {WHEEL_TOPICS.map((t, i) => (
            <g key={t.ar}>
              <path d={arc(i)} fill={t.c} stroke="#fff" strokeWidth="3" />
              <text x={labelPos(i)[0]} y={labelPos(i)[1] - 8} textAnchor="middle" fontSize="22">{t.e}</text>
              <text x={labelPos(i)[0]} y={labelPos(i)[1] + 16} textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff">{t.ar}</text>
            </g>
          ))}
        </svg>
        <span className="wheel-hub">🔄</span>
      </div>
      <button className="wheel-btn" onClick={spin} disabled={spinning}>
        {spinning ? '…تدور' : '🎡 أدر العجلة'}
      </button>
      {picked && (
        <div className="wheel-result pop-in">
          <span style={{ fontSize: 22 }}>{picked.e}</span>
          موضوعك: {picked.ar} — تحدث عنه بثلاث جمل!
        </div>
      )}
      <div className="wheel-note">✨ كل موضوع جديد فرصة لتتحدث أفضل!</div>
    </div>
  );
}

/* ---- تحدث: عبارات + عجلة مواضيع + مسجل + تحقق من نفسك ---- */
function Speaking() {
  return (
    <div className="card activity-card">
      <h2 style={{ marginTop: 0 }}>تحدث عن حاجاتك ورغباتك</h2>
      <div className="en">Speak about your needs and wants</div>
      <p className="prompt">استمع للجمل (أصوات درسك الأصلية)، ردّدها، ثم سجّل صوتك وأنت تتحدث عن حاجاتك.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 14 }}>
        {usefulPhrases.map(p => (
          <div className="phrase-row" key={p.ar} style={{ marginTop: 0 }}>
            <button className="sound-btn" onClick={() => playClip(p.audio)} aria-label={'استمع: ' + p.ar}>🔊</button>
            <div className="txt">
              <div className="ar">{p.ar}</div>
              <div className="tr">{p.en}</div>
            </div>
          </div>
        ))}
      </div>
      <TopicWheel />

      <div className="recorder">
        <button className="rec-btn" onClick={(e) => { clickSound(); e.currentTarget.classList.toggle('on'); }}>🎙</button>
        <div className="t">اضغط وسجّل صوتك عن موضوع العجلة</div>
        <div className="timer">00:00 / 01:00</div>
      </div>
      <div className="self-check">
        <h4>تحقق من نفسك</h4>
        {['نطقتُ الجملَ بوضوح', 'استخدمتُ أحتاجُ وأريدُ', 'ذكرتُ سبباً بـ«لـ» أو «لأن»'].map(c => <label key={c}><input type="checkbox" /> {c}</label>)}
      </div>
      <FinishBar hint="انطق الجملة قبل التسجيل" />
    </div>
  );
}

/* ---- كتابة: مخطط + بنك العبارات المفيدة (ودجت العميل) + حقل كتابة ---- */
const STARTERS = ['أنا أحتاجُ إلى…', 'أريدُ…', 'لأنَّ…', 'أحبُّ… لأنها…'];
const STARTERS_MORE = ['في المدرسةِ أحتاجُ إلى…', 'في البيتِ نحتاجُ إلى…', 'الحاجةُ هي…', 'أمّا الرغبةُ فهي…'];

function Writing() {
  const [txt, setTxt] = useState('');
  const [more, setMore] = useState(false);
  const shown = more ? [...STARTERS, ...STARTERS_MORE] : STARTERS;
  const add = (s) => setTxt(t => (t ? t + ' ' : '') + s);
  return (
    <div className="card activity-card">
      <h2 style={{ marginTop: 0 }}>اكتب عن حاجاتك ورغباتك</h2>
      <div className="en">Write about your needs and wants</div>
      <div className="sw-box good" style={{ marginTop: 16 }}>
        <h4>🗺 مخطط كتابتك</h4>
        <li style={{ listStyle: 'none' }}>١. ماذا تحتاج؟ · ٢. ماذا تريد؟ · ٣. لماذا؟ (استخدم «لأن»)</li>
      </div>

      {/* بنك العبارات المفيدة — بطاقة بنمط ودجت العميل */}
      <div className="phrase-bank">
        <div className="head">
          <span className="ic">💬</span>
          <div>
            <div className="t">بنك العبارات المفيدة</div>
            <div className="e">Useful Phrase Bank — اضغط عبارة لإضافتها لكتابتك</div>
          </div>
        </div>
        <div className="pb-grid">
          {shown.map(s => (
            <button key={s} className="pb-item" onClick={() => add(s)}>
              <span className="bulb">💡</span>
              <span className="txt">{s}</span>
              <span className="dots">···</span>
            </button>
          ))}
        </div>
        <button className="pb-more" onClick={() => setMore(m => !m)}>
          {more ? 'عرض أقل ↑' : '→ عرض المزيد'}
        </button>
      </div>
      <textarea
        value={txt} onChange={e => setTxt(e.target.value)}
        placeholder="ابدأ الكتابة هنا…"
        style={{ width: '100%', minHeight: 170, marginTop: 16, border: '2px solid var(--line)', borderRadius: 14, padding: '14px 18px', fontFamily: 'inherit', fontSize: 16, lineHeight: 2, resize: 'vertical' }}
      />
      <div style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 700, marginTop: 6 }}>
        عدد الكلمات: {txt.trim() ? txt.trim().split(/\s+/).length : 0} · الهدف: نحو 40 كلمة
        <Link to="/rubric" className="link" style={{ marginInlineStart: 14 }}>📋 كيف يقيّم معلمك كتابتك؟</Link>
      </div>
      <FinishBar hint="استخدم: أحتاج / أريد / لأن" />
    </div>
  );
}

/* ---- قراءة: نص + مساعد قرائي + سؤال الفكرة الرئيسية ---- */
function Reading() {
  const [sel, setSel] = useState(null);
  const vocab = [{ ar: 'الحقيبة', en: 'Bag' }, { ar: 'الروتين', en: 'Routine' }, { ar: 'نشيط', en: 'Active' }];
  const opts = ['روتيني اليومي واحتياجاتي', 'رحلة إلى السوق', 'حفلة عيد ميلاد', 'زيارة الطبيب'];
  return (
    <div className="card activity-card">
      <h2 style={{ marginTop: 0 }}>اقرأ فقرة: روتيني اليومي</h2>
      <div className="en">Reading: my daily routine</div>
      <div className="passage">
        <span className="tr-hover" data-tr="In the morning I drink water. Then I wear my clothes and put my books in the bag. I go to school by car. In the evening I do sports to stay active.">
          في الصباحِ أشربُ الماءَ. ثم ألبسُ ملابسي وأضعُ كتبي في الحقيبةِ.
          أذهبُ إلى المدرسةِ بالسيارةِ. وفي المساءِ أمارسُ الرياضةَ لأكونَ نشيطاً.
        </span>
      </div>
      {/* مساعد القراءة — ثلاثة أعمدة (نمط ودجت العميل) */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 15.5, marginBottom: 10 }}>📖 مساعد القراءة <span style={{ fontSize: 10.5, color: 'var(--mute)', fontWeight: 500 }}>Reading Helper</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { t: 'كلمات جديدة', ico: '🔤', bg: 'var(--green-soft)', items: ['روتين: أعمال اليوم', 'حقيبة: نحمل فيها الكتب', 'أمارس: أفعل بانتظام'] },
            { t: 'مرادفات', ico: '💡', bg: 'var(--lav-soft)', items: ['أمارس = أزاول', 'ألبس = أرتدي', 'نشيط = حيوي'] },
            { t: 'مضادات', ico: '✨', bg: 'var(--pink-soft)', items: ['صباح ↔ مساء', 'نشيط ↔ كسول', 'أحتاج ↔ أستغني'] },
          ].map(col => (
            <div key={col.t} style={{ background: col.bg, borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>{col.ico} {col.t}</div>
              <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--ink2)', lineHeight: 2.1 }}>
                {col.items.map(it => <div key={it}>{it}</div>)}
              </div>
              <button className="btn-sm" style={{ marginTop: 10 }} onClick={() => nav('/extra/support')}>عرض المزيد</button>
            </div>
          ))}
        </div>
      </div>
      <div className="q-title">ما الفكرة الرئيسية للنص؟</div>
      <div className="options">
        {opts.map((o, i) => (
          <button key={o} className={'option' + (sel === i ? ' selected' : '')} onClick={() => setSel(i)}>
            <span className="key">{['أ', 'ب', 'ج', 'د'][i]}</span>{o}
          </button>
        ))}
      </div>
      {sel !== null && (
        <div className="explain-box ok">
          <img src="/img/owl.png" alt="" />
          <div><span className="h">كيف عرفتَ ذلك؟</span> ارجع للنص وابحث عن الجملة التي تدل على إجابتك — هذه مهارة القارئ الماهر!</div>
        </div>
      )}
      <FinishBar hint="اقرأ الجملة الأولى والأخيرة" />
    </div>
  );
}

/* ---- قواعد: القاعدة + أخطاء شائعة + تمرين ---- */
function Grammar() {
  const [sel, setSel] = useState(null);
  const opts = ['أحتاجُ إلى الكتبِ لأتعلَّم', 'أنا كتب أتعلم', 'لأتعلم كتب أحتاج', 'كتب أحتاج تعلم'];
  return (
    <div className="card activity-card">
      <h2 style={{ marginTop: 0 }}>أعبّر عن السبب</h2>
      <div className="en">Grammar: giving reasons</div>
      <div className="grammar-box" style={{ marginTop: 16 }}>
        <div className="rule">القاعدة: لبيان السبب نستخدم «لـ + فعل مضارع» أو «لأنَّ»</div>
        <div className="ex">
          <span className="ok">✔ أحتاجُ إلى الماءِ لأشرب</span><br />
          <span className="no">✘ أحتاجُ إلى الماء أشرب</span>
        </div>
        <div className="warn">خطأ شائع: نسيان «لـ» قبل فعل السبب.</div>
      </div>
      <div className="q-title">اختر الجملة الصحيحة:</div>
      <div className="options">
        {opts.map((o, i) => (
          <button key={o} className={'option' + (sel === i ? ' selected' : '')} onClick={() => setSel(i)}>
            <span className="key">{['أ', 'ب', 'ج', 'د'][i]}</span>{o}
          </button>
        ))}
      </div>
      <FinishBar hint="أين «لـ» في الجملة؟" />
    </div>
  );
}

const TYPES = {
  listening: { c: Listening, t: 'تدريب استماع · روتيني اليومي',   en: 'Listening Practice' },
  speaking:  { c: Speaking,  t: 'مهمة تحدث · حاجاتي ورغباتي',    en: 'Speaking Task' },
  writing:   { c: Writing,   t: 'مهمة كتابة · حاجاتي ورغباتي',   en: 'Writing Task' },
  reading:   { c: Reading,   t: 'نشاط قراءة · روتيني اليومي',    en: 'Reading Activity' },
  grammar:   { c: Grammar,   t: 'تدريب قواعد · أعبّر عن السبب',  en: 'Grammar Practice' },
};

export default function Activity() {
  const { type } = useParams();
  if (type === 'vocab') return <Navigate to="/game" replace />;
  const T = TYPES[type];
  if (!T) return <Navigate to="/activities" replace />;
  const Body = T.c;
  const S = SKILLS[type];
  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar title={T.t} en={T.en} />
      <div className="container" style={{ maxWidth: 1060 }}>
        <div className="quiz-progress">
          <span className="chip" style={{ color: S.color, background: S.color + '15', fontSize: 13 }}>مهارة {S.ar} · {S.en}</span>
          <div className="spacer" style={{ flex: 1 }} />
          <span className="pts">☁ الحفظ التلقائي مفعّل</span>
        </div>
        <div style={{ marginTop: 18 }}>
          <Body />
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
