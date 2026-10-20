import { useEffect, useRef, useState } from 'react';
import { playClip, clickSound, stopAudio } from './sounds.js';
import { uploadFiles, absUrl } from './api/client.js';
import { openFile } from './FileViewer.jsx';
import { showToast } from './toast.js';
import QuestionBody, { isAnswered } from './QuestionBody.jsx';   // للحاوية المركّبة (استيراد دائري آمن: يُستخدم وقت العرض فقط)

/* محرّكات الأسئلة الجديدة (17 نوعاً) — كل نوع مكوّن مستقل
   props: q · value · onChange(v) · readOnly · model (الإجابة النموذجية في المراجعة)
   الصواب/الخطأ يقرره السيرفر فقط */

const s = (v) => String(v);
const isImg = (u) => /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(u || '') || /^data:image|^blob:/.test(u || '');
const isAud = (u) => /\.(webm|mp3|wav|ogg|m4a|aac)(\?|$)/i.test(u || '');
const words = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;

/* ===== أدوات مشتركة ===== */

/* سحب عنصر بالمؤشر وإفلاته فوق [data-drop] — ضغطة بلا سحب = onTap */
function useDrag(onDrop, onTap) {
  const [drag, setDrag] = useState(null);
  const start = (e, payload, label) => {
    e.preventDefault(); e.stopPropagation();
    const R = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    const at = (x, y) => document.elementFromPoint(x, y)?.closest('[data-drop]')?.dataset.drop ?? null;
    const d0 = { payload, label, dx: sx - R.left, dy: sy - R.top, w: R.width, h: R.height };
    const mv = (ev) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
      moved = true;
      setDrag({ ...d0, x: ev.clientX, y: ev.clientY, over: at(ev.clientX, ev.clientY) });
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      setDrag(null);
      if (!moved) return onTap?.(payload);
      onDrop(payload, at(ev.clientX, ev.clientY));
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  const ghost = drag && (
    <div className="ar-chip floating" style={{ position: 'fixed', left: drag.x - drag.dx, top: drag.y - drag.dy, minWidth: drag.w, height: drag.h }}>{drag.label}</div>
  );
  return { drag, start, ghost };
}

/* عرض ملف مرفوع (صورة / صوت / رابط) */
export function FileAnswer({ url, name }) {
  if (!url) return null;
  if (isImg(url)) return <img src={url} alt="" onClick={() => openFile({ url, name })} className="qt-thumb" />;
  if (isAud(url)) return <audio controls src={url} style={{ width: '100%', maxWidth: 420 }} />;
  return <button type="button" className="chip" style={{ cursor: 'pointer', border: 0 }} onClick={() => openFile({ url, name })}>📎 {name || decodeURIComponent(url.split('/').pop())}</button>;
}

/* شريط رفع */
function Progress({ pct }) {
  return <div className="qt-up"><div className="bar thin"><i style={{ width: pct + '%' }} /></div><span>جارٍ الرفع… {pct}%</span></div>;
}

/* تحويل التسجيل (webm/ogg من المتصفح) إلى WAV أحادي 16kHz — السيرفر يقبل wav/mp3 فقط */
async function toWav(blob) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const rate = 16000;
    const off = new OfflineAudioContext(1, Math.ceil(buf.duration * rate), rate);
    const src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start();
    const pcm = (await off.startRendering()).getChannelData(0);
    const out = new DataView(new ArrayBuffer(44 + pcm.length * 2));
    const w = (o, str) => [...str].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); out.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
    out.setUint32(24, rate, true); out.setUint32(28, rate * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
    w(36, 'data'); out.setUint32(40, pcm.length * 2, true);
    for (let i = 0; i < pcm.length; i++) { const v = Math.max(-1, Math.min(1, pcm[i])); out.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true); }
    return new Blob([out], { type: 'audio/wav' });
  } finally { ctx.close().catch(() => {}); }
}

/* المسجّل الصوتي: إذن الميكروفون، مؤشر المستوى، مؤقت، إيقاف تلقائي، حد أدنى، تشغيل، إعادة، رفع */
function Recorder({ value, onChange, readOnly, maxSeconds = 120, minSeconds }) {
  const [st, setSt] = useState('idle');     // idle | rec | done | up
  const [sec, setSec] = useState(0);
  const [lvl, setLvl] = useState(0);
  const [blobUrl, setBlobUrl] = useState(null);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState(null);
  const R = useRef({});
  const release = () => {
    const r = R.current;
    clearInterval(r.t); cancelAnimationFrame(r.raf);
    r.stream?.getTracks().forEach(t => t.stop()); r.ctx?.close().catch(() => {});
    R.current = { blob: r.blob };
  };
  useEffect(() => () => release(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setErr(null); stopAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
        R.current.blob = blob;
        setBlobUrl(URL.createObjectURL(blob));
        setSt('done'); release();
      };
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const an = ctx.createAnalyser(); an.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const loop = () => { an.getByteFrequencyData(buf); setLvl(Math.min(1, buf.reduce((a, b) => a + b, 0) / buf.length / 90)); R.current.raf = requestAnimationFrame(loop); };
      R.current = { stream, rec, ctx, t0: Date.now() };
      loop();
      R.current.t = setInterval(() => {
        const n = Math.floor((Date.now() - R.current.t0) / 1000);
        setSec(n);
        if (n >= maxSeconds) stop();
      }, 250);
      rec.start(); setSec(0); setSt('rec');
    } catch (e) {
      setErr(e?.name === 'NotAllowedError' ? 'لم يُسمح باستخدام الميكروفون — اسمح به من إعدادات المتصفح (رمز القفل بجانب العنوان) ثم أعد المحاولة.' : 'تعذّر تشغيل الميكروفون على هذا الجهاز.');
    }
  };
  const stop = () => { const r = R.current.rec; if (r && r.state === 'recording') r.stop(); };
  const upload = async () => {
    const b = R.current.blob; if (!b) return;
    setSt('up'); setPct(0);
    try {
      const wav = await toWav(b);
      const res = await uploadFiles(new File([wav], `recording-${Date.now()}.wav`, { type: 'audio/wav' }), setPct);
      onChange(absUrl(res.url)); setSt('idle'); setBlobUrl(null);
      showToast('تم حفظ التسجيل ✓', '🎙');
    } catch (e) { showToast(e.message, '⚠️'); setSt('done'); }
  };
  const mm = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  const short = minSeconds && sec < minSeconds;

  if (readOnly) return value ? <FileAnswer url={value} /> : <div className="qt-muted">لا يوجد تسجيل</div>;
  return (
    <div className="qt-rec">
      {value && st === 'idle' && (
        <div className="qt-saved"><span>✓ تسجيلك المحفوظ</span><FileAnswer url={value} /></div>
      )}
      {st === 'rec' && (
        <div className="qt-rec-live">
          <span className="dot" />
          <b>{mm(sec)}</b><small>/ {mm(maxSeconds)}</small>
          <div className="qt-meter">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ transform: `scaleY(${0.15 + lvl * (0.5 + 0.5 * Math.abs(Math.sin(i * 1.7 + sec)))})` }} />)}</div>
        </div>
      )}
      {st === 'done' && blobUrl && <audio controls src={blobUrl} style={{ width: '100%' }} />}
      {st === 'up' && <Progress pct={pct} />}
      {err && <div className="qt-err">🎙 {err}</div>}
      <div className="qt-row">
        {st === 'idle' && <button type="button" className="btn btn-primary qt-mic" onClick={start}>🎙 {value ? 'سجّل من جديد' : 'ابدأ التسجيل'}</button>}
        {st === 'rec' && <button type="button" className="btn btn-primary" disabled={short} onClick={stop} style={{ opacity: short ? 0.55 : 1, background: '#ef4444' }}>
          ⏹ {short ? `سجّل ${minSeconds} ثانية على الأقل` : 'تم'}
        </button>}
        {st === 'done' && <>
          <button type="button" className="btn btn-primary" onClick={upload}>✓ اعتمد التسجيل</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setBlobUrl(null); start(); }}>↺ سجّل من جديد</button>
        </>}
      </div>
    </div>
  );
}

