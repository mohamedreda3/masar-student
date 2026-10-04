/* بيانات وهمية موحّدة — نفس شخصية V4 (أحمد العلي) */
export const student = {
  ar: 'أحمد العلي', en: 'Ahmed Al Ali · Student',
  first: 'أحمد',
  level: 5, nextLevel: 6, levelPct: 72,
  points: '2,340', streak: 7, notifications: 3,
  teacher: { ar: 'أ. نورة السالم', en: "Ms. Noura Al Salem" },
};

export const nav = [
  { to: '/',          ar: 'الرئيسية',  en: 'Home',          ico: '🏠' },
  { to: '/path',      ar: 'مساري',     en: 'My Path',       ico: '🗺️' },
  { to: '/activities',ar: 'أنشطتي',    en: 'My Activities', ico: '✏️' },
  { to: '/skills',    ar: 'مهاراتي',   en: 'My Skills',     ico: '🎯' },
  { to: '/reports',   ar: 'تقاريري',   en: 'My Reports',    ico: '📊' },
  { to: '/badges',    ar: 'الشارات',   en: 'Badges',        ico: '🏅' },
  { to: '/challenges',ar: 'التحديات والألعاب', en: 'Challenges & Games', ico: '🎮' },
  { to: '/more',      ar: 'المزيد',    en: 'More',          ico: '✨' },
];

export const currentLesson = {
  unitAr: 'الاحتياجات والرغبات', unitEn: 'Needs & Wants', unitTag: 'الوحدة 1',
  lessonAr: 'الدرس الأول – احتياجاتنا ورغباتنا', lessonEn: 'Lesson 1 — Our Needs and Wants',
  pct: 67,
  skills: [
    { ar: 'القراءة',  color: 'var(--blue)',  soft: 'var(--blue-soft)' },
    { ar: 'الاستماع', color: 'var(--teal)',  soft: '#e0f4f8' },
    { ar: 'المفردات', color: 'var(--green)', soft: 'var(--green-soft)' },
  ],
};

export const tasks = [
  {
    ar: 'تدريب استماع', en: 'Listening Practice', d: 'فقرة روتيني اليومي', skill: 'listening',
    done: 3, of: 5, color: 'var(--teal)', soft: '#e0f4f8', ico: '/img/headphones.png', cta: 'تابع',
  },
  {
    ar: 'مهمة تحدث', en: 'Speaking Task', d: 'جمل استمع وردِّد', skill: 'speaking',
    done: 1, of: 4, color: 'var(--orange)', soft: 'var(--orange-soft)', ico: '/img/mic.png', cta: 'تابع',
  },
  {
    ar: 'مهمة كتابة', en: 'Writing Task', d: 'حاجاتي ورغباتي', skill: 'writing',
    done: 0, of: 3, color: 'var(--pink)', soft: 'var(--pink-soft)', ico: '/img/pencil.png', cta: 'ابدأ', pink: true,
  },
];

/* ألعاب الرئيسية — كل بطاقة تفتح لعبتها الفعلية */
export const games = [
  { ar: 'مطابقة المفردات',   en: 'Vocabulary Match', img: '/img/scene-cards.png',    rate: 4.8, to: '/game' },
  { ar: 'البحث عن الكلمات',  en: 'Word Search',      img: '/img/needs-words.png',    rate: 4.9, to: '/game/wordsearch' },
  { ar: 'عجلة المواضيع',     en: 'Topic Wheel',      img: '/img/scene-discover.png', rate: 4.7, to: '/activity/speaking' },
  { ar: 'اختر قصة',          en: 'Choose a Story',   img: '/img/scene-story.png',    rate: 4.6, to: '/library' },
];

export const badges = [
  { ar: 'متعلّم نشط',   en: 'Active Learner',     img: '/img/badge-active.png' },
  { ar: 'قارئ متميّز',  en: 'Star Reader',        img: '/img/badge-reader.png' },
  { ar: 'بطل الاستماع', en: 'Listening Champion', img: '/img/badge-listen.png' },
];

/* سلّم مساري الخماسي — فلو الوحدات (رسمة العميل) */
export const levels = [
  { ar: 'المبتدئ', en: 'Beginner',   status: 'done',    pct: 100 },
  { ar: 'الناشئ',  en: 'Emerging',   status: 'done',    pct: 100 },
  { ar: 'المتطور', en: 'Developing', status: 'current', pct: 40 },
  { ar: 'المتقدم', en: 'Expanding',  status: 'locked',  pct: 0 },
  { ar: 'المتقن',  en: 'Advanced',   status: 'locked',  pct: 0 },
];

/* وحدات المسار — من مجلد تخطيط العميل الفعلي (ثيم الهوية والعائلة + الاحتياجات) */
export const stations = [
  { ar: 'التحية والتعارف',       en: 'Greetings & Introductions', img: '/media/units/friend.png',   status: 'done',    pct: 100, meta: 'أتقنت كل الدروس', cta: 'راجع' },
  { ar: 'الأسرة والأصدقاء',      en: 'Family & Friends',          img: '/media/units/family.png',   status: 'done',    pct: 100, meta: 'أتقنت كل الدروس', cta: 'راجع' },
  { ar: 'أعرف عن نفسي',          en: 'Introducing Myself',        img: '/media/units/introduce.png', status: 'done',   pct: 100, meta: 'أتقنت كل الدروس', cta: 'راجع' },
  { ar: 'الاحتياجات والرغبات',   en: 'Needs & Wants',             img: '/img/scene-needs.png',      status: 'current', pct: 40,  meta: 'أنجزت درساً من 3', cta: 'تابع' },
  { ar: 'صديقي المفضل',          en: 'My Best Friend',            img: '/media/units/bestfriend.png', status: 'locked', pct: 0,  meta: 'بتكليف من معلمك',  cta: 'مقفلة' },
  { ar: 'علاقاتنا الأسرية وأصدقاؤنا', en: 'Family Relations & Friends', img: '/media/units/family-relations.png', status: 'locked', pct: 0, meta: 'بتكليف من معلمك', cta: 'مقفلة' },
];

/* وحدات السنوات القادمة — من مجلد تخطيط العميل، تظهر عند «عرض الكل» */
export const futureStations = [
  { ar: 'كل شيء عني',              en: 'All About Me',                  img: '/media/units/allaboutme.png',  status: 'locked', pct: 0, meta: 'سنة قادمة', cta: 'مقفلة' },
  { ar: 'علاقاتي الاجتماعية',      en: 'My Social Relationships',       img: '/media/units/mother.png',      status: 'locked', pct: 0, meta: 'سنة قادمة', cta: 'مقفلة' },
  { ar: 'التواصل بين الأجيال',     en: 'Communication Across Generations', img: '/media/units/father.png',   status: 'locked', pct: 0, meta: 'سنة قادمة', cta: 'مقفلة' },
];

