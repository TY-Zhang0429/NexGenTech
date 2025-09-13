<template>
  <section class="wordly">
    <BreadcrumbNav />

    <!-- Top -->
    <header class="wd-toolbar">
      <div class="wd-left">
        <label class="wd-label">Difficulty</label>
        <select v-model="difficulty" @change="startGame" class="wd-select">
          <option value="Easy">Easy (5)</option>
          <option value="Medium">Medium (5)</option>
          <option value="Hard">Hard (6)</option>
        </select>
        <button class="wd-btn" @click="startGame">New Game</button>
        <span class="wd-status" v-if="statusMsg">{{ statusMsg }}</span>
      </div>

      <div class="wd-right">
        <div class="wd-hint">
          <strong>Hint</strong>
          <button class="wd-btn ghost" @click="hintVisible = !hintVisible">
            {{ hintVisible ? 'Hide' : 'Show' }}
          </button>
          <div class="wd-hint-content">{{ hintVisible ? (currentHint || '—') : '—' }}</div>
        </div>
      </div>
    </header>

    <!-- Loading / Error -->
    <div class="wd-notice" v-if="loading">Loading words…</div>
    <div class="wd-notice wd-error" v-else-if="error">{{ error }}</div>

    <!-- Play zone: left instruction | center board | right rules/tips -->
    <main class="wd-playzone" v-else @click="maybeFocusMobile">
      <!-- Left: How to Play -->
      <aside class="wd-aside left">
        <h3 class="wd-aside-title">How to Play</h3>
        <ol class="wd-steps">
          <li>Guess the word in <strong>{{ maxAttempts }}</strong> tries.</li>
          <li>Each guess must be a valid <strong>{{ targetLen }}</strong>-letter word. Press <kbd>Enter</kbd> to submit.</li>
          <li>The tile colors show how close your guess was:</li>
        </ol>
        <div class="wd-legend">
          <div class="legend-row">
            <span class="wd-cell tiny correct">A</span>
            <span>Right letter, right spot</span>
          </div>
          <div class="legend-row">
            <span class="wd-cell tiny present">A</span>
            <span>Right letter, wrong spot</span>
          </div>
          <div class="legend-row">
            <span class="wd-cell tiny absent">A</span>
            <span>Letter not in the word</span>
          </div>
        </div>
        <p class="wd-note">Use the on-screen keyboard or your physical keyboard.</p>
      </aside>

      <!-- Center: Board -->
      <div class="wd-board-col">
        <div class="wd-board" :style="{ gridTemplateColumns: `repeat(${targetLen}, var(--cell))` }">
          <template v-for="r in maxAttempts" :key="r">
            <div
              v-for="c in targetLen"
              :key="`${r}-${c}`"
              class="wd-cell"
              :class="cellClass(r-1, c-1)"
              :style="flipStyle(r-1, c-1)"
            >
              {{ letterAt(r-1, c-1) }}
            </div>
          </template>
        </div>

        <!-- mobile input(invoke soft keyboard) -->
        <input
          ref="mobileInput"
          class="wd-hidden-input"
          inputmode="latin"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          @keydown.prevent="onKeydown"
        />
      </div>

      <!-- Right: Rules / Tips -->
      <aside class="wd-aside right">
        <h3 class="wd-aside-title">Rules & Tips</h3>
        <ul class="wd-bullets">
          <li><strong>Difficulty</strong>: {{ difficulty }} ({{ targetLen }} letters)</li>
          <li><strong>Attempts</strong>: {{ maxAttempts }}</li>
          <li><strong>Duplicates</strong>: Letters can repeat.</li>
          <li><strong>Hints</strong>: Click “Show” in the toolbar to view.</li>
        </ul>
      </aside>

      <!-- ===== Mobile-only accordion panels (≤980px screen) ===== -->
      <div class="wd-mobile-panels">
        <details class="wd-coll">
          <summary>How to Play</summary>
          <ol class="wd-steps">
            <li>Guess the word in <strong>{{ maxAttempts }}</strong> tries.</li>
            <li>Each guess must be a valid <strong>{{ targetLen }}</strong>-letter word. Press <kbd>Enter</kbd> to submit.</li>
            <li>The tile colors show how close your guess was:</li>
          </ol>
          <div class="wd-legend">
            <div class="legend-row">
              <span class="wd-cell tiny correct">A</span>
              <span>Right letter, right spot</span>
            </div>
            <div class="legend-row">
              <span class="wd-cell tiny present">A</span>
              <span>Right letter, wrong spot</span>
            </div>
            <div class="legend-row">
              <span class="wd-cell tiny absent">A</span>
              <span>Letter not in the word</span>
            </div>
          </div>
          <p class="wd-note">Use the on-screen keyboard or your physical keyboard.</p>
        </details>

        <details class="wd-coll" style="margin-top:10px">
          <summary>Rules & Tips</summary>
          <ul class="wd-bullets">
            <li><strong>Difficulty</strong>: {{ difficulty }} ({{ targetLen }} letters)</li>
            <li><strong>Attempts</strong>: {{ maxAttempts }}</li>
            <li><strong>Duplicates</strong>: Letters can repeat.</li>
            <li><strong>Hints</strong>: Click “Show” in the toolbar to view.</li>
          </ul>
        </details>
      </div>
      <!-- ===== end mobile panels ===== -->
    </main>

    <!-- Full-screen confetti -->
    <canvas v-if="confettiRunning" ref="confettiCanvas" class="wd-confetti"></canvas>

    <!-- On-screen keyboard -->
    <footer class="wd-kbd" v-if="!loading">
      <div class="wd-row">
        <button
          v-for="k in row1"
          :key="k"
          class="wd-key"
          :class="keyState[k.toLowerCase()]"
          @click="press(k)"
        >{{ k }}</button>
      </div>
      <div class="wd-row">
        <button
          v-for="k in row2"
          :key="k"
          class="wd-key"
          :class="keyState[k.toLowerCase()]"
          @click="press(k)"
        >{{ k }}</button>
      </div>
      <div class="wd-row">
        <button class="wd-key wd-wide" @click="press('Enter')">Enter</button>
        <button
          v-for="k in row3"
          :key="k"
          class="wd-key"
          :class="keyState[k.toLowerCase()]"
          @click="press(k)"
        >{{ k }}</button>
        <button class="wd-key wd-wide" @click="press('Backspace')">Back</button>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import BreadcrumbNav from '@/components/BreadcrumbNav.vue';

