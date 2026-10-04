import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar } from '../components.jsx';
import { student } from '../data.js';
import { winSound } from '../sounds.js';

/* معاينة الشهادة — قالب أنيق قابل للطباعة/PDF لاحقاً */
export default function Certificate() {
  useEffect(() => { winSound(); }, []);
  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="certificate pop-in">
          <img src="/img/logo-masar.svg" alt="مسار العربية" style={{ height: 74, margin: '0 auto', display: 'block' }} />
          <div className="title">🎓 شهادة إتمام وحدة</div>
          <div style={{ fontSize: 11.5, color: 'var(--mute)' }}>Certificate of Unit Completion</div>
          <div className="name">{student.ar}</div>
          <div className="line" />
          <div className="body-t">
            أتمّ بنجاحٍ وتميّزٍ <b>وحدة الاحتياجات والرغبات</b> — مجموعة المتطور · الصف السادس
            <br />بنتيجة <b style={{ color: 'var(--gold)' }}>88%</b> في اختبار الوحدة الختامي بالمهارات الأربع
            <br /><span style={{ fontSize: 12, color: 'var(--mute)' }}>Successfully completed the Health Unit with excellence</span>
          </div>
          <div style={{ marginTop: 14, fontSize: 22 }}>⭐⭐⭐</div>
          <div className="foot">
            <div className="sig">{student.teacher.ar}<br /><span style={{ fontWeight: 400, fontSize: 11 }}>المعلمة</span></div>
            <img src="/img/medal.png" alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} />
            <div className="sig">31 أغسطس 2026<br /><span style={{ fontWeight: 400, fontSize: 11 }}>التاريخ</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 8, marginBottom: 40 }}>
          <button className="btn btn-primary" onClick={() => window.print()}>🖨 اطبع شهادتك / PDF</button>
          <Link to="/badges" className="btn btn-ghost">شاراتي والإنجازات</Link>
          <Link to="/path" className="btn btn-ghost">تابع رحلتك ←</Link>
        </div>
      </div>
    </div>
  );
}
