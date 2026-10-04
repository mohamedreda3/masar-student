/* طبقة التلعيب العامة — شرارات وأصوات نقر على مستوى المنصة كلها
   (تحترم prefers-reduced-motion: الشرارات تتعطل والأصوات تبقى خفيفة) */
import { tickSound } from './sounds.js';

let inited = false;

export function initFx() {
  if (inited) return;
  inited = true;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a, .option, .toolkit-item, .theme-swatch .dot, input[type="checkbox"]');
    if (!target || target.disabled) return;
    tickSound();
    if (!reduced) burst(e.clientX || window.innerWidth / 2, e.clientY || 80);
  }, { passive: true });
}

/* انفجار شرارات صغير عند نقطة النقر */
const GLYPHS = ['✦', '✧', '★', '•'];
const COLORS = ['#f59e0b', '#ec4899', '#22c55e', '#3b82f6', '#a78bfa'];
function burst(x, y) {
  const n = 6;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'fx-spark';
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.7;
    const d = 20 + Math.random() * 18;
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.color = COLORS[(Math.random() * COLORS.length) | 0];
    s.style.setProperty('--dx', Math.cos(a) * d + 'px');
    s.style.setProperty('--dy', Math.sin(a) * d + 'px');
    s.textContent = GLYPHS[i % GLYPHS.length];
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 520);
  }
}