const API_BASE = ''; // Same origin (via CloudFront proxy)

/* ---------- basic state ---------- */
const difficulty = ref('Medium');
const targetLen = computed(() => (difficulty.value === 'Hard' ? 6 : 5));
const maxAttempts = 6;

const loading = ref(true);
const error = ref('');
const wordsRaw = ref([]);           // [{word, difficulty, hint}]
const answer = ref('');
const currentHint = ref('');
const hintVisible = ref(false);

const guesses = reactive([]);       // ['apple', ...]
const status  = reactive([]);       // [['pending'|'correct'|'present'|'absent', ...], ...]
const cur = ref('');
const statusMsg = ref('');

/* ---------- animation ---------- */
const revealingRowIndex = ref(-1);
const REVEAL_GAP   = 140;                          // every (ms)
const SINGLE_FLIP  = 250;                          // single cell flip duration (ms)
const HALF_FLIP    = Math.floor(SINGLE_FLIP / 2);  // 50% moment

/* ---------- keyboard state (green > yellow > gray) ---------- */
const keyState = reactive(Object.fromEntries(
  'abcdefghijklmnopqrstuvwxyz'.split('').map(ch => [ch, ''])
));
function updateKeyState(letter, newState) {
  const curSt = keyState[letter];
  if (curSt === 'correct') return;                         // highest priority
  if (curSt === 'present' && newState === 'absent') return; // yellow cannot be covered by gray
  keyState[letter] = newState;
}

