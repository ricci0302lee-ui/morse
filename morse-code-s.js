// ===== DOM =====
const btn = document.getElementById("beepBtn");
const morseTextEl = document.getElementById("morseText");
const letterTextEl = document.getElementById("letterText");

// 若抓不到元素，直接提示（避免「沒字」卻不知道原因）
if (!btn || !morseTextEl || !letterTextEl) {
  console.error("找不到必要的元素：beepBtn / morseText / letterText");
}

// ===== Morse table =====
const MORSE_TABLE = {
  ".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F",
  "--.":"G","....":"H","..":"I",".---":"J","-.-":"K",".-..":"L",
  "--":"M","-.":"N","---":"O",".--.":"P","--.-":"Q",".-.":"R",
  "...":"S","-":"T","..-":"U","...-":"V",".--":"W","-..-":"X",
  "-.--":"Y","--..":"Z",
  "-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",
  ".....":"5","-....":"6","--...":"7","---..":"8","----.":"9"
};

// ===== Timing (ms) =====
const DOT_DASH_TIME = 180;  // < 180ms -> dot, else dash
const LETTER_GAP = 450;     // 放開後超過這時間，就翻譯成一個字母

// ===== State =====
let audioCtx = null;
let oscillator = null;
let pressing = false;

let pressStart = 0;
let currentMorse = "";
let morseAll = "";
let textAll = "";
let gapTimer = null;

// ===== Render =====
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

// ===== Input handlers =====
async function down(e) {
  // 只接受左鍵（滑鼠）/ 觸控 pointer
  if (e.button !== undefined && e.button !== 0) return;

  e.preventDefault();
  pressing = true;

  // 避免「移動/點別處也算按住」
  try { btn.setPointerCapture(e.pointerId); } catch {}

  btn.classList.add("is-down");

  // 如果正在等字母結束，代表同一字母還沒結束
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

// ===== Events =====
btn.addEventListener("pointerdown", down);
btn.addEventListener("pointerup", up);
btn.addEventListener("pointercancel", cancel);
btn.addEventListener("pointerleave", cancel);
window.addEventListener("blur", cancel);

// 保險：有時候放開在視窗外
window.addEventListener("pointerup", up);
