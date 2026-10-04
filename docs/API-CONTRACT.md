# عقد الـAPI — لوحة الطالب «مسار العربية»

> **المبدأ:** ملف `src/data.js` هو مواصفة الـAPI حرفياً. كل `export` فيه = استجابة endpoint واحدة بالشكل نفسه.
> اربطوا الباك إند بحيث يعيد **نفس أسماء الحقول ونفس الأشكال**، وستعمل كل الشاشات بلا تعديل في المكوّنات.
> كل النصوص ثنائية اللغة: `ar` (أساسي) + `en` (صغير تحته). الصور مسارات نسبية تحت `/public`.

جميع المسارات المقترحة تحت `/api/v1/students/{studentId}/…` ما لم يُذكر غير ذلك. طرق القراءة `GET`، والكتابة موضّحة.

---

## 1) الهوية والتنقل

| الصادر في data.js | Endpoint مقترح | الشكل | ملاحظات |
|---|---|---|---|
| `student` | `GET /me` | `{ ar, en, first, level, nextLevel, levelPct, points, streak, notifications, teacher:{ar,en} }` | `points` نص منسّق «2,340» — أو رقم وتنسّقه الواجهة |
| `nav` | ثابت بالواجهة | `[{ to, ar, en, ico }]` | **8 عناصر بقرار العميل** — لا يُغيَّر من الباك إند |
| `moreLinks` | ثابت بالواجهة | `[{ ar, en, d, ico, to }]` | بطاقات صفحة «المزيد» |
| `levels` | `GET /me/levels` | `[{ ar, en, status:'done'\|'current'\|'locked', pct }]` | السلّم الخماسي — **الطالب يرى مجموعته فقط**؛ السلّم كاملاً للمعلم |

## 2) المسار والوحدات

| الصادر | Endpoint | الشكل | ملاحظات |
|---|---|---|---|
| `stations` | `GET /me/units` | `[{ ar, en, img, status, pct, meta, cta }]` | 6 وحدات المستوى الحالي؛ `status: locked` مع `meta:'بتكليف من معلمك'` = **الفتح بتكليف المعلم لا بتسلسل مقفل** |
| `futureStations` | `GET /me/units?scope=future` | نفس الشكل | تظهر عند «عرض الكل» |
| `healthUnit` | `GET /units/{unitId}` | `{ ar, en, stage, grade, img, desc, descEn, lessons:[{ n, ar, en, status, pct, img }] }` | الاسم تاريخي — يمثّل **الوحدة الجارية** |
| `currentLesson` | `GET /me/current-lesson` | `{ unitAr, unitEn, unitTag, lessonAr, lessonEn, pct, skills:[{ar,color,soft}] }` | بطاقة «تابع التعلّم» بالرئيسية |
| `unitObjectives` | `GET /units/{id}/objectives` | `[{ ar, en }]` | صيغة المعلم |
| `myOutcomes` | `GET /units/{id}/outcomes` | `[{ ar, en, done }]` | صيغة الطالب «أستطيع أن…» |
| `activityOutcome` | ضمن النشاط | `{ ar, en }` | يظهر كبانر فوق كل نشاط |
| `lessonFlow` | `GET /lessons/{id}/flow` | `[{ n, ar, en, status:'done'\|'current'\|'todo'\|'quiz', to }]` | **9 خطوات ثابتة بترتيب العميل** — الباك إند يغيّر `status` فقط |
| `unitResources` | `GET /units/{id}/resources` | `[{ ar, en, d, ico, url? }]` | المطبوعات — أضيفوا `url` للملف |
| `lessonSteps` | مرجعي | — | نسخة قديمة، يمكن حذفها |

## 3) محتوى الدرس (وحدة الاحتياجات والرغبات — من ملفات العميل)

