import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatsBar, SecHead, FooterStrip } from '../components.jsx';
import { SKILLS } from '../data.js';
import { clickSound, dingSound, winSound } from '../sounds.js';
import { showToast } from '../toast.js';

/* ============================================================
   مولّد الاختبارات الذكي — معاينة من لوحة المعلم داخل النموذج
   (الرد العملي على «اختبار في 10 ثوانٍ»: كل سؤال عندنا موسوم
    بناتج التعلم والمهارة والمحرك والمستوى — فالتوليد مجرد فلترة)
   ============================================================ */

/* بنك الأسئلة الموسوم — عينة من أسئلة وحدة الاحتياجات والرغبات */
const BANK = [
  { id: 1,  lo: 'LO.AR.3.1.1', skill: 'reading',   engine: 'اختيار من متعدد',   lvl: 1, pts: 1, q: 'لماذا يحتاج حمدان إلى الماء؟' },
  { id: 2,  lo: 'LO.AR.3.1.1', skill: 'reading',   engine: 'صح أم خطأ',         lvl: 1, pts: 1, q: 'يعيش حمدان في دبي في منطقة ند الشبا' },
  { id: 3,  lo: 'LO.AR.3.1.1', skill: 'reading',   engine: 'صح أم خطأ',         lvl: 2, pts: 1, q: 'مايا تحتاج إلى المال لتشتري الكتب فقط' },
  { id: 4,  lo: 'LO.AR.3.1.2', skill: 'vocab',     engine: 'اختيار الصور',      lvl: 1, pts: 1, q: 'أحتاج إلى هذا الشيء عندما أمرض — ما اسمه؟' },
  { id: 5,  lo: 'LO.AR.3.1.2', skill: 'vocab',     engine: 'المطابقة',          lvl: 1, pts: 2, q: 'صِل الكلمة بصورتها: الماء، الطعام، الكتب' },
  { id: 6,  lo: 'LO.AR.3.1.2', skill: 'vocab',     engine: 'السحب والإفلات',    lvl: 2, pts: 2, q: 'صنّف الكلمات: حاجات / رغبات' },
  { id: 7,  lo: 'LO.AR.3.1.3', skill: 'grammar',   engine: 'ملء الفراغات',      lvl: 1, pts: 2, q: 'أحتاج إلى ____ لأشرب' },
  { id: 8,  lo: 'LO.AR.3.1.3', skill: 'grammar',   engine: 'الترتيب',           lvl: 2, pts: 2, q: 'رتّب: أحتاجُ / إلى / الهواءِ / لأتنفّس' },
  { id: 9,  lo: 'LO.AR.3.1.3', skill: 'grammar',   engine: 'تصحيح الأخطاء',     lvl: 3, pts: 2, q: 'صحّح: أحتاجُ إلى الكتب أتعلم' },
  { id: 10, lo: 'LO.AR.3.1.4', skill: 'writing',   engine: 'إجابة نصية قصيرة',  lvl: 2, pts: 2, q: 'هل السيارة حاجة أم رغبة؟ اذكر سبباً' },
  { id: 11, lo: 'LO.AR.3.1.4', skill: 'writing',   engine: 'الكتابة الممتدة',   lvl: 3, pts: 4, q: 'اكتب 4-5 جمل عن حاجاتك ورغباتك' },
  { id: 12, lo: 'LO.AR.3.1.5', skill: 'listening', engine: 'الاستماع',          lvl: 1, pts: 2, q: 'استمع: لماذا أستخدم الإنترنت؟' },
  { id: 13, lo: 'LO.AR.3.1.5', skill: 'listening', engine: 'الترتيب',           lvl: 2, pts: 2, q: 'استمع للفقرة ورتّب الجمل حسب ورودها' },
  { id: 14, lo: 'LO.AR.3.1.6', skill: 'speaking',  engine: 'تسجيل التحدث',      lvl: 2, pts: 2, q: 'اذكر حاجة ورغبة لديك مع السبب' },
];

const LOS = [
  { code: 'الكل', ar: 'كل النواتج' },
  { code: 'LO.AR.3.1.1', ar: 'الفكرة الرئيسية والفهم' },
  { code: 'LO.AR.3.1.2', ar: 'المفردات' },
  { code: 'LO.AR.3.1.3', ar: 'التراكيب النحوية' },
  { code: 'LO.AR.3.1.4', ar: 'الكتابة' },
  { code: 'LO.AR.3.1.5', ar: 'الاستماع' },
  { code: 'LO.AR.3.1.6', ar: 'التحدث' },
];

