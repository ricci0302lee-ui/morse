let audioCtx = null;
let oscillator = null;

const btn = document.getElementById("beepBtn");

/* 🔓 強制在第一次觸控時解鎖 AudioContext */
function unlockAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

/* 第一次點任何地方就解鎖（只跑一次） */
window.addEventListener("touchstart", unlockAudio, { once: true });
window.addEventListener("pointerdown", unlockAudio, { once: true });

function startBeep() {
  if (!audioCtx || audioCtx.state !== "running") return;
  if (oscillator) return;

  oscillator = audioCtx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = 700;

  oscillator.connect(audioCtx.destination);
  oscillator.start();
}

function stopBeep() {
  if (!oscillator) return;
  try { oscillator.stop(); } catch(e){}
  try { oscillator.disconnect(); } catch(e){}
  oscillator = null;
}

function down(e) {
  e.preventDefault();
  btn.classList.add("is-down");
  startBeep();
}

function up(e) {
  e.preventDefault();
  btn.classList.remove("is-down");
  stopBeep();
}

/* 同時支援滑鼠 + 觸控 */
btn.addEventListener("pointerdown", down);
window.addEventListener("pointerup", up);
window.addEventListener("pointercancel", up);
btn.addEventListener("pointerleave", up);