/* ===== 1) multi_select — كروت كلمات قابلة للاختيار (علامة ✓ تقفز في الركن) ===== */
const MS_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#14b8a6'];
function MultiSelect({ q, value, onChange, readOnly, model }) {
  const sel = Array.isArray(value) ? value.map(s) : [];
  const right = (model?.option_ids || []).map(s);
  const opts = q.options || [];
  const pics = opts.some(o => o.image);
  const toggle = (id) => { if (readOnly) return; clickSound(); const n = sel.includes(s(id)) ? sel.filter(x => x !== s(id)) : [...sel, s(id)]; onChange(n.length ? n : undefined); };
  return (
    <>
      {!readOnly && <div className="ms-tip">☑️ اختر كل الإجابات الصحيحة — قد تكون أكثر من واحدة</div>}
      <div className={'ms-grid' + (pics ? ' pics' : '')}>
        {opts.map((o, k) => {
          const on = sel.includes(s(o.id));
          const st = model ? (right.includes(s(o.id)) ? (on ? ' ok' : ' miss') : on ? ' bad' : '') : '';
          return (
            <button key={o.id} type="button" className={'ms-card' + (on ? ' on' : '') + st} disabled={readOnly} onClick={() => toggle(o.id)}
              style={{ '--c': MS_COLORS[k % MS_COLORS.length], animationDelay: k * 0.05 + 's' }}>
              <span className="ms-tick">✓</span>
              {o.image && <img src={o.image} alt="" />}
              <span className="ms-t">{o.text}</span>
              {o.text_en && <span className="ms-en">{o.text_en}</span>}
              {o.audio && <span className="qt-spk" onClick={(e) => { e.stopPropagation(); playClip(o.audio); }}>🔊</span>}
            </button>
          );
        })}
      </div>
      {!readOnly && (
        <div className="ms-foot">
          <span className={'ms-count' + (sel.length ? ' on' : '')}>اخترت <b>{sel.length}</b></span>
          {sel.length > 0 && <button type="button" className="hint-btn" onClick={() => { clickSound(); onChange(undefined); }}>↺ مسح الاختيار</button>}
        </div>
      )}
    </>
  );
}

/* ===== 2) drag_drop ===== */
function DragDropQ({ q, value, onChange, readOnly, model }) {
  const place = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const zones = q.zones || [], items = q.items || [];
  const [sel, setSel] = useState(null);
  const POOL = '__pool';
  const put = (id, z) => {
    if (readOnly) return;
    clickSound();
    const n = { ...place };
    if (z === POOL || z == null) delete n[s(id)]; else n[s(id)] = s(z);
    onChange(Object.keys(n).length ? n : undefined); setSel(null);
  };
  const { drag, start, ghost } = useDrag((id, z) => z != null && put(id, z), (id) => (place[s(id)] ? put(id, POOL) : setSel(x => (x === id ? null : id))));
  const rightZone = (id) => model?.placement?.find(p => s(p.item_id) === s(id))?.zone;
  const chip = (it) => (
    <button key={it.id} type="button" className={'ar-chip' + (place[s(it.id)] ? ' in' : '') + (sel === it.id ? ' in' : '') + (drag?.payload === it.id ? ' ghosted' : '')}
      disabled={readOnly} onPointerDown={readOnly ? undefined : (e) => start(e, it.id, it.text)}>
      {it.image && <img src={it.image} alt="" className="qt-chip-img" />}{it.text}
      {model && rightZone(it.id) && place[s(it.id)] && <small className="qt-right">← {rightZone(it.id)}</small>}
    </button>
  );
  const pool = items.filter(it => !place[s(it.id)]);
  return (
    <>
      {!readOnly && (
        <div data-drop={POOL} className={'g-pool' + (drag?.over === POOL ? ' dd-hot' : '')}>
          {pool.map(chip)}
          {!pool.length && <span className="g-pool-done">✓ وضعت كل العناصر</span>}
        </div>
      )}
      <div className="qt-row" style={{ justifyContent: 'space-between' }}>
        <span className="qt-muted">{items.length - pool.length} / {items.length} في مكانها</span>
        {!readOnly && Object.keys(place).length > 0 && <button type="button" className="hint-btn" onClick={() => { clickSound(); onChange(undefined); }}>↺ إعادة</button>}
      </div>
      <div className="g-zones">
        {zones.map((z, i) => (
          <div key={z.id} data-drop={z.id} onClick={() => sel != null && put(sel, z.id)}
            className={'g-zone' + (drag?.over === s(z.id) ? ' hot' : '') + (sel != null ? ' ready' : '')} style={{ '--c': ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6'][i % 6] }}>
            <div className="g-zone-h"><span>{z.label}</span><small>{items.filter(it => place[s(it.id)] === s(z.id)).length}</small></div>
            {z.image && <img src={z.image} alt="" className="qt-zone-img" />}
            <div className="g-zone-b">
              {items.filter(it => place[s(it.id)] === s(z.id)).map(chip)}
              {!items.some(it => place[s(it.id)] === s(z.id)) && <span className="g-zone-ph">أفلت هنا</span>}
            </div>
          </div>
        ))}
      </div>
      {readOnly && pool.length > 0 && <div className="qt-muted">لم توضع: {pool.map(i => i.text).join('، ')}</div>}
      {ghost}
    </>
  );
}

/* صورة بإحداثيات نسبية (المربع = الصورة نفسها) */
function PctImage({ src, children, onPick, cursor }) {
  const ref = useRef(null);
  const click = (e) => {
    if (!onPick) return;
    const r = ref.current.getBoundingClientRect();
    onPick({ x: Math.round(((e.clientX - r.left) / r.width) * 1000) / 10, y: Math.round(((e.clientY - r.top) / r.height) * 1000) / 10 });
  };
  return (
    <div className="qt-pimg">
      <div className="qt-pimg-in" ref={ref} onClick={click} style={{ cursor }}>
        <img src={src} alt="" draggable={false} />
        {children}
      </div>
    </div>
  );
}

/* ===== 3) labeling ===== */
function Labeling({ q, value, onChange, readOnly, model }) {
  const v = value && typeof value === 'object' ? value : {};
  const [open, setOpen] = useState(null);
  const set = (spot, label) => {
    if (readOnly) return;
    clickSound();
    const n = { ...v };
    if (label == null) delete n[s(spot)]; else n[s(spot)] = label;
    onChange(Object.keys(n).length ? n : undefined); setOpen(null);
  };
  const { drag, start, ghost } = useDrag((label, spot) => spot != null && set(spot, label));
  const rightOf = (id) => model?.spots?.find(x => s(x.spot_id) === s(id))?.label;
  return (
    <>
      <PctImage src={q.image}>
        {(q.spots || []).map((sp, i) => (
          <button key={sp.id} type="button" data-drop={sp.id} className={'qt-spot' + (v[s(sp.id)] ? ' on' : '') + (drag?.over === s(sp.id) ? ' hot' : '') + (open === sp.id ? ' open' : '')}
            style={{ left: sp.x + '%', top: sp.y + '%' }} onClick={(e) => { e.stopPropagation(); if (!readOnly) { clickSound(); setOpen(open === sp.id ? null : sp.id); } }}>
            <b>{i + 1}</b>{v[s(sp.id)] && <span>{v[s(sp.id)]}</span>}
            {model && rightOf(sp.id) && <em>✓ {rightOf(sp.id)}</em>}
          </button>
        ))}
      </PctImage>
      {open != null && !readOnly && (
        <div className="qt-sheet">
          <div className="qt-sheet-h">اختر تسمية للعلامة {(q.spots || []).findIndex(x => x.id === open) + 1}<button type="button" onClick={() => setOpen(null)}>✕</button></div>
          <div className="ar-bank">
            {(q.labels || []).map(l => <button key={l} type="button" className={'ar-chip' + (v[s(open)] === l ? ' in' : '')} onClick={() => set(open, l)}>{l}</button>)}
            {v[s(open)] && <button type="button" className="hint-btn" onClick={() => set(open, null)}>مسح</button>}
          </div>
        </div>
      )}
      {!readOnly && <>
        <div className="g-tip">👆 اسحب التسمية إلى العلامة المناسبة، أو اضغط العلامة لتختار</div>
        <div className="ar-bank">{(q.labels || []).map(l => <button key={l} type="button" className="ar-chip" onPointerDown={(e) => start(e, l, l)}>{l}</button>)}</div>
      </>}
      {ghost}
    </>
  );
}

/* ===== 4) dropdown_fill — الجملة في بطاقة بفراغات مسطّرة + بنك كلمات للفراغ النشط (اضغط أو اسحب الكلمة) ===== */
export function DropdownFill({ q, value, onChange, readOnly, model }) {
  const v = value && typeof value === 'object' ? value : {};
  const blanks = Object.fromEntries((q.blanks || []).map(b => [s(b.id), b]));
  const ids = Object.keys(blanks);
  const [act, setAct] = useState(() => ids.find(k => !v[k]) ?? ids[0]);
  const right = (id) => model?.blanks?.find(b => s(b.id) === s(id))?.answer;
  const fill = (id, o) => {
    if (readOnly || id == null) return;
    clickSound();
    const n = { ...v };
    if (o == null) delete n[id]; else n[id] = o;
    onChange(Object.keys(n).length ? n : undefined);
    if (o != null) { const nx = ids.find(k => !n[k] && ids.indexOf(k) > ids.indexOf(id)) ?? ids.find(k => !n[k]); if (nx) setAct(nx); }
  };
  const { drag, start, ghost } = useDrag((o, id) => id != null && fill(id, o), (o) => fill(act, o));
  const parts = String(q.text || '').split(/(\[\[\s*[^\]]+\s*\]\])/);
  const filled = ids.filter(k => v[k]).length;
  const opts = blanks[act]?.options || [];
  return (
    <>
      <div className="dfx-card" dir="rtl">
        {parts.map((p, i) => {
          const m = p.match(/^\[\[\s*([^\]]+?)\s*\]\]$/);
          if (!m) return <span key={i}>{p}</span>;
          const id = m[1];
          const r = model ? right(id) : null;
          const st = model ? (r && v[id] === r ? ' ok' : v[id] ? ' bad' : '') : '';
          return (
            <span key={i} className="dfx-wrap">
              <button type="button" data-drop={id} disabled={readOnly}
                className={'dfx-blank' + (v[id] ? ' on' : '') + (act === id && !readOnly ? ' act' : '') + (drag?.over === id ? ' hot' : '') + st}
                onClick={() => { if (v[id] && act === id) fill(id, null); else { clickSound(); setAct(id); } }}>
                {v[id] ? <span className="w" key={v[id]}>{v[id]}</span> : <span className="ph">{ids.length > 1 ? ids.indexOf(id) + 1 : ''}</span>}
              </button>
              {model && r && v[id] !== r && <small className="df-right">✓ {r}</small>}
            </span>
          );
        })}
      </div>
      {!readOnly && <>
        <div className="dfx-bank-h">
          <span>{ids.length > 1 ? `كلمات الفراغ ${ids.indexOf(act) + 1}` : 'اختر الكلمة المناسبة'}</span>
          {ids.length > 1 && <span className={'ms-count' + (filled ? ' on' : '')}>أكملت <b>{filled}</b> / {ids.length}</span>}
        </div>
        <div className="dfx-bank" key={act}>
          {opts.map((o, k) => (
            <button key={o} type="button" className={'dfx-word' + (v[act] === o ? ' used' : '') + (drag?.payload === o ? ' ghosted' : '')} style={{ animationDelay: k * 0.05 + 's' }}
              onPointerDown={(e) => start(e, o, o)}>{o}</button>
          ))}
        </div>
        <div className="g-tip">👆 اضغط الكلمة أو اسحبها إلى الفراغ · اضغط الفراغ المملوء مرتين لمسحه</div>
      </>}
      {ghost}
    </>
  );
}

