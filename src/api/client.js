/* ============================================================
   نقطة الربط بالـAPI — باك اند مسار (لوحة الطالب)
   ------------------------------------------------------------
   كل الردود بالشكل { message, status, data } — الدوال هنا تعيد data مباشرة.
   التوكن يُحفظ في localStorage بعد تسجيل الدخول، وأي 401 يعيد لشاشة الدخول.
   ============================================================ */

const BASE = (import.meta.env.VITE_API_BASE || 'https://masar-alarabia.ae/backend/api').replace(/\/$/, '');
const TOKEN_KEY = 'masar-token';

// «تذكرني» → localStorage، وإلا sessionStorage (ينتهي بإغلاق المتصفح)
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t, remember = true) => {
  try {
    localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY);
    if (t) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, t);
  } catch { /* بلا تخزين */ }
};

/* رابط ملف من الباك اند (uploads) قابل للعرض في <img>/<video>:
   - يرمّز المسافات والحروف الخاصة في اسم الملف
   - في التطوير يحوّله لمسار نسبي يمرّ عبر بروكسي Vite (تجاوز Cross-Origin-Resource-Policy: same-origin) */
export function media(url) {
  if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:')) return url;
  let u = /%[0-9A-F]{2}/i.test(url) ? url : encodeURI(url);
  if (import.meta.env.DEV) u = u.replace(/^https?:\/\/masar-alarabia\.ae(?=\/backend\/uploads\/)/, '');
  return u;
}

/* تمرير كل روابط /backend/uploads في الرد عبر media() — صور، فيديو، صوت، أفاتار… */
const UPLOADS = 'masar-alarabia.ae/backend/uploads/';
function fixMedia(v) {
  if (typeof v === 'string') return v.includes(UPLOADS) ? media(v) : v;
  if (Array.isArray(v)) return v.map(fixMedia);
  if (v && typeof v === 'object') { for (const k in v) v[k] = fixMedia(v[k]); return v; }
  return v;
}

