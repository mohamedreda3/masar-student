/* ثوابت الواجهة فقط (القائمة، ألوان وأيقونات المهارات، روابط «المزيد»، رسومات الوحدات) — كل البيانات من الـAPI */

export const nav = [
  { to: '/',          ar: 'الرئيسية',  en: 'Home',          ico: '🏠' },
  { to: '/path',      ar: 'مساري',     en: 'My Path',       ico: '🗺️' },
  { to: '/activities',ar: 'أنشطتي',    en: 'My Activities', ico: '✏️' },
  { to: '/assignments', ar: 'اختباراتي وواجباتي', en: 'Exams & Homework', ico: '📝' },
  { to: '/skills',    ar: 'مهاراتي',   en: 'My Skills',     ico: '🎯' },
  { to: '/reports',   ar: 'تقاريري',   en: 'My Reports',    ico: '📊' },
  { to: '/badges',    ar: 'الشارات',   en: 'Badges',        ico: '🏅' },
  { to: '/challenges',ar: 'التحديات والألعاب', en: 'Challenges & Games', ico: '🎮' },
  { to: '/more',      ar: 'المزيد',    en: 'More',          ico: '✨' },
];

export const SKILLS = {
  reading:   { ar: 'القراءة',  en: 'Reading',    color: '#2563eb', ico: '/img/book.png' },
  listening: { ar: 'الاستماع', en: 'Listening',  color: '#0891b2', ico: '/img/headphones.png' },
  writing:   { ar: 'الكتابة',  en: 'Writing',    color: '#db2777', ico: '/img/pencil.png' },
  speaking:  { ar: 'التحدث',   en: 'Speaking',   color: '#ea580c', ico: '/img/mic.png' },
  vocab:     { ar: 'المفردات', en: 'Vocabulary', color: '#16a34a', ico: '/img/flashcards.png' },
  grammar:   { ar: 'القواعد',  en: 'Grammar',    color: '#7c3aed', ico: '/img/book.png' },
};

/* ---------------- المزيد ---------------- */
export const moreLinks = [
  { ar: 'موارد الدعم',       en: 'Support Resources', d: 'أدوات ومواد تساعدك على التعلّم', ico: '/img/book.png',       to: '/support' },
  { ar: 'خطة الدعم الخاصة بي', en: 'My Support Plan',  d: 'الخطة التي صمّمها لك معلمك لتتحسن خطوة بخطوة', ico: '/img/target.png', to: '/support-plan' },
  { ar: 'الإشعارات',         en: 'Notifications',     d: 'كل جديد يخصّك',                  ico: '/img/bell.png',       to: '/notifications' },
  { ar: 'ملف أعمالي',        en: 'My Portfolio',      d: 'كتاباتك وتسجيلاتك ومشاريعك',     ico: '/img/clipboard.png',  to: '/reports?tab=portfolio' },
  { ar: 'التقويم والمهام',   en: 'Calendar & Tasks',  d: 'مواعيد التسليم والاختبارات',     ico: '/img/clipboard.png',  to: '/calendar' },
  { ar: 'ملاحظات المعلم',    en: 'Teacher Feedback',  d: 'تعليقات وتوجيهات على مهامك',     ico: '/img/teacher.png',    to: '/feedback' },
  { ar: 'حسابي والإعدادات',  en: 'Account & Settings', d: 'بياناتك وتفضيلاتك',             ico: '/img/gear.png',       to: '/settings' },
  { ar: 'مركز المهارات',     en: 'Skills Hub',         d: 'مهاراتك الأربع بدروسها وتحدياتها',   ico: '/img/target.png',  to: '/skills' },
];

export const skillFooters = {
  reading:   { ar: 'كل صفحة تقرأها تقرّبك من هدفك!', en: 'Every page you read brings you closer to your goal!' },
  listening: { ar: 'أذن تسمع جيداً، لسان يتحدث بثقة!', en: 'Good listening builds confident speaking!' },
  speaking:  { ar: 'كل جملة تنطقها تزيد طلاقتك!', en: 'Every sentence you say builds your fluency!' },
  writing:   { ar: 'كل سطر تكتبه يصنع منك كاتباً!', en: 'Every line you write makes you a writer!' },
};

/* رسمة الوحدة من التصميم (باسمها) عندما لا تكون لها صورة — utils useApi unitArt */
export const UNIT_ART = {
  'التحية والتعارف': '/media/units/friend.png',
  'الأسرة والأصدقاء': '/media/units/family.png',
  'أعرف عن نفسي': '/media/units/introduce.png',
  'الاحتياجات والرغبات': '/img/scene-needs.png',
  'صديقي المفضل': '/media/units/bestfriend.png',
  'علاقاتنا الأسرية وأصدقاؤنا': '/media/units/family-relations.png',
  'كل شيء عني': '/media/units/allaboutme.png',
  'علاقاتي الاجتماعية': '/media/units/mother.png',
  'التواصل بين الأجيال': '/media/units/father.png',
};
