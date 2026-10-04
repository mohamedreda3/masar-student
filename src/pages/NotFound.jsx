import { Link } from 'react-router-dom';
import { StatsBar } from '../components.jsx';

/* 404 — البومة ضاعت معك */
export default function NotFound() {
  return (
    <div className="page">
      <StatsBar />
      <div className="container">
        <div className="empty-state" style={{ paddingTop: 70 }}>
          <img src="/img/owl.png" alt="" style={{ width: 130, height: 130 }} />
          <div className="t" style={{ fontSize: 26 }}>أووبس! هذه المحطة غير موجودة 🧭</div>
          <div className="e">404 — This station doesn't exist</div>
          <div className="d">يبدو أنك خرجت عن المسار — لا تقلق، البومة ستعيدك!</div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 24 }}>
            <Link to="/" className="btn btn-primary">🏠 الرئيسية</Link>
            <Link to="/path" className="btn btn-ghost">مساري</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
