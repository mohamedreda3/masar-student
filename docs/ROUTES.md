# خريطة الشاشات — 41 مساراً (HashRouter)

`src/App.jsx` — الشاشات المميزة بـ 🎯 **وضع مركّز** (بلا قائمة علوية — قاعدة العميل: لا مشتتات داخل التمرين).

| المسار | الملف | الوظيفة | يحتاج من الـAPI |
|---|---|---|---|
| `/` | `pages/Home.jsx` | الرئيسية: تابع التعلّم، مهاراتي الأربع (+ سباركلاينات + مقترح تكيفي)، مهام اليوم، مفردات اليوم، عبارات مفيدة، ألعاب؛ جانبياً: ملخص رحلتك، تحدي اليوم، ملاحظة المعلمة، بومة الإشعارات، دعم النطق، دقة الجمل، الشارات | `student, currentLesson, tasks, skillProgress, lessonVocab, usefulPhrases, games, badges` |
| `/path` | `pages/Path.jsx` | مساري: مجموعتي، خريطة المحطات المتموجة، الوحدة الحالية، مهامك الجارية، كل الوحدات (+ عرض الكل)، خطوتك التالية | `levels, stations, futureStations, healthUnit, lessonFlow, tasks` |
| `/unit` | `pages/Unit.jsx` | لوحة الوحدة: هيرو، فيديو تمهيدي (مودال)، الدروس، رحلة الدرس، أعمدة التقدم، الختامي، الأهداف/النواتج، المطبوعات | `healthUnit, lessonFlow, unitObjectives, myOutcomes, unitResources` |
| `/lesson` 🎯 | `pages/Lesson.jsx` | درس القراءة: نص حمدان + صح/خطأ + مشغل + أدوات (عبارات، بنك مفردات، نطق، قاعدة) + أدوات مساعدة | `hamdanText, lessonVocab, usefulPhrases, dialogueAudio, pronunciationAudio, selfCheck, activityOutcome` |
| `/activity/:type` 🎯 | `pages/Activity.jsx` | نشاط لكل مهارة: `listening / speaking (+عجلة المواضيع) / writing (+بنك العبارات) / reading / grammar / vocab→/game` | `usefulPhrases, dialogueAudio` |
| `/extra/:mode` 🎯 | `pages/Extra.jsx` | `support` («أحتاج مساعدة» — تلميح مفتوح) / `challenge` (مؤقت) | ثابت |
| `/exit-ticket` 🎯 | `pages/ExitTicket.jsx` | تذكرة الخروج + المزاج (😕 يُشعر المعلم) → يفتح الاختبار القصير | `exitTicket` |
| `/quiz/run` 🎯 | `pages/QuizRun.jsx` | الاختبار القصير — ميكس محركات، يمرّر `pct` الحي للنتيجة | `quizQuestions` |
| `/result` | `pages/Result.jsx` | النتيجة + **التوجيه التكيفي** `adaptivePlan(pct)` + إنجاز جديد (≥90) | `activityResult` (+ `location.state.pct`) |
| `/quiz` | `pages/QuizInstructions.jsx` | تعليمات الختامي — 4 مهارات بحالاتها | ثابت |
| `/exam` 🎯 | `pages/Exam.jsx` | الختامي بالمهارات الأربع (بلا صح/خطأ ظاهر) | `examSections, dialogueAudio` |
| `/exam/result` | `pages/ExamResult.jsx` | نتيجة الختامي (التحدث/الكتابة بانتظار المعلم) | `examResult` |
| `/certificate` | `pages/Certificate.jsx` | شهادة الوحدة — طباعة PDF | `student` |
| `/rubric` | `pages/Rubric.jsx` | معايير التقييم بعين الطالب | `rubric` |
| `/level-check` · `/question` 🎯 · `/result` | `pages/Level*.jsx` | تحديد المستوى (مجموعة فقط، بلا سلّم) | ثابت → `POST /placement` |
| `/skills` | `pages/SkillsHub.jsx` | مركز المهارات الأربع + رادار الاستماع | `skillProgress, skillsHub, skillFooters` |
| `/activities` | `pages/Activities.jsx` | أنشطتي بفلاتر | `activities` |
| `/reports` | `pages/Reports.jsx` | تقاريري: نظرة عامة (تقدمي عبر الوقت، أهداف، شارات، القوة/التحسين) / المهارات (رادار، قراءة) / الإنجازات / الملف | `reportKpis, progressOverTime, goals, strengths, improvements, recentActivity, …` |
| `/badges` | `pages/Badges.jsx` | الشارات: محققة / قيد التقدم / مقفلة (رمادية) / شهاداتي / متجر المكافآت | `earnedBadges, progressBadges, lockedBadges, certificates` |
| `/challenges` | `pages/Challenges.jsx` | التحديات والألعاب (مدمجة؛ `/games` يحوّل هنا) | `challenges, allGames, gameStats` |
| `/game` 🎯 | `pages/Game.jsx` | مطابقة المفردات | `lessonVocab` |
| `/game/wordsearch` 🎯 | `pages/WordSearch.jsx` | البحث عن الكلمات 9×9 | ثابت → `GET /games/wordsearch/{lessonId}` |
| `/library` · `/story` 🎯 | `pages/Library.jsx` · `pages/Story.jsx` | مكتبة القصص والقارئ | `stories, storyPages` |
| `/more` | `pages/More.jsx` | بطاقات المزيد | `moreLinks` |
| `/support` | `pages/Support.jsx` | موارد الدعم + التذاكر (نموذج يضيف فعلياً) | `supportResources, myTickets` |
| `/notifications` | `pages/Notifications.jsx` | الإشعارات (تحديد/مسح الكل → حالة فارغة) | `notifications` |
| `/portfolio` | `pages/Portfolio.jsx` | ملف أعمالي | `portfolioWorks` |
| `/calendar` | `pages/Calendar.jsx` | التقويم والمهام | `calendarEvents, todaySchedule, upcomingTasks` |
| `/feedback` | `pages/Feedback.jsx` | ملاحظات المعلم (قوة + خطوة تالية) | `teacherNotes, goals` |
| `/settings` | `pages/Settings.jsx` | الثيمات التسعة، الداكن، حجم الخط | localStorage → `PATCH /me/preferences` |
| `/engines` | `pages/Engines.jsx` | معرض 23 محرك سؤال حي (مواصفة محرر الأنشطة) | ثابت |
| `/test-builder` | `pages/TestBuilder.jsx` | معاينة مولّد الاختبارات (لوحة المعلم) | `BANK` → `GET /question-bank` |
| `*` | `pages/NotFound.jsx` | 404 بالبومة | — |

## المكوّنات المشتركة
- `components.jsx`: `Logo` (اللوغو الرسمي — أبيض/ملوّن بالهوفر)، `TopBar` (+ميغا مينيو ≤1100px)، `StatsBar`، `Ring`، `SecHead` (يدعم `to` / `onLink`)، `FooterStrip`، `Empty`.
- `sounds.js`: `clickSound/dingSound/buzzSound/winSound/tickSound/swooshSound` (Web Audio) + `playClip(src, rate)`.
- `fx.js`: طبقة التلعيب العامة (شرارات النقر + النقرة الصوتية).
- `toast.js`: `showToast(msg, emoji)`.
