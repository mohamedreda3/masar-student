/* هوية الألعاب: لون لكل تصنيف + أيقونة وشرح «كيف ألعب؟» لكل محرك (احتياطي حين لا يرسل الباك اند instructions) */

export const CAT_COLOR = {
  vocabulary: '#22c55e', listening: '#0ea5e9', reading: '#f97316', grammar: '#8b5cf6',
  writing: '#ec4899', speaking: '#f43f5e', early_years: '#eab308', all: '#3b82f6',
};
export const catColor = (k) => CAT_COLOR[k] || CAT_COLOR.all;

export const ENGINE = {
  memory_match:    { ico: '🃏', how: 'اقلب بطاقتين، وطابق كل كلمة مع ما يناسبها.' },
  word_builder:    { ico: '🧱', how: 'اسحب الحروف إلى الخانات لتكوّن الكلمة.' },
  drag_drop:       { ico: '🧺', how: 'اسحب كل بطاقة إلى سلّتها الصحيحة.' },
  speed_quiz:      { ico: '⚡', how: 'أجب بسرعة قبل أن ينفد الوقت.' },
  puzzle:          { ico: '🧩', how: 'رتّب القطع بالترتيب الصحيح.' },
  custom:          { ico: '💬', how: 'اقرأ الموقف واختر الرد المناسب.' },
  scenes:          { ico: '💬', how: 'اقرأ الموقف واختر الرد المناسب.' },
  word_hunt:       { ico: '🐹', how: 'اضغط الكلمة الصحيحة عندما تقفز من الجحر!' },
  balloon_pop:     { ico: '🎈', how: 'فرقع البالون الذي يحمل الكلمة المطابقة للمعنى.' },
  word_search:     { ico: '🔎', how: 'اسحب إصبعك على الحروف لتجد الكلمات المخبّأة.' },
  odd_one_out:     { ico: '🫙', how: 'اضغط الكلمة التي لا تنتمي إلى المجموعة.' },
  listen_pick:     { ico: '📻', how: 'استمع جيداً ثم اختر ما سمعته.' },
  sound_sequence:  { ico: '🥁', how: 'استمع لتسلسل الأصوات ثم أعده بنفس الترتيب.' },
  picture_hunt:    { ico: '🗺️', how: 'استمع للكلمة ثم اضغط مكانها في الصورة.' },
  story_order:     { ico: '📖', how: 'رتّب صفحات القصة من البداية إلى النهاية.' },
  story_cloze:     { ico: '📜', how: 'أكمل فراغات القصة بالكلمات المناسبة.' },
  grammar_maze:    { ico: '🚪', how: 'اختر الباب الصحيح لتعبر المتاهة.' },
  answer_plane:    { ico: '✈️', how: 'وجّه الطائرة إلى السحابة التي تحمل الإجابة الصحيحة.' },
  error_hunt:      { ico: '⚖️', how: 'اضغط الكلمة الخاطئة ثم اختر تصحيحها.' },
  tashkeel:        { ico: '🧲', how: 'اختر الحرف ثم ضع عليه الحركة الصحيحة.' },
  root_family:     { ico: '🌳', how: 'ضع كل كلمة في سلّة جذرها.' },
  speed_dictation: { ico: '⌨️', how: 'استمع واكتب الكلمة قبل أن تنتهي الدائرة.' },
  read_karaoke:    { ico: '🎤', how: 'اقرأ بصوت عالٍ مع الكلمة المضيئة.' },
  speak_wheel:     { ico: '🎡', how: 'دوّر العجلة وتحدّث عن الموضوع حتى ينتهي الوقت.' },
  letter_forms:    { ico: '🔤', how: 'اختر شكل الحرف المطلوب.' },
  letter_trace:    { ico: '✍️', how: 'مرّر إصبعك فوق الحرف المنقّط.' },
};
export const engineOf = (t) => ENGINE[t] || null;

/* نجوم من النسبة: ≥ 90 → 3، ≥ 60 → 2، > 0 → 1 */
export const starsOf = (pct) => (pct == null ? 0 : pct >= 90 ? 3 : pct >= 60 ? 2 : pct > 0 ? 1 : 0);
