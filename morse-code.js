// ================= DOM =================
const btn = document.getElementById("beepBtn");
const morseTextEl = document.getElementById("morseText");
const letterTextEl = document.getElementById("letterText");
const backBtn = document.getElementById("backBtn");

// ================= Morse Table =================
const MORSE_TABLE = {
  ".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F",
  "--.":"G","....":"H","..":"I",".---":"J","-.-":"K",".-..":"L",
  "--":"M","-.":"N","---":"O",".--.":"P","--.-":"Q",".-.":"R",
  "...":"S","-":"T","..-":"U","...-":"V",".--":"W","-..-":"X",
  "-.--":"Y","--..":"Z",
  "-----":"0",".----":"1","..---":"2","...--":"3","....-":"4",
  ".....":"5","-....":"6","--...":"7","---..":"8","----.":"9"
};

// ================= Timing (ms) =================
const DOT_DASH_TIME = 180;   // 短 / 長
const LETTER_GAP = 450;      // 字母間隔

// ================= Audio =================
let audioCtx = null;
let oscillator = null;

async function ensureAudio(){
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    try { await audioCtx.resume(); } catch(e){}
  }
}

function startBeep(){
  if (!audioCtx || audioCtx.state !== "running") return;
  if (oscillator) return;

  oscillator = audioCtx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = 700;
  oscillator.connect(audioCtx.destination);
  oscillator.start();
}

function stopBeep(){
  if (!oscillator) return;
  try { oscillator.stop(); } catch(e){}
  try { oscillator.disconnect(); } catch(e){}
  oscillator = null;
}

// ================= State =================
let pressing = false;
let pressStart = 0;

let currentMorse = "";      // 正在輸入中的一個字母
let lettersMorse = [];      // 已完成字母的摩斯碼
let lettersText = [];       // 已完成字母的翻譯

let gapTimer = null;

// ================= Render =================
function render(){
  const morseAll = [...lettersMorse, currentMorse]
    .filter(x => x.length)
    .join(" ");

  const textAll = lettersText.join("");

  morseTextEl.textContent = morseAll || "(尚未輸入)";
  letterTextEl.textContent = textAll || "(尚未輸入)";
}
render();

// ================= Input =================
async function down(e){
  // 只接受左鍵或觸控
  if (e.button !== undefined && e.button !== 0) return;

  e.preventDefault();
  pressing = true;

  try { btn.setPointerCapture(e.pointerId); } catch {}

  btn.classList.add("is-down");

  if (gapTimer) {
    clearTimeout(gapTimer);
    gapTimer = null;
  }

  pressStart = performance.now();

  await ensureAudio();
  startBeep();
}

function up(e){
  if (!pressing) return;

  e.preventDefault();
  pressing = false;

  try { btn.releasePointerCapture(e.pointerId); } catch {}

  btn.classList.remove("is-down");
  stopBeep();

  const duration = performance.now() - pressStart;
  const symbol = duration < DOT_DASH_TIME ? "." : "-";

  currentMorse += symbol;
  render();

  // 等一段時間，視為字母完成
  gapTimer = setTimeout(() => {
    const letter = MORSE_TABLE[currentMorse] || "?";
    lettersMorse.push(currentMorse);
    lettersText.push(letter);
    currentMorse = "";
    gapTimer = null;
    render();
  }, LETTER_GAP);
}

function cancel(){
  if (!pressing) return;
  pressing = false;
  btn.classList.remove("is-down");
  stopBeep();
}

// ================= Backspace =================
function backspace(){
  if (gapTimer) {
    clearTimeout(gapTimer);
    gapTimer = null;
  }

  if (currentMorse.length > 0) {
    // 刪正在輸入的 . 或 -
    currentMorse = currentMorse.slice(0, -1);
  } else if (lettersMorse.length > 0) {
    // 刪上一個完整字母
    lettersMorse.pop();
    lettersText.pop();
  }
  render();
}

// ================= Events =================
btn.addEventListener("pointerdown", down);
btn.addEventListener("pointerup", up);
btn.addEventListener("pointercancel", cancel);
btn.addEventListener("pointerleave", cancel);
window.addEventListener("blur", cancel);
window.addEventListener("pointerup", up);

// 退格按鈕
if (backBtn) backBtn.addEventListener("click", backspace);

// 鍵盤 Backspace
window.addEventListener("keydown", (e) => {
  if (e.key === "Backspace") {
    e.preventDefault();
    backspace();
  }
});