/* ===== 5) grammar_transform — «آلة التحويل»: بطاقة الأصل ← سهم متحرك ← بطاقة الناتج (يكتب فيها الطالب) + شريط تشكيل ===== */
const HARAKAT = [['َ', 'فتحة'], ['ُ', 'ضمة'], ['ِ', 'كسرة'], ['ْ', 'سكون'], ['ّ', 'شدة'], ['ً', 'تنوين فتح'], ['ٌ', 'تنوين ضم'], ['ٍ', 'تنوين كسر']];
function GrammarTransform({ q, value, onChange, readOnly }) {
  const inp = useRef(null);
  const [from, to] = String(q.transformation_type || '').split(/\s*[←→]\s*/);
  const val = value ?? '';
  // إدراج الحركة عند موضع المؤشر
  const addHaraka = (h) => {
    const el = inp.current; if (!el) return;
    const a = el.selectionStart ?? val.length, b = el.selectionEnd ?? val.length;
    const n = val.slice(0, a) + h + val.slice(b);
    onChange(n || undefined); clickSound();
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + h.length, a + h.length); });
  };
  return (
    <>
      <div className={'gt-machine' + (val ? ' done' : '')}>
        <div className="gt-card src">
          <span className="gt-tag">{from || 'الأصل'}</span>
          <div className="gt-word">{q.source_text}</div>
        </div>
        <div className="gt-arrow" aria-hidden><span>⟵</span><i /><i /><i /></div>
        <div className="gt-card out">
          <span className="gt-tag">{to || 'بعد التحويل'}</span>
          <input ref={inp} dir="rtl" className="gt-input" readOnly={readOnly} value={val} placeholder="اكتب هنا…"
            onChange={e => onChange(e.target.value || undefined)} />
        </div>
      </div>
      {(q.verb_form || q.diacritics) && (
        <div className="gt-rules">
          <span>📌 انتبه:</span>
          {q.verb_form && <span className="chip">{q.verb_form}</span>}
          {q.diacritics && <span className="chip">{q.diacritics}</span>}
        </div>
      )}
      {!readOnly && (
        <div className="gt-keys">
          <span className="l">✍️ أضف التشكيل (اختياري):</span>
          {HARAKAT.map(([h, t]) => <button key={h} type="button" title={t} onMouseDown={e => e.preventDefault()} onClick={() => addHaraka(h)}>{'ـ' + h}</button>)}
        </div>
      )}
    </>
  );
}

/* ===== 6) error_correction — وضعان: rewrite (أعد كتابة النص) · tap (اضغط الكلمات الخاطئة → [indexes]) ===== */
function ErrorCorrection(props) {
  return props.q.mode === 'tap' ? <ErrorTap {...props} /> : <ErrorRewrite {...props} />;
}
function ErrorTap({ q, value, onChange, readOnly, model }) {
  const sel = Array.isArray(value) ? value.map(Number) : [];
  const right = (model?.indexes || []).map(Number);
  const list = q.words?.length ? q.words : String(q.text_with_errors || '').split(/\s+/).map((word, index) => ({ index, word }));
  const toggle = (i) => { if (readOnly) return; clickSound(); const n = sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i]; onChange(n.length ? n.sort((a, b) => a - b) : undefined); };
  return (
    <>
      {!readOnly && (
        <div className="hl-bar et-bar">
          <span className="hl-pen">🔍</span>
          <span className="hl-l">اضغط على الكلمة أو الكلمات الخاطئة</span>
          <span className={'ms-count' + (sel.length ? ' on' : '')}>حدّدت <b>{sel.length}</b></span>
          {sel.length > 0 && <button type="button" className="hint-btn" onClick={() => { clickSound(); onChange(undefined); }}>مسح</button>}
        </div>
      )}
      <div className="hl-paper" dir="rtl">
        {list.map(w => {
          const i = Number(w.index);
          const on = sel.includes(i), ok = right.includes(i);
          const st = model ? (ok && on ? ' ok' : on ? ' bad' : ok ? ' miss' : '') : '';
          return <span key={i} role="button" tabIndex={readOnly ? -1 : 0} className={'et-w' + (on ? ' on' : '') + st} onClick={() => toggle(i)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(i))}>{w.word}</span>;
        })}
      </div>
      {model?.text && <div className="g-answer">الجملة الصحيحة: <b>{model.text}</b></div>}
    </>
  );
}
function ErrorRewrite({ q, value, onChange, readOnly }) {
  return (
    <>
      <div className="qt-src warn"><span className="l">⚠️ النص فيه أخطاء</span><div className="t">{q.text_with_errors}</div></div>
      <textarea className="eng-input qt-input" dir="rtl" rows={4} readOnly={readOnly} value={value ?? q.text_with_errors ?? ''} onChange={e => onChange(e.target.value)} />
      {!readOnly && <div className="qt-row"><span className="qt-muted" style={{ flex: 1 }}>صحّح الأخطاء داخل النص مباشرة</span>
        <button type="button" className="hint-btn" onClick={() => { clickSound(); onChange(undefined); }}>↺ إعادة النص الأصلي</button></div>}
    </>
  );
}

