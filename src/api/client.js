/* ============================================================
   نقطة الربط بالـAPI — هيكل جاهز للمطورين
   ------------------------------------------------------------
   اليوم: الشاشات تستورد البيانات من ../data.js مباشرة (مواصفة الـAPI).
   الربط المقترح على مرحلتين:
     1) أنشئوا الـendpoints بنفس أشكال data.js (راجعوا docs/API-CONTRACT.md).
     2) في كل صفحة استبدلوا `import { x } from '../data.js'`
        بـ `const x = await api.getX(...)` (أو hook بسيط useApi).
   كل الدوال هنا تعيد Promise بنفس شكل الصادر المقابل من data.js.
   ============================================================ */

const BASE = import.meta.env.VITE_API_BASE || '/api/v1';

async function http(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json();
}

/* خريطة الـendpoints — كل دالة تقابل export في data.js */
export const api = {
  // الهوية والمسار
  me:            () => http('/me'),                              // ↔ student
  levels:        () => http('/me/levels'),                       // ↔ levels
  units:         (scope) => http(`/me/units${scope ? `?scope=${scope}` : ''}`), // ↔ stations / futureStations
  unit:          (id) => http(`/units/${id}`),                   // ↔ healthUnit
  currentLesson: () => http('/me/current-lesson'),               // ↔ currentLesson
  unitObjectives:(id) => http(`/units/${id}/objectives`),        // ↔ unitObjectives
  unitOutcomes:  (id) => http(`/units/${id}/outcomes`),          // ↔ myOutcomes
  unitResources: (id) => http(`/units/${id}/resources`),         // ↔ unitResources

  // الدرس
  lessonFlow:    (id) => http(`/lessons/${id}/flow`),            // ↔ lessonFlow
  lessonReading: (id) => http(`/lessons/${id}/reading`),         // ↔ hamdanText
  lessonVocab:   (id, scope) => http(`/lessons/${id}/vocab${scope ? `?scope=${scope}` : ''}`), // ↔ lessonVocab / extraVocab
  lessonPhrases: (id) => http(`/lessons/${id}/phrases`),         // ↔ usefulPhrases

  // التقييم
  quiz:          (id) => http(`/lessons/${id}/quiz`),            // ↔ quizQuestions
  submitQuiz:    (id, answers) => http(`/lessons/${id}/quiz/attempts`, { method: 'POST', body: { answers } }), // → { pct, correct, pts, plan }
  attemptResult: (attemptId) => http(`/attempts/${attemptId}/result`), // ↔ activityResult
  exitTicket:    (id) => http(`/lessons/${id}/exit-ticket`),     // ↔ exitTicket
  submitExit:    (id, answer, mood) => http(`/lessons/${id}/exit-ticket`, { method: 'POST', body: { answer, mood } }), // mood=2 يُشعر المعلم
  exam:          (unitId) => http(`/units/${unitId}/exam`),      // ↔ examSections
  examResult:    (unitId) => http(`/units/${unitId}/exam/result`), // ↔ examResult
  rubric:        (kind = 'writing') => http(`/rubrics/${kind}`), // ↔ rubric

  // المهارات والتقارير
  skills:        () => http('/me/skills'),                       // ↔ skillProgress
  skillItems:    (skill) => http(`/me/skills/${skill}/items`),   // ↔ skillsHub[skill]
  tasksToday:    () => http('/me/tasks/today'),                  // ↔ tasks
  activities:    () => http('/me/activities'),                   // ↔ activities
  reportKpis:    () => http('/me/reports/kpis'),                 // ↔ reportKpis
  progress:      () => http('/me/reports/progress'),             // ↔ progressOverTime
  feedbackPoints:() => http('/me/reports/feedback'),             // ↔ { strengths, improvements }
  goals:         () => http('/me/goals'),                        // ↔ goals
  recentActivity:(limit = 4) => http(`/me/activity?limit=${limit}`), // ↔ recentActivity

  // التلعيب
  badges:        (status) => http(`/me/badges${status ? `?status=${status}` : ''}`), // ↔ earnedBadges / progressBadges / lockedBadges
  certificates:  () => http('/me/certificates'),                 // ↔ certificates
  challenges:    () => http('/me/challenges'),                   // ↔ challenges
  games:         () => http('/games'),                           // ↔ allGames
  gameStats:     () => http('/me/games/stats'),                  // ↔ gameStats
  wordSearch:    (lessonId) => http(`/games/wordsearch/${lessonId}`), // { grid, words }

  // التواصل
  notifications: () => http('/me/notifications'),                // ↔ notifications
  readAllNotifs: () => http('/me/notifications/read-all', { method: 'POST' }),
  teacherNotes:  () => http('/me/feedback'),                     // ↔ teacherNotes
  tickets:       () => http('/me/tickets'),                      // ↔ myTickets
  openTicket:    (subject, text) => http('/me/tickets', { method: 'POST', body: { subject, text } }),
  portfolio:     () => http('/me/portfolio'),                    // ↔ portfolioWorks
  calendar:      (month) => http(`/me/calendar?month=${month}`), // ↔ calendarEvents
  library:       () => http('/library'),                         // ↔ stories
  story:         (id) => http(`/stories/${id}`),                 // ↔ storyPages

  // التفضيلات (تحل محل localStorage)
  savePreferences: (prefs) => http('/me/preferences', { method: 'PATCH', body: prefs }), // { theme, mode, fontSize }

  // لوحة المعلم (بنك الأسئلة)
  questionBank:  (q = {}) => http('/question-bank?' + new URLSearchParams(q)), // ↔ TestBuilder BANK
  createTest:    (questionIds, classId) => http('/tests', { method: 'POST', body: { questionIds, classId } }),
};

export default api;