| الصادر | Endpoint | الشكل | ملاحظات |
|---|---|---|---|
| `hamdanText` | `GET /lessons/{id}/reading` | `{ title, titleEn, paragraphs:[{ who, ar, en }], trueFalse:[{ s, correct }] }` | نص القراءة + مهمة صح/خطأ بمفتاحها |
| `lessonVocab` | `GET /lessons/{id}/vocab` | `[{ ar, en, img, audio }]` | بنك المفردات (4) — `audio` ملف نطق |
| `extraVocab` | `GET /lessons/{id}/vocab?scope=extra` | نفس الشكل | مفردات إضافية للألعاب |
| `usefulPhrases` | `GET /lessons/{id}/phrases` | `[{ ar, en, audio }]` | جمل «استمع وردد» بأصوات العميل |
| `pronunciationAudio` | ضمن الدرس | `string` | كلمة النطق التدريبي |
| `dialogueAudio` | ضمن الدرس | `string` | فقرة الاستماع الرئيسية (كل مشغلات الاستماع) |
| `selfCheck` | ضمن الدرس | `string[]` | بنود «تحقق من نفسك» |
| `stories` / `storyPages` | `GET /library` / `GET /stories/{id}` | `[{ ar, en, img, mins, words, tag, audio }]` / `[{ img, text, en, audio }]` | القارئ صفحة-صفحة |

## 4) التقييم — نوعان (قرار العميل)

| الصادر | Endpoint | الشكل | ملاحظات |
|---|---|---|---|
| `quizQuestions` | `GET /lessons/{id}/quiz` | `[{ type:'mcq'\|'listen'\|'order'\|'input', engine, skill, pts, q, qEn, …حسب النوع }]` | **الاختبار القصير** آخر كل درس، 10 درجات. الحقول حسب النوع: `mcq/listen`: `options[], correct, img?, audio?, passage?` · `order`: `words[], answer[]` · `input`: `accept[], model` · الكل: `explain` |
| — | `POST /lessons/{id}/quiz/attempts` | body `{ answers:[…] }` → `{ pct, correct, pts }` | **الواجهة تمرّر `pct` الحية لصفحة النتيجة عبر `location.state`** — نفس القيمة يجب أن تعود من هنا |
| `activityResult` | `GET /attempts/{id}/result` | `{ pct, verdict, verdictEn, time, correct, pts, mastered[], improve[], teacher:{name,img,note} }` | صفحة النتيجة |
| `examSections` | `GET /units/{id}/exam` | `[{ skill, title, passage?, passageEn?, audio?, record?, q, qEn, options?, correct? }]` | **الختامي** بالمهارات الأربع |
| `examResult` | `GET /units/{id}/exam/result` | `{ pct, perSkill:[{ skill, pct, note? }], … }` | التحدث والكتابة `note:'بانتظار تصحيح المعلم'` — **لا تصحيح آلي لهما** |
| `rubric` | `GET /rubrics/writing` | `{ criteria:[…], levels:[…] }` | 4×4 بعين الطالب |
| `exitTicket` | `GET /lessons/{id}/exit-ticket` | `{ q, options[], correct }` | + `POST …/exit-ticket` body `{ answer, mood:0\|1\|2 }` — **mood=2 يُشعر المعلم** |

### قواعد التكيف v1 (منفّذة بالواجهة في `Result.jsx` → `adaptivePlan(pct)`)
انقلوها للباك إند كما هي وأعيدوا `plan` مع النتيجة:
- `pct < 60` → `{ to:'/extra/support' }` نشاط دعم قبل المتابعة
- `60 ≤ pct < 90` → `{ to:'/lesson' }` متابعة
- `pct ≥ 90` → `{ to:'/extra/challenge' }` فتح التحدي + شارة «متقن للفهم»
- الشارة والكونفيتي **لا تُمنح تحت 90 / 60** على التوالي.
- الرئيسية: «مقترح لك اليوم» = أضعف مهارة في `skillProgress` (`Home.jsx → MySkills`).

## 5) المهارات والتقارير

