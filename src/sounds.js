/* أصوات تفاعل خفيفة — مولّدة بـWeb Audio (بلا ملفات خارجية)
   تُشغَّل فقط استجابةً لنقرة المستخدم (متوافقة مع سياسات المتصفح) */
let ctx = null;
/* كتم أصوات اللعب (يُحفظ) — يطبّق على النغمات والمقاطع */
let muted = (() => { try { return localStorage.getItem('masar-mute') === '1'; } catch { return false; } })();
export const isMuted = () => muted;
export function setMuted(m) { muted = !!m; try { localStorage.setItem('masar-mute', muted ? '1' : '0'); } catch { /* */ } if (muted) stopAudio(); }
const ac = () => (ctx ??= new (window.AudioContext || window.webkitAudioContext)());

/* نقرة عامة خفيفة جداً — لكل زر ورابط (طبقة التلعيب) */
export function tickSound() { tone(1400, 0, 0.05, 'triangle', 0.045); }
/* سووش التنقل بين الصفحات */
export function swooshSound() { tone(420, 0, 0.09, 'sine', 0.05); tone(720, 0.05, 0.11, 'sine', 0.055); }

/* تشغيل مقطع صوتي (عبارات/نطق/حوار) — مقطع واحد بكل لحظة، الكبسة الثانية توقفه،
   وrate يطبّق سرعة التشغيل المختارة (0.75/1/1.25) */
let clip = null;
/* أفضل صوت عربي متاح على الجهاز: الأصوات العصبية (Natural/Online) أولاً — مثل Microsoft Zariyah/Hamed في Edge وWindows —
   ثم صوت Google العربي في Chrome، ثم أي صوت عربي. النص يُنطق كما هو (بتشكيله إن وُجد) */
let voices = [];
const loadVoices = () => { try { voices = window.speechSynthesis?.getVoices() || []; } catch { voices = []; } };
if (typeof window !== 'undefined' && window.speechSynthesis) { loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }
export function bestArabicVoice() {
  const ar = voices.filter(v => /^ar/i.test(v.lang));
  const score = (v) => (/natural|online|neural/i.test(v.name) ? 100 : 0) + (/zariyah|hamed|salma|shakir/i.test(v.name) ? 20 : 0)
    + (/google/i.test(v.name) ? 40 : 0) + (/ar-SA/i.test(v.lang) ? 10 : /ar-EG/i.test(v.lang) ? 5 : 0) + (v.localService ? 0 : 3);
  return ar.sort((x, y) => score(y) - score(x))[0] || null;
}
let speaking = null;
export function speak(text, rate = 1) {
  if (muted) return false;
  try {
    const ss = window.speechSynthesis;
    if (!ss || !text) return false;
    ss.cancel();
    if (clip) { clip.pause(); clip = null; }
    const u = new SpeechSynthesisUtterance(text);
    const v = bestArabicVoice();
    u.lang = v?.lang || 'ar-SA';
    if (v) u.voice = v;
    u.rate = 0.9 * rate;
    u.onend = () => { speaking = null; };
    speaking = text;
    ss.speak(u);
    return true;
  } catch { return false; }
}
export function stopAudio() {
  try { window.speechSynthesis?.cancel(); speaking = null; if (clip) { clip.pause(); clip = null; } } catch { /* */ }
}

/* نص رابط Google TTS (البارامتر q) — احتياطي لصوت المتصفح إن فشل الملف */
const ttsText = (src) => {
  try { const u = new URL(src, location.href); return u.pathname.includes('translate_tts') ? u.searchParams.get('q') : null; } catch { return null; }
};

let playToken = 0;
export function playClip(src, rate = 1) {
  if (muted) return;
  try {
    const text = ttsText(src);
    const token = ++playToken;                       // أي تشغيل أحدث يلغي الأقدم (منع التداخل)
    // ضغطة ثانية على نفس المقطع = إيقاف
    if ((clip && clip._src === src && !clip.paused) || (text && speaking === text && window.speechSynthesis?.speaking)) { stopAudio(); return; }
    stopAudio();
    if (text) {
      // روابط Google Translate TTS → أفضل صوت عربي على الجهاز (ننتظر تحميل الأصوات قليلاً أول مرة)
      const go = () => { if (token !== playToken) return; if (bestArabicVoice()) speak(text, rate); else playFile(src, rate, null, token); };
      if (voices.length) go(); else { loadVoices(); setTimeout(() => { loadVoices(); go(); }, 600); }
      return;
    }
    playFile(src, rate, null, token);
  } catch { /* بلا صوت؟ التجربة تبقى سليمة */ }
}
function playFile(src, rate, text, token) {
  const a = new Audio(src);
  a._src = src;
  a.playbackRate = rate;
  clip = a;
  let failed = false;
  const fallback = () => { if (failed || token !== playToken) return; failed = true; if (text) speak(text, rate); };
  a.onerror = fallback;
  a.play().catch(fallback);
}

function tone(freq, start, dur, type = 'sine', vol = 0.12) {
  if (muted) return;
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

/* أصوات اللعب الإضافية */
export const levelSound = () => { tone(523, 0, 0.1); tone(784, 0.08, 0.1); tone(1047, 0.16, 0.22); };
export const tickTimer = () => tone(1200, 0, 0.07, 'square', 0.04);
export const popSound = () => { tone(900, 0, 0.05, 'triangle', 0.1); tone(1500, 0.03, 0.06, 'sine', 0.06); };