/* ---------- confetti ---------- */
const confettiCanvas = ref(null);
let confettiTimer = null;
const confettiRunning = ref(false);

/* ---------- input device ---------- */
const mobileInput = ref(null);
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

/* ---------- keyboard layout ---------- */
const row1 = ['Q','W','E','R','T','Y','U','I','O','P'];
const row2 = ['A','S','D','F','G','H','J','K','L'];
const row3 = ['Z','X','C','V','B','N','M'];

/* ---------- lifecycle ---------- */
onMounted(async () => {
  try {
    await fetchWords();
    startGame();
    if (!isMobile) window.addEventListener('keydown', onKeydown, { passive: false });
    window.addEventListener('resize', resizeCanvas);
  } catch (e) {
    error.value = 'Failed to load words. Please retry later.';
  } finally {
    loading.value = false;
  }
});
onBeforeUnmount(() => {
  if (!isMobile) window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('resize', resizeCanvas);
  stopConfetti();
});

/* ---------- API ---------- */
async function fetchWords() {
  const res = await fetch(`${API_BASE}/api/words`);
  if (!res.ok) throw new Error('fetch words failed');
  const data = await res.json();
  wordsRaw.value = Array.isArray(data) ? data : [];
}

/* ---------- question ---------- */
function pickAnswerObj() {
  const needLen = targetLen.value;
  const pool = wordsRaw.value.filter(
    (w) => w?.difficulty === difficulty.value && typeof w?.word === 'string' && w.word.length === needLen
  );
  if (pool.length === 0) {
    const fb = wordsRaw.value.filter(w => w?.difficulty === difficulty.value);
    const ch = fb[Math.floor(Math.random() * Math.max(fb.length, 1))] || { word: 'apple', hint: '' };
    return { word: (ch.word || 'apple').toLowerCase().slice(0, needLen).padEnd(needLen, 'a'), hint: ch.hint || '' };
  }
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return { word: (choice.word || '').toLowerCase(), hint: choice.hint || '' };
}

function resetBoard() {
  guesses.splice(0);
  status.splice(0);
  cur.value = '';
  statusMsg.value = '';
  hintVisible.value = false;
  revealingRowIndex.value = -1;
  // clear keyboard state
  Object.keys(keyState).forEach(k => keyState[k] = '');
  stopConfetti();
}
function startGame() {
  if (!wordsRaw.value.length) return;
  resetBoard();
  const picked = pickAnswerObj();
  answer.value = picked.word;
  currentHint.value = picked.hint;
}

/* ---------- input ---------- */
function onKeydown(e) {
  if (statusMsg.value || revealingRowIndex.value !== -1) return;
  const key = e.key;

  if (/^[a-zA-Z]$/.test(key)) {
    if (cur.value.length < targetLen.value) cur.value += key.toLowerCase();
    e.preventDefault?.();
    return;
  }
  if (key === 'Backspace') { cur.value = cur.value.slice(0, -1); e.preventDefault?.(); return; }
  if (key === 'Enter') { submitGuess(); e.preventDefault?.(); }
}
function press(k) {
  if (statusMsg.value || revealingRowIndex.value !== -1) return;
  if (k === 'Enter') return submitGuess();
  if (k === 'Backspace') { cur.value = cur.value.slice(0, -1); return; }
  if (/^[A-Z]$/.test(k)) {
    const ch = k.toLowerCase();
    if (cur.value.length < targetLen.value) cur.value += ch;
  }
}
function maybeFocusMobile() { if (isMobile) mobileInput.value?.focus(); }

