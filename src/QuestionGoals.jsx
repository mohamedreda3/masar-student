import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clickSound } from './sounds.js';

/* ============================================================
   «ماذا أتعلم هنا؟» — أهداف الدرس · نواتج التعلم · سلّم التقييم
   البيانات جاهزة داخل كل سؤال (objectives · learning_outcomes · rating_scale)
   فلا طلب جديد: شريط شارات صغير تحت نص السؤال، واللوحة تُبنى عند فتحها فقط.
   ============================================================ */

/* نص عنصر الهدف: نص مباشر أو كائن { text | title } */
const itemText = (x) => (typeof x === 'string' ? x : x?.text ?? x?.title ?? '');
export const objItems = (o) => {
  const raw = Array.isArray(o?.items) ? o.items : Array.isArray(o?.items?.items) ? o.items.items : [];
  return raw.map(itemText).filter(Boolean);
};

const DIFF = { beginner: { n: 1, ar: 'سهل' }, intermediate: { n: 2, ar: 'متوسط' }, advanced: { n: 3, ar: 'متقدّم' } };
/* أيقونة الصف حسب المهارة */
const SKILL_ICO = (name = '') => (/كتاب/.test(name) ? '✏️' : /استماع|سماع/.test(name) ? '👂' : /تحدث|محادث|نطق/.test(name) ? '🗣️' : '📖');
/* ألوان المستويات حين لا يرسلها الباك اند: الأعلى أخضر ثم كهرماني ثم مرجاني */
const RANK_COLOR = ['#16a34a', '#f59e0b', '#fb7185'];
const sortedLevels = (rs) => [...(rs?.levels || [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
const levelColor = (lv, i, n) => lv.color || RANK_COLOR[i === 0 ? 0 : i === n - 1 ? 2 : 1];
const critText = (c, lv) => c?.level_descriptions?.[lv.name] ?? c?.level_descriptions?.[String(lv.score)] ?? '';

/* ما الذي يحمله هذا السؤال فعلاً؟ */
export function goalsOf(q) {
  const objectives = (q?.objectives || []).filter(o => o && (objItems(o).length || o.content));
  const outcomes = (q?.learning_outcomes || []).filter(o => o?.title);
  const scale = q?.rating_scale?.levels?.length || q?.rating_scale?.criteria?.length ? q.rating_scale : null;
  return { objectives, outcomes, scale, any: !!(objectives.length || outcomes.length || scale) };
}

const skillOf = (G) => G.scale?.skill || G.outcomes[0]?.skill || null;
const tint = (c, a = '1f') => (c ? c + a : 'var(--lav-soft)');

/* بصمة محتوى السؤال — لإظهار ✨ مرة واحدة عند تغيّر الأهداف عن السؤال السابق */
const fingerprint = (G) => [G.objectives.map(o => o.id).join(','), G.outcomes.map(o => o.id).join(','), G.scale?.id ?? ''].join('|');

export default function QuestionGoals({ question, timed = false }) {
  const G = goalsOf(question);
  const [tab, setTab] = useState(null);           // null = مغلقة (اللوحة تُبنى عند الفتح فقط)
  const [fresh, setFresh] = useState(false);
  const last = useRef(null);
  const fp = G.any ? fingerprint(G) : '';
  useEffect(() => {
    if (!fp) return;
    if (last.current && last.current !== fp) { setFresh(true); const t = setTimeout(() => setFresh(false), 2200); last.current = fp; return () => clearTimeout(t); }
    last.current = fp;
  }, [fp]);
  if (!G.any) return null;

  const S = skillOf(G);
  const chip = (key, ico, label, n, aria) => (
    <button type="button" key={key} className="qg-chip" style={{ background: tint(S?.color), color: S?.color || 'var(--brand-ink)' }}
      onClick={() => { clickSound(); setTab(key); }} aria-label={aria}>
      <span aria-hidden="true">{ico}</span>{label}{n != null && <i className="n">{n}</i>}
    </button>
  );

  return (
    <>
      <div className={'qg-strip' + (fresh ? ' fresh' : '')}>
        {G.objectives.length > 0 && chip('obj', '🎯', 'أهدافي', G.objectives.length, `أهداف هذا السؤال: ${G.objectives.length}`)}
        {G.outcomes.length > 0 && chip('out', '🧩', 'ما أتعلمه', G.outcomes.length, `ما أتعلمه في هذا السؤال: ${G.outcomes.length}`)}
        {G.scale && chip('rate', '⭐', 'كيف أُقيَّم', null, 'كيف تُقيَّم إجابتي')}
        {fresh && <span className="qg-spark" aria-hidden="true">✨</span>}
      </div>
      {tab && <GoalsSheet G={G} S={S} tab={tab} setTab={setTab} onClose={() => setTab(null)} timed={timed} />}
    </>
  );
}

/* ===== اللوحة: ورقة سفلية على الجوال ولوحة جانبية على الشاشات الكبيرة ===== */
function GoalsSheet({ G, S, tab, setTab, onClose, timed }) {
  const box = useRef(null);
  const [dy, setDy] = useState(0);             // سحب الورقة للأسفل
  const drag = (e) => {
    if (window.innerWidth >= 820) return;      // اللوحة الجانبية لا تُسحب
    const y0 = e.clientY;
    const mv = (ev) => setDy(Math.max(0, ev.clientY - y0));
    const up = (ev) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      if (ev.clientY - y0 > 90) onClose(); else setDy(0);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    box.current?.focus();
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [onClose]);
  // حبس التركيز داخل اللوحة
  const keep = (e) => {
    if (e.key !== 'Tab') return;
    const f = [...box.current.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')].filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], lastEl = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  };
  const tabs = [
    G.objectives.length > 0 && { k: 'obj', ico: '🎯', t: 'أهدافي' },
    G.outcomes.length > 0 && { k: 'out', ico: '🧩', t: 'ما أتعلمه' },
    G.scale && { k: 'rate', ico: '⭐', t: 'كيف أُقيَّم' },
  ].filter(Boolean);
  const cur = tabs.some(t => t.k === tab) ? tab : tabs[0].k;

  return createPortal(
    <div className="qg-bg" onClick={onClose} role="dialog" aria-modal="true" aria-label="ماذا أتعلم هنا؟">
      <div className="qg-sheet" ref={box} tabIndex={-1} onKeyDown={keep} onClick={e => e.stopPropagation()}
        style={dy ? { transform: `translateY(${dy}px)`, transition: 'none' } : undefined}>
        <span className="qg-grip" aria-hidden="true" onPointerDown={drag} style={{ touchAction: 'none', cursor: 'grab' }} />
        <div className="qg-head">
          <div>
            <h3>ماذا أتعلم هنا؟</h3>
            {S && <span className="qg-skill" style={{ background: tint(S.color), color: S.color }}>{S.icon ? <img src={S.icon} alt="" /> : SKILL_ICO(S.name)}{S.name}</span>}
          </div>
          {timed && <span className="qg-timed">⏱ الوقت مستمر</span>}
          <button type="button" className="modal-close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        <div className="qg-tabs">
          {tabs.map(t => (
            <button type="button" key={t.k} className={'qg-tab' + (cur === t.k ? ' on' : '')} onClick={() => { clickSound(); setTab(t.k); }}>
              <span aria-hidden="true">{t.ico}</span>{t.t}
            </button>
          ))}
        </div>

        <div className="qg-body">
          {cur === 'obj' && <Objectives list={G.objectives} S={S} />}
          {cur === 'out' && <Outcomes list={G.outcomes} />}
          {cur === 'rate' && <Scale rs={G.scale} />}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Objectives({ list, S }) {
  const ico = SKILL_ICO(S?.name);
  return list.map(o => (
    <div className="qg-card" key={o.id}>
      {o.title && <div className="qg-t">{o.title}</div>}
      {o.content && <p className="qg-p">{o.content}</p>}
      {objItems(o).map((t, i) => (
        <div className="qg-goal" key={i}>
          <span className="ico" style={{ background: tint(S?.color, '26'), color: S?.color }} aria-hidden="true">{ico}</span>
          <span>{t}</span>
        </div>
      ))}
    </div>
  ));
}

function Outcomes({ list }) {
  const [all, setAll] = useState(false);
  const shown = all ? list : list.slice(0, 3);
  return (
    <>
      {shown.map(o => {
        const d = DIFF[o.difficulty_level];
        const c = o.skill?.color;
        return (
          <div className="qg-card qg-out" key={o.id}>
            {o.skill && <span className="qg-skill sm" style={{ background: tint(c), color: c }}>{o.skill.icon ? <img src={o.skill.icon} alt="" /> : SKILL_ICO(o.skill.name)}{o.skill.name}</span>}
            <div className="qg-out-t">{o.title}</div>
            {d && <div className="qg-stars" title={d.ar}>{'⭐'.repeat(d.n)}<small>{d.ar}</small></div>}
          </div>
        );
      })}
      {!all && list.length > 3 && <button type="button" className="qg-more" onClick={() => { clickSound(); setAll(true); }}>عرض الكل ({list.length}) ←</button>}
    </>
  );
}

function Scale({ rs }) {
  const levels = sortedLevels(rs);
  const [open, setOpen] = useState(null);
  const top = levels[0];
  return (
    <>
      {rs.name && <div className="qg-t">{rs.name}{rs.name_en && <small className="qg-en">{rs.name_en}</small>}</div>}
      {rs.description && <p className="qg-p">{rs.description}</p>}
      <div className="qg-ladder">
        {levels.map((lv, i) => {
          const c = levelColor(lv, i, levels.length);
          return (
            <div className="qg-step" key={lv.name + i} style={{ '--c': c, background: tint(c, '1a'), borderColor: c }}>
              <span className="qg-lv" style={{ background: c }}>{i === 0 ? '🏆 ' : ''}{lv.name}{lv.name_en && <small>{lv.name_en}</small>}</span>
              <span className="qg-lv-stars" aria-hidden="true">{'⭐'.repeat(Math.max(1, levels.length - i))}</span>
              {lv.description && <div className="qg-lv-d">{lv.description}</div>}
            </div>
          );
        })}
      </div>
      {top && <div className="qg-tip">هكذا سيقيّم معلمك إجابتك — حاول أن تصل إلى «{top.name}» ⭐</div>}
      {(rs.criteria || []).map(c => {
        const on = open === c.id;
        return (
          <div className={'qg-crit' + (on ? ' on' : '')} key={c.id}>
            <button type="button" className="qg-crit-h" onClick={() => { clickSound(); setOpen(on ? null : c.id); }} aria-expanded={on}>
              <span className="t">{c.name}</span>
              <span className="x" aria-hidden="true">{on ? '−' : '+'}</span>
            </button>
            {on && (
              <div className="qg-crit-b">
                {c.description && <p className="qg-p">{c.description}</p>}
                {levels.map((lv, i) => {
                  const t = critText(c, lv);
                  if (!t) return null;
                  return (
                    <div className="qg-crit-row" key={lv.name + i}>
                      <span className="dot" style={{ background: levelColor(lv, i, levels.length) }} aria-hidden="true" />
                      <b>{lv.name}</b><span>{t}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ===== بطاقة البداية: «في هذا النشاط ستتعلم» — تُبنى من كل الأسئلة بلا تكرار ===== */
export function GoalsIntro({ questions = [], onStart, label = 'لنبدأ! 🚀', title = 'في هذا النشاط ستتعلم' }) {
  const items = [], outs = [], scales = [];
  const seen = { i: new Set(), o: new Set(), s: new Set() };
  (questions || []).forEach(q => {
    const G = goalsOf(q);
    G.objectives.forEach(o => objItems(o).forEach(t => { if (!seen.i.has(t)) { seen.i.add(t); items.push(t); } }));
    G.outcomes.forEach(o => { if (!seen.o.has(o.id)) { seen.o.add(o.id); outs.push(o); } });
    if (G.scale && !seen.s.has(G.scale.id)) { seen.s.add(G.scale.id); scales.push(G.scale); }
  });
  if (!items.length && !outs.length && !scales.length) return null;
  const more = Math.max(0, items.length - 4);
  return (
    <div className="qg-intro">
      <div className="qg-intro-h"><span aria-hidden="true">🎯</span><h3>{title}</h3></div>
      {items.slice(0, 4).map((t, i) => <div className="qg-goal" key={i}><span className="ico" aria-hidden="true">✓</span><span>{t}</span></div>)}
      {more > 0 && <div className="qg-more-n">+{more} أهداف أخرى</div>}
      {outs.length > 0 && (
        <div className="qg-intro-tags">
          {outs.slice(0, 3).map(o => (
            <span className="qg-skill sm" key={o.id} style={{ background: tint(o.skill?.color), color: o.skill?.color }}>
              🧩 {o.title}
            </span>
          ))}
        </div>
      )}
      {scales.length > 0 && <div className="qg-intro-scale">⭐ التقييم بـ: {scales.map(x => x.name).filter(Boolean).join(' · ')}</div>}
      {onStart && <button type="button" className="btn btn-primary qg-start" onClick={() => { clickSound(); onStart(); }}>{label}</button>}
    </div>
  );
}