/* ===== 7) hotspot — دبابيس تنغرس في الصورة (سنّ الدبوس على النقطة فلا تُغطّى) + موجة عند الضغط + خانات الدبابيس ===== */
function HotspotFind({ q, value, onChange, readOnly, model }) {
  const pts = Array.isArray(value) ? value : [];
  const max = q.picks || 1;
  const [ripple, setRipple] = useState(null);
  const full = pts.length >= max;
  const add = (p) => {
    if (readOnly) return;
    setRipple({ ...p, k: Date.now() });
    if (full) { showToast(`حدّدت ${max} ${max > 1 ? 'أماكن' : 'مكاناً'} — اضغط دبوساً لحذفه أولاً`, '📍'); return; }
    clickSound(); onChange([...pts, p]);
  };
  const del = (i) => { if (readOnly) return; clickSound(); const n = pts.filter((_, k) => k !== i); onChange(n.length ? n : undefined); };
  return (
    <>
      {!readOnly && (
        <div className="hs-bar">
          <span className="hs-l">🎯 اضغط على المكان الصحيح في الصورة</span>
          <span className="hs-slots">
            {Array.from({ length: max }, (_, k) => <i key={k} className={k < pts.length ? 'on' : ''}>📍</i>)}
          </span>
          {pts.length > 0 && <button type="button" className="hint-btn" onClick={() => { clickSound(); onChange(undefined); }}>↺ إعادة</button>}
        </div>
      )}
      <div className={'hs-frame' + (full && !readOnly ? ' full' : '')}>
        <PctImage src={q.image} onPick={readOnly ? null : add} cursor={readOnly ? 'default' : 'crosshair'}>
          {(model?.spots || []).map(sp => <span key={sp.id} className="qt-hz" style={{ left: sp.x + '%', top: sp.y + '%', width: (sp.radius || 5) * 2 + '%' }} title={sp.label} />)}
          {ripple && <span key={ripple.k} className="hs-ripple" style={{ left: ripple.x + '%', top: ripple.y + '%' }} />}
          {pts.map((p, i) => (
            <button key={i + '-' + p.x + '-' + p.y} type="button" className="hs-pin" style={{ left: p.x + '%', top: p.y + '%' }} title={readOnly ? '' : 'اضغط للحذف'}
              onClick={(e) => { e.stopPropagation(); del(i); }}>
              <span className="head"><b>{max > 1 ? i + 1 : '✓'}</b></span><span className="tip" />
            </button>
          ))}
        </PctImage>
      </div>
    </>
  );
}

/* ===== 8) highlight — «قلم التظليل»: النص على ورقة مسطّرة، والضغط يمرّر قلماً فسفورياً على الكلمة ===== */
function Highlight({ q, value, onChange, readOnly, model }) {
  const sel = Array.isArray(value) ? value.map(Number) : [];
  const right = (model?.indexes || []).map(Number);
  const toggle = (i) => { if (readOnly) return; clickSound(); const n = sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i]; onChange(n.length ? n.sort((a, b) => a - b) : undefined); };
  const list = q.words?.length ? q.words : String(q.text || '').split(/\s+/).map((word, index) => ({ index, word }));
  return (
    <>
      {!readOnly && (
        <div className="hl-bar">
          <span className="hl-pen">🖍</span>
          <span className="hl-l">ظلّل الكلمات المطلوبة بالضغط عليها{q.text_en ? <small dir="ltr">{q.text_en}</small> : null}</span>
          <span className={'ms-count' + (sel.length ? ' on' : '')}>ظلّلت <b>{sel.length}</b></span>
          {sel.length > 0 && <button type="button" className="hint-btn" onClick={() => { clickSound(); onChange(undefined); }}>🧽 مسح</button>}
        </div>
      )}
      <div className="hl-paper" dir="rtl">
        {list.map(w => {
          const i = Number(w.index);
          const on = sel.includes(i), ok = right.includes(i);
          const st = model ? (ok && on ? ' ok' : on ? ' bad' : ok ? ' miss' : '') : '';
          return (
            <span key={i} role="button" tabIndex={readOnly ? -1 : 0} className={'hl-w' + (on ? ' on' : '') + st}
              onClick={() => toggle(i)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(i))}>{w.word}</span>
          );
        })}
      </div>
    </>
  );
}

/* ===== 9) image_description ===== */
function ImageDescription({ q, value, onChange, readOnly }) {
  const n = words(value);
  const min = q.min_words;
  return (
    <>
      {q.image && <div className="q-img"><img src={q.image} alt="" onClick={() => openFile({ url: q.image })} style={{ cursor: 'zoom-in' }} /></div>}
      {q.guiding_questions?.length > 0 && (
        <div className="qt-guide"><b>أسئلة تساعدك</b><ul>{q.guiding_questions.map((g, i) => <li key={i}>{g}</li>)}</ul></div>
      )}
      <textarea className="eng-input qt-input" dir="rtl" rows={6} readOnly={readOnly} value={value ?? ''} onChange={e => onChange(e.target.value || undefined)} placeholder="صف الصورة بجمل كاملة…" />
      <div className="qt-muted" style={{ color: min && n < min ? 'var(--orange)' : undefined }}>{n}{min ? ` / ${min}` : ''} كلمة</div>
    </>
  );
}