| الصادر | Endpoint | الشكل |
|---|---|---|
| `SKILLS` | ثابت | خريطة المهارات الست بألوانها الثابتة `{ ar, en, color, ico }` — **الألوان ثابتة عبر المنصة** |
| `skillProgress` | `GET /me/skills` | `[{ skill, pct, verdict }]` |
| `skillsHub` | `GET /me/skills/{skill}/items` | `{ [skill]: [{ ar, en, type:'درس'\|'تدريب'\|'مهمة'\|'تحدي', mins, pct, status, img }] }` |
| `skillFooters` | ثابت | `{ [skill]: { ar, en } }` |
| `reportKpis` | `GET /me/reports/kpis` | `[{ ar, en, v, … }]` |
| `progressOverTime` | `GET /me/reports/progress` | `[{ m, en, v }]` — شهرياً |
| `goals` | `GET /me/goals` | `[{ ar, en, pct, skill }]` |
| `strengths` / `improvements` | `GET /me/reports/feedback` | `[{ ar, en }]` |
| `recentActivity` | `GET /me/activity?limit=4` | `[{ t, ar, en, c }]` |
| `skillDistribution` | `GET /me/reports/distribution` | `[{ … }]` |
| `tasks` | `GET /me/tasks/today` | `[{ ar, en, d, skill, done, of, color, soft, ico, cta, pink? }]` — **مرشّح أول للتوليد التكيفي** |
| `activities` | `GET /me/activities` | `[{ ar, en, d, skill, status, done, of, cta }]` |

## 6) التلعيب

| الصادر | Endpoint | الشكل |
|---|---|---|
| `badges` | `GET /me/badges?recent=3` | `[{ ar, en, img }]` |
| `earnedBadges` | `GET /me/badges?status=earned` | `[{ ar, en, img, date }]` |
| `progressBadges` | `GET /me/badges?status=progress` | `[{ ar, en, img, pct }]` |
| `lockedBadges` | `GET /badges?status=locked` | `[{ ar, en, img, how }]` — تُعرض رمادية |
| `certificates` | `GET /me/certificates` | `[{ ar, en, year, status:'earned'\|'locked', to?, how? }]` |
| `challenges` | `GET /me/challenges` | `[{ ar, en, d, en2, done, of, pts, color, ico }]` |
| `games` / `allGames` / `challengeGames` / `gameStats` | `GET /games` / `GET /me/games/stats` | `[{ ar, en, img, rate, to, cat? }]` / `[{ ar, en, ico, n }]` |
| لعبة البحث عن الكلمات | `GET /games/wordsearch/{lessonId}` | `{ grid: string[][], words:[{ w, color }] }` — حالياً ثابتة في `WordSearch.jsx` |
| عجلة المواضيع | ثابت في `Activity.jsx` | `[{ ar, e, c }]` |

## 7) التواصل والدعم

| الصادر | Endpoint | الشكل |
|---|---|---|
| `notifications` | `GET /me/notifications` + `POST …/read-all` + `DELETE …` | `[{ ar, en, t, type, read }]` |
| `teacherNotes` | `GET /me/feedback` | `[{ name, en, img, date, strengths, next }]` — **دائماً نقاط قوة + خطوة تالية** |
| `myTickets` | `GET/POST /me/tickets` | `[{ id, subject, status:'open'\|'replied'\|'closed', date, reply? }]` |
| `supportResources` | `GET /support/resources` | `[{ ar, en, d, ico }]` |
| `portfolioWorks` | `GET /me/portfolio` | `[{ ar, en, type, date, img }]` |
| `calendarEvents` / `todaySchedule` / `upcomingTasks` | `GET /me/calendar?month=` / `…/today` / `…/upcoming` | `[{ d, ar }]` / `[{ t, ar, st }]` / `[{ … }]` |

## 8) لوحة المعلم (معاينة داخل النموذج)

