import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip, Empty } from '../components.jsx';
import api from '../api/client.js';
import { useApi, useHome } from '../api/useApi.js';

/* نوع إشعار الباك اند → تبويب التصميم */
const TYPE_TAB = { teacher_feedback: 'معلم', teacher_message: 'معلم', support_reply: 'نظام', badge_earned: 'إنجاز', badge_awarded: 'إنجاز', challenge_completed: 'إنجاز', assignment_graded: 'واجبات', level_up: 'إنجاز', badge: 'إنجاز', achievement: 'إنجاز', reward: 'إنجاز', assignment: 'واجبات', task: 'واجبات', exam: 'واجبات', teacher: 'معلم', feedback: 'معلم', note: 'معلم' };
const TYPE_ICO = { 'إنجاز': '/img/medal.png', 'واجبات': '/img/clipboard.png', 'معلم': '/img/teacher.png', 'نظام': '/img/bell.png' };
const ago = (d) => {
  if (!d) return '';
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  if (m < 60) return `منذ ${Math.max(m, 1)} د`;
  if (m < 1440) return `منذ ${Math.round(m / 60)} س`;
  return `منذ ${Math.round(m / 1440)} يوم`;
};
const toItem = (n) => {
  const type = TYPE_TAB[n.type] || 'نظام';
  /* أين يفتح الإشعار */
  const d = typeof n.data === 'string' ? (() => { try { return JSON.parse(n.data); } catch { return {}; } })() : (n.data || {});
  const to = /^badge_/.test(n.type) ? '/badges'
    : n.type === 'teacher_feedback' ? '/feedback'
    : n.type === 'teacher_message' || n.type === 'support_reply' || d.ticket_id ? '/support' + (d.ticket_id ? '?ticket=' + d.ticket_id : '')
    : n.type === 'challenge_completed' ? '/challenges'
    : d.assignment_id ? '/assignment?id=' + d.assignment_id
    : n.type === 'level_up' ? '/reports' : null;
  return { id: n.id, to, ar: n.title ?? n.message, en: n.body ?? n.message_en ?? n.title_en ?? '', type, ico: TYPE_ICO[type], t: ago(n.created_at), unread: !(n.is_read ?? n.read_at) };
};
import { clickSound } from '../sounds.js';
import { showToast } from '../toast.js';

const TABS = ['الكل', 'واجبات', 'معلم', 'إنجاز', 'نظام'];

export default function Notifications() {
  const [tab, setTab] = useState('الكل');
  const { reload: reloadHome } = useHome();
  const nav = useNavigate();
  const { data } = useApi(() => api.notifications(), []);
  const [items, setItems] = useState([]);
  useEffect(() => { if (data) setItems((data.items || []).map(toItem)); }, [data]);
  const readOne = (n) => {
    if (n.to) nav(n.to);
    if (!n.unread) return;
    setItems(it => it.map(x => (x.id === n.id ? { ...x, unread: false } : x)));
    api.readNotification(n.id).then(reloadHome, () => {});
  };
  const shown = items.filter(n => tab === 'الكل' || n.type === tab);
  const unread = items.filter(n => n.unread).length;
  const markAll = () => {
    clickSound();
    setItems(it => it.map(n => ({ ...n, unread: false })));
    api.readAllNotifications().then(() => { reloadHome(); showToast('تم تحديد الكل كمقروء', '✅'); }, (ex) => showToast(ex.message, '⚠️'));
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
              <div key={n.id} className={'notif-row' + (n.unread ? ' unread' : '')} onClick={() => readOne(n)} style={{ cursor: n.unread || n.to ? 'pointer' : undefined }}>
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
