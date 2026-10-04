import { useState } from 'react';
import { Logo } from '../components.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { storyPages } from '../data.js';
import { playClip } from '../sounds.js';

/* قارئ القصة — قراءة مريحة: صوت بسرعات + حجم خط + صفحة بصفحة */
function FocusBar() {
  return (
    <div className="focus-bar">
      <div className="container in">
        <Logo h={50} />
        <div className="title">
          <div className="t">قصة: عشاء في المطعم</div>
          <div className="e">Story: Dinner at the Restaurant</div>
        </div>
        <Link to="/library" className="focus-exit">خروج ⎋</Link>
      </div>
    </div>
  );
}

const SIZES = { 'A-': 17, 'A': 20, 'A+': 24 };

export default function Story() {
  const nav = useNavigate();
  const [p, setP] = useState(0);
  const [speed, setSpeed] = useState('1.0x');
  const [size, setSize] = useState('A');
  const page = storyPages[p];
  const last = p === storyPages.length - 1;

  return (
    <div className="page" style={{ background: 'var(--wash)' }}>
      <FocusBar />
      <div className="container">
        <div className="quiz-progress">
          <span className="lab">الصفحة {p + 1} من {storyPages.length}</span>
          <div className="bar"><i style={{ width: ((p + 1) / storyPages.length) * 100 + '%', background: 'var(--green)' }} /></div>
          <span className="size-pills">
            {['A-', 'A', 'A+'].map(s => (
              <button key={s} className={'size-pill' + (size === s ? ' active' : '')} onClick={() => setSize(s)} style={{ direction: 'ltr' }}>{s}</button>
            ))}
          </span>
        </div>

        <div className="card activity-card" style={{ marginTop: 22, maxWidth: 980, marginInline: 'auto' }}>
          <div className="scene" style={{ maxWidth: 640, marginInline: 'auto' }}>
            <img src={page.img} alt="" />
          </div>
          <p style={{ fontSize: SIZES[size], lineHeight: 2.4, marginTop: 24, textAlign: 'center', fontWeight: 500 }}>
            <span className="tr-hover" data-tr={page.en}>{page.text}</span>
          </p>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--mute2)', marginTop: 10 }}>
            💡 مرّر الماوس فوق النص لترى الترجمة · Hover over the text to see the translation
          </div>

          <div className="audio-player" style={{ maxWidth: 640, marginInline: 'auto' }}>
            <button className="audio-play" onClick={() => playClip(page.audio, parseFloat(speed))}>▶</button>
            <div className="audio-track"><div className="bar"><i style={{ width: '30%' }} /></div></div>
            <span className="speed-lab">سرعة التشغيل</span>
            <div className="speed-pills">
              {['0.75x', '1.0x', '1.25x'].map(s => (
                <button key={s} className={'speed-pill' + (speed === s ? ' active' : '')} onClick={() => setSpeed(s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="activity-nav">
            <button className="btn btn-ghost" onClick={() => setP(Math.max(0, p - 1))} style={{ opacity: p === 0 ? 0.4 : 1 }} disabled={p === 0}>
              → الصفحة السابقة
            </button>
            <div className="spacer" />
            {last
              ? <button className="btn btn-primary" onClick={() => nav('/result')}>أنهيت القصة 🎉</button>
              : <button className="btn btn-primary" onClick={() => setP(p + 1)}>الصفحة التالية ←</button>}
          </div>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}
