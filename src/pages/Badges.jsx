import { Link } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip } from '../components.jsx';
import { earnedBadges, progressBadges, lockedBadges, certificates, student } from '../data.js';
import { winSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* متجر المكافآت — فكرة العميل: نقاط تُصرف على مكافآت */
const SHOP = [
  { ar: 'خلفية جديدة لملفك', en: 'New Profile Background', pts: 150, ico: '/img/puzzle.png' },
  { ar: 'إطار مميز للصورة',  en: 'Special Avatar Frame',   pts: 200, ico: '/img/medal.png' },
  { ar: 'هدية مفاجأة',       en: 'Mystery Gift',           pts: 250, ico: '/img/gift.png' },
];

export default function Badges() {
  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="badge-hero">
          <div className="img"><img src="/img/scene-play.png" alt="" /></div>
          <div className="mid">
            <h1>الشارات والإنجازات</h1>
            <div className="en-sub">Badges &amp; Achievements</div>
            <p style={{ color: 'var(--ink2)', marginTop: 10 }}>كل شارة هي خطوة نحو إتقانك وتطوّرك!</p>
            <div className="en-sub">Every badge is a step toward your mastery and growth!</div>
          </div>
          <div className="stats">
            <div className="b">
              <img src="/img/points.png" alt="" />
              <div className="n">{student.points}</div>
              <div className="l">نقطة</div>
            </div>
            <div className="b">
              <img src="/img/shield.png" alt="" />
              <div className="n">{student.level}</div>
              <div className="l">المستوى</div>
            </div>
            <div className="b">
              <img src="/img/medal.png" alt="" />
              <div className="n">12</div>
              <div className="l">شارة</div>
            </div>
          </div>
        </div>

        <SecHead ico="/img/medal.png" ar="شارات محقّقة" en="Earned Badges" />
        <div className="earned-grid">
          {earnedBadges.map(b => (
            <div className="earned-card" key={b.ar}>
              <img loading="lazy" decoding="async" src={b.img} alt="" />
              <div className="t">{b.ar}</div>
              <div className="e">{b.en}</div>
              <div className="d">{b.date}</div>
            </div>
          ))}
        </div>

        <SecHead ico="/img/star.png" ar="شارات قيد التقدم" en="Badges in Progress" />
        <div className="wip-grid">
          {progressBadges.map(b => (
            <div className="wip-card" key={b.ar}>
              <div className="head">
                <img loading="lazy" decoding="async" src={b.img} alt="" />
                <div>
                  <h4>{b.ar}</h4>
                  <div className="en">{b.en}</div>
                </div>
              </div>
              <div className="pct">أنجزت {b.pct}٪ من الشرط</div>
              <div className="bar thin"><i style={{ width: b.pct + '%' }} /></div>
            </div>
          ))}
        </div>

        <SecHead ico="/img/shield.png" ar="شارات لم تحققها بعد" en="Locked Badges — اجمعها كلها!" />
        <div className="earned-grid">
          {lockedBadges.map(b => (
            <div className="earned-card locked-badge" key={b.ar} title={b.how}>
              <img loading="lazy" decoding="async" src={b.img} alt="" />
              <span className="lock">🔒</span>
              <div className="t">{b.ar}</div>
              <div className="e">{b.en}</div>
              <div className="d how">{b.how}</div>
            </div>
          ))}
        </div>

        <SecHead ico="/img/scroll.png" ar="شهاداتي" en="My Certificates" />
        <div className="certs-grid">
          {certificates.map(c => {
            const inner = (
              <>
                <div className="ico">{c.status === 'earned' ? '🎓' : '🔒'}</div>
                <div className="body">
                  <div className="t">{c.ar}</div>
                  <div className="e">{c.en}</div>
                  <div className="y">{c.status === 'earned' ? `📅 ${c.year}` : `⏳ ${c.how}`}</div>
                </div>
                {c.status === 'earned'
                  ? <span className="st ok">{c.to ? 'اعرضها ←' : 'محققة ✓'}</span>
                  : <span className="st off">مقفلة</span>}
              </>
            );
            return c.to
              ? <Link to={c.to} className="cert-card earned" key={c.ar}>{inner}</Link>
              : <div className={'cert-card ' + c.status} key={c.ar}>{inner}</div>;
          })}
        </div>

        <SecHead ico="/img/gift.png" ar="متجر المكافآت" en="Rewards Shop — اصرف نقاطك" />
        <div className="wip-grid">
          {SHOP.map(s => (
            <div className="wip-card" key={s.ar} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img src={s.ico} alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />
              <div style={{ flex: 1 }}>
                <h4>{s.ar}</h4>
                <div className="en">{s.en}</div>
              </div>
              <button className="btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => { winSound(); showToast(`مبروك! حصلت على «${s.ar}» مقابل ${s.pts} نقطة`, '🛍'); }}>⭐ {s.pts} نقطة</button>
            </div>
          ))}
        </div>

        <div className="weekly-strip">
          <img src="/img/trophy.png" alt="" />
          <div>
            <div className="t">تحدي مفردات الأسبوع</div>
            <div className="e">Weekly Vocabulary Challenge</div>
            <div className="d">أكمل 15 كلمة جديدة هذا الأسبوع لتحصل على هذه الشارة المميزة!</div>
          </div>
          <div className="cta">
            <div style={{ textAlign: 'center' }}>
              <div className="n">9/15</div>
              <div className="e">New Words</div>
            </div>
            <Link to="/certificate" className="btn">🎓 شهادة الوحدة</Link>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="استمر في التعلّم، فكل إنجاز اليوم يصنع مستقبلك المشرق"
        en="Keep learning — every achievement today builds your bright future!"
      />
    </div>
  );
}