/* ===== 10) drawing — «كرّاسة الخط»: ورقة بسطور كتابة (أو مربعات/بيضاء) وشريط أدوات عائم فوقها ===== */
const PENS = ['#1e293b', '#2563eb', '#dc2626', '#16a34a'];
const SIZES = [3, 6, 11];
const PAPERS = [['lines', '📝 سطور'], ['grid', '▦ مربعات'], ['plain', '⬜ بيضاء']];
/* رسم خلفية الورقة على canvas (للتصدير) */
function paintPaper(o, w, h, paper, k) {
  o.fillStyle = '#fffdf7'; o.fillRect(0, 0, w, h);
  o.lineWidth = 1 * k;
  if (paper === 'lines') {
    const gap = 70 * k;
    for (let y = gap; y < h; y += gap) {
      o.strokeStyle = '#93c5fd'; o.setLineDash([]); o.beginPath(); o.moveTo(0, y); o.lineTo(w, y); o.stroke();
      o.strokeStyle = '#dbeafe'; o.setLineDash([6 * k, 6 * k]); o.beginPath(); o.moveTo(0, y - gap / 2); o.lineTo(w, y - gap / 2); o.stroke();
    }
    o.setLineDash([]);
  } else if (paper === 'grid') {
    o.strokeStyle = '#e2e8f0';
    for (let x = 0; x < w; x += 28 * k) { o.beginPath(); o.moveTo(x, 0); o.lineTo(x, h); o.stroke(); }
    for (let y = 0; y < h; y += 28 * k) { o.beginPath(); o.moveTo(0, y); o.lineTo(w, y); o.stroke(); }
  }
}
function DrawingFree({ q, value, onChange, readOnly }) {
  const cv = useRef(null);
  const hist = useRef([]);
  const bg = q.background_image || null;   // الصورة كما ترجع من الباك اند
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState(PENS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [paper, setPaper] = useState(bg ? 'plain' : 'lines');
  const [pct, setPct] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [redo, setRedo] = useState(!value);
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const r = c.getBoundingClientRect();
    c.width = r.width * 2; c.height = r.height * 2;
    const x = c.getContext('2d'); x.scale(2, 2); x.lineCap = 'round'; x.lineJoin = 'round';
    hist.current = []; setDirty(false);
  }, [redo]);
  const pos = (e) => { const r = cv.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = (e) => {
    const c = cv.current, x = c.getContext('2d');
    hist.current.push(x.getImageData(0, 0, c.width, c.height)); if (hist.current.length > 30) hist.current.shift();
    c.setPointerCapture(e.pointerId);
    x.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    x.strokeStyle = color; x.lineWidth = tool === 'eraser' ? size * 4 : size;
    const [px, py] = pos(e);
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + 0.1, py + 0.1); x.stroke();
    c._on = true; setDirty(true);
  };
  const move = (e) => { const c = cv.current; if (!c._on) return; const x = c.getContext('2d'); const [px, py] = pos(e); x.lineTo(px, py); x.stroke(); };
  const up = () => { if (cv.current) cv.current._on = false; };
  const undo = () => { const h = hist.current.pop(); if (h) { cv.current.getContext('2d').putImageData(h, 0, 0); clickSound(); } if (!hist.current.length) setDirty(false); };
  const clear = () => { const c = cv.current; hist.current.push(c.getContext('2d').getImageData(0, 0, c.width, c.height)); c.getContext('2d').clearRect(0, 0, c.width, c.height); clickSound(); setDirty(false); };
  const save = async () => {
    const c = cv.current;
    const out = document.createElement('canvas'); out.width = c.width; out.height = c.height;
    const o = out.getContext('2d');
    paintPaper(o, out.width, out.height, paper, 2);
    if (bg) {
      await new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { const k = Math.min(out.width / im.width, out.height / im.height); o.drawImage(im, (out.width - im.width * k) / 2, (out.height - im.height * k) / 2, im.width * k, im.height * k); res(); }; im.onerror = res; im.src = bg; });
    }
    o.drawImage(c, 0, 0);
    let blob;
    try { blob = await new Promise(r => out.toBlob(r, 'image/png')); } catch { blob = await new Promise(r => c.toBlob(r, 'image/png')); }
    setPct(0);
    try { const res = await uploadFiles(new File([blob], `drawing-${Date.now()}.png`, { type: 'image/png' }), setPct); onChange(absUrl(res.url)); setRedo(false); showToast('تم حفظ الرسم ✓', '🎨'); }
    catch (e) { showToast(e.message, '⚠️'); }
    setPct(null);
  };
  if (readOnly || (value && !redo)) return (
    <div className="dr-saved">
      {value ? <FileAnswer url={value} /> : <div className="qt-muted">لا يوجد رسم</div>}
      {!readOnly && <div className="qt-row" style={{ justifyContent: 'center' }}><span className="ms-count on">✓ تم حفظ رسمك</span><button type="button" className="hint-btn" onClick={() => setRedo(true)}>🎨 ارسم من جديد</button></div>}
    </div>
  );
  return (
    <>
      {q.instructions && <div className="dr-note">💡 {q.instructions}</div>}
      <div className={'dr-book p-' + paper}>
        <div className="dr-tools">
          <button type="button" title="قلم" className={tool === 'pen' ? 'on' : ''} onClick={() => setTool('pen')}>✏️</button>
          <button type="button" title="ممحاة" className={tool === 'eraser' ? 'on' : ''} onClick={() => setTool('eraser')}>🧽</button>
          <i className="sep" />
          {PENS.map(c => <button key={c} type="button" className={'dr-dot' + (color === c && tool === 'pen' ? ' on' : '')} style={{ '--c': c }} onClick={() => { setColor(c); setTool('pen'); }} />)}
          <i className="sep" />
          {SIZES.map(z => <button key={z} type="button" title="السُّمك" className={'dr-size' + (size === z ? ' on' : '')} onClick={() => setSize(z)}><span style={{ width: z + 3, height: z + 3 }} /></button>)}
          <i className="sep" />
          <button type="button" title="تراجع" onClick={undo}>↶</button>
          <button type="button" title="مسح الكل" onClick={clear}>🗑</button>
        </div>
        <div className="dr-sheet" style={bg ? { backgroundImage: `url("${bg}")` } : undefined}>
          <canvas ref={cv} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
          {!dirty && <span className="dr-hint">✍️ اكتب أو ارسم هنا</span>}
        </div>
      </div>
      <div className="dr-foot">
        {!bg && <div className="dr-papers">{PAPERS.map(([k, t]) => <button key={k} type="button" className={paper === k ? 'on' : ''} onClick={() => setPaper(k)}>{t}</button>)}</div>}
        {pct != null ? <Progress pct={pct} /> : <button type="button" className="btn btn-primary" disabled={!dirty} style={{ opacity: dirty ? 1 : 0.5 }} onClick={save}>💾 حفظ الرسم</button>}
      </div>
    </>
  );
}

