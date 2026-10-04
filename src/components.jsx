import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { student, nav } from './data.js';

/* شعار «مسار العربية» الرسمي — SVG العميل داخل لوحة بيضاء */
export function Logo({ h = 60 }) {
  return (
    <Link to="/" className="logo-plate" style={{ height: h }}>
      <img src="/img/logo-masar.svg" alt="مسار العربية — مسارك نحو إتقان العربية" />
    </Link>
  );
}

export function TopBar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="container topbar-in">
        <Logo />
        <button className="nav-toggle" onClick={() => setOpen(o => !o)} aria-label="القائمة">☰</button>
        <nav className={'nav' + (open ? ' open' : '')} onClick={() => setOpen(false)}>
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <span className="ico" aria-hidden="true">{item.ico}</span>
              <span className="ar">{item.ar}</span>
              <span className="en">{item.en}</span>
            </NavLink>
          ))}
        </nav>
        <div className="top-user">
          <button className="top-exit" title="تسجيل الخروج">⎋</button>
          <div className="top-name">
            <div className="ar">{student.ar}</div>
            <div className="en">{student.en}</div>
          </div>
          <div className="avatar">
            <img src="/img/avatar-boy.png" alt="" />
            <span className="dot" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function StatsBar() {
  return (
    <div className="container">
      <div className="statsbar">
        <div className="hello">
          <div className="h">مرحباً {student.first}</div>
          <div className="e">Welcome back, Ahmed</div>
          <div className="q">جاهز لمتابعة رحلتك اليوم؟</div>
        </div>
        <Link to="/notifications" className="stat" title="افتح الإشعارات">
          <div className="ico">
            <img src="/img/bell.png" alt="" />
            <span className="badge">{student.notifications}</span>
          </div>
          <div>
            <div className="num">{student.notifications}</div>
            <div className="lab">التنبيهات</div>
            <div className="en">Notifications</div>
          </div>
        </Link>
        <Link to="/challenges" className="stat" title="تحدي الاستمرارية">
          <div className="ico"><img src="/img/flame.png" alt="" /></div>
          <div>
            <div className="num">{student.streak}</div>
            <div className="lab">أيام متتالية</div>
            <div className="en">Day Streak</div>
          </div>
        </Link>
        <Link to="/badges" className="stat" title="متجر المكافآت">
          <div className="ico"><img src="/img/points.png" alt="" /></div>
          <div>
            <div className="num">{student.points}</div>
            <div className="lab">النقاط</div>
            <div className="en">Points</div>
          </div>
        </Link>
        <Link to="/reports" className="stat" title="تقدمي">
          <div className="ico"><img src="/img/shield.png" alt="" /></div>
          <div>
            <div className="num">{student.level}</div>
            <div className="lab">المستوى الحالي</div>
            <div className="en">Current Level</div>
          </div>
        </Link>
        <Link to="/reports" className="level-progress" title="تقدمي">
          <div className="row">
            <span>نحو المستوى {student.nextLevel}</span>
          </div>
          <div className="bar"><i style={{ width: student.levelPct + '%' }} /></div>
          <div className="pct">{student.levelPct}% complete</div>
        </Link>
      </div>
    </div>
  );
}

export function Ring({ pct, size = 92, stroke = 9, color = '#1d6fe0', track = '#e5e7eb', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <div className="val">{children ?? pct + '%'}</div>
    </div>
  );
}

export function SecHead({ ico, ar, en, link, to, onLink }) {
  return (
    <div className="sec-head">
      <div className="sec-title">
        {ico && <img className="ico" src={ico} alt="" />}
        <span>{ar}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        {link && to && <Link className="link" to={to}>{link}</Link>}
        {link && !to && onLink && <a className="link" href="#!" onClick={(e) => { e.preventDefault(); onLink(); }}>{link}</a>}
        {link && !to && !onLink && <a className="link" href="#!">{link}</a>}
        <span className="sec-en">{en}</span>
      </div>
    </div>
  );
}

/* الحالة الفارغة — البومة بدل الفراغ الصامت */
export function Empty({ t, e, d }) {
  return (
    <div className="empty-state">
      <img src="/img/owl.png" alt="" />
      <div className="t">{t}</div>
      <div className="e">{e}</div>
      {d && <div className="d">{d}</div>}
    </div>
  );
}

export function FooterStrip({ ar, en }) {
  const stars = [8, 28, 52, 71, 90];
  return (
    <div className="container">
      <div className="footer-strip">
        {stars.map((x, i) => (
          <span key={i} className="star" style={{ insetInlineStart: x + '%', top: i % 2 ? '18%' : '62%' }}>★</span>
        ))}
        <img src="/img/trophy.png" alt="" />
        <div>
          <div className="t">{ar}</div>
          <div className="e">{en}</div>
        </div>
      </div>
    </div>
  );
}
