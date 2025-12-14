const btn = document.getElementById("beepBtn");
const morseTextEl = document.getElementById("morseText");
const letterTextEl = document.getElementById("letterText");
const clearBtn = document.getElementById("clearBtn");

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

async function ensureAudio(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") {
    try { await audioCtx.resume(); } catch {}
  }
}

function startBeep(){
  if (!audioCtx || audioCtx.state !== "running") return;
  if (oscillator) return;

  oscillator = audioCtx.createOscillator();
  oscillator.type = "square";
  oscillator.frequency.value = 400;
  oscillator.connect(audioCtx.destination);
  oscillator.start();
}

function stopBeep(){
  if (!oscillator) return;
  try { oscillator.stop(); } catch {}
  try { oscillator.disconnect(); } catch {}
  oscillator = null;
}

// ===== State =====
let pressing = false;
let pressStart = 0;

let currentMorse = "";
let lettersMorse = [];
let lettersText = [];
let gapTimer = null;

function render(){
  const morseAll = [...lettersMorse, currentMorse].filter(x => x.length).join(" ");
  const textAll  = lettersText.join("");
    morseTextEl.textContent  = morseAll.length ? morseAll : "　";
  letterTextEl.textContent = textAll.length ? textAll : "　";
}
render();

function finalizeLetter(){
  if (!currentMorse.length) return;
  const letter = MORSE_TABLE[currentMorse] || "?";
  lettersMorse.push(currentMorse);
  lettersText.push(letter);
  currentMorse = "";
  render();
}

function clearAll(){
  if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; }
  currentMorse = "";
  lettersMorse = [];
  lettersText = [];
  render();
}

// ===== Input =====
async function down(e){
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

  gapTimer = setTimeout(() => {
    finalizeLetter();
    gapTimer = null;
  }, LETTER_GAP);
}

function cancel(){
  if (!pressing) return;
  pressing = false;
  btn.classList.remove("is-down");
  stopBeep();
}

// Events
btn.addEventListener("pointerdown", down);
btn.addEventListener("pointerup", up);
btn.addEventListener("pointercancel", cancel);
btn.addEventListener("pointerleave", cancel);
window.addEventListener("blur", cancel);
window.addEventListener("pointerup", up);

// 清除
clearBtn.addEventListener("click", clearAll);