export default function TestBuilder() {
  const [lo, setLo] = useState('الكل');
  const [skill, setSkill] = useState('الكل');
  const [picked, setPicked] = useState([]);
  const [built, setBuilt] = useState(false);

  const matches = BANK.filter(q =>
    (lo === 'الكل' || q.lo === lo) && (skill === 'الكل' || q.skill === skill)
  );
  const total = picked.reduce((a, id) => a + (BANK.find(q => q.id === id)?.pts || 0), 0);

  const toggle = (id) => {
    clickSound(); setBuilt(false);
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };
  const autoPick = () => {
    dingSound(); setBuilt(false);
    // التوليد الآلي: يلتقط أسئلة مطابقة حتى 10 درجات بالضبط (يتخطى ما يتجاوزها)
    const sel = []; let pts = 0;
    for (const q of matches) {
      if (pts + q.pts > 10) continue;
      sel.push(q.id); pts += q.pts;
      if (pts === 10) break;
    }
    setPicked(sel);
    showToast(`وُلّد اختبار من ${sel.length} أسئلة (${pts} درجات) خلال ثانية`, '⚡');
  };
  const build = () => { winSound(); setBuilt(true); showToast('الاختبار جاهز للإسناد لطلابك', '✅'); };

  return (
    <div className="page">
      <StatsBar />
      <div className="container page-head">
        <div>
          <h1>مولّد الاختبارات الذكي</h1>
          <div className="en">Smart Test Builder — معاينة من لوحة المعلم</div>
        </div>
        <div className="tag">اختر ناتج التعلم — والأسئلة الموسومة تظهر وحدها. اختبار كامل في ثوانٍ.</div>
      </div>
      <div className="container">
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>ناتج التعلم · Learning Outcome</div>
              <select className="eng-input" style={{ width: '100%' }} value={lo} onChange={e => { clickSound(); setLo(e.target.value); }}>
                {LOS.map(l => <option key={l.code} value={l.code}>{l.code === 'الكل' ? l.ar : `${l.code} — ${l.ar}`}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>المهارة · Skill</div>
              <select className="eng-input" style={{ width: '100%' }} value={skill} onChange={e => { clickSound(); setSkill(e.target.value); }}>
                <option value="الكل">كل المهارات</option>
                {Object.entries(SKILLS).map(([k, s]) => <option key={k} value={k}>{s.ar}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={autoPick}>⚡ ولّد اختباراً (10 درجات)</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontWeight: 900, fontSize: 15.5 }}>
              الأسئلة المطابقة ({matches.length}) <span style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 500 }}>— اضغط سؤالاً لإضافته أو إزالته</span>
            </div>
            <span className="chip" style={{ background: total === 10 ? 'var(--green-soft)' : 'var(--gold-soft)', color: total === 10 ? 'var(--green-deep)' : '#92400e' }}>
              المجموع: {total} / 10 درجات · {picked.length} أسئلة
            </span>
          </div>

          <div style={{ marginTop: 12 }}>
            {matches.map(q => {
              const on = picked.includes(q.id);
              const S = SKILLS[q.skill];
              return (
                <button key={q.id} onClick={() => toggle(q.id)}
                  className={'option' + (on ? ' correct' : '')}
                  style={{ width: '100%', marginBottom: 8, justifyContent: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <span className="key">{on ? '✓' : '+'}</span>
                  <span style={{ flex: 1, minWidth: 200, textAlign: 'start' }}>{q.q}</span>
                  <span className="chip" style={{ color: 'var(--purple)', background: 'var(--lav-soft)', fontSize: 11 }}>⚙ {q.engine}</span>
                  <span className="chip" style={{ color: S.color, background: S.color + '15', fontSize: 11 }}>{S.ar}</span>
                  <span className="chip" style={{ fontSize: 11, background: 'var(--wash)', color: 'var(--ink2)' }}>{q.lo} · م{q.lvl} · {q.pts} د</span>
                </button>
              );
            })}
            {matches.length === 0 && <div className="eng-note" style={{ textAlign: 'center', padding: 20 }}>لا أسئلة مطابقة لهذا الفلتر — جرّب ناتجاً آخر.</div>}
          </div>

          <div className="activity-nav">
            <span style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 700 }}>
              في النسخة الكاملة: البنك يضم كل أسئلة الوحدات، والمعلم يسند الاختبار لصفه بضغطة
            </span>
            <div className="spacer" />
            <button className="btn btn-primary" disabled={picked.length === 0} style={{ opacity: picked.length ? 1 : 0.5 }} onClick={build}>
              إنشاء الاختبار ({picked.length} أسئلة) ←
            </button>
          </div>

          {built && (
            <div className="explain-box ok" style={{ marginTop: 14 }}>
              <img src="/img/owl.png" alt="" />
              <div>
                <span className="h">الاختبار جاهز! ✅</span>
                {picked.length} أسئلة · {total} درجات — هكذا يعيشه الطالب: <Link to="/quiz/run" className="link">جرّب الاختبار القصير ←</Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <FooterStrip
        ar="كل سؤال موسوم بناتج تعلمه ومهارته ومحركه — لهذا التوليد عندنا يستغرق ثانية"
        en="Every question is tagged by outcome, skill, and engine — that's why generation takes a second."
      />
    </div>
  );
}
