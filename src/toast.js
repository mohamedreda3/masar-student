/* توست تحفيزي خفيف — «+120 نقطة! 🎉» يظهر ويختفي (بلا مكتبات) */
export function showToast(msg, emoji = '🎉') {
  try {
    const t = document.createElement('div');
    t.className = 'masar-toast';
    t.textContent = `${emoji} ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  } catch { /* كماليّ */ }
}