/* ===== 11) table_organizer — خانات الاختيار فراغات منقّطة + بنك كلمات للخانة النشطة (اضغط أو اسحب)؛ الخانات الحرة للكتابة ===== */
function TableOrganizer({ q, value, onChange, readOnly, model }) {
  const v = value && typeof value === 'object' ? value : {};
  const rows = q.rows || [];
  const choiceCells = rows.flatMap((row, ri) => row.filter(c => c?.blank != null && c.options?.length).map(c => ({ ...c, ri })));
  const [act, setAct] = useState(() => choiceCells.find(c => !v[s(c.blank)])?.blank ?? choiceCells[0]?.blank ?? null);
  const [focus, setFocus] = useState(null);
  const right = (k) => model?.cells?.find(c => s(c.key) === s(k))?.answer;
  const setCell = (key, val) => {
    const n = { ...v };
    if (val) n[s(key)] = val; else delete n[s(key)];
    onChange(Object.keys(n).length ? n : undefined);
    return n;
  };
  const fill = (key, o) => {
    if (readOnly || key == null) return;
    clickSound();
    const n = setCell(key, o);
    if (o) { const nx = choiceCells.find(c => !n[s(c.blank)]); if (nx) setAct(nx.blank); }
  };
  const { drag, start, ghost } = useDrag((o, key) => key != null && fill(key, o), (o) => fill(act, o));
  const actCell = choiceCells.find(c => s(c.blank) === s(act));
  const actRow = actCell?.ri;
  const filled = choiceCells.filter(c => v[s(c.blank)]).length;
  return (
    <>
      <div className="qt-table-wrap">
        <table className="qt-table tb-x">
          <thead><tr>{(q.columns || []).map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={focus === ri || (!readOnly && actRow === ri) ? 'focus' : ''}>
                {row.map((cell, ci) => {
                  if (cell?.blank == null) return <td key={ci}>{cell?.text ?? ''}</td>;
                  const key = s(cell.blank), val = v[key], r = model ? right(key) : null;
                  const st = model ? (r && val === r ? ' ok' : val ? ' bad' : '') : '';
                  return (
                    <td key={ci}>
                      {cell.options?.length && s(act) === key && !readOnly ? (
                        /* الخانة النشطة: الكلمات داخل الخانة نفسها */
                        <div className="tb-pick">
                          {cell.options.map((o, k) => (
                            <button key={o} type="button" className={'tb-opt' + (val === o ? ' on' : '')} style={{ animationDelay: k * 0.04 + 's' }}
                              onClick={() => fill(key, val === o ? null : o)}>{o}</button>
                          ))}
                        </div>
                      ) : cell.options?.length ? (
                        <button type="button" data-drop={key} disabled={readOnly}
                          className={'tb-slot' + (val ? ' on' : '') + (s(act) === key && !readOnly ? ' act' : '') + (drag?.over === key ? ' hot' : '') + st}
                          onClick={() => { if (val && s(act) === key) fill(key, null); else { clickSound(); setAct(cell.blank); } }}>
                          {val ? <span className="w" key={val}>{val}</span> : <span className="ph">؟</span>}
                        </button>
                      ) : (
                        <input dir="rtl" readOnly={readOnly} placeholder="اكتب…" value={val ?? ''} onFocus={() => setFocus(ri)} onBlur={() => setFocus(null)}
                          onChange={e => setCell(key, e.target.value)} />
                      )}
                      {model && r && val !== r && <small className="qt-right">✓ {r}</small>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && choiceCells.length > 1 && <div className="ms-foot"><span className={'ms-count' + (filled ? ' on' : '')}>أكملت <b>{filled}</b> / {choiceCells.length}</span></div>}
      {ghost}
    </>
  );
}

/* ===== 12) listening ===== */
function Listening({ q, value, onChange, readOnly, model }) {
  const key = 'masar-plays-' + q.id;
  const [used, setUsed] = useState(() => { try { return +sessionStorage.getItem(key) || 0; } catch { return 0; } });
  const left = q.max_plays == null ? null : Math.max(0, q.max_plays - used);
  const play = () => {
    if (left === 0) return;
    playClip(q.audio);
    const n = used + 1; setUsed(n);
    try { sessionStorage.setItem(key, n); } catch { /* */ }
  };
  const right = (model?.option_ids || []).map(s);
  return (
    <>
      {q.audio && !readOnly && (
        <div className="qt-listen">
          <button type="button" className="qt-bigplay" disabled={left === 0} onClick={play}>▶</button>
          <div>{left == null ? 'استمع جيداً ثم أجب' : left > 0 ? `مرات الاستماع المتبقية: ${left}` : 'انتهت مرات الاستماع'}</div>
        </div>
      )}
      {q.answer_kind === 'choice' || q.options?.length ? (
        <div className="options">
          {(q.options || []).map(o => {
            const on = s(value) === s(o.id);
            return (
              <button key={o.id} type="button" className={'option' + (on ? ' selected' : '') + (model ? (right.includes(s(o.id)) ? ' correct' : on ? ' wrong' : '') : '')} disabled={readOnly}
                onClick={() => { clickSound(); onChange(s(o.id)); }}>
                {o.image && <img src={o.image} alt="" className="qt-opt-img" />}<span style={{ flex: 1 }}>{o.text}</span>
                {o.audio && <span className="qt-spk" onClick={(e) => { e.stopPropagation(); playClip(o.audio); }}>🔊</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <input className="eng-input qt-input" dir="rtl" readOnly={readOnly} value={value ?? ''} onChange={e => onChange(e.target.value || undefined)} placeholder="اكتب ما سمعت" />
      )}
    </>
  );
}

/* ===== 13) speaking_record ===== */
function SpeakingRecord({ q, value, onChange, readOnly }) {
  return (
    <>
      {q.prompt && <div className="qt-src"><span className="l">🎤 تحدّث عن</span><div className="t">{q.prompt}</div></div>}
      <Recorder value={value} onChange={onChange} readOnly={readOnly} maxSeconds={q.max_seconds || 120} minSeconds={q.min_seconds} />
    </>
  );
}

/* ===== 14) read_aloud ===== */
function ReadAloud({ q, value, onChange, readOnly }) {
  const [fs, setFs] = useState(24);
  const url = value && typeof value === 'object' ? value.audio_url : value;
  return (
    <>
      <div className="qt-row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="size-pill" onClick={() => setFs(f => Math.max(16, f - 3))}>A-</button>
        <button type="button" className="size-pill" onClick={() => setFs(f => Math.min(40, f + 3))}>A+</button>
      </div>
      <div className="qt-passage" style={{ fontSize: fs }}>{q.passage}</div>
      <Recorder value={url} onChange={(u) => onChange(u ? { audio_url: u } : undefined)} readOnly={readOnly} maxSeconds={q.max_seconds || 180} />
    </>
  );
}

/* ===== 15) media_response — خطوتان جنباً إلى جنب: ① شاهد/استمع ← ② أجب (كتابة أو تسجيل) ===== */
function MediaResponse({ q, value, onChange, readOnly, model }) {
  const [seen, setSeen] = useState(false);
  const video = q.media_type === 'video';
  const kind = q.response || q.answer_kind;
  const audioAns = kind === 'audio';
  const right = (model?.option_ids || []).map(s);
  const n = words(typeof value === 'string' ? value : '');
  return (
    <div className="mr-grid">
      <div className={'mr-step' + (seen ? ' done' : ' cur')}>
        <div className="mr-h"><span className="mr-n">{seen ? '✓' : '1'}</span>{video ? 'شاهد الفيديو' : 'استمع للمقطع'}</div>
        {q.media_url && (video
          ? <video className="mr-video" controls playsInline preload="metadata" src={q.media_url} onEnded={() => setSeen(true)} />
          : <div className="mr-audio"><span>🎧</span><audio controls src={q.media_url} onEnded={() => setSeen(true)} /></div>)}
        {!readOnly && <div className="qt-muted">{seen ? 'أحسنت! يمكنك المشاهدة مرة أخرى' : 'شاهده حتى النهاية — يمكنك الإعادة متى شئت'}</div>}
      </div>
      <div className={'mr-step' + (value ? ' done' : seen ? ' cur' : '')}>
        <div className="mr-h"><span className="mr-n">{value ? '✓' : '2'}</span>{audioAns ? 'سجّل إجابتك' : kind === 'choice' ? 'اختر الإجابة' : 'اكتب إجابتك'}</div>
        {kind === 'choice' ? (
          <div className="mr-choices">
            {(q.options || []).map(o => {
              const on = s(value) === s(o.id);
              return (
                <button key={o.id} type="button" disabled={readOnly} className={'option' + (on ? ' selected' : '') + (model ? (right.includes(s(o.id)) ? ' correct' : on ? ' wrong' : '') : '')}
                  onClick={() => { clickSound(); onChange(s(o.id)); }}>
                  {o.image && <img src={o.image} alt="" className="qt-opt-img" />}<span style={{ flex: 1 }}>{o.text}</span>
                </button>
              );
            })}
          </div>
        ) : audioAns
          ? <Recorder value={value} onChange={onChange} readOnly={readOnly} maxSeconds={q.max_seconds || 120} />
          : <>
            <textarea className="mr-text" dir="rtl" readOnly={readOnly} value={value ?? ''} onChange={e => onChange(e.target.value || undefined)}
              placeholder={video ? 'ماذا رأيت؟ صف ما شاهدته بجمل قصيرة…' : 'ماذا سمعت؟ اكتب بجمل قصيرة…'} />
            {!readOnly && <div className="qt-muted">{n} كلمة</div>}
          </>}
      </div>
    </div>
  );
}

/* ===== 16) file_upload ===== */
const MIME = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', doc: '.doc', docx: '.docx', mp3: 'audio/mpeg', mp4: 'video/mp4' };
function FileUploadQ({ q, value, onChange, readOnly }) {
  const urls = Array.isArray(value) ? value : [];
  const [pct, setPct] = useState(null);
  const [names, setNames] = useState({});
  const max = q.max_files || 10;
  const accept = (q.allowed_types || []).map(t => MIME[t] || '.' + t).join(',') || undefined;
  const pick = async (e) => {
    const files = [...e.target.files].slice(0, max - urls.length); e.target.value = '';
    if (!files.length) return;
    setPct(0);
    try {
      const res = await uploadFiles(files, setPct);
      const got = (res.files || []).map(f => absUrl(f.url));
      setNames(n => ({ ...n, ...Object.fromEntries((res.files || []).map((f, i) => [absUrl(f.url), `${f.name || files[i]?.name} · ${Math.round((f.size || files[i]?.size || 0) / 1024)} ك.ب`])) }));
      onChange([...urls, ...got]);
    } catch (ex) { showToast(ex.message, '⚠️'); }
    setPct(null);
  };
  return (
    <>
      {/* ورقة/ملف المعلم المطلوب حلّه (إن أرسله الباك اند) */}
      {[q.attachment, q.worksheet, q.file, ...(q.attachments || [])].filter(Boolean).map((f, i) => { const u = typeof f === 'string' ? f : f.url; return u && <button key={i} type="button" className="fu-sheet" onClick={() => openFile({ url: u, name: f.name })}>📄 <span><b>{f.name || 'ورقة العمل'}</b><small>اضغط لفتحها وحلّها</small></span></button>; })}
      {q.instructions && <div className="qt-guide">{q.instructions}</div>}
      <div className="qt-files">
        {urls.map(u => (
          <div key={u} className="qt-file"><FileAnswer url={u} name={names[u]} />
            {!readOnly && <button type="button" onClick={() => onChange(urls.filter(x => x !== u).length ? urls.filter(x => x !== u) : undefined)}>✕</button>}
          </div>
        ))}
        {readOnly && !urls.length && <div className="qt-muted">لا توجد ملفات</div>}
      </div>
      {pct != null && <Progress pct={pct} />}
      {!readOnly && urls.length < max && pct == null && (
        <label className="qt-drop">
          <input type="file" multiple={max > 1} accept={accept} onChange={pick} hidden />
          📎 اختر ملفاً أو صورة {q.allowed_types?.length ? `(${q.allowed_types.join('، ')})` : ''} · {max === 1 ? 'ملف واحد' : `حتى ${max} ملفات`}
        </label>
      )}
    </>
  );
}

/* ===== 17) early_years — على طريقة Duolingo «اختر الصورة الصحيحة»: شبكة بطاقات مدمجة (صورة + كلمة + رقم) ===== */
function EarlyYears({ q, value, onChange, readOnly, model }) {
  const right = (model?.option_ids || []).map(s);
  const sound = q.mode === 'pick_sound';
  useEffect(() => { if (q.audio && !readOnly) { const t = setTimeout(() => playClip(q.audio), 400); return () => { clearTimeout(t); stopAudio(); }; } }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (o) => { if (readOnly) return; clickSound(); onChange(s(o.id)); if (sound && o.audio) playClip(o.audio); };
  return (
    <>
      {q.audio && !readOnly && (
        <div className="ey-listen"><button type="button" className="duo-spk" onClick={() => playClip(q.audio)}>🔊</button><span>استمع ثم اختر</span></div>
      )}
      <div className={'ey-grid n' + Math.min((q.options || []).length, 4)}>
        {(q.options || []).map((o, k) => {
          const on = s(value) === s(o.id);
          const st = model ? (right.includes(s(o.id)) ? ' ok' : on ? ' bad' : '') : '';
          const img = o.image || null;   // الصورة كما ترجع من الباك اند — دائماً
          return (
            <button key={o.id} type="button" disabled={readOnly} className={'ey-card' + (img && !sound ? ' pic' : '') + (on ? ' on' : '') + (value != null && !on ? ' dim' : '') + st} onClick={() => pick(o)} style={{ animationDelay: k * 0.06 + 's' }}>
              {!(img && !sound) && <span className="ey-k">{k + 1}</span>}
              {sound
                ? <span className="ey-spk" onClick={(e) => { e.stopPropagation(); playClip(o.audio); }}>🔊</span>
                : img ? <img src={img} alt="" /> : <span className="ey-word">{o.text}</span>}
              {sound && o.text && <span className="ey-label">{o.text}</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ===== hotspot — الموجّه حسب الوضع: find (حدّد الأماكن) · explore (استكشف النقاط) ===== */
function Hotspot(props) {
  return props.q.mode === 'explore' ? <HotspotExplore {...props} /> : <HotspotFind {...props} />;
}
/* explore: علامات متوهّجة نابضة؛ الضغط يفتح فقاعة بالاسم ويشغّل صوتها؛ المفتوحة تبقى مضاءة → [spot ids] */
function HotspotExplore({ q, value, onChange, readOnly, model }) {
  const opened = Array.isArray(value) ? value.map(s) : [];
  const [cur, setCur] = useState(null);
  const spots = q.spots || [];
  const all = !!model;   // في المراجعة: كل العلامات مضاءة بأسمائها
  const open = (sp) => {
    setCur(sp.id);
    if (sp.audio) playClip(sp.audio); else clickSound();
    if (readOnly || opened.includes(s(sp.id))) return;
    onChange([...opened, s(sp.id)]);
  };
  const labelOf = (sp) => sp.label || model?.spots?.find(x => s(x.id) === s(sp.id))?.label;
  return (
    <>
      <div className="hs-bar">
        <span className="hs-l">✨ اضغط على كل نقطة مضيئة لتكتشفها</span>
        <span className={'ms-count' + (opened.length ? ' on' : '')}><b>{opened.length}</b> / {spots.length}</span>
      </div>
      <div className="hs-frame">
        <PctImage src={q.image}>
          {spots.map((sp, i) => {
            const lit = all || opened.includes(s(sp.id));
            return (
              <button key={sp.id} type="button" className={'hx-dot' + (lit ? ' lit' : '') + (cur === sp.id ? ' cur' : '')} style={{ left: sp.x + '%', top: sp.y + '%' }}
                onClick={(e) => { e.stopPropagation(); open(sp); }}>
                <span className="core">{lit ? '✓' : i + 1}</span>
                {(cur === sp.id || all) && labelOf(sp) && <span className="hx-bubble">{labelOf(sp)}{sp.audio && ' 🔊'}</span>}
              </button>
            );
          })}
        </PctImage>
      </div>
    </>
  );
}

/* ===== drawing — الموجّه حسب الوضع: free (رسم حر) · trace (تتبّع الحرف) ===== */
function Drawing(props) {
  return props.q.mode === 'trace' ? <TraceLetter {...props} /> : <DrawingFree {...props} />;
}
/* trace: الحرف كبير منقّط خفيف، والطالب يمرّر إصبعه عليه؛ نسبة التغطية = accuracy_score
   → { image_url, accuracy_score } */
function TraceLetter({ q, value, onChange, readOnly }) {
  const cv = useRef(null);
  const box = useRef(null);
  const [dirty, setDirty] = useState(false);
  const [pct, setPct] = useState(null);
  const [redo, setRedo] = useState(!value);
  const url = value && typeof value === 'object' ? value.image_url : value;
  const letter = q.letter || '';
  const FONT = (h) => `900 ${Math.round(h * 0.62)}px "Tajawal","Cairo","Noto Naskh Arabic",sans-serif`;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const r = c.getBoundingClientRect();
    c.width = r.width * 2; c.height = r.height * 2;
    const x = c.getContext('2d'); x.scale(2, 2); x.lineCap = 'round'; x.lineJoin = 'round';
    setDirty(false);
  }, [redo]);
  const pos = (e) => { const r = cv.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = (e) => {
    const c = cv.current, x = c.getContext('2d');
    c.setPointerCapture(e.pointerId);
    x.strokeStyle = '#2563eb'; x.lineWidth = Math.max(14, c.height / 2 / 16);
    const [px, py] = pos(e); x.beginPath(); x.moveTo(px, py); x.lineTo(px + 0.1, py + 0.1); x.stroke();
    c._on = true; setDirty(true);
  };
  const move = (e) => { const c = cv.current; if (!c._on) return; const x = c.getContext('2d'); const [px, py] = pos(e); x.lineTo(px, py); x.stroke(); };
  const up = () => { if (cv.current) cv.current._on = false; };
  const clear = () => { const c = cv.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); clickSound(); setDirty(false); };
  // نسبة ما غطّاه الطالب من بكسلات الحرف (دقة تقريبية لتصحيح آلي)
  const score = () => {
    const c = cv.current, W = c.width, H = c.height;
    const g = document.createElement('canvas'); g.width = W; g.height = H;
    const gx = g.getContext('2d'); gx.font = FONT(H); gx.textAlign = 'center'; gx.textBaseline = 'middle'; gx.direction = 'rtl';
    gx.fillText(letter, W / 2, H / 2);
    const G = gx.getImageData(0, 0, W, H).data, U = c.getContext('2d').getImageData(0, 0, W, H).data;
    let tot = 0, hit = 0, out = 0;
    for (let i = 3; i < G.length; i += 16) { const gi = G[i] > 80, ui = U[i] > 80; if (gi) { tot++; if (ui) hit++; } else if (ui) out++; }
    if (!tot) return null;
    const cover = hit / tot, spill = out / Math.max(1, hit + out);
    return Math.max(0, Math.min(100, Math.round(cover * 100 - spill * 40)));
  };
  const save = async () => {
    const c = cv.current, W = c.width, H = c.height;
    const acc = score();
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    const o = out.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, W, H);
    o.font = FONT(H); o.textAlign = 'center'; o.textBaseline = 'middle'; o.direction = 'rtl'; o.fillStyle = '#e2e8f0'; o.fillText(letter, W / 2, H / 2);
    o.drawImage(c, 0, 0);
    const blob = await new Promise(r => out.toBlob(r, 'image/png'));
    setPct(0);
    try {
      const res = await uploadFiles(new File([blob], `trace-${Date.now()}.png`, { type: 'image/png' }), setPct);
      onChange({ image_url: absUrl(res.url), ...(acc != null ? { accuracy_score: acc } : {}) });
      setRedo(false); showToast('تم حفظ محاولتك ✓', '✍️');
    } catch (e) { showToast(e.message, '⚠️'); }
    setPct(null);
  };
  if (readOnly || (url && !redo)) return (
    <div className="dr-saved">
      {url ? <FileAnswer url={url} /> : <div className="qt-muted">لا توجد محاولة</div>}
      {value?.accuracy_score != null && <div className="qt-row" style={{ justifyContent: 'center' }}><span className="ms-count on">دقة التتبّع <b>{value.accuracy_score}%</b></span></div>}
      {!readOnly && <button type="button" className="hint-btn" style={{ marginTop: 10 }} onClick={() => setRedo(true)}>✍️ تتبّع من جديد</button>}
    </div>
  );
  return (
    <>
      {q.instructions && <div className="dr-note">💡 {q.instructions}</div>}
      <div className="tr-book" ref={box}>
        {q.audio && <button type="button" className="duo-spk tr-spk" onClick={() => playClip(q.audio)}>🔊</button>}
        <div className="tr-sheet" style={q.guide_image ? { backgroundImage: `url("${q.guide_image}")` } : undefined}>
          {!q.guide_image && (
            <svg className="tr-guide" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" aria-hidden>
              <text x="200" y="135" textAnchor="middle" dominantBaseline="middle" direction="rtl">{letter}</text>
            </svg>
          )}
          <canvas ref={cv} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
        </div>
      </div>
      <div className="dr-foot">
        <button type="button" className="hint-btn" onClick={clear}>🧽 امسح وجرّب من جديد</button>
        {pct != null ? <Progress pct={pct} /> : <button type="button" className="btn btn-primary" disabled={!dirty} style={{ opacity: dirty ? 1 : 0.5 }} onClick={save}>✓ اعتمد</button>}
      </div>
    </>
  );
}

/* ===== 18) composite — حاوية متعددة الخطوات: شريط تبويبات مرقّم + نفس مكوّن نوع كل خطوة ===== */
function Composite({ q, value, onChange, readOnly, model }) {
  const steps = q.steps || [];
  const v = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const [k, setK] = useState(0);
  const st = steps[k];
  const done = (x) => isAnswered(x, v[s(x.id)]);
  const set = (ans) => {
    const n = { ...v };
    if (ans === undefined || ans === null || ans === '') delete n[s(st.id)]; else n[s(st.id)] = ans;
    onChange(Object.keys(n).length ? n : undefined);
  };
  const sm = model?.steps?.find(x => s(x.step) === s(st?.id))?.model_answer;
  const empty = steps.filter(x => !done(x)).length;
  if (!st) return null;
  return (
    <>
      {q.intro && <div className="qt-guide">{q.intro}</div>}
      <div className="cp-tabs">
        {steps.map((x, i) => (
          <button key={x.id} type="button" className={'cp-tab' + (i === k ? ' cur' : '') + (done(x) ? ' done' : '')} onClick={() => { clickSound(); stopAudio(); setK(i); }}>
            <span className="n">{done(x) && i !== k ? '✓' : i + 1}</span><span className="t">{x.type_label || x.type}</span>
          </button>
        ))}
      </div>
      <div className="cp-body" key={st.id}>
        <QuestionBody q={{ ...st, id: q.id + '-' + st.id }} value={v[s(st.id)]} onChange={set} readOnly={readOnly} model={sm} />
      </div>
      <div className="cp-nav">
        <button type="button" className="btn btn-ghost" disabled={k === 0} style={{ opacity: k === 0 ? 0.4 : 1 }} onClick={() => { clickSound(); stopAudio(); setK(k - 1); }}>→ الخطوة السابقة</button>
        {!readOnly && empty > 0 && <span className="qt-muted">باقي {empty} {empty === 1 ? 'خطوة' : 'خطوات'}</span>}
        <button type="button" className="btn btn-primary" disabled={k === steps.length - 1} style={{ opacity: k === steps.length - 1 ? 0.4 : 1 }} onClick={() => { clickSound(); stopAudio(); setK(k + 1); }}>الخطوة التالية ←</button>
      </div>
    </>
  );
}

/* الحقول التي لا يعمل النوع بدونها — لو غابت نعرض رسالة بدل سؤال فارغ */
const NEED = { multi_select: ['options'], drag_drop: ['zones', 'items'], labeling: ['image', 'spots', 'labels'], dropdown_fill: ['blanks'],
  grammar_transform: ['source_text'], error_correction: ['text_with_errors'], hotspot: ['image'], highlight: [], image_description: [],
  drawing: [], table_organizer: ['columns', 'rows'], listening: ['audio'], speaking_record: [], read_aloud: ['passage'],
  media_response: ['media_url'], file_upload: [], early_years: ['options'], composite: ['steps'] };
const empty = (v) => v == null || (Array.isArray(v) && !v.length);
export const missingData = (q) => (NEED[q.type] || []).some(k => empty(q[k])) || (q.type === 'highlight' && !q.words?.length && !q.text)
  || (q.type === 'hotspot' && q.mode === 'explore' && empty(q.spots)) || (q.type === 'drawing' && q.mode === 'trace' && !q.letter && !q.guide_image)
  || (q.type === 'media_response' && (q.response || q.answer_kind) === 'choice' && empty(q.options))
  || (q.type === 'error_correction' && q.mode === 'tap' && empty(q.words) && !q.text_with_errors);
export function MissingData() {
  return <div className="qt-err" style={{ background: 'var(--orange-soft, #fff7ed)', color: 'var(--orange, #c2410c)' }}>⚠️ بيانات هذا السؤال غير مكتملة من المصدر — لا يمكن عرضه الآن. أكمل باقي الأسئلة، وأبلغ معلمك.</div>;
}

export const NEW_TYPES = {
  multi_select: MultiSelect, drag_drop: DragDropQ, labeling: Labeling, dropdown_fill: DropdownFill,
  grammar_transform: GrammarTransform, error_correction: ErrorCorrection, hotspot: Hotspot, highlight: Highlight,
  image_description: ImageDescription, drawing: Drawing, table_organizer: TableOrganizer, listening: Listening,
  speaking_record: SpeakingRecord, read_aloud: ReadAloud, media_response: MediaResponse, file_upload: FileUploadQ, early_years: EarlyYears, composite: Composite,
};
/* أنواع تعرض صورتها/نصها بنفسها */
export const OWN_IMAGE = ['labeling', 'hotspot', 'image_description'];
export const OWN_TITLE = ['dropdown_fill', 'highlight'];
export const OWN_AUDIO = ['listening', 'early_years'];