/* الوحدة الحالية: الاحتياجات والرغبات — من ملفات العميل الفعلية (Grade 6 · Year 7 · Developing)
   (الاسم healthUnit تاريخي — يشير الآن للوحدة الجارية) */
export const healthUnit = {
  ar: 'الاحتياجات والرغبات', en: 'Needs & Wants',
  stage: 'Year 7', grade: 'الصف السادس · Grade 6',
  img: '/img/scene-needs.png',
  desc: 'تميّز بين ما تحتاجه وما تريده، وتفهم لماذا نحتاج إلى بعض الأشياء في حياتنا اليومية.',
  descEn: 'Distinguish between needs and wants, and understand why we need certain things in daily life.',
  lessons: [
    { n: 1, ar: 'احتياجاتنا ورغباتنا', en: 'Our Needs and Wants',   status: 'current', pct: 67, img: '/img/scene-needs.png' },
    { n: 2, ar: 'حوار الحاجات والرغبات', en: 'Needs & Wants Roleplay', status: 'locked', pct: 0, img: '/media/needs/fc-8.png' },
    { n: 3, ar: 'أخطط لكتابتي',        en: 'I Plan My Writing',     status: 'locked',  pct: 0,  img: '/media/needs/fc-20.png' },
  ],
};

/* الأهداف المحورية للوحدة (صيغة المعلم) + نواتج التعلم (صيغة الطالب) — عربي/إنكليزي */
export const unitObjectives = [
  { ar: 'أن يقرأ الطالب نصاً وحواراً قصيرين عن الحاجات والرغبات ويميز بين ما يحتاجه وما يريده', en: 'Read a short text and dialogue about needs and wants and distinguish needs from wants' },
  { ar: 'أن يستخرج الطالب معلومات مباشرة من النص ويجيب عن أسئلة صح/خطأ وإكمال الفراغات', en: 'Retrieve direct information and answer true/false and fill-in-the-blank questions' },
  { ar: 'أن يستخدم الطالب مفردات الموضوع في جمل قصيرة مع سبب بسيط (لـ / لأن)', en: 'Use topic vocabulary in short sentences with a simple reason (to / because)' },
];
export const myOutcomes = [
  { ar: 'أستطيع قراءة نص قصير عن الحاجات والرغبات وفهم الفكرة العامة', en: 'I can read a short text about needs and wants and understand the main idea', done: true },
  { ar: 'أستطيع فهم لماذا نحتاج إلى الماء والهواء والطعام', en: 'I can understand why we need water, air, and food', done: true },
  { ar: 'أستطيع التمييز بين الحاجات والرغبات في مواقف الحياة اليومية', en: 'I can distinguish between needs and wants in daily life', done: false },
  { ar: 'أستطيع إكمال الجمل بكلمات مناسبة من صندوق الكلمات', en: 'I can complete sentences with suitable words from the word bank', done: false },
];
export const activityOutcome = { ar: 'أستطيع التمييز بين الحاجات والرغبات وفهم لماذا نحتاج إلى بعض الأشياء', en: 'I can distinguish between needs and wants and understand why we need things' };

/* التسلسل داخل الدرس — بترتيب العميل المحدّث (2026-08-31):
   الدعم لم يعد خطوة — صار زر «أحتاج مساعدة» داخل المهارات الأربع */
export const lessonFlow = [
  { n: 1, ar: 'هيا نبدأ',        en: "Let's Start", status: 'done',    to: '/lesson' },
  { n: 2, ar: 'المعجم اللغوي',   en: 'Vocabulary',  status: 'done',    to: '/activity/vocab' },
  { n: 3, ar: 'مهارة الاستماع',  en: 'Listening',   status: 'done',    to: '/activity/listening' },
  { n: 4, ar: 'مهارة القراءة',   en: 'Reading',     status: 'current', to: '/lesson' },
  { n: 5, ar: 'مهارة التحدث',    en: 'Speaking',    status: 'todo',    to: '/activity/speaking' },
  { n: 6, ar: 'مهارة الكتابة',   en: 'Writing',     status: 'todo',    to: '/activity/writing' },
  { n: 7, ar: 'أنشطة التحدي',    en: 'Challenge',   status: 'todo',    to: '/extra/challenge' },
  { n: 8, ar: 'تذكرة الخروج',    en: 'Exit Ticket', status: 'todo',    to: '/exit-ticket' },
  { n: 9, ar: 'اختبار قصير', en: 'Quick Quiz · 10', status: 'quiz',    to: '/quiz/run' },
];

/* مصادر الوحدة للطباعة — طلب العميل الصوتي */
export const unitResources = [
  { ar: 'خطة الوحدة',            en: 'Unit Plan · صفحتان',      d: 'الأهداف، المحتوى، نواتج التعلم', ico: '/img/scroll.png' },
  { ar: 'أوراق عمل',             en: 'Worksheets · PDF',        d: 'تدريبات ورقية لكل درس',          ico: '/img/clipboard.png' },
  { ar: 'بطاقات مفردات للطباعة', en: 'Printable Flashcards',    d: 'بطاقات الوحدة المصوّرة',          ico: '/img/flashcards.png' },
  { ar: 'دليل الألعاب الصفية',   en: 'Class Games Guide',       d: 'أنشطة جماعية داخل الصف',          ico: '/img/gamepad.png' },
];

/* ---------------- أنشطتي ---------------- */
export const activities = [
  { ar: 'تدريب استماع', en: 'Listening Practice', d: 'فقرة روتيني اليومي',      skill: 'listening', status: 'جارية',  done: 3,  of: 5,  cta: 'تابع' },
  { ar: 'مهمة تحدث',    en: 'Speaking Task',      d: 'جمل استمع وردِّد',     skill: 'speaking',  status: 'جارية',  done: 1,  of: 4,  cta: 'تابع' },
  { ar: 'مهمة كتابة',   en: 'Writing Task',       d: 'حاجاتي ورغباتي',    skill: 'writing',   status: 'قادمة',  done: 0,  of: 3,  cta: 'ابدأ' },
  { ar: 'نشاط قراءة',   en: 'Reading Activity',   d: 'نص حمدان: الحاجات والرغبات',   skill: 'reading',   status: 'مكتملة', done: 6,  of: 6,  cta: 'راجع' },
  { ar: 'تدريب مفردات', en: 'Vocabulary Drill',   d: 'كلمات المطعم',        skill: 'vocab',     status: 'جارية',  done: 8,  of: 10, cta: 'تابع' },
  { ar: 'تدريب قواعد',  en: 'Grammar Practice',   d: 'صيغة الطلب المهذّب',  skill: 'grammar',   status: 'مكتملة', done: 4,  of: 4,  cta: 'راجع' },
];

