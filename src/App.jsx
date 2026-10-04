import { useEffect, useRef } from 'react';
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

function Shell() {
  const { pathname } = useLocation();
  const firstNav = useRef(true);
  useEffect(() => { initFx(); }, []);
  useEffect(() => {
    if (firstNav.current) { firstNav.current = false; return; }
    swooshSound(); // سووش خفيف مع كل تنقل
  }, [pathname]);
  const focused = ['/lesson', '/quiz/run', '/level-check/question', '/story', '/exam', '/exit-ticket'].includes(pathname)
    || pathname.startsWith('/activity/') || pathname.startsWith('/extra/') || pathname.startsWith('/game'); // شاشات الجلسة المركزة بلا قائمة علوية
  return (
    <>
      {!focused && <TopBar />}
      {/* مفتاح المسار يعيد تشغيل انزلاق الدخول مع كل صفحة */}
      <div className="route-fx" key={pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/path" element={<Path />} />
        <Route path="/activities" element={<Activities />} />
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
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
