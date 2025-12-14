// ===== DOM =====
const btn = document.getElementById("beepBtn");
const morseTextEl = document.getElementById("morseText");
const letterTextEl = document.getElementById("letterText");
const backBtn = document.getElementById("backBtn");
const clearBtn = document.getElementById("clearBtn");

// 如果抓不到元素，直接在 console 提示（方便你排錯）
if (!btn || !morseTextEl || !letterTextEl || !backBtn || !clearBtn) {
  console.error("缺少必要元素：beepBtn / morseText / letterText / backBtn / clearBtn");
}

// ===== Morse Table =====
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
const DOT_DASH_TIME = 180; // < 180 = dot
const LETTER_GAP = 450;    // 放開後超過這時間→翻譯一個字母

// ===== Audio =====
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
  oscillator.type = "sine";
  oscillator.frequency.value = 700;
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

let currentMorse = "";   // 正在打的這一個字母
let lettersMorse = [];   // 已完成字母的摩斯碼（每一個字母一格）
let lettersText  = [];   // 已完成字母的翻譯

let gapTimer = null;

// ===== Render =====
function render(){
  const morseAll = [...lettersMorse, currentMorse].filter(x => x.length).join(" ");
  const textAll  = lettersText.join("");

  morseTextEl.textContent  = morseAll.length ? morseAll : "(尚未輸入)";
  letterTextEl.textContent = textAll.length ? textAll : "(尚未輸入)";
}
render();

// ===== Helpers =====
function finalizeLetter(){
  if (!currentMorse.length) return;
  const letter = MORSE_TABLE[currentMorse] || "?";
  lettersMorse.push(currentMorse);
  lettersText.push(letter);
  currentMorse = "";
  render();
}

function backspace(){
  // 先取消正在等待翻譯的 timer（不然會刪了又被自動補回）
  if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; }

  if (currentMorse.length > 0) {
    currentMorse = currentMorse.slice(0, -1);
  } else if (lettersMorse.length > 0) {
    lettersMorse.pop();
    lettersText.pop();
  }
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
  if (e.button !== undefined && e.button !== 0) return; // 左鍵/觸控

  e.preventDefault();
  pressing = true;

  // 防誤觸：捕捉 pointer
  try { btn.setPointerCapture(e.pointerId); } catch {}

  btn.classList.add("is-down");

  // 若正在等字母結束，代表你要繼續同一個字母
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

  // 放開後計時：一段時間沒再按，就把這個字母翻譯完成
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

// ===== Events =====
btn.addEventListener("pointerdown", down);
btn.addEventListener("pointerup", up);
btn.addEventListener("pointercancel", cancel);
btn.addEventListener("pointerleave", cancel);
window.addEventListener("blur", cancel);

// 保險：放開跑到視窗外也能收到
window.addEventListener("pointerup", up);

// 退格 / 清除
backBtn.addEventListener("click", backspace);
clearBtn.addEventListener("click", clearAll);

// 鍵盤 Backspace（桌機可用）
window.addEventListener("keydown", (e) => {
  if (e.key === "Backspace") {
    e.preventDefault();
    backspace();
  }
});
