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
import Portfolio from './pages/Portfolio.jsx';
import Calendar from './pages/Calendar.jsx';
import Feedback from './pages/Feedback.jsx';
import Settings from './pages/Settings.jsx';
import QuizRun from './pages/QuizRun.jsx';
import Result from './pages/Result.jsx';
import Game from './pages/Game.jsx';
import LevelIntro from './pages/LevelIntro.jsx';
import LevelQuestion from './pages/LevelQuestion.jsx';
import LevelResult from './pages/LevelResult.jsx';
import Library from './pages/Library.jsx';
import Story from './pages/Story.jsx';
import Activity from './pages/Activity.jsx';
import SkillsHub from './pages/SkillsHub.jsx';
import Exam from './pages/Exam.jsx';
import ExamResult from './pages/ExamResult.jsx';
import ExitTicket from './pages/ExitTicket.jsx';
import Extra from './pages/Extra.jsx';
import Rubric from './pages/Rubric.jsx';
import Certificate from './pages/Certificate.jsx';
import NotFound from './pages/NotFound.jsx';
import Badges from './pages/Badges.jsx';
import Challenges from './pages/Challenges.jsx';
import More from './pages/More.jsx';
import Engines from './pages/Engines.jsx';
import TestBuilder from './pages/TestBuilder.jsx';
import WordSearch from './pages/WordSearch.jsx';
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
  const focused = ['/lesson', '/quiz/run', '/play', '/level-check/question', '/story', '/exam', '/exit-ticket'].includes(pathname)
    || pathname.startsWith('/activity/') || pathname.startsWith('/extra/') || pathname.startsWith('/game'); // شاشات الجلسة المركزة بلا قائمة علوية
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
        <Route path="/engines" element={<Engines />} />
        <Route path="/test-builder" element={<TestBuilder />} />
        <Route path="/support" element={<Support />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/quiz/run" element={<QuizRun />} />
        <Route path="/result" element={<Result />} />
        <Route path="/game" element={<Game />} />
        <Route path="/game/wordsearch" element={<WordSearch />} />
        <Route path="/level-check" element={<LevelIntro />} />
        <Route path="/level-check/question" element={<LevelQuestion />} />
        <Route path="/level-check/result" element={<LevelResult />} />
        <Route path="/library" element={<Library />} />
        <Route path="/story" element={<Story />} />
        <Route path="/activity/:type" element={<Activity />} />
        <Route path="/skills" element={<SkillsHub />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/exam/result" element={<ExamResult />} />
        <Route path="/exit-ticket" element={<ExitTicket />} />
        <Route path="/extra/:mode" element={<Extra />} />
        <Route path="/rubric" element={<Rubric />} />
        <Route path="/certificate" element={<Certificate />} />
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
