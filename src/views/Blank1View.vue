<template>
  <section class="wordly">
    <!-- 顶部工具栏 -->
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
          <div class="wd-hint-content">
            {{ hintVisible ? (currentHint || '—') : '—' }}
          </div>
        </div>
      </div>
    </header>

    <!-- 加载 / 报错 -->
    <div class="wd-notice" v-if="loading">Loading words…</div>
    <div class="wd-notice wd-error" v-else-if="error">{{ error }}</div>

    <!-- 棋盘 -->
    <main class="wd-board-wrap" v-else @click="maybeFocusMobile">
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

      <!-- 移动端隐藏输入：仅用于调起软键盘 -->
      <input
        ref="mobileInput"
        class="wd-hidden-input"
        inputmode="latin"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        @keydown.prevent="onKeydown"
      />

      <!-- 胜利礼花 -->
      <canvas v-if="confettiRunning" ref="confettiCanvas" class="wd-confetti"></canvas>
    </main>

    <!-- 屏幕键盘 -->
    <footer class="wd-kbd" v-if="!loading">
      <div class="wd-row">
        <button v-for="k in row1" :key="k" class="wd-key" @click="press(k)">{{ k }}</button>
      </div>
      <div class="wd-row">
        <button v-for="k in row2" :key="k" class="wd-key" @click="press(k)">{{ k }}</button>
      </div>
      <div class="wd-row">
        <button class="wd-key wd-wide" @click="press('Enter')">Enter</button>
        <button v-for="k in row3" :key="k" class="wd-key" @click="press(k)">{{ k }}</button>
        <button class="wd-key wd-wide" @click="press('Backspace')">Back</button>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';

const API_BASE = ''; // 同域 CloudFront

/* ----- 基础状态 ----- */
const difficulty = ref('Medium');
const targetLen = computed(() => (difficulty.value === 'Hard' ? 6 : 5));
const maxAttempts = 6;

const loading = ref(true);
const error = ref('');
const wordsRaw = ref([]);          // [{word, difficulty, hint}]
const answer = ref('');
const currentHint = ref('');
const hintVisible = ref(false);

const guesses = reactive([]);      // ['apple', ...]
const status  = reactive([]);      // [['correct','present',...], ...]
const cur = ref('');
const statusMsg = ref('');

/* ----- 动画控制 ----- */
const revealingRowIndex = ref(-1);
const REVEAL_GAP = 140;

/* ----- 礼花 ----- */
const confettiCanvas = ref(null);
let confettiTimer = null;
const confettiRunning = ref(false);

/* ----- 移动端输入 ----- */
const mobileInput = ref(null);
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

/* ----- 屏幕键盘 ----- */
const row1 = ['Q','W','E','R','T','Y','U','I','O','P'];
const row2 = ['A','S','D','F','G','H','J','K','L'];
const row3 = ['Z','X','C','V','B','N','M'];

/* ----- 生命周期 ----- */
onMounted(async () => {
  try {
    await fetchWords();
    startGame();
    // 桌面端使用全局键盘监听；移动端事件交给隐藏 input（它也会触发 onKeydown）
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

/* ----- API ----- */
async function fetchWords() {
  const res = await fetch(`${API_BASE}/api/words`);
  if (!res.ok) throw new Error('fetch words failed');
  const data = await res.json();
  wordsRaw.value = Array.isArray(data) ? data : [];
}

/* ----- 出题（带 hint） ----- */
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
  stopConfetti();
}
function startGame() {
  if (!wordsRaw.value.length) return;
  resetBoard();
  const picked = pickAnswerObj();
  answer.value = picked.word;
  currentHint.value = picked.hint;
}

/* ----- 输入（桌面监听 window；移动监听 input） ----- */
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
    if (cur.value.length < targetLen.value) cur.value += k.toLowerCase();
  }
}
/** 点击棋盘：在移动端唤起软键盘 */
function maybeFocusMobile() {
  if (isMobile) mobileInput.value?.focus();
}

/* ----- 提交 + 翻牌 ----- */
function submitGuess() {
  if (cur.value.length !== targetLen.value) return;

  const guess = cur.value;
  const res = scoreGuess(guess, answer.value);

  const rowIndex = guesses.length;
  guesses.push(guess);
  status.push(Array(targetLen.value).fill('pending'));
  cur.value = '';

  revealingRowIndex.value = rowIndex;

  res.forEach((st, i) => {
    setTimeout(() => {
      status[rowIndex][i] = st;
      if (i === res.length - 1) {
        revealingRowIndex.value = -1;
        afterReveal(guess);
      }
    }, i * REVEAL_GAP + 250);
  });
}

function afterReveal(guess) {
  if (guess === answer.value) {
    statusMsg.value = '🎉 You Win!';
    launchConfetti();
  } else if (guesses.length >= maxAttempts) {
    statusMsg.value = `😵 You Lose — Answer: ${answer.value.toUpperCase()}`;
  } else {
    if (guesses.length === 2 && currentHint.value) hintVisible.value = true;
  }
}

/* ----- 判分 ----- */
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

/* ----- 渲染辅助 ----- */
function letterAt(r, c) {
  if (r < guesses.length) return guesses[r][c] ?? '';
  if (r === guesses.length) return cur.value[c] ?? '';
  return '';
}
function cellClass(r, c) {
  const base = [];
  if (r < status.length && r !== revealingRowIndex.value) base.push(status[r][c]);
  if (r === revealingRowIndex.value) base.push('flipping');
  if (r === guesses.length && !statusMsg.value && revealingRowIndex.value === -1) {
    if (cur.value[c]) base.push('active');
  }
  return base;
}
function flipStyle(r, c) {
  if (r !== revealingRowIndex.value) return {};
  return { '--reveal-delay': `${c * REVEAL_GAP}ms` };
}

