let audioCtx;
let oscillator;

const btn = document.getElementById("beepBtn");

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // iOS 需要在手勢中 resume
  if (audioCtx.state === "suspended") {
    return audioCtx.resume();
  }
  return Promise.resolve();
}

async function startBeep() {
  await ensureAudio();

  if (oscillator) return;

  oscillator = audioCtx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = 700;

  oscillator.connect(audioCtx.destination);
  oscillator.start();
}

function stopBeep() {
  if (!oscillator) return;

  try { oscillator.stop(); } catch(e) {}
  try { oscillator.disconnect(); } catch(e) {}

  oscillator = null;
}

function down(e){
  if (e.cancelable) e.preventDefault();
  btn.classList.add("is-down");
  startBeep();
}

function up(e){
  if (e && e.cancelable) e.preventDefault();
  btn.classList.remove("is-down");
  stopBeep();
}

/* Pointer Events（滑鼠＋觸控） */
btn.addEventListener("pointerdown", down);
window.addEventListener("pointerup", up);
window.addEventListener("pointercancel", up);
btn.addEventListener("pointerleave", up);