export const SKILLS = {
  reading:   { ar: 'القراءة',  en: 'Reading',    color: '#2563eb', ico: '/img/book.png' },
  listening: { ar: 'الاستماع', en: 'Listening',  color: '#0891b2', ico: '/img/headphones.png' },
  writing:   { ar: 'الكتابة',  en: 'Writing',    color: '#db2777', ico: '/img/pencil.png' },
  speaking:  { ar: 'التحدث',   en: 'Speaking',   color: '#ea580c', ico: '/img/mic.png' },
  vocab:     { ar: 'المفردات', en: 'Vocabulary', color: '#16a34a', ico: '/img/flashcards.png' },
  grammar:   { ar: 'القواعد',  en: 'Grammar',    color: '#7c3aed', ico: '/img/book.png' },
};

export const skillDistribution = [
  { skill: 'listening', n: 5 }, { skill: 'speaking', n: 3 }, { skill: 'writing', n: 4 },
  { skill: 'reading', n: 6 }, { skill: 'vocab', n: 8 }, { skill: 'grammar', n: 4 },
];

/* ---------------- ألعابي ---------------- */
export const allGames = [
  { ar: 'لعبة البطاقات', en: 'Card Match',     img: '/img/scene-cards.png',    rate: 4.8, cat: 'مفردات' },
  { ar: 'اختر قصة',      en: 'Choose a Story', img: '/img/scene-story.png',    rate: 4.9, cat: 'استماع' },
  { ar: 'اكتشف المزيد',  en: 'Discover More',  img: '/img/scene-discover.png', rate: 4.7, cat: 'مفردات' },
  { ar: 'في السوق',      en: 'At the Market',  img: '/img/scene-market.png',   rate: 4.6, cat: 'مفردات' },
  { ar: 'رحلة الحديقة',  en: 'Garden Trip',    img: '/img/scene-garden.png',   rate: 4.7, cat: 'استماع' },
  { ar: 'في المزرعة',    en: 'On the Farm',    img: '/img/scene-farm.png',     rate: 4.5, cat: 'قواعد' },
];
export const gameStats = [
  { n: 24,  ar: 'ألعاب لعبتها', en: 'Games Played', ico: '/img/target.png' },
  { n: 4.9, ar: 'أعلى تقييم',   en: 'Top Rated',    ico: '/img/badge-reader.png' },
  { n: 480, ar: 'نقاط مكتسبة',  en: 'Points Earned', ico: '/img/points.png' },
];

/* ---------------- تقاريري ---------------- */
export const reportKpis = [
  { ar: 'ساعات التعلم',    en: 'This Month',       n: '18.5', sub: 'ساعة',      delta: '+16% عن الشهر', ico: '/img/clipboard.png' },
  { ar: 'المهام المكتملة', en: 'Completed Tasks',  n: '27',   sub: 'من أصل 36', delta: '+15% عن الماضي', ico: '/img/clipboard.png' },
  { ar: 'نسبة التقدم',     en: 'Overall Progress', n: '68%',  sub: '',          delta: '+8% عن الماضي',  ico: '/img/target.png' },
  { ar: 'النقاط المكتسبة', en: 'Points Earned',    n: '320',  sub: 'نقطة',      delta: '+22% عن الماضي', ico: '/img/points.png' },
];
export const skillProgress = [
  { skill: 'reading',   pct: 72, verdict: 'جيد' },
  { skill: 'listening', pct: 65, verdict: 'جيد' },
  { skill: 'speaking',  pct: 58, verdict: 'يحتاج تطوير' },
  { skill: 'writing',   pct: 77, verdict: 'جيد جداً' },
];
export const goals = [
  { ar: 'تحسين مهارة القراءة',  en: 'Improve reading skills',    pct: 80, skill: 'reading' },
  { ar: 'الاستماع للتفاصيل',    en: 'Listen for details',        pct: 60, skill: 'listening' },
  { ar: 'التحدث بطلاقة',        en: 'Speak more fluently',       pct: 40, skill: 'speaking' },
  { ar: 'كتابة فقرات كاملة',    en: 'Write complete paragraphs', pct: 70, skill: 'writing' },
];
export const strengths = [
  { ar: 'فهم الأفكار الرئيسية',      en: 'Understanding main ideas' },
  { ar: 'استخدام المفردات الجديدة',  en: 'Using new vocabulary' },
  { ar: 'تنظيم الأفكار في الكتابة',  en: 'Organizing ideas in writing' },
];
export const improvements = [
  { ar: 'الاستماع للتفاصيل',          en: 'Listening for details' },
  { ar: 'التحدث بطلاقة أكبر',         en: 'Speaking fluency' },
  { ar: 'استخدام القواعد في الكتابة', en: 'Using grammar in writing' },
];
export const progressOverTime = [
  { m: 'نوفمبر', en: 'Nov', v: 40 }, { m: 'ديسمبر', en: 'Dec', v: 45 }, { m: 'يناير', en: 'Jan', v: 52 },
  { m: 'فبراير', en: 'Feb', v: 58 }, { m: 'مارس', en: 'Mar', v: 62 }, { m: 'أبريل', en: 'Apr', v: 67 },
  { m: 'مايو', en: 'May', v: 65 },
];
export const recentActivity = [
  { t: 'اليوم',     ar: 'أكملت واجب الاستماع اليومي', en: 'Completed Listening Homework', c: 'var(--green)' },
  { t: 'أمس',       ar: 'حصلت على شارة قارئ ممتاز',   en: 'Earned badge: Great Reader',   c: 'var(--gold)' },
  { t: 'قبل يومين', ar: 'سلّمت مشروع يوم في حياتي',   en: 'Submitted: A Day in My Life',  c: 'var(--blue)' },
  { t: 'قبل 3 أيام', ar: 'كتبت فقرة عن هوايتي',       en: 'Wrote about my hobby',         c: 'var(--pink)' },
];