/* ----- 礼花（v-if + nextTick） ----- */
function resizeCanvas() {
  const cvs = confettiCanvas.value;
  if (!cvs) return;
  const rect = cvs.parentElement.getBoundingClientRect();
  cvs.width = rect.width;
  cvs.height = 360;
  cvs.style.background = 'transparent';
}
async function launchConfetti() {
  confettiRunning.value = true;
  await nextTick(); // 等 canvas 挂载
  const cvs = confettiCanvas.value;
  if (!cvs) return;

  resizeCanvas();
  const ctx = cvs.getContext('2d');
  const particles = Array.from({ length: 140 }).map(() => ({
    x: Math.random() * cvs.width,
    y: -20 - Math.random() * 80,
    r: 2 + Math.random() * 4,
    vx: -1 + Math.random() * 2,
    vy: 2 + Math.random() * 3,
    a: Math.random() * Math.PI * 2,
    va: -0.2 + Math.random() * 0.4
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
    if (t - start < 1800) confettiTimer = requestAnimationFrame(frame);
    else stopConfetti();
  }
  confettiTimer = requestAnimationFrame(frame);
}
function stopConfetti() {
  if (confettiTimer) cancelAnimationFrame(confettiTimer);
  confettiTimer = null;
  confettiRunning.value = false;
}
</script>

<style scoped>
.wordly { --cell: 52px; max-width: 860px; margin: 24px auto; padding: 0 16px 48px; color: #e6e6eb; position: relative; }

/* 工具栏 */
.wd-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.wd-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.wd-label { opacity: .85; margin-right: 4px; }
.wd-select { background: #1e1f26; color: #e6e6eb; border: 1px solid #343644; padding: 6px 10px; border-radius: 8px; outline: none; }
.wd-btn { background: #4f46e5; color: white; border: 0; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.wd-btn.ghost { background: transparent; border: 1px dashed #4f46e5; color: #cfd3ff; padding: 4px 8px; }
.wd-btn:hover { filter: brightness(1.07); }
.wd-status { margin-left: 6px; opacity: .9; }

/* Hint */
.wd-right .wd-hint { display: flex; align-items: center; gap: 10px; background: #1b1c22; border: 1px dashed #343644; padding: 8px 12px; border-radius: 10px; }
.wd-hint-content { opacity: .95; }

/* 提示 */
.wd-notice { background: #1b1c22; border: 1px solid #343644; padding: 10px 12px; border-radius: 10px; margin: 8px 0 16px; }
.wd-error { border-color: #b91c1c; color: #fecaca; }

/* 棋盘 */
.wd-board-wrap { display: flex; justify-content: center; position: relative; }
.wd-board { display: grid; grid-template-rows: repeat(6, var(--cell)); gap: 10px; perspective: 800px; }
.wd-cell {
  width: var(--cell); height: var(--cell);
  display: grid; place-items: center;
  border: 2px solid #343644; border-radius: 8px;
  font-weight: 800; font-size: 20px; text-transform: uppercase;
  background: #16171d; color: #e6e6eb;
  transition: transform .08s ease, background .2s ease, border-color .2s ease;
}
.wd-cell.active { border-color: #6b7280; }
.wd-cell.correct { background: #16a34a; border-color: #16a34a; color: #0b0c0f; }
.wd-cell.present { background: #eab308; border-color: #eab308; color: #0b0c0f; }
.wd-cell.absent  { background: #272935; border-color: #3a3d4b; color: #9aa0ad; }

/* 翻牌动画 */
.wd-cell.flipping {
  animation: wd-flip 250ms ease forwards;
  animation-delay: var(--reveal-delay, 0ms);
  transform-style: preserve-3d;
}
@keyframes wd-flip {
  0%   { transform: rotateX(0deg); }
  49%  { transform: rotateX(90deg); }
  50%  { transform: rotateX(-90deg); }
  100% { transform: rotateX(0deg); }
}

/* 移动端隐藏输入（彻底隐藏） */
.wd-hidden-input{
  position:absolute !important;
  left:-9999px !important;
  top:0 !important;
  width:0 !important;
  height:0 !important;
  opacity:0 !important;
  border:0 !important;
  padding:0 !important;
  pointer-events:none !important;
  clip: rect(0 0 0 0) !important;
  clip-path: inset(50%) !important;
  white-space: nowrap !important;
}

/* 礼花画布 */
.wd-confetti{
  position:absolute; inset:0; height:360px;
  pointer-events:none; background:transparent !important;
  border:0; outline:0; display:block;
}

/* 屏幕键盘 */
.wd-kbd { max-width: 640px; margin: 18px auto 0; user-select: none; }
.wd-row { display: flex; justify-content: center; gap: 8px; margin-top: 8px; }
.wd-key { background: #1f2230; color: #e7e9f0; border: 1px solid #343a55; padding: 10px 12px; border-radius: 8px; min-width: 34px; font-weight: 700; cursor: pointer; }
.wd-key.wd-wide { min-width: 72px; }
.wd-key:active { transform: translateY(1px); }

@media (max-width: 560px) {
  .wordly { --cell: 46px; }
  .wd-key { padding: 8px 10px; }
}
</style>