export function logout() {
  const t = getToken();
  setToken(null);
  location.hash = '#/login';
  if (t) fetch(BASE + '/student/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: '{}' }).catch(() => {}); // إبطال التوكن على السيرفر
}

/* بناء query بدون القيم الفاضية */
const qstr = (p) => { const s = new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all')).toString(); return s ? '?' + s : ''; };

async function http(path, { method = 'GET', body } = {}) {
  const token = getToken();
  // POST/PATCH/PUT بلا body → نرسل {} مع Content-Type (LiteSpeed يرفض الطلب الفارغ — شكل مُجرَّب على السيرفر)
  if (method !== 'GET' && body === undefined) body = {};
  const isForm = body instanceof FormData;
  const res = await fetch(BASE + '/student' + path, {
    method,
    headers: {
      // FormData: المتصفح يضبط Content-Type (boundary) و Content-Length بنفسه — لا نضعه يدوياً
      ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = fixMedia(await res.json().catch(() => ({})));
  if (res.status === 401 && !/^\/auth\/(login|forgot|reset)/.test(path)) logout();
  if (!res.ok || json.status === 'error') {
    const err = new Error(json.message || `${method} ${path} → ${res.status}`);
    err.status = res.status; // 403 = مقفل، 409 = قسم مُسلَّم
    throw err;
  }
  return json.data;
}

export const api = {
  // الهوية
  login:    (email, password) => http('/auth/login', { method: 'POST', body: { email, password } }), // → { token, student }
  forgotPassword: (identifier, channel) => http('/auth/forgot-password', { method: 'POST', body: { identifier, channel } }), // channel: email | whatsapp
  resetPassword:  (reset_token, new_password) => http('/auth/reset-password', { method: 'POST', body: { reset_token, new_password } }),
  profile:  () => http('/auth/profile'),                          // → { student }
  updateProfile:  (fields) => http('/auth/profile', { method: 'PATCH', body: fields }),
  changePassword: (current_password, new_password) => http('/auth/change-password', { method: 'POST', body: { current_password, new_password } }),
  home:     () => http('/home'),                                  // الرئيسية: stats, skills, tasks, vocabulary…
  stats:    () => http('/stats'),                                 // النقاط، الأيام المتتالية، المستوى، الإشعارات غير المقروءة
  points:   (page = 1) => http('/points?page=' + page),           // سجل كسب النقاط
  notifications:        (unread) => http('/notifications' + (unread ? '?unread=true' : '')), // → { unread_count, items }
  readNotification:     (id) => http(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAllNotifications: () => http('/notifications/read-all', { method: 'PATCH' }),

  // تكليفات المعلم (أنشطة / واجبات / اختبارات)
  // ?kind=work|exam &type= &status= &page= — → { summary, statuses, items }
  assignments:      (params = {}) => http('/assignments' + qstr(params)),
  // مكتبة أنشطة المنصة (من الأدمن) — ?unit_id= &lesson_id= &type= &status= &search=
  library:          (params = {}) => http('/activities' + qstr(params)),
  // مركز المهارات: ?skill_id= &tab=all|lessons|practice|tasks|challenges &days=7..90
  skills:           (params = {}) => http('/skills' + qstr(params)),
  // تقاريري: ?tab=overview|skills|achievements|portfolio &skill_id= &accuracy_skill_id= &period=1W|1M|3M|1Y &limit=
  reports:          (params = {}) => http('/reports' + qstr(params)),
  // الشارات: { summary, earned, in_progress, not_started } — تُقيَّم مع كل طلب
  badges:           () => http('/badges'),
  // مكتبة القصص: ?lesson_id= &unit_id= &status=all|locked|not_started|reading|completed &search=
  stories:          (params = {}) => http('/stories' + qstr(params)),
  story:            (id) => http(`/stories/${id}`),
  storyProgress:    (id, last_page) => http(`/stories/${id}/progress`, { method: 'POST', body: { last_page } }),
  submitStory:      (id, answers, time_spent_seconds) => http(`/stories/${id}/submit`, { method: 'POST', body: { answers, time_spent_seconds } }),
  // التقويم والمهام: ?month=YYYY-MM &category=homework|activity|quiz|final|lesson
  calendar:         (params = {}) => http('/calendar' + qstr(params)),
  // موارد الدعم والتذاكر
  support:          (params = {}) => http('/support' + qstr(params)),
  tickets:          (params = {}) => http('/support/tickets' + qstr(params)),   // ?to=teacher
  newTicket:        (category, message) => http('/support/tickets', { method: 'POST', body: { category, message } }),
  ticketMessage:    (id, message) => http(`/support/tickets/${id}/messages`, { method: 'POST', body: { message } }),
  askTeacher:       (message) => http('/support/teacher-questions', { method: 'POST', body: { message } }),
  // التحديات والألعاب
  challenges:       (params = {}) => http('/challenges' + qstr(params)),
  challenge:        (key) => http(`/challenges/${key}`),
  game:             (id) => http(`/games/${id}`),
  playGame:         (id, r) => http(`/games/${id}/play`, { method: 'POST', body: r }),   // { score, max_score, mistakes, time_spent_seconds }
  assignment:       (id) => http(`/assignments/${id}`),
  startAssignment:  (id) => http(`/assignments/${id}/start`, { method: 'POST' }),
  exams:            (params = {}) => http('/exams' + qstr(params)),   // نفس شكل /assignments — والتفاصيل/البدء/التسليم من نفس مسارات assignments
  // التسليم: answers (JSON) + ملفات (حتى 10: صورة/PDF/صوت/فيديو/Word) + ملاحظة
  submitAssignment: (id, { answers = [], files = [], note = '', time_spent_seconds } = {}) => {
    if (!files.length) return http(`/assignments/${id}/submit`, { method: 'POST', body: { answers, ...(note ? { note } : {}), ...(time_spent_seconds ? { time_spent_seconds } : {}) } });
    const fd = new FormData();
    fd.append('answers', JSON.stringify(answers));
    if (note) fd.append('note', note);
    if (time_spent_seconds) fd.append('time_spent_seconds', String(time_spent_seconds));
    files.forEach(f => fd.append('files', f, f.name));
    return http(`/assignments/${id}/submit`, { method: 'POST', body: fd });
  },
  // نشاط داخل تكليف (يعمل حتى لو درسه مقفل في المسار)
  aActivity:        (id, lessonId) => http(`/activities/${id}?lesson_id=${lessonId}`),
  aStartActivity:   (id, lessonId) => http(`/activities/${id}/start?lesson_id=${lessonId}`, { method: 'POST' }),
  aSubmitActivity:  (id, lessonId, answers, time_spent_seconds) => http(`/activities/${id}/submit?lesson_id=${lessonId}`, { method: 'POST', body: { answers, time_spent_seconds } }),
  aCompleteActivity:(id, lessonId, body) => http(`/activities/${id}/complete?lesson_id=${lessonId}`, { method: 'POST', body: body || {} }),

  // المسار
  path:     (filter) => http('/path' + (filter && filter !== 'all' ? `?filter=${filter}` : '')),
  unit:     (unitId) => http(`/path/units/${unitId}`),
  // الاختبار الختامي (يظهر فقط بتكليف من المعلم)
  unitExam:      (unitId) => http(`/path/units/${unitId}/exam`),
  examSection:   (unitId, sectionId) => http(`/path/units/${unitId}/exam/sections/${sectionId}`),
  saveSection:   (unitId, sectionId, answers) => http(`/path/units/${unitId}/exam/sections/${sectionId}/save`, { method: 'POST', body: { answers } }),
  submitSection: (unitId, sectionId, answers) => http(`/path/units/${unitId}/exam/sections/${sectionId}/submit`, { method: 'POST', body: { answers } }),
  lesson:   (lessonId) => http(`/path/lessons/${lessonId}`),
  // صفحة الدرس (المحتوى الدراسي)
  lessonPage:       (lessonId) => http(`/path/lessons/${lessonId}/page`),
  submitLessonTask: (lessonId, answers) => http(`/path/lessons/${lessonId}/page/task`, { method: 'POST', body: { answers } }),
  saveSelfCheck:    (lessonId, checked) => http(`/path/lessons/${lessonId}/page/self-check`, { method: 'POST', body: { checked } }),

  // النشاط داخل الدرس
  activity:         (lessonId, activityId) => http(`/path/lessons/${lessonId}/activities/${activityId}`),
  startActivity:    (lessonId, activityId) => http(`/path/lessons/${lessonId}/activities/${activityId}/start`, { method: 'POST' }),
  submitActivity:   (lessonId, activityId, answers, time_spent_seconds) => http(`/path/lessons/${lessonId}/activities/${activityId}/submit`, { method: 'POST', body: { answers, time_spent_seconds } }), // answers: [{ question_id, answer }]
  // النطق: FormData فيه audio_<pronunciation_id> لكل كلمة
  completeActivity: (lessonId, activityId, formData) => http(`/path/lessons/${lessonId}/activities/${activityId}/complete`, { method: 'POST', body: formData || {} }),
};

export default api;