/* ---------------- الشارات ---------------- */
export const earnedBadges = [
  { ar: 'متعلّم نشط',       en: 'Active Learner',      img: '/img/badge-active.png', date: 'مايو 18' },
  { ar: 'بطل الاستمرارية',  en: 'Consistency',         img: '/img/badge-listen.png', date: 'مايو 14' },
  { ar: 'مركّز ومثابر',     en: 'Focused & Persistent', img: '/img/badge-reader.png', date: 'مايو 10' },
  { ar: 'معاون رائع',       en: 'Great Helper',        img: '/img/shield.png',       date: 'مايو 05' },
];
export const progressBadges = [
  { ar: 'كاتب مبدع',    en: 'Creative Writer',   img: '/img/shield.png',       pct: 65 },
  { ar: 'متحدث واثق',   en: 'Confident Speaker', img: '/img/badge-listen.png', pct: 40 },
  { ar: 'قارئ متميّز',  en: 'Star Reader',       img: '/img/badge-reader.png', pct: 25 },
];
/* الشارات المقفلة — تظهر رمادية حتى يحققها الطالب (أسماء مجموعة شارات كنان الجديدة) */
export const lockedBadges = [
  { ar: 'بطل الاستماع',       en: 'Listening Champion',        img: '/img/badge-listen.png', how: 'أكمل 10 أنشطة استماع بدقة 90٪' },
  { ar: 'متمكن في الكتابة',   en: 'Writing Master',            img: '/img/pencil.png',       how: 'سلّم 5 مهام كتابة بتقييم ممتاز' },
  { ar: 'متمكن في القواعد',   en: 'Grammar Master',            img: '/img/book.png',         how: 'أتقن 8 قواعد لغوية' },
  { ar: 'مستكشف المفردات',    en: 'Vocabulary Explorer',       img: '/img/flashcards.png',   how: 'تعلّم 100 كلمة جديدة' },
  { ar: 'بطل التحديات',       en: 'Challenge Champion',        img: '/img/trophy.png',       how: 'أكمل 5 تحديات أسبوعية' },
  { ar: 'مستكشف كنوز المعرفة', en: 'Knowledge Treasure Hunter', img: '/img/gift.png',        how: 'افتح 3 صناديق معرفة' },
  { ar: 'الدرجة الكاملة',     en: 'Perfect Score',             img: '/img/star.png',         how: 'حقق 10/10 في اختبار قصير' },
  { ar: 'المنجز السريع',      en: 'Fast Finisher',             img: '/img/stopwatch.png',    how: 'أنهِ درساً كاملاً في يوم واحد' },
  { ar: 'المتعلم الفضولي',    en: 'Curious Learner',           img: '/img/lamp.png',         how: 'افتح 10 تلميحات وترجمات' },
  { ar: 'لاعب الفريق',        en: 'Team Player',               img: '/img/puzzle.png',       how: 'شارك في نشاط جماعي صفي' },
  { ar: 'نجم التطور',         en: 'Improvement Star',          img: '/img/target2.png',      how: 'ارفع نتيجتك 15٪ بين اختبارين' },
];
/* شهاداتي — سنوات سابقة محققة + الحالية + مقفلة قادمة */
export const certificates = [
  { ar: 'شهادة إتمام وحدة الصحة',        en: 'Health Unit Certificate',        year: 'هذه السنة · Year 7',   status: 'earned', to: '/certificate' },
  { ar: 'شهادة نهاية السنة الثالثة',      en: 'Year 3 Completion',             year: '2024–2025',            status: 'earned' },
  { ar: 'شهادة أفضل قارئ في الصف',        en: 'Best Reader Award',             year: '2024–2025',            status: 'earned' },
  { ar: 'شهادة نهاية السنة الثانية',      en: 'Year 2 Completion',             year: '2023–2024',            status: 'earned' },
  { ar: 'شهادة وحدة الاحتياجات والرغبات', en: 'Needs & Wants Unit Certificate', year: 'الوحدة الجارية',      status: 'locked', how: 'أكمل الاختبار الختامي للوحدة' },
  { ar: 'شهادة نهاية السنة الرابعة',      en: 'Year 4 Completion',             year: 'نهاية هذه السنة',      status: 'locked', how: 'أكمل وحدات السنة الست' },
];

/* ---------------- التحديات ---------------- */
export const challenges = [
  { ar: 'تحدي المفردات اليومي', en: 'Daily Vocabulary',      d: 'أكمل 15 كلمة جديدة هذا الأسبوع', en2: 'Learn 15 new words this week',       done: 12, of: 15, pts: 200, color: 'var(--brand)',  ico: '/img/flashcards.png' },
  { ar: 'تحدي التركيز',         en: 'Focus Challenge',       d: 'أجب بدقة 90% على 20 سؤالاً',      en2: 'Answer 20 questions with 90% accuracy', done: 14, of: 20, pts: 250, color: 'var(--green)',  ico: '/img/target.png' },
  { ar: 'تحدي الاستمرارية',     en: 'Consistency Challenge', d: 'حافظ على سلسلة إنجاز 7 أيام',     en2: 'Keep a 7-day streak',                 done: 5,  of: 7,  pts: 230, color: 'var(--orange)', ico: '/img/flame.png' },
];
export const challengeGames = [
  { ar: 'كلمة سريعة',    en: 'Word Sprint',        img: '/img/scene-cards.png',    rate: 4.8 },
  { ar: 'مغامرة القواعد', en: 'Grammar Quest',      img: '/img/scene-discover.png', rate: 4.7 },
  { ar: 'كنوز المعرفة',  en: 'Knowledge Treasures', img: '/img/scene-story.png',    rate: 4.9 },
  { ar: 'ألغاز المنطق',  en: 'Logic Puzzles',       img: '/img/scene-market.png',   rate: 4.6 },
];

/* ---------------- المزيد ---------------- */
export const moreLinks = [
  { ar: 'موارد الدعم',       en: 'Support Resources', d: 'أدوات ومواد تساعدك على التعلّم', ico: '/img/book.png',       to: '/support' },
  { ar: 'الإشعارات',         en: 'Notifications',     d: 'كل جديد يخصّك',                  ico: '/img/bell.png',       to: '/notifications' },
  { ar: 'ملف أعمالي',        en: 'My Portfolio',      d: 'كتاباتك وتسجيلاتك ومشاريعك',     ico: '/img/clipboard.png',  to: '/portfolio' },
  { ar: 'التقويم والمهام',   en: 'Calendar & Tasks',  d: 'مواعيد التسليم والاختبارات',     ico: '/img/clipboard.png',  to: '/calendar' },
  { ar: 'ملاحظات المعلم',    en: 'Teacher Feedback',  d: 'تعليقات وتوجيهات على مهامك',     ico: '/img/teacher.png',    to: '/feedback' },
  { ar: 'حسابي والإعدادات',  en: 'Account & Settings', d: 'بياناتك وتفضيلاتك',             ico: '/img/gear.png',       to: '/settings' },
  { ar: 'تحديد المستوى',     en: 'Level Check',        d: 'قيّم مستواك لتبدأ من المكان الصحيح', ico: '/img/target2.png', to: '/level-check' },
  { ar: 'مركز المهارات',     en: 'Skills Hub',         d: 'مهاراتك الأربع بدروسها وتحدياتها',   ico: '/img/target.png',  to: '/skills' },
  { ar: 'محركات الأسئلة',    en: 'Question Engines',   d: '23 نوع سؤال تفاعلي — جرّبها كلها',   ico: '/img/puzzle.png',  to: '/engines' },
];

