import { Link } from 'react-router-dom';
import { StatsBar, FooterStrip } from '../components.jsx';
import { rubric } from '../data.js';

/* معايير التقييم بعين الطالب — الشفافية: يعرف كيف يُقيَّم قبل أن يسلّم */
export default function Rubric() {
  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>معايير التقييم</h1>
          <div className="en">How Your Work Is Graded</div>
        </div>
        <div className="tag">هكذا يقيّم معلمك عملك — اعرف المطلوب قبل أن تسلّم.</div>
      </div>
      <div className="container" style={{ marginTop: 26, maxWidth: 1100 }}>
        <div className="card" style={{ padding: '26px 30px' }}>
          <div className="badges-head">
            <div>
              <h3>📋 {rubric.task}</h3>
              <div className="en">Read each row — aim for the green column!</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="rubric-table">
              <thead>
                <tr>
                  <th>المعيار</th>
                  {rubric.levels.map(l => <th key={l}>{l}</th>)}
                </tr>
              </thead>
              <tbody>
                {rubric.rows.map(r => (
                  <tr key={r.c}>
                    <td className="c">{r.c}</td>
                    {r.d.map((d, di) => <td key={di} className={di === 0 ? 'best' : ''}>{d}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mascot" style={{ marginTop: 18, marginBottom: 0 }}>
            <img src="/img/owl.png" alt="" />
            <div className="b">العمود الأخضر هو هدفك — والمعايير نفسها التي سيستخدمها معلمك، فلا مفاجآت! 💚</div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <Link to="/activity/writing" className="btn btn-primary">✍ ارجع لمهمة الكتابة وطبّقها</Link>
          </div>
        </div>
      </div>
      <FooterStrip
        ar="من يعرف المطلوب، يصل إليه – المعايير خارطة طريقك"
        en="Know the target and you'll hit it — rubrics are your roadmap!"
      />
    </div>
  );
}