/* ---------- submit one by one and flip ---------- */
function submitGuess() {
  if (cur.value.length !== targetLen.value) {
    triggerRowShake(guesses.length);
    return;
  }

  const guess = cur.value;
  const res = scoreGuess(guess, answer.value);
  const rowIndex = guesses.length;

  guesses.push(guess);

  // 1) all line pending, prevent early coloring
  status.push(Array(targetLen.value).fill('pending'));
  cur.value = '';

  // 2) start flipping one by one
  revealingRowIndex.value = rowIndex;

  // 3) each cell changes color at 50% + update keyboard state
  for (let i = 0; i < targetLen.value; i++) {
    setTimeout(() => {
      const st = res[i];
      status[rowIndex][i] = st;          // change color of this cell
      updateKeyState(guess[i], st);      // sync keyboard
    }, i * REVEAL_GAP + HALF_FLIP);
  }

  // 4) after row animation ends, determine win/lose
  const total = (targetLen.value - 1) * REVEAL_GAP + SINGLE_FLIP;
  setTimeout(() => {
    revealingRowIndex.value = -1;
    afterReveal(guess);
  }, total + 20);
}

function afterReveal(guess) {
  const rowIndex = guesses.length - 1; // current row

  if (guess === answer.value) {
    statusMsg.value = '🎉 You Win!';
    launchConfetti();
  } else if (guesses.length >= maxAttempts) {
    statusMsg.value = `😵 You Lose — Answer: ${answer.value.toUpperCase()}`;
  } else {
    if (status[rowIndex]?.every(st => st === 'absent')) {
      triggerRowShake(rowIndex);
    }
  }
}

/* ---------- scoring ---------- */
function scoreGuess(guess, ans) {
  const n = ans.length, res = Array(n).fill('absent'), used = Array(n).fill(false);
  for (let i = 0; i < n; i++) if (guess[i] === ans[i]) { res[i] = 'correct'; used[i] = true; }
  for (let i = 0; i < n; i++) {
    if (res[i] === 'correct') continue;
    const ch = guess[i];
    let hit = false;
    for (let j = 0; j < n; j++) if (!used[j] && ans[j] === ch) { used[j] = true; hit = true; break; }
    if (hit) res[i] = 'present';
  }
  return res;
}

/* ---------- rendering helpers ---------- */
function letterAt(r, c) {
  if (r < guesses.length) return guesses[r][c] ?? '';
  if (r === guesses.length) return cur.value[c] ?? '';
  return '';
}
function cellClass(r, c) {
  const base = [];
  if (r < status.length) base.push(status[r][c]);           // pending / correct / present / absent
  if (r === revealingRowIndex.value) base.push('flipping'); // flipping
  if (shakingRows.has(r)) base.push('shaking');             // shaking effect
  if (r === guesses.length && !statusMsg.value && revealingRowIndex.value === -1 && cur.value[c]) {
    base.push('active');
  }
  return base;
}
function flipStyle(r, c) {
  if (r !== revealingRowIndex.value) return {};
  return { '--reveal-delay': `${c * REVEAL_GAP}ms` };
}

/* ---------- confetti ---------- */
function resizeCanvas() {
  const cvs = confettiCanvas.value;
  if (!cvs) return;
  cvs.width  = window.innerWidth;
  cvs.height = window.innerHeight;
  cvs.style.background = 'transparent';
}
async function launchConfetti() {
  confettiRunning.value = true;
  await nextTick();
  const cvs = confettiCanvas.value;
  if (!cvs) return;

  resizeCanvas();
  const ctx = cvs.getContext('2d');
  const particles = Array.from({ length: 200 }).map(() => ({
    x: Math.random() * cvs.width,
    y: -20 - Math.random() * 120,
    r: 2 + Math.random() * 4,
    vx: -1 + Math.random() * 2,
    vy: 2 + Math.random() * 3.5,
    a: Math.random() * Math.PI * 2,
    va: -0.25 + Math.random() * 0.5
  }));

  const start = performance.now();
  function frame(t) {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.a += p.va;
      const hue = (p.x / cvs.width) * 360;
      ctx.fillStyle = `hsl(${hue}, 90%, 60%)`;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
      ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
      ctx.restore();
    }
    if (t - start < 2200) confettiTimer = requestAnimationFrame(frame);
    else stopConfetti();
  }
  confettiTimer = requestAnimationFrame(frame);
}
function stopConfetti() {
  if (confettiTimer) cancelAnimationFrame(confettiTimer);
  confettiTimer = null;
  confettiRunning.value = false;
}

