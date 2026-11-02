import { useApi } from '../api/useApi.js';
import api from '../api/client.js';

/* ============================================================
   تقييم المعايير (rubric) — عند الطالب
   ------------------------------------------------------------
   المعلم يعتمد التقييم أولاً، وقبل الاعتماد لا يصل للطالب شيء.
   كل معيار له مستوى من مستويات السلّم، والشريط يوضّح موقع الطالب
   بين المستويات. لا تظهر درجات المعيار هنا — المستوى هو الرسالة.
   ============================================================ */

const LEVEL_FALLBACK = ['#e11d48', '#f59e0b', '#1d6fe0', '#16a34a', '#7c3aed'];
const colorOf = (l, i = 0) => l?.color || LEVEL_FALLBACK[i % LEVEL_FALLBACK.length];

function LevelBar({ levels = [], current }) {
  if (!levels.length) return null;
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
      {levels.map((l, i) => (
        <span
          key={l.level}
          title={l.name}
          style={{
            height: 6, flex: 1, borderRadius: 999,
            background: current != null && l.level <= current ? colorOf(l, i) : 'var(--line2)',
          }}
        />
      ))}
    </div>
  );
}

export function RubricCriterion({ c, levels }) {
  const i = (c.level?.level ?? 1) - 1;
  return (
    <div style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--soft, #f8fafc)', marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <strong style={{ flex: 1, minWidth: 140, fontSize: 14 }}>{c.name}</strong>
        {c.level ? (
          <span
            className="chip"
            style={{ background: `${colorOf(c.level, i)}18`, color: colorOf(c.level, i), fontWeight: 900 }}
          >
            {c.level.name}
          </span>
        ) : (
          <span className="chip" style={{ color: 'var(--mute)' }}>—</span>
        )}
      </div>
      {c.description && (
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--mute)', lineHeight: 1.7 }}>{c.description}</p>
      )}
      <LevelBar levels={levels} current={c.level?.level} />
      {c.note && (
        <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 700, background: '#fff', padding: '6px 10px', borderRadius: 10 }}>
          {c.note}
        </p>
      )}
    </div>
  );
}

/** بطاقة تقييم واحدة — تُستخدم داخل صفحة النتيجة وفي صفحة التقييمات */
export function RubricEvaluationCard({ e }) {
  const levels = e.rubric?.levels || [];
  const i = (e.overall_level?.level ?? 1) - 1;

  return (
    <div className="card" style={{ marginTop: 18, padding: '20px 22px', borderTop: `4px solid ${e.rubric?.color || 'var(--brand)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 17, flex: 1, minWidth: 160 }}>
          🏅 {e.rubric?.name || 'تقييم المعايير'}
        </h3>
        {e.overall_level && (
          <span
            className="chip"
            style={{ background: `${colorOf(e.overall_level, i)}18`, color: colorOf(e.overall_level, i), fontWeight: 900 }}
          >
            {e.overall_level.name}
          </span>
        )}
      </div>

      {e.exam_title && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--mute)', fontWeight: 700 }}>{e.exam_title}</p>
      )}

      {e.criteria?.map((c) => <RubricCriterion key={c.id} c={c} levels={levels} />)}

      {e.notes && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--green-soft)' }}>
          <strong style={{ fontSize: 12 }}>ملاحظة معلمك</strong>
          <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.8 }}>{e.notes}</p>
        </div>
      )}
    </div>
  );
}

/**
 * التقييم الخاص باختبار واحد — يُعرض داخل صفحة نتيجة الاختبار.
 * لا يظهر شيء إذا لم يكن الاختبار مرتبطاً بسلّم تقييم أو لم يعتمده المعلم بعد.
 */
export function RubricForAssignment({ assignmentId }) {
  const { data, loading } = useApi(
    () => (assignmentId ? api.rubricEvaluations({ assignment_id: assignmentId }) : Promise.resolve(null)),
    [assignmentId],
  );
  if (loading || !data) return null;
  const list = data.evaluations || [];
  if (!list.length) return null;

  return list.map((e) => <RubricEvaluationCard key={e.id} e={e} />);
}

/** صفحة مستقلة بكل تقييمات الطالب */
export default function RubricEvaluations() {
  const { data, loading, error } = useApi(() => api.rubricEvaluations(), []);
  const list = data?.evaluations || [];

  return (
    <div className="wrap">
      <h1 style={{ fontSize: 24, margin: '18px 0 4px' }}>🏅 تقييماتي بالمعايير</h1>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)', fontWeight: 700 }}>
        مستواك في كل معيار من معايير اختباراتك، بعد اعتماد معلمك
      </p>

      {loading && <p style={{ marginTop: 28, textAlign: 'center', color: 'var(--mute)', fontWeight: 700 }}>جاري التحميل…</p>}

      {!loading && error && (
        <p style={{ marginTop: 28, textAlign: 'center', color: 'var(--danger)', fontWeight: 700 }}>تعذر تحميل التقييمات</p>
      )}

      {!loading && !error && list.length === 0 && (
        <div className="card" style={{ marginTop: 22, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 34 }}>🏅</div>
          <h3 style={{ margin: '10px 0 4px' }}>لا توجد تقييمات بعد</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)', fontWeight: 700 }}>
            يظهر التقييم هنا بعد أن يصحّح معلمك اختباراً مرتبطاً بسلّم تقييم
          </p>
        </div>
      )}

      {list.map((e) => <RubricEvaluationCard key={e.id} e={e} />)}
    </div>
  );
}
