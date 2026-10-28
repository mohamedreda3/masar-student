import { useEffect, useLayoutEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TopBar } from './components.jsx';
import { initFx } from './fx.js';
import { swooshSound } from './sounds.js';
import Home from './pages/Home.jsx';
import Path from './pages/Path.jsx';
import Activities from './pages/Activities.jsx';
import Reports from './pages/Reports.jsx';
import Unit from './pages/Unit.jsx';
import Lesson from './pages/Lesson.jsx';
import QuizInstructions from './pages/QuizInstructions.jsx';
import Support from './pages/Support.jsx';
import Notifications from './pages/Notifications.jsx';
import Calendar from './pages/Calendar.jsx';
import Feedback from './pages/Feedback.jsx';
import Settings from './pages/Settings.jsx';
import QuizRun from './pages/QuizRun.jsx';
import Result from './pages/Result.jsx';
import Library from './pages/Library.jsx';
import Story from './pages/Story.jsx';
import SkillsHub from './pages/SkillsHub.jsx';
import Exam from './pages/Exam.jsx';
import NotFound from './pages/NotFound.jsx';
import Badges from './pages/Badges.jsx';
import Challenges from './pages/Challenges.jsx';
import More from './pages/More.jsx';
import Login from './pages/Login.jsx';
import Assignment from './pages/Assignment.jsx';
import PlayGame from './pages/PlayGame.jsx';
import SupportPlans from './pages/SupportPlans.jsx';
import { FileViewerHost } from './FileViewer.jsx';
import { getToken } from './api/client.js';
import { HomeProvider } from './api/useApi.js';

/* عنوان التبويب: «مسار العربية | مسار الطالب - {اسم الصفحة}» */
const PAGE_TITLES = {
  '/': 'الصفحة الرئيسية', '/login': 'تسجيل الدخول', '/path': 'مساري', '/unit': 'الوحدة', '/lesson': 'الدرس',
  '/activities': 'أنشطتي', '/assignments': 'اختباراتي وواجباتي', '/assignment': 'تفاصيل التكليف',
  '/skills': 'مهاراتي', '/reports': 'تقاريري', '/badges': 'الشارات', '/challenges': 'التحديات والألعاب', '/games': 'التحديات والألعاب',
  '/play': 'اللعبة', '/more': 'المزيد', '/support': 'موارد الدعم', '/support-plan': 'خطة الدعم الخاصة بي', '/notifications': 'الإشعارات', '/portfolio': 'ملف أعمالي',
  '/calendar': 'التقويم والمهام', '/feedback': 'ملاحظات المعلم', '/settings': 'حسابي والإعدادات',
  '/quiz': 'تعليمات الاختبار', '/quiz/run': 'النشاط', '/result': 'النتيجة', '/exam': 'الاختبار', '/exam/result': 'نتيجة الاختبار',
  '/library': 'مكتبة القصص', '/story': 'القصة', '/game': 'مطابقة المفردات', '/game/wordsearch': 'البحث عن الكلمات',
  '/level-check': 'تحديد المستوى', '/level-check/question': 'تحديد المستوى', '/level-check/result': 'نتيجة تحديد المستوى',
  '/exit-ticket': 'تذكرة الخروج', '/rubric': 'معايير التقييم', '/certificate': 'الشهادة', '/engines': 'محركات الأسئلة', '/test-builder': 'مولّد الاختبارات',
};
const titleOf = (p) => PAGE_TITLES[p] || (p.startsWith('/activity/') ? 'النشاط' : p.startsWith('/extra/') ? 'نشاط إضافي' : 'الصفحة غير موجودة');

function Shell() {
  const { pathname } = useLocation();
  const firstNav = useRef(true);
  useEffect(() => { initFx(); }, []);
  const { search } = useLocation();
  useLayoutEffect(() => { document.title = `مسار العربية | مسار الطالب - ${titleOf(pathname)}`; }, [pathname, search]);
  useEffect(() => {
    if (firstNav.current) { firstNav.current = false; return; }
    swooshSound(); // سووش خفيف مع كل تنقل
  }, [pathname]);
  if (!getToken() && pathname !== '/login') return <Navigate to="/login" replace />; // بلا توكن → شاشة الدخول
  if (pathname === '/login') return getToken() ? <Navigate to="/" replace /> : <Login />;
  const focused = ['/lesson', '/quiz/run', '/play', '/story', '/exam'].includes(pathname)
   ; // شاشات الجلسة المركزة بلا قائمة علوية
  return (
    <HomeProvider>
      {!focused && <TopBar />}
      {/* مفتاح المسار يعيد تشغيل انزلاق الدخول مع كل صفحة */}
      <div className="route-fx" key={pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/path" element={<Path />} />
        <Route path="/activities" element={<Activities mode="activities" />} />
        <Route path="/assignment" element={<Assignment />} />
        <Route path="/play" element={<PlayGame />} />
        <Route path="/support-plan" element={<SupportPlans />} />
        <Route path="/assignments" element={<Activities key="assignments" mode="assignments" />} />
        <Route path="/games" element={<Navigate to="/challenges" replace />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/unit" element={<Unit />} />
        <Route path="/lesson" element={<Lesson />} />
        <Route path="/quiz" element={<QuizInstructions />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/more" element={<More />} />
        <Route path="/engines" element={<Navigate to="/challenges" replace />} />
        <Route path="/test-builder" element={<Navigate to="/challenges" replace />} />
        <Route path="/support" element={<Support />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/portfolio" element={<Navigate to="/reports?tab=portfolio" replace />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/quiz/run" element={<QuizRun />} />
        <Route path="/result" element={<Result />} />
        <Route path="/game" element={<Navigate to="/challenges" replace />} />
        <Route path="/game/wordsearch" element={<Navigate to="/challenges" replace />} />
        <Route path="/level-check/*" element={<Navigate to="/" replace />} />
        <Route path="/library" element={<Library />} />
        <Route path="/story" element={<Story />} />
        <Route path="/activity/:type" element={<Navigate to="/skills" replace />} />
        <Route path="/skills" element={<SkillsHub />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/exam/result" element={<Navigate to="/path" replace />} />
        <Route path="/exit-ticket" element={<Navigate to="/path" replace />} />
        <Route path="/extra/:mode" element={<Navigate to="/support" replace />} />
        <Route path="/rubric" element={<Navigate to="/path" replace />} />
        <Route path="/certificate" element={<Navigate to="/badges" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
      <FileViewerHost />
    </HomeProvider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