const shakingRows = reactive(new Set());
function triggerRowShake(r) {
  shakingRows.add(r);
  setTimeout(() => shakingRows.delete(r), 600); // animation duration
}
</script>

<style scoped>
.wordly {
  --cell: 52px;
  max-width: 1100px; /* enlarge container to fit side instructions */
  margin: 24px auto;
  padding: 0 16px 48px;
  color: #e6e6eb;
  position: relative;
}

.wordly .breadcrumb { margin-bottom: 20px; }

/* toolbar */
.wd-toolbar{
  display:flex; align-items:center; justify-content:flex-start;
  gap:12px; margin-bottom:16px; flex-wrap:nowrap;
}
.wd-left{ display:flex; align-items:center; gap:10px; flex:0 0 auto; }
.wd-status{ white-space:nowrap; }
.wd-right{ margin-left:auto; flex:0 1 auto; }
.wd-right .wd-hint{
  display:flex; align-items:center; gap:10px;
  background:#1b1c22; border:1px dashed #343644;
  padding:8px 12px; border-radius:10px;
  max-width:min(60vw, 560px);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.wd-hint-content{ opacity:.95; overflow:hidden; text-overflow:ellipsis; }

.wd-label { opacity: .85; margin-right: 4px; }
.wd-select { background:#1e1f26; color:#e6e6eb; border:1px solid #343644; padding:6px 10px; border-radius:8px; outline:none; }
.wd-btn { background:#4f46e5; color:#fff; border:0; padding:6px 12px; border-radius:8px; cursor:pointer; font-weight:600; }
.wd-btn.ghost { background:transparent; border:1px dashed #4f46e5; color:#cfd3ff; padding:4px 8px; }
.wd-btn:hover { filter:brightness(1.07); }

/* hint card */
.wd-notice { background:#1b1c22; border:1px solid #343644; padding:10px 12px; border-radius:10px; margin:8px 0 16px; }
.wd-error { border-color:#b91c1c; color:#fecaca; }

/* ================= Playzone layout ================= */
.wd-playzone{
  display:grid;
  grid-template-columns: 1fr auto 1fr; /* left | board | right */
  gap: 20px;
  align-items: start;
}
.wd-board-col{
  display:flex;
  justify-content:center;
}
.wd-aside{
  background:#10121a;
  border:1px solid #343644;
  padding:12px 14px;
  border-radius:12px;
  color:#cfd2dd;
  max-width: 300px;
  position: sticky;
  top: 84px;             /* roughly align with the bottom of the toolbar, adjust as needed */
  height: fit-content;
}
.wd-aside-title{
  margin: 2px 0 8px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: .2px;
  color: #e8e9f3;
}
.wd-steps{
  margin: 0 0 8px 18px;
  padding: 0;
  line-height: 1.5;
}
.wd-legend { margin: 8px 0; }
.legend-row{
  display:flex; align-items:center;
  gap:10px; margin:6px 0;
}
.wd-note{ opacity:.9; font-size: 13px; margin-top: 4px; }

.wd-bullets{
  margin: 0; padding-left: 18px;
  line-height: 1.5;
}

/* board */
.wd-board-wrap { display:flex; justify-content:center; position:relative; }
.wd-board { display:grid; grid-template-rows:repeat(6, var(--cell)); gap:10px; perspective:900px; }

.wd-cell {
  width:var(--cell); height:var(--cell);
  display:grid; place-items:center;
  border:2px solid #343644; border-radius:8px;
  font-weight:800; font-size:20px; text-transform:uppercase;
  background:#16171d; color:#e6e6eb;
  transition: transform .08s ease, background .2s ease, border-color .2s ease, color .2s ease;
}
.wd-cell.active { border-color:#6b7280; }

/* legend tiny tiles */
.wd-cell.tiny{
  width:22px; height:22px;
  font-size:12px; border-radius:6px;
  border-width: 2px;
}

/* statistic */
.wd-cell.correct { background:#16a34a; border-color:#16a34a; color:#0b0c0f; }
.wd-cell.present { background:#eab308; border-color:#eab308; color:#0b0c0f; }
.wd-cell.absent  { background:#272935; border-color:#3a3d4b; color:#9aa0ad; }
.wd-cell.pending { background:#16171d; border-color:#343644; color:#e6e6eb; }

/* flipping animation */
.wd-cell.flipping{
  animation: wd-flip 250ms ease forwards;
  animation-delay: var(--reveal-delay, 0ms);
  transform-style: preserve-3d;
}
@keyframes wd-flip{
  0%   { transform: rotateX(0deg); }
  49%  { transform: rotateX(90deg); }
  50%  { transform: rotateX(-90deg); }
  100% { transform: rotateX(0deg); }
}

/* hidden input */
.wd-hidden-input{
  position:absolute !important;
  left:-9999px !important; top:0 !important;
  width:0 !important; height:0 !important;
  opacity:0 !important; border:0 !important; padding:0 !important;
  pointer-events:none !important;
  clip: rect(0 0 0 0) !important; clip-path: inset(50%) !important;
  white-space: nowrap !important;
}

/* confetti */
.wd-confetti{
  position: fixed; inset: 0;
  pointer-events: none;
  background: transparent !important;
  border: 0; outline: 0; display: block;
  z-index: 9999;
}

/* keyboard */
.wd-kbd { max-width: 640px; margin: 18px auto 0; user-select: none; }
.wd-row { display:flex; justify-content:center; gap:8px; margin-top:8px; }
.wd-key { background:#1f2230; color:#e7e9f0; border:1px solid #343a55; padding:10px 12px; border-radius:8px; min-width:34px; font-weight:700; cursor:pointer; }
.wd-key.wd-wide { min-width:72px; }
.wd-key:active { transform:translateY(1px); }

/* keyboard state colors */
.wd-key.correct { background:#16a34a; border-color:#16a34a; color:#0b0c0f; }
.wd-key.present { background:#eab308; border-color:#eab308; color:#0b0c0f; }
.wd-key.absent  { background:#272935; border-color:#3a3d4b; color:#9aa0ad; }

/* shaking animation */
.wd-cell.shaking { animation: wd-shake 0.6s ease; }
@keyframes wd-shake {
  0%, 100% { transform: translateX(0); }
  15%, 45%, 75% { transform: translateX(-6px); }
  30%, 60%, 90% { transform: translateX(6px); }
}

/* ====== Mobile panels visibility ====== */
.wd-mobile-panels { display: none; }

/* ≤980px：hide side panels */
@media (max-width: 980px) {
  .wd-playzone { grid-template-columns: 1fr; }
  .wd-aside { display: none; }               /* hide left and right side panels */
  .wd-mobile-panels { 
    display: block; 
    margin-top: 12px; 
  }
  .wordly { --cell: 46px; }
  .wd-right .wd-hint { max-width: 80vw; }
  .wd-key { padding: 8px 10px; }
}

/* foldable panels */
.wd-coll {
  background:#10121a;
  border:1px solid #343644;
  padding: 8px 12px;
  border-radius:12px;
  color:#cfd2dd;
}
.wd-coll > summary {
  cursor: pointer;
  font-weight: 800;
  color:#e8e9f3;
  list-style: none;
  display: flex; align-items: center; gap: 8px;
}
.wd-coll > summary::-webkit-details-marker { display: none; }
.wd-coll > summary::before{
  content: '▸';
  display:inline-block; transform: translateY(1px);
  opacity: .9;
}
.wd-coll[open] > summary::before{ content: '▾'; }
.wd-coll > *:not(summary){ margin-top:8px; }
</style>