/* أدوات الدرس — مطالب العميل المؤشَّرة */
/* العبارات المفيدة — جمل «استمع وردد» بأصوات العميل الأصلية من ملفات الوحدة */
export const usefulPhrases = [
  { ar: 'أشربُ الماءَ لأحافظَ على صحّتي',  en: 'I drink water to stay healthy',      audio: '/media/needs/phrase-water.mp3' },
  { ar: 'أقرأُ الكتبَ لأتعلّم',            en: 'I read books to learn',              audio: '/media/needs/phrase-books.mp3' },
  { ar: 'أستخدمُ المالَ لشراءِ حاجاتي',    en: 'I use money to buy my needs',        audio: '/media/needs/phrase-money.mp3' },
  { ar: 'أتناولُ الدواءَ عندما أمرض',      en: 'I take medicine when I am sick',     audio: '/media/needs/phrase-medicine.mp3' },
];
/* صوت النطق التدريبي — كلمة الدرس */
export const pronunciationAudio = '/media/needs/w-air.wav';
/* بنك مفردات الدرس — كلمات وصور العميل من بطاقات الوحدة */
export const lessonVocab = [
  { ar: 'الماء',   en: 'Water',    img: '/media/needs/fc-19.png', audio: '/media/needs/w-water.wav' },
  { ar: 'الطعام',  en: 'Food',     img: '/media/needs/fc-3.png',  audio: '/media/needs/w-food.wav' },
  { ar: 'الكتب',   en: 'Books',    img: '/media/needs/fc-20.png', audio: '/media/needs/w-books.wav' },
  { ar: 'الهاتف',  en: 'Phone',    img: '/media/needs/fc-8.png',  audio: '/media/needs/w-phone.wav' },
];
/* المفردات الموسعة — للعبة المطابقة وأنشطة إضافية */
export const extraVocab = [
  { ar: 'المال',    en: 'Money',    img: '/media/needs/fc-13.png', audio: '/media/needs/w-money.wav' },
  { ar: 'الدواء',   en: 'Medicine', img: '/media/needs/fc-21.png', audio: '/media/needs/w-medicine.wav' },
  { ar: 'الملابس',  en: 'Clothes',  img: '/media/needs/fc-18.png', audio: '/media/needs/w-clothes.wav' },
  { ar: 'الهواء',   en: 'Air',      img: '/media/needs/fc-10.png', audio: '/media/needs/w-air.wav' },
];
/* الصوت الرئيسي لمشغلات الاستماع — فقرة العميل الأصلية (روتيني اليومي) */
export const dialogueAudio = '/media/needs/listen-t3-paragraph.mp3';

/* نص حمدان — درس القراءة من ملف العميل الفعلي */
export const hamdanText = {
  title: 'الحاجاتُ والرغباتُ في حياةِ حمدان',
  titleEn: "Needs and Wants in Hamdan's Life",
  paragraphs: [
    { who: '👦 حمدان', ar: 'تحياتي، اسمي حمدان، وأنا أعيشُ في دبي في منطقةِ ند الشبا. كلَّ يومٍ أحتاجُ إلى الهواءِ لأتنفّس، وأحتاجُ إلى الماءِ لأشرب، وأحتاجُ إلى الطعامِ لأحافظَ على صحّتي. كما أحتاجُ أحياناً إلى المالِ لأشتريَ حاجاتي اليومية، مثل الدواءِ أو الحذاءِ المدرسي.', en: 'My name is Hamdan, I live in Dubai in Nad Al Sheba. Every day I need air to breathe, water to drink, and food to stay healthy. Sometimes I need money for daily needs like medicine or school shoes.' },
    { who: '👧 مايا', ar: 'أختي مايا تحبُّ الذهابَ إلى السوقِ مع أمّي. هي تحتاجُ إلى المالِ لتشتريَ طعاماً لذيذاً مثل الفواكهِ والساندويتش، وأحياناً تشتري ملابسَ جديدةً مثل فستانٍ أو قميصٍ أو بنطال.', en: 'My sister Maya loves going to the market with Mum. She needs money to buy tasty food like fruits and sandwiches, and sometimes buys new clothes.' },
    { who: '👩 الأم', ar: 'أمّي تحبُّ القراءةَ كثيراً؛ لذلك تحتاجُ إلى المالِ لتشتريَ الكتبَ والقصصَ المفيدة. هي تقولُ إنّ القراءةَ تساعدُ العقلَ على التفكيرِ والتعلُّم.', en: 'Mum loves reading, so she needs money to buy useful books and stories. She says reading helps the mind think and learn.' },
    { who: '👨 الأب', ar: 'أمّا أبي فيعملُ في شركةٍ، ويحتاجُ أحياناً إلى السفرِ من أجلِ العملِ وحضورِ الاجتماعات. لذلك يشتري تذكرةَ سفرٍ، ويستعدُّ لرحلتِهِ بحقيبةٍ صغيرة.', en: 'Dad works in a company and sometimes needs to travel for work and meetings. So he buys a ticket and packs a small bag.' },
  ],
  /* المهمة الأولى — صح أم خطأ (بمفتاح إجابات العميل) */
  trueFalse: [
    { s: 'يعيشُ حمدان في دبي في منطقةِ ند الشبا', correct: true },
    { s: 'مايا تحتاجُ إلى المالِ لتشتريَ الكتبَ فقط', correct: false },
    { s: 'أبُ حمدان يسافرُ أحياناً من أجلِ العمل', correct: true },
  ],
};
export const selfCheck = [
  'قرأت نص حمدان كاملاً',
  'ميّزت بين الحاجة والرغبة',
  'فهمت لماذا نحتاج إلى الماء والهواء',
  'أكملت الجمل من صندوق الكلمات',
];

