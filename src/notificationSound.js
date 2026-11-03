/**
 * صوت الإشعار — a short two-note chime.
 *
 * Synthesised with the Web Audio API rather than shipped as a file: no asset to deploy,
 * nothing to 404, and no download before the first notification can be heard.
 *
 * Browsers refuse to start audio until the user has interacted with the page, so a chime
 * before any click is simply dropped — never an error the caller has to handle. The
 * context is created once and reused, because a page that opens one per notification
 * eventually hits the browser's limit and goes silent.
 */

let ctx = null;

const audioContext = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx || ctx.state === "closed") ctx = new AudioCtx();
  return ctx;
};

/** One note of the chime. */
const note = (ac, { freq, at, duration, gain }) => {
  const osc = ac.createOscillator();
  const vol = ac.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, at);

  // A flat envelope clicks at both ends, so the note is faded in and out.
  vol.gain.setValueAtTime(0, at);
  vol.gain.linearRampToValueAtTime(gain, at + 0.015);
  vol.gain.exponentialRampToValueAtTime(0.0001, at + duration);

  osc.connect(vol);
  vol.connect(ac.destination);
  osc.start(at);
  osc.stop(at + duration);
};

/**
 * Plays the chime. Safe to call from anywhere: it never throws and never blocks.
 * `volume` is 0–1 and defaults to something audible but easy to sit next to all day.
 */
export function playNotificationChime({ volume = 0.18 } = {}) {
  try {
    const ac = audioContext();
    if (!ac) return;

    // Suspended until the page has been interacted with; resume is a no-op otherwise.
    if (ac.state === "suspended") ac.resume().catch(() => {});

    const t = ac.currentTime;
    note(ac, { freq: 880, at: t, duration: 0.18, gain: volume }); // A5
    note(ac, { freq: 1174.66, at: t + 0.1, duration: 0.24, gain: volume * 0.85 }); // D6
  } catch {
    // Audio is a courtesy, never a reason to break the screen that triggered it.
  }
}

export default playNotificationChime;
