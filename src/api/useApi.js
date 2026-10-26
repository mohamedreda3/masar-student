import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import api from './client.js';
import { applyPrefs } from '../prefs.js';

/* جلب بسيط: const { data, loading, error, reload } = useApi(() => api.unit(id), [id]) */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = useCallback(() => {
    let alive = true;
    setState(s => ({ ...s, loading: true, error: null }));
    fn().then(
      data => alive && setState({ data, loading: false, error: null }),
      error => alive && setState({ data: null, loading: false, error }),
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(load, [load]);
  return { ...state, reload: load };
}

/* بيانات الرئيسية (الطالب + الإحصاءات) مشتركة بين الشريط العلوي وشريط الإحصاءات وكل الصفحات */
const HomeCtx = createContext({ home: null, reload: () => {} });

export function HomeProvider({ children }) {
  const { data, reload: reloadHome } = useApi(() => api.home(), []);
  // الهيدر من GET /stats (أحدث من home.stats) — ويُعاد جلبه بعد كل إكمال
  const { data: stats, reload: reloadStats } = useApi(() => api.stats(), []);
  // تفضيلات المظهر من حساب الطالب — تُطبَّق بعد الدخول على المنصة كلها
  useEffect(() => { api.settings().then(s => s?.appearance && applyPrefs(s.appearance)).catch(() => {}); }, []);
  const home = data ? { ...data, stats: stats || data.stats } : null;
  const reload = useCallback(() => { reloadHome(); reloadStats(); }, [reloadHome, reloadStats]);
  return createElement(HomeCtx.Provider, { value: { home, reload } }, children);
}

export const useHome = () => useContext(HomeCtx);

/* عنوان التبويب باسم العنصر الداخلي (وحدة / درس / نشاط / تكليف…) — «مسار العربية | مسار الطالب - {الاسم}»
   App يضع اسم القسم أولاً (useLayoutEffect) ثم تستبدله الصفحة بالاسم الحقيقي عند وصول بياناتها */
export const PAGE_PREFIX = 'مسار العربية | مسار الطالب - ';
export function usePageTitle(...parts) {
  const name = parts.filter(Boolean).join(' · ');
  useEffect(() => { if (name) document.title = PAGE_PREFIX + name; }, [name]);
}

/* اسم الطالب ونقاطه ومستواه من الـAPI بنفس شكل student في data.js */
export function useStudent(fallback = {}) {
  const h = useContext(HomeCtx).home;
  const name = h?.student?.name || '';
  const st = h?.stats || {};
  return {
    ...fallback,
    ar: name, first: name.split(' ')[0],
    points: (st.points ?? 0).toLocaleString('en'),
    level: st.current_level?.name ?? st.current_level ?? h?.tier?.name_ar ?? '—',
  };
}

/* ربط أسماء مهارات الباك اند بمفاتيح SKILLS في التصميم */
export const SKILL_KEY = { 'القراءة': 'reading', 'الكتابة': 'writing', 'الاستماع': 'listening', 'التحدث': 'speaking', 'النحو': 'grammar', 'القواعد': 'grammar', 'المفردات': 'vocab' };

/* حالات الباك اند → حالات التصميم */
export const ST = (s) => (s === 'completed' ? 'done' : s === 'current' || s === 'in_progress' ? 'current' : 'locked');

/* رابط تشغيل نشاط داخل درس */
export const activityLink = (lessonId, activityId) => `/quiz/run?lesson=${lessonId}&activity=${activityId}`;

/* ===== صور الوحدات والدروس =====
   صور الـAPI المولّدة (SVG مكتوب عليه العنوان) تتقصّ في البطاقات وتكرر العنوان —
   نعرض الصورة الحقيقية إن وُجدت، وإلا رسمة الوحدة من التصميم (بالاسم) أو مشهداً ثابتاً لها */
import { stations as _st, futureStations as _fst } from '../data.js';
const UNIT_ART = Object.fromEntries([..._st, ..._fst].map(s => [s.ar, s.img]));
const SCENES = ['/img/scene-greetings.png', '/img/scene-read.png', '/img/scene-story.png', '/img/scene-discover.png', '/img/scene-garden.png', '/img/scene-market.png', '/img/scene-play.png', '/img/scene-speak.png', '/img/scene-express.png', '/img/scene-farm.png'];
const isReal = (src) => !!src && typeof src === 'string' && !!src.trim();   // أي صورة راجعة تُعرض كما هي (البديل فقط عند غيابها؛ والخطأ يعالجه main.jsx)
const pick = (seed) => { const s = String(seed ?? ''); let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return SCENES[h % SCENES.length]; };
export const unitArt = (title, image) => (isReal(image) ? image : UNIT_ART[String(title || '').trim()] || pick(title));
export const lessonArt = (thumb, seed) => (isReal(thumb) ? thumb : pick('lesson-' + seed));
/* صورة حقيقية فقط: الصور المولّدة (SVG مكتوب عليه نص البطاقة) تكرّر النص — نتجاهلها */
export const photoOnly = (src) => (/\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(String(src || '')) ? src : null);