/* ---------------- الاختبار الختامي — قسم لكل مهارة ---------------- */
export const examSections = [
  {
    skill: 'reading', title: 'قسم القراءة',
    passage: 'اسمي حمدان، وأنا أعيش في دبي في منطقة ند الشبا. كلَّ يومٍ أحتاجُ إلى الهواءِ لأتنفّس، وأحتاجُ إلى الماءِ لأشرب، وأحتاجُ إلى الطعامِ لأحافظَ على صحّتي.',
    passageEn: 'My name is Hamdan and I live in Dubai, in Nad Al Sheba. Every day I need air to breathe, water to drink, and food to stay healthy.',
    q: 'لماذا يحتاج حمدان إلى الماء؟', qEn: 'Why does Hamdan need water?',
    options: ['ليلعب', 'ليشرب', 'ليسافر', 'ليقرأ'], correct: 1,
  },
  {
    skill: 'listening', audio: true, title: 'قسم الاستماع',
    q: 'استمع للفقرة ثم أجب: ماذا يفعل المتحدث في المساء؟', qEn: 'Listen: what does the speaker do in the evening?',
    options: ['يشرب الماء', 'يمارس الرياضة', 'يذهب إلى المدرسة', 'يلبس ملابسه'], correct: 1,
  },
  {
    skill: 'speaking', record: true, title: 'قسم التحدث',
    q: 'تحدث في ثلاث جمل: اذكر حاجة ورغبة لديك، ولماذا تحتاج أو تريد كلاً منهما.',
    qEn: 'Speak in three sentences: mention one need and one want, and why.',
  },
  {
    skill: 'writing', write: true, title: 'قسم الكتابة',
    q: 'اكتب فقرة قصيرة (نحو 30 كلمة) عن الطعام الصحي.',
    qEn: 'Write a short paragraph (~30 words) about healthy food.',
  },
];
export const examResult = {
  total: 88, verdict: 'أداء رائع في اختبار الوحدة!',
  skills: [
    { skill: 'reading', pct: 95 }, { skill: 'listening', pct: 90 },
    { skill: 'speaking', pct: 82, note: 'بانتظار تصحيح المعلم' }, { skill: 'writing', pct: 85, note: 'بانتظار تصحيح المعلم' },
  ],
  outcomes: ['أقرأ نصاً معلوماتياً وأستنتج الفكرة', 'أفهم حواراً مسموعاً وأحدد مكانه', 'أصف طعامي المفضل شفهياً'],
};

/* ---------------- معايير التقييم بعين الطالب ---------------- */
export const rubric = {
  task: 'مهمة الكتابة: صف زيارتك للمطعم',
  levels: ['ممتاز ⭐⭐⭐⭐', 'جيد ⭐⭐⭐', 'مقبول ⭐⭐', 'أحتاج دعماً ⭐'],
  rows: [
    { c: 'الأفكار', d: ['أفكاري واضحة ومرتبة ومكتملة', 'أفكاري واضحة ومرتبة', 'بعض الأفكار واضحة', 'أفكاري غير واضحة بعد'] },
    { c: 'المفردات', d: ['أستخدم كلمات الوحدة الجديدة بدقة', 'أستخدم أغلب كلمات الوحدة', 'أستخدم بعض الكلمات', 'أحتاج مراجعة الكلمات'] },
    { c: 'القواعد', d: ['جملي صحيحة و«أن» في مكانها', 'أخطاء قليلة لا تغيّر المعنى', 'بعض الأخطاء', 'أحتاج مراجعة القاعدة'] },
    { c: 'التنظيم', d: ['بداية ووسط ونهاية واضحة', 'ترتيب جيد', 'ترتيب بسيط', 'أحتاج مخطط الكتابة'] },
  ],
};

/* ---------------- تذكرة الخروج ---------------- */
/* تذكرة الخروج — من ملف العميل الفعلي (exit_ticket_needs_wants_developing) */
export const exitTicket = {
  q: 'لماذا نحتاج إلى الهواء؟',
  options: ['لأتنفس', 'لأشتري الطعام', 'للعب فقط'],
  correct: 0,
};

/* ---------------- مركز المهارات الأربع ---------------- */
export const skillsHub = {
  reading: [
    { ar: 'قراءة النص والتعرف على الفكرة العامة', en: 'Read the text and identify the main idea', type: 'درس',   mins: 20, pct: 70, status: 'done',    img: '/img/scene-read.png' },
    { ar: 'استنتاج المعاني من السياق',            en: 'Infer meanings from context',            type: 'تدريب', mins: 15, pct: 60, status: 'current', img: '/img/scene-story.png' },
    { ar: 'تحديد التفاصيل المهمة',                en: 'Identify important details',             type: 'تدريب', mins: 15, pct: 40, status: 'todo',    img: '/img/scene-discover.png' },
    { ar: 'تحدي القراءة',                          en: 'Reading Challenge',                      type: 'تحدي',  mins: 10, pct: 0,  status: 'locked',  img: '/img/scene-cards.png' },
  ],
  listening: [
    { ar: 'الاستماع للحوار وفهم الفكرة',          en: 'Listen and understand the dialogue',     type: 'درس',   mins: 15, pct: 80, status: 'done',    img: '/img/scene-restaurant.png' },
    { ar: 'التقاط التفاصيل من المسموع',           en: 'Catch details from audio',               type: 'تدريب', mins: 10, pct: 45, status: 'current', img: '/img/scene-dinner.png' },
    { ar: 'تحدي الاستماع السريع',                 en: 'Speed Listening Challenge',              type: 'تحدي',  mins: 8,  pct: 0,  status: 'locked',  img: '/img/scene-market.png' },
  ],
  speaking: [
    { ar: 'اطلب وجبتك بثقة',                       en: 'Order your meal with confidence',        type: 'مهمة',  mins: 12, pct: 50, status: 'current', img: '/img/scene-speak.png' },
    { ar: 'قدّم نفسك بثلاث جمل',                  en: 'Introduce yourself in 3 sentences',      type: 'تدريب', mins: 8,  pct: 0,  status: 'todo',    img: '/img/scene-greetings.png' },
    { ar: 'تحدي المحادثة',                         en: 'Conversation Challenge',                 type: 'تحدي',  mins: 10, pct: 0,  status: 'locked',  img: '/img/scene-play.png' },
  ],
  writing: [
    { ar: 'صف زيارتك للمطعم',                      en: 'Describe your restaurant visit',         type: 'مهمة',  mins: 20, pct: 30, status: 'current', img: '/img/scene-menu.png' },
    { ar: 'رتّب الجمل لتكوّن فقرة',               en: 'Order sentences into a paragraph',       type: 'تدريب', mins: 10, pct: 0,  status: 'todo',    img: '/img/scene-express.png' },
    { ar: 'تحدي الكتابة الإبداعية',                en: 'Creative Writing Challenge',             type: 'تحدي',  mins: 15, pct: 0,  status: 'locked',  img: '/img/scene-garden.png' },
  ],
};
export const skillFooters = {
  reading:   { ar: 'كل صفحة تقرأها تقرّبك من هدفك!', en: 'Every page you read brings you closer to your goal!' },
  listening: { ar: 'أذن تسمع جيداً، لسان يتحدث بثقة!', en: 'Good listening builds confident speaking!' },
  speaking:  { ar: 'كل جملة تنطقها تزيد طلاقتك!', en: 'Every sentence you say builds your fluency!' },
  writing:   { ar: 'كل سطر تكتبه يصنع منك كاتباً!', en: 'Every line you write makes you a writer!' },
};

