import { useEffect, useState } from 'react';
import { playClip, stopAudio, onAudio, playingSrc } from './sounds.js';
import { openFile } from './FileViewer.jsx';

/* ============================================================
   الصور والأصوات في كل الشاشات — مكوّنان صغيران بنفس تصميم المنصة
   كل قيمة اختيارية: لا نرسم مربعاً فارغاً ولا صورة مكسورة أبداً.
   ============================================================ */

/* هل هذا المقطع هو الجاري تشغيله الآن؟ (مقطع واحد في كل التطبيق) */
export function useIsPlaying(src) {
  const [cur, setCur] = useState(() => playingSrc());
  useEffect(() => onAudio(setCur), []);
  return !!src && cur === src;
}

/* إيقاف الصوت عند مغادرة الشاشة */
export function useStopAudio(deps = []) {
  useEffect(() => stopAudio, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/* صورة اختيارية — تختفي بهدوء إن فشل تحميلها، ومكانها محجوز فلا تقفز الشاشة.
   الضغط يفتحها بحجم كامل (عارض الملفات) إلا داخل بطاقة اختيار (zoom={false}) */
export function Picture({ src, alt = 'صورة', className = '', ratio, zoom = true, style, children }) {
  const [state, setState] = useState('loading');   // loading · ok · fail
  useEffect(() => { setState('loading'); }, [src]);
  if (!src || state === 'fail') return null;
  const big = (e) => { e.stopPropagation(); e.preventDefault(); openFile({ url: src, name: alt, file_type: 'image' }); };
  return (
    <span
      className={['pic', state === 'loading' ? 'loading' : '', zoom ? 'zoomable' : '', ratio ? 'fit' : '', className].filter(Boolean).join(' ')}
      style={{ ...(ratio ? { aspectRatio: ratio } : null), ...style }}
      onClick={zoom ? big : undefined}
      onKeyDown={zoom ? (e) => { if (e.key === 'Enter' || e.key === ' ') big(e); } : undefined}
      role={zoom ? 'button' : undefined} tabIndex={zoom ? 0 : undefined}
      title={zoom ? 'اضغط لتكبير الصورة' : undefined}
    >
      <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setState('ok')} onError={() => setState('fail')} />
      {children}
    </span>
  );
}

/* زر صوت دائري — موجة متحركة أثناء التشغيل، والضغطة الثانية توقفه.
   size: sm (داخل خيار/بطاقة) · md (افتراضي) · lg (سؤال أو لعبة)
   maxPlays: يرسم نقاط المرات المتبقية ويتعطّل عند صفر (يُحفظ بالجلسة عبر playKey) */
export function SoundButton({ src, size = 'md', label = '', maxPlays, playKey, className = '', onPlay, disabled }) {
  const playing = useIsPlaying(src);
  const key = playKey && maxPlays != null ? 'masar-plays-' + playKey : null;
  const [used, setUsed] = useState(() => { try { return key ? +sessionStorage.getItem(key) || 0 : 0; } catch { return 0; } });
  const [failed, setFailed] = useState(false);
  if (!src) return null;
  const left = maxPlays == null ? null : Math.max(0, maxPlays - used);
  const off = disabled || left === 0;
  const play = (e) => {
    e.stopPropagation(); e.preventDefault();
    if (off) return;
    setFailed(false);
    playClip(src);
    if (maxPlays != null && !playing) {
      const n = used + 1;
      setUsed(n);
      try { if (key) sessionStorage.setItem(key, n); } catch { /* */ }
    }
    onPlay?.();
  };
  /* span لا button: زر الصوت يعيش غالباً داخل بطاقة اختيار (زر) — والتداخل غير صالح */
  return (
    <span className={['snd-wrap', className].filter(Boolean).join(' ')}>
      <span role="button" tabIndex={off ? -1 : 0} aria-disabled={off || undefined} onClick={play}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') play(e); }}
        className={['sound-btn', 'snd', 'snd-' + size, playing ? 'playing' : '', off ? 'off' : '', failed ? 'failed' : ''].filter(Boolean).join(' ')}
        aria-label={'تشغيل الصوت' + (label ? ' — ' + label : '')} title={off ? 'انتهت مرات الاستماع' : 'استمع'}>
        {playing ? <span className="snd-waves" aria-hidden="true"><i /><i /><i /></span> : '🔊'}
      </span>
      {left != null && (
        <span className="snd-dots" aria-label={`مرات الاستماع المتبقية: ${left}`}>
          {Array.from({ length: maxPlays }, (_, i) => <i key={i} className={i < left ? 'on' : ''} />)}
        </span>
      )}
    </span>
  );
}

/* صورة + صوت عنصر (خيار · بطاقة · قطعة لعبة) — يُرسم ما وُجد منهما فقط */
export function ItemMedia({ image, audio, alt, size = 'sm', zoom = false, className = '' }) {
  if (!image && !audio) return null;
  return (
    <>
      <Picture src={image} alt={alt || 'صورة'} zoom={zoom} className={'item-pic ' + className} />
      <SoundButton src={audio} size={size} label={alt} className="item-snd" />
    </>
  );
}

/* بطاقة اختيار بلا نص: صورة فقط أو صوت فقط — حرف البطاقة يبقى ليختارها الطالب */
export const isMediaOnly = (o) => !String(o?.text ?? o?.label ?? '').trim() && !!(o?.image || o?.audio);
