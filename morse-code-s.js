const btn = document.getElementById("beepBtn");
const morseTextEl = document.getElementById("morseText");
const letterTextEl = document.getElementById("letterText");

if (!btn || !morseTextEl || !letterTextEl) {
  console.error("找不到必要的元素：beepBtn / morseText / letterText");
}

const MORSE_TABLE = {
  ".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F",
  "--.":"G","....":"H","..":"I",".---":"J","-.-":"K",".-..":"L",
  "--":"M","-.":"N","---":"O",".--.":"P","--.-":"Q",".-.":"R",
  "...":"S","-":"T","..-":"U","...-":"V",".--":"W","-..-":"X",
  "-.--":"Y","--..":"Z",
  "-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",
  ".....":"5","-....":"6","--...":"7","---..":"8","----.":"9"
};

const DOT_DASH_TIME = 180;
const LETTER_GAP = 450;

let audioCtx = null;
let oscillator = null;
let pressing = false;

let pressStart = 0;
let currentMorse = "";
let morseAll = "";
let textAll = "";
let gapTimer = null;

function render() {
  morseTextEl.textContent = morseAll.trim().length ? morseAll : "";
  letterTextEl.textContent = textAll.trim().length ? textAll : "";
}
render();

// ===== Audio =====
async function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") {
    try { await audioCtx.resume(); } catch (e) {}
  }
}

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
  try { oscillator.stop(); } catch(e) {}
  try { oscillator.disconnect(); } catch(e) {}
  oscillator = null;
}

async function down(e) {
  if (e.button !== undefined && e.button !== 0) return;

  e.preventDefault();
  pressing = true;

  try { btn.setPointerCapture(e.pointerId); } catch {}

  btn.classList.add("is-down");

  if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; }

  pressStart = performance.now();

  await ensureAudio();
  startBeep();
}

function up(e) {
  if (!pressing) return;

  e.preventDefault();
  pressing = false;

  try { btn.releasePointerCapture(e.pointerId); } catch {}

  btn.classList.remove("is-down");
  stopBeep();

  const duration = performance.now() - pressStart;
  const symbol = duration < DOT_DASH_TIME ? "." : "-";

  currentMorse += symbol;
  morseAll += symbol;
  render();

  gapTimer = setTimeout(() => {
    const letter = MORSE_TABLE[currentMorse] || "?";
    textAll += letter;

    morseAll += " ";
    currentMorse = "";
    gapTimer = null;

    render();
  }, LETTER_GAP);
}

function cancel() {
  if (!pressing) return;
  pressing = false;
  btn.classList.remove("is-down");
  stopBeep();
}

btn.addEventListener("pointerdown", down);
btn.addEventListener("pointerup", up);
btn.addEventListener("pointercancel", cancel);
btn.addEventListener("pointerleave", cancel);
window.addEventListener("blur", cancel);

window.addEventListener("pointerup", up);