/* ---------------- صفحات «المزيد» الستة ---------------- */
export const supportResources = [
  { ar: 'بطاقات الكلمات',  en: 'Word Flashcards',   d: 'كل مفردات وحداتك للمراجعة',      ico: '/img/flashcards.png', skill: 'vocab' },
  { ar: 'ملخصات الدروس',   en: 'Lesson Summaries',  d: 'مراجعة سريعة لكل درس',            ico: '/img/scroll.png',     skill: 'reading' },
  { ar: 'فيديوهات تعليمية', en: 'Learning Videos',   d: 'شروحات مرئية قصيرة',              ico: '/img/target2.png',    skill: 'listening' },
  { ar: 'دليل القواعد',    en: 'Grammar Guide',     d: 'كل القواعد بأمثلة صح وخطأ',       ico: '/img/book.png',       skill: 'grammar' },
  { ar: 'عبارات مساعدة',   en: 'Helping Phrases',   d: 'جمل جاهزة لكل موقف',              ico: '/img/speech.png',     skill: 'speaking' },
  { ar: 'كتب وقصص',        en: 'Books & Stories',   d: 'مكتبة قصص حسب مستواك',            ico: '/img/bookOpenGold.png', skill: 'reading' },
];

/* تذاكر دعم الطالب */
export const myTickets = [
  { id: 'T-104', subj: 'الصوت لا يعمل في تدريب الاستماع', type: 'مشكلة تقنية', t: 'أمس',       status: 'تم الرد', reply: 'جرّب تحديث الصفحة والسماح للمتصفح بتشغيل الصوت — أخبرنا إن استمرت المشكلة.' },
  { id: 'T-98',  subj: 'أريد تغيير صورة ملفي',            type: 'اقتراح',      t: 'قبل 4 أيام', status: 'مغلقة',  reply: 'أُضيفت الميزة في حسابي والإعدادات — شكراً لاقتراحك!' },
];

export const notifications = [
  { ar: 'أضاف معلمك واجباً جديداً: وصف وجبتي المفضلة', en: 'New assignment from your teacher', t: 'قبل ساعة',   type: 'واجبات', unread: true,  ico: '/img/clipboard.png' },
  { ar: 'أحسنت! حصلت على شارة «متعلّم نشط»',            en: 'You earned the Active Learner badge', t: 'قبل 3 ساعات', type: 'إنجاز',  unread: true,  ico: '/img/badge-active.png' },
  { ar: 'تذكير: كويز درس المطعم غداً',                  en: 'Reminder: lesson quiz tomorrow',      t: 'أمس',        type: 'واجبات', unread: true,  ico: '/img/stopwatch.png' },
  { ar: 'علّقت معلمتك على تسجيلك الصوتي',               en: 'Your teacher commented on your recording', t: 'أمس',   type: 'معلم',   unread: false, ico: '/img/teacher.png' },
  { ar: 'اكتمل حفظ تقدمك في مهمة الكتابة',              en: 'Your writing progress was saved',     t: 'قبل يومين',  type: 'نظام',   unread: false, ico: '/img/cloudDone.png' },
  { ar: 'محتوى مقترح لك: قصة «رحلة إلى السوق»',         en: 'Suggested for you: a new story',      t: 'قبل يومين',  type: 'نظام',   unread: false, ico: '/img/bookOpenGold.png' },
];

export const portfolioWorks = [
  { ar: 'قصتي: يوم في حياتي',      en: 'My Story: A Day in My Life', type: 'كتابة',  img: '/img/scene-express.png', views: 124, likes: 18, date: 'مايو 20' },
  { ar: 'تسجيلي: أطلب طعامي',       en: 'Recording: Ordering Food',   type: 'تحدث',   img: '/img/scene-speak.png',   views: 86,  likes: 12, date: 'مايو 17', audio: true },
  { ar: 'مشروع: وجباتنا الصحية',    en: 'Project: Healthy Meals',     type: 'مشاريع', img: '/img/scene-menu.png',    views: 210, likes: 31, date: 'مايو 12' },
  { ar: 'واجب: وصف مدرستي',         en: 'Homework: My School',        type: 'واجبات', img: '/img/scene-read.png',    views: 67,  likes: 9,  date: 'مايو 08' },
];

export const teacherNotes = [
  {
    name: 'أ. نورة السالم', en: 'Ms. Noura Al Salem', date: 'اليوم', img: '/img/teacher.png',
    strengths: 'نطقك في تسجيل «أطلب طعامي» واضح جداً، واستخدمت عبارات مهذبة بشكل ممتاز.',
    next: 'ركّز في التسجيل القادم على تمديد الجمل — جرّب أن تصف الطعام الذي طلبته.',
  },
  {
    name: 'أ. أحمد العتيبي', en: 'Mr. Ahmed Al Otaibi', date: 'قبل 3 أيام', img: '/img/avatar-boy.png',
    strengths: 'فقرتك عن هوايتك منظمة وفيها مفردات جديدة استخدمتها صح.',
    next: 'انتبه لأداة «أن» بعد أريد — راجع القاعدة المساعدة في درس المطعم.',
  },
];

export const calendarEvents = [
  { d: 2,  type: 'واجب' }, { d: 5, type: 'كويز' }, { d: 9, type: 'نشاط' },
  { d: 12, type: 'واجب' }, { d: 16, type: 'كويز' }, { d: 19, type: 'نشاط' },
  { d: 23, type: 'ختامي' }, { d: 26, type: 'واجب' },
];
export const todaySchedule = [
  { t: '4:00', ar: 'احتياجاتنا ورغباتنا — مهارة القراءة', st: 'جارية' },
  { t: '4:30', ar: 'تدريب استماع: روتيني اليومي', st: 'قادمة' },
  { t: '5:00', ar: 'لعبة البطاقات — مفردات الوحدة', st: 'قادمة' },
];
export const upcomingTasks = [
  { d: 'الاثنين', ar: 'تسليم واجب: وصف وجبتي المفضلة' },
  { d: 'الأربعاء', ar: 'كويز درس المطعم' },
  { d: 'الأحد القادم', ar: 'اختبار الوحدة الختامي — بتكليف المعلم' },
];

/* أسئلة الاختبار القصير — 10 درجات، من ملف العميل الفعلي
   (Developing interactive_quiz + exit ticket) — كل سؤال بمحرك من محركات الأسئلة */