`src/pages/TestBuilder.jsx` يحتوي `BANK` — بنك أسئلة موسوم: `{ id, lo, skill, engine, lvl, pts, q }`.
هذا هو شكل بنك الأسئلة المطلوب: **كل سؤال موسوم بناتج التعلم (`lo` = كود LO.AR.x.x.x) والمهارة والمحرك والمستوى والدرجة** — وهو ما يجعل «توليد اختبار في ثوانٍ» مجرد فلترة:
`GET /question-bank?lo=&skill=&level=` → `[…]` و `POST /tests` body `{ questionIds[], classId }`.

## 9) تفضيلات المستخدم (localStorage اليوم → ملف الطالب غداً)

| المفتاح | القيم | Endpoint مقترح |
|---|---|---|
| `masar-theme` | `pink/purple/coral/gold/emerald/teal/sky/indigo` (الافتراضي blue) | `PATCH /me/preferences { theme }` |
| `masar-mode` | `dark` | `PATCH /me/preferences { mode }` |
| `masar-fs` | `sm/lg` | `PATCH /me/preferences { fontSize }` |

تُقرأ قبل الرسم في `src/main.jsx` — عند الربط: احقنوها في `<html data-theme data-mode data-fs>` من الـSSR أو من أول استجابة `/me`.

## 10) إضافات 2026-09-27 (شارتات + محرك الكتابة اليدوية)

| مصدر البيانات اليوم | Endpoint مقترح | الشكل |
|---|---|---|
| `SPARKS` في `src/Sparkline.jsx` (30 قيمة لكل مهارة) | `GET /me/skills/{skill}/daily?days=30` | `[{ date:'YYYY-MM-DD', pct:0-100 }]` — تظهر في كروت «مهاراتي الأربع» بالرئيسية وبصفحة مهاراتي (موجة ناعمة + تولتيب بالهوفر) |
| `ACCURACY_BY_SKILL` في `src/pages/Reports.jsx` | `GET /me/skills/{skill}/accuracy` | `{ correct:83, wrong:17, label:'دقة عالية' }` — **صحيح/خطأ فقط، لا فئة «قيد التحسن»** والمجموع 100 |
| `RANGES`/`progressOverTime` في `src/pages/Reports.jsx` | `GET /me/progress?range=week\|month\|term\|year` | `[{ label, en, v }]` |
| `ARABIC_LETTERS` + `letterSkeleton()` في `src/pages/Engines.jsx` | لا يحتاج API | مسار الحرف المنقط يُولَّد في المتصفح من خط الواجهة (تنحيف Zhang-Suen). حرف «ع» له مسار يدوي `TRACE_PATH`. لو أراد العميل مسارات مدرسية دقيقة: `GET /handwriting/{letter}` → `{ path:'M…', arrows:[{x,y,r}] }` بنفس صندوق 560×220 |
| الفيديو التمهيدي `public/media/unit-intro.mp4` | حقل `introVideo` في `GET /units/{id}` | رابط mp4 — يُعرض بمودال مركزي (portal على body) |

ملاحظة: كل الشارتات SVG مكتوبة يدوياً بدون مكتبات؛ أي بيانات جديدة تُمرَّر كمصفوفة أرقام فقط.

---

## ملاحظات للربط
1. **ابدؤوا بـ `/me`, `/me/units`, `/units/{id}`, `/lessons/{id}/*`, `/lessons/{id}/quiz`** — هذه تشغّل الفلو الأساسي كاملاً.
2. لا تغيّروا أسماء الحقول؛ أي حقل إضافي يتجاهله الفرونت بأمان.
3. الوسائط (`img`, `audio`) روابط مطلقة أو نسبية — الفرونت يمررها لـ`<img>`/`new Audio()` مباشرة.
4. الأصوات تُشغَّل عبر `playClip(src, rate)` في `src/sounds.js` (مقطع واحد بكل لحظة + سرعة).
5. التوليد التكيفي للمهام والاقتراحات ينتقل للباك إند تدريجياً؛ الواجهة تعرض ما يصلها.
