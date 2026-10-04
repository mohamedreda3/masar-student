import { useState } from 'react';
import { StatsBar, SecHead, FooterStrip, Empty } from '../components.jsx';
import { notifications } from '../data.js';
import { clickSound } from '../sounds.js';
import { showToast } from '../toast.js';

const TABS = ['الكل', 'واجبات', 'معلم', 'إنجاز', 'نظام'];

export default function Notifications() {
  const [tab, setTab] = useState('الكل');
  const [items, setItems] = useState(notifications);
  const shown = items.filter(n => tab === 'الكل' || n.type === tab);
  const unread = items.filter(n => n.unread).length;
  const markAll = () => {
    clickSound();
    setItems(it => it.map(n => ({ ...n, unread: false })));
    showToast('تم تحديد الكل كمقروء', '✅');
  };
  const clearAll = () => {
    clickSound();
    setItems([]);
  };
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>الإشعارات</h1>
          <div className="en">Notifications</div>
        </div>
        <div className="tag">كل جديد يخصّك — غير المقروءة: {unread}</div>
      </div>
      <div className="container">
        <div className="filters">
          {TABS.map(t => (
            <button key={t} className={'filter' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>
              <span>{t}</span>
            </button>
          ))}
        </div>
        <div className="grid-main">
          <div className="col">
            <div className="sec-head">
              <div className="sec-title">
                <img className="ico" src="/img/bell.png" alt="" />
                <span>أحدث الإشعارات</span>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <button className="link" onClick={markAll} style={{ background: 'none' }}>تحديد الكل كمقروء</button>
                <button className="link" onClick={clearAll} style={{ background: 'none', color: 'var(--mute)' }}>مسح الكل</button>
              </div>
            </div>
            {shown.length === 0 && (
              <div className="card">
                <Empty t="لا إشعارات هنا — كلك تمام! 🌟" e="All caught up!" d="سنخبرك فور وصول أي جديد من معلمك أو المنصة." />
              </div>
            )}
            {shown.map(n => (
              <div key={n.ar} className={'notif-row' + (n.unread ? ' unread' : '')}>
                <img src={n.ico} alt="" />
                <div style={{ flex: 1 }}>
                  <div className="t">{n.ar}</div>
                  <div className="e">{n.en}</div>
                </div>
                <span className="type">{n.type}</span>
                <span className="when">{n.t}</span>
              </div>
            ))}
          </div>
          <div className="col">
            <div className="side-card">
              <div className="badges-head">
                <div>
                  <h3>ملخص سريع</h3>
                  <div className="en">Quick Summary</div>
                </div>
              </div>
              <div className="stats-list" style={{ marginTop: 8 }}>
                <div className="row"><img src="/img/bell.png" alt="" /><div className="t">الإجمالي</div><div className="n">{items.length}</div></div>
                <div className="row"><img src="/img/flame.png" alt="" /><div className="t">غير مقروءة</div><div className="n">{unread}</div></div>
              </div>
            </div>
            <div className="side-card">
              <div className="badges-head">
                <div>
                  <h3>إعدادات الإشعارات</h3>
                  <div className="en">Notification Settings</div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                {['تذكير المهام اليومية', 'إشعارات المعلم', 'إشعارات الإنجازات', 'إشعارات النظام'].map((s, i) => (
                  <div className="setting-row" key={s}>
                    <span>{s}</span>
                    <span className={'toggle' + (i < 3 ? ' on' : '')} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="ابقَ على اطلاع – كل إشعار خطوة في رحلتك"
        en="Stay tuned — every update is part of your journey!"
      />
    </div>
  );
}