export const quizQuestions = [
  {
    type: 'mcq', engine: 'ملء الفراغات', skill: 'reading', pts: 2,
    q: 'أكمل الجملة بالكلمة الصحيحة: «أنا أحتاجُ إلى ____ لأشرب»',
    qEn: 'I need ____ to drink.',
    options: ['الماء', 'الكتب', 'الأحذية'],
    correct: 0,
    explain: 'نحتاج إلى الماء لنشرب — الماء حاجة أساسية للحياة.',
  },
  {
    type: 'mcq', engine: 'اختيار من متعدد', skill: 'vocab', pts: 1,
    q: 'أريدُ ____ جديداً للتواصلِ مع عائلتي',
    qEn: 'I want a new ____ to communicate with my family.',
    options: ['حقيبةً', 'هاتفاً', 'طعاماً'],
    correct: 1,
    explain: 'الهاتف نستخدمه للتواصل — وهو غالباً رغبة وليس حاجة أساسية.',
  },
  {
    type: 'mcq', engine: 'اختيار الصور', skill: 'vocab', pts: 1,
    img: '/media/needs/fc-21.png',
    q: 'أحتاجُ إلى هذا الشيء عندما أمرض — ما اسمه؟',
    qEn: 'I need this when I am sick — what is it?',
    options: ['الدواء', 'اللعب', 'التسوق'],
    correct: 0,
    explain: 'الدواء حاجة عندما نمرض — يساعدنا على الشفاء.',
  },
  {
    type: 'listen', engine: 'الاستماع', skill: 'listening', pts: 2,
    audio: '/media/needs/listen-t2-sentences.mp3',
    q: 'استمع للجمل: لماذا أستخدمُ الإنترنت؟',
    qEn: 'Listen: why do I use the internet?',
    options: ['للتعلُّم', 'للعب', 'للتسوّق'],
    correct: 0,
    explain: 'الجملة الأولى في التسجيل: «أستخدمُ الإنترنتَ للتعلُّم».',
  },
  {
    type: 'order', engine: 'الترتيب', skill: 'grammar', pts: 2,
    q: 'رتّب الكلمات لتكوّن جملة صحيحة من الدرس',
    qEn: 'Order the words to form a correct sentence',
    words: ['لأتنفّس', 'الهواءِ', 'إلى', 'أحتاجُ'],
    answer: ['أحتاجُ', 'إلى', 'الهواءِ', 'لأتنفّس'],
    explain: 'التركيب: أحتاجُ + إلى + الاسم + السبب (لـ + فعل): أحتاجُ إلى الهواءِ لأتنفّس.',
  },
  {
    type: 'input', engine: 'إجابة نصية قصيرة', skill: 'writing', pts: 2,
    q: 'أجب برأيك: هل السيارةُ حاجةٌ أم رغبةٌ؟ اكتب سبباً بسيطاً باستخدام «لأنها»',
    qEn: 'Is a car a need or a want? Give a simple reason using "because".',
    accept: ['حاجة', 'رغبة'],
    model: 'قد تكون السيارةُ حاجةً لأنها تساعدنا على التنقل — أو رغبةً إذا كان هناك بديل',
    explain: 'الإجابتان مقبولتان مع سبب واضح — المهم أن تفسّر لماذا. (يراجعها معلمك أيضاً)',
  },
];

/* نتيجة النشاط */
export const activityResult = {
  pct: 92, verdict: 'ممتاز!', verdictEn: 'Excellent!',
  time: '06:20', correct: '11 من 12', pts: 120,
  mastered: ['قرأتَ نص حمدان وفهمتَ فكرته العامة', 'ميّزتَ بين الحاجات والرغبات بدقة', 'استخدمتَ «لـ» للتعبير عن السبب'],
  improve: ['أضف سبباً بـ«لأنَّ» في جملك — جرّب: أحتاجُ إلى الماءِ لأنني…'],
  teacher: { name: 'أ. نورة السالم', img: '/img/teacher.png', note: 'تقدّم رائع يا أحمد! تمييزك بين الحاجة والرغبة أصبح دقيقاً — استمر بهذا التركيز.' },
};

/* مكتبة القصص — حسب مستوى الطالب */
export const stories = [
  { ar: 'عشاء في المطعم',   en: 'Dinner at the Restaurant', img: '/img/scene-dinner.png',    mins: 5, words: 120, tag: 'مرتبطة بوحدتك', audio: true },
  { ar: 'رحلة إلى الحديقة', en: 'A Trip to the Garden',     img: '/img/scene-garden.png',    mins: 4, words: 95,  audio: true },
  { ar: 'يوم في السوق',     en: 'A Day at the Market',      img: '/img/scene-market.png',    mins: 6, words: 140, audio: true },
  { ar: 'في المزرعة',       en: 'On the Farm',              img: '/img/scene-farm.png',      mins: 4, words: 90,  audio: false },
  { ar: 'صديقي الجديد',     en: 'My New Friend',            img: '/img/scene-greetings.png', mins: 3, words: 70,  audio: true },
  { ar: 'مغامرة القراءة',   en: 'The Reading Adventure',    img: '/img/scene-story.png',     mins: 7, words: 160, audio: false },
];

/* صفحات قصة «عشاء في المطعم» للقارئ */
export const storyPages = [
  { img: '/img/scene-dinner.png',     text: 'في يومِ الجمعةِ، ذهبَ أحمدُ مع عائلتِهِ إلى المطعمِ. كانَ المطعمُ جميلاً وهادئاً.',
    en: 'On Friday, Ahmed went with his family to the restaurant. The restaurant was beautiful and quiet.',
    audio: '/media/story-p1.wav' },
  { img: '/img/scene-menu.png',       text: 'أعطى النادلُ أحمدَ قائمةَ الطعامِ. قرأَ أحمدُ الأسماءَ ثم قالَ: «أريدُ أن أطلبَ أرزاً بالدجاجِ من فضلك».',
    en: 'The waiter gave Ahmed the menu. Ahmed read the names then said: "I would like to order rice with chicken, please."',
    audio: '/media/story-p2.wav' },
  { img: '/img/scene-restaurant.png', text: 'أكلتِ العائلةُ معاً وتحدّثوا وضحكوا. في النهايةِ قالَ أحمدُ للنادلِ: «شكراً جزيلاً، الطعامُ لذيذٌ!»',
    en: 'The family ate together, talked and laughed. At the end Ahmed told the waiter: "Thank you very much, the food is delicious!"',
    audio: '/media/story-p3.wav' },
];

export const lessonSteps = [
  { n: 1, ar: 'أدخل المطعم',    en: 'Entering',  skill: 'الاستماع', status: 'done' },
  { n: 2, ar: 'أطلب طعامي',     en: 'Ordering',  skill: 'التحدث',   status: 'current' },
  { n: 3, ar: 'أسأل عن الحساب', en: 'The Bill',  skill: 'التحدث',   status: 'todo' },
  { n: 4, ar: 'أصف وجبتي',      en: 'Describe',  skill: 'الكتابة',  status: 'todo' },
];
