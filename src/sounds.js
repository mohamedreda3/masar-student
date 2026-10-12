/* أصوات تفاعل خفيفة — مولّدة بـWeb Audio (بلا ملفات خارجية)
   تُشغَّل فقط استجابةً لنقرة المستخدم (متوافقة مع سياسات المتصفح) */
let ctx = null;
const ac = () => (ctx ??= new (window.AudioContext || window.webkitAudioContext)());

/* نقرة عامة خفيفة جداً — لكل زر ورابط (طبقة التلعيب) */
export function tickSound() { tone(1400, 0, 0.05, 'triangle', 0.045); }
/* سووش التنقل بين الصفحات */
export function swooshSound() { tone(420, 0, 0.09, 'sine', 0.05); tone(720, 0.05, 0.11, 'sine', 0.055); }

/* تشغيل مقطع صوتي (عبارات/نطق/حوار) — مقطع واحد بكل لحظة، الكبسة الثانية توقفه،
   وrate يطبّق سرعة التشغيل المختارة (0.75/1/1.25) */
let clip = null;
/* نطق النص بصوت المتصفح العربي (Web Speech) */
export function speak(text, rate = 1) {
  try {
    const ss = window.speechSynthesis;
    if (!ss || !text) return;
    ss.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA';
    u.rate = 0.85 * rate;
    const v = ss.getVoices().find(x => x.lang?.startsWith('ar'));
    if (v) u.voice = v;
    ss.speak(u);
  } catch { /* بلا صوت */ }
}

/* نص رابط Google TTS (البارامتر q) — احتياطي لصوت المتصفح إن فشل الملف */
const ttsText = (src) => {
  try { const u = new URL(src, location.href); return u.pathname.includes('translate_tts') ? u.searchParams.get('q') : null; } catch { return null; }
};

export function playClip(src, rate = 1) {
  try {
    const text = ttsText(src);
    if (clip && clip._src === src && !clip.paused) { clip.pause(); clip = null; return; } // ضغطة ثانية = إيقاف
    if (clip) clip.pause();
    clip = new Audio(src);
    clip._src = src;
    clip.playbackRate = rate;
    // لو فشل الملف (Google TTS بـReferer أو رابط مكسور) → صوت المتصفح العربي
    const fallback = () => { if (text) speak(text, rate); };
    clip.onerror = fallback;
    clip.play().catch(fallback);
  } catch { /* بلا صوت؟ التجربة تبقى سليمة */ }
}

function tone(freq, start, dur, type = 'sine', vol = 0.12) {
  try {
    const a = ac();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, a.currentTime + start);
    g.gain.linearRampToValueAtTime(vol, a.currentTime + start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + start + dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime + start);
    o.stop(a.currentTime + start + dur + 0.05);
  } catch { /* الصوت كماليّ — لا نكسر التجربة إن رفضه المتصفح */ }
}

/* نقرة ناعمة */
export const clickSound = () => tone(880, 0, 0.06, 'sine', 0.06);
/* إجابة صحيحة — رنة صاعدة */
export const dingSound = () => { tone(660, 0, 0.12); tone(880, 0.09, 0.16); };
/* إجابة خاطئة — نغمة هابطة لطيفة (غير مزعجة) */
export const buzzSound = () => { tone(320, 0, 0.12, 'triangle', 0.08); tone(260, 0.1, 0.16, 'triangle', 0.08); };
/* إنجاز/فوز — أربيجيو قصير */
export const winSound = () => { tone(523, 0, 0.12); tone(659, 0.1, 0.12); tone(784, 0.2, 0.12); tone(1047, 0.3, 0.28); };
