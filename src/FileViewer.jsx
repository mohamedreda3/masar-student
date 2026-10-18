import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/* عارض الملفات داخل الموقع — بدل فتح الملفات والصور في تبويب خارجي
   الاستخدام: openFile({ url, name, mime_type | file_type }) من أي مكان، و<FileViewerHost /> مرة واحدة في App */

const EVT = 'masar:open-file';
export const openFile = (f) => window.dispatchEvent(new CustomEvent(EVT, { detail: typeof f === 'string' ? { url: f } : f }));

/* نوع العرض من mime_type / file_type / امتداد الرابط */
function kindOf({ url = '', mime_type = '', file_type = '' }) {
  const m = String(mime_type).toLowerCase(), t = String(file_type).toLowerCase();
  const ext = (String(url).split('?')[0].split('#')[0].match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  const any = (...xs) => xs.some(x => m.includes(x) || t === x || ext === x);
  if (/youtu\.?be|vimeo\.com/.test(url)) return 'embed';
  if (m.startsWith('image/') || t === 'image' || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (any('pdf')) return 'pdf';
  if (m.startsWith('video/') || t === 'video' || ['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext)) return 'video';
  if (m.startsWith('audio/') || t === 'audio' || ['mp3', 'wav', 'm4a', 'ogg', 'aac', 'weba'].includes(ext)) return 'audio';
  if (/^https?:/.test(url) && !ext) return 'page';        // رابط صفحة ويب
  return 'other';                                          // Word / PowerPoint / …
}

/* رابط يوتيوب/فيميو → embed */
function embedUrl(url) {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\.|^m\./, '');
    if (h === 'youtu.be') return 'https://www.youtube.com/embed/' + u.pathname.slice(1);
    if (h.endsWith('youtube.com')) return 'https://www.youtube.com/embed/' + (u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop());
    if (h.endsWith('vimeo.com')) return 'https://player.vimeo.com/video/' + u.pathname.split('/').filter(Boolean).pop();
  } catch { /* رابط غير صالح */ }
  return url;
}

const box = { width: '100%', height: '72vh', border: 0, borderRadius: 12, background: '#fff', display: 'block' };

export function FileViewerHost() {
  const [f, setF] = useState(null);
  const [zoom, setZoom] = useState(false);
  useEffect(() => {
    const on = (e) => { setZoom(false); setF(e.detail); };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  useEffect(() => {
    if (!f) return;
    const esc = (e) => { if (e.key === 'Escape') setF(null); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [f]);
  if (!f?.url) return null;
  const k = kindOf(f);
  const name = f.name || decodeURIComponent(String(f.url).split('?')[0].split('/').pop() || 'ملف');

  return createPortal(
    <div className="modal-overlay" onClick={() => setF(null)} role="dialog" aria-modal="true" aria-label={name}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ width: 'min(1000px, 96vw)', maxWidth: 'none' }}>
        <div className="modal-head">
          <div style={{ minWidth: 0 }}>
            <div className="t" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div className="e">{{ image: 'صورة', pdf: 'ملف PDF', video: 'فيديو', audio: 'تسجيل صوتي', embed: 'فيديو', page: 'رابط', other: 'ملف' }[k]}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {k !== 'embed' && k !== 'page' && <a href={f.url} download={name} className="btn-sm" style={{ textDecoration: 'none' }}>⬇ تحميل</a>}
            <button className="modal-close" onClick={() => setF(null)} aria-label="إغلاق">✕</button>
          </div>
        </div>

        {k === 'image' && (
          <div style={{ maxHeight: '74vh', overflow: 'auto', textAlign: 'center', background: 'var(--wash)', borderRadius: 12 }}>
            <img src={f.url} alt={name} onClick={() => setZoom(z => !z)}
              style={{ maxWidth: zoom ? 'none' : '100%', maxHeight: zoom ? 'none' : '72vh', width: zoom ? '180%' : 'auto', cursor: zoom ? 'zoom-out' : 'zoom-in', display: 'inline-block' }} />
          </div>
        )}
        {k === 'pdf' && <iframe src={f.url + '#toolbar=1'} title={name} style={box} />}
        {k === 'video' && <video src={f.url} controls autoPlay playsInline style={{ ...box, height: 'auto', maxHeight: '72vh', background: '#000' }} />}
        {k === 'audio' && <div style={{ padding: '30px 10px', textAlign: 'center' }}><div style={{ fontSize: 54 }}>🎧</div><audio src={f.url} controls autoPlay style={{ width: '100%', marginTop: 10 }} /></div>}
        {k === 'embed' && <iframe src={embedUrl(f.url)} title={name} referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ ...box, height: 'auto', aspectRatio: '16 / 9', background: '#000' }} />}
        {k === 'page' && (
          <>
            <iframe src={f.url} title={name} style={box} />
            <div style={{ fontSize: 12, color: 'var(--mute)', textAlign: 'center', marginTop: 8 }}>إن لم تظهر الصفحة فهذا الموقع لا يسمح بعرضه داخل المنصة.</div>
          </>
        )}
        {k === 'other' && (
          <div style={{ padding: '40px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 60 }}>📘</div>
            <div style={{ fontWeight: 900, fontSize: 17, marginTop: 8 }}>{name}</div>
            <div style={{ fontSize: 13.5, color: 'var(--mute)', marginTop: 6 }}>لا يمكن معاينة هذا النوع من الملفات داخل المتصفح — حمّله لتفتحه على جهازك.</div>
            <a href={f.url} download={name} className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>⬇ تحميل الملف</a>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
