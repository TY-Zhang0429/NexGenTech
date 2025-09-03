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
    <main class="wd-board-wrap" v-else @click="focusHiddenInput">
      <div
        class="wd-board"
        :style="{ gridTemplateColumns: `repeat(${targetLen}, var(--cell))` }"
      >
        <template v-for="r in maxAttempts" :key="r">
          <div
            v-for="c in targetLen"
            :key="`${r}-${c}`"
            class="wd-cell"
            :class="[cellClass(r-1, c-1), flipClass(r-1, c-1)]"
            :style="flipStyle(r-1, c-1)"
          >
            {{ letterAt(r-1, c-1) }}
          </div>
        </template>
      </div>

      <!-- 捕获键盘输入 -->
      <input
        ref="hiddenInput"
        class="wd-hidden-input"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        @keydown.prevent="onKeydown"
      />

      <!-- 礼花画布（胜利时显示） -->
      <canvas
        v-if="confettiRunning"
        ref="confettiCanvas"
        class="wd-confetti"
      ></canvas>
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
import { ref, reactive, computed, onMounted, nextTick, onBeforeUnmount } from 'vue';

const API_BASE = ''; // 同域 CloudFront

// 基本状态
const difficulty = ref('Medium');
const targetLen = computed(() => (difficulty.value === 'Hard' ? 6 : 5));
const maxAttempts = 6;

const loading = ref(true);
const error = ref('');
const wordsRaw = ref([]); // [{word, difficulty, hint}]
const answer = ref('');
const currentHint = ref('');
const hintVisible = ref(false);

const guesses = reactive([]);  // ['apple', ...]
const status  = reactive([]);  // [['correct','present',...], ...]
const cur = ref('');
const statusMsg = ref('');
const hiddenInput = ref(null);

// 动画：翻转控制
const revealingRowIndex = ref(-1); // 正在翻的行：-1 表示没有
const REVEAL_GAP = 140;            // 每格延时 ms

// 礼花
const confettiCanvas = ref(null);
let confettiTimer = null;
const confettiRunning = ref(false);

// 屏幕键盘
const row1 = ['Q','W','E','R','T','Y','U','I','O','P'];
const row2 = ['A','S','D','F','G','H','J','K','L'];
const row3 = ['Z','X','C','V','B','N','M'];

onMounted(async () => {
  try {
    await fetchWords();
    startGame();
    window.addEventListener('resize', resizeCanvas);
  } catch (e) {
    error.value = 'Failed to load words. Please retry later.';
  } finally {
    loading.value = false;
  }
});
onBeforeUnmount(() => {
  stopConfetti();
  window.removeEventListener('resize', resizeCanvas);
});

// 拉词
async function fetchWords() {
  const res = await fetch(`${API_BASE}/api/words`);
  if (!res.ok) throw new Error('fetch words failed');
  const data = await res.json();
  wordsRaw.value = Array.isArray(data) ? data : [];
}

// 选谜底（含 hint）
function pickAnswerObj() {
  const needLen = targetLen.value;
  const pool = wordsRaw.value.filter(
    w => w?.difficulty === difficulty.value && typeof w?.word === 'string' && w.word.length === needLen
  );
  if (pool.length === 0) {
    const fb = wordsRaw.value.filter(w => w?.difficulty === difficulty.value);
    const ch = fb[Math.floor(Math.random() * Math.max(fb.length, 1))] || { word: 'apple', hint: '' };
    return { word: (ch.word || 'apple').toLowerCase().slice(0, needLen).padEnd(needLen, 'a'), hint: ch.hint || '' };
  }
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return { word: (choice.word || '').toLowerCase(), hint: choice.hint || '' };
}

// 开新局
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
  nextTick(() => hiddenInput.value?.focus());
}

// 输入（翻牌或已结束时禁用）
function onKeydown(e) {
  if (statusMsg.value || revealingRowIndex.value !== -1) return;
  const key = e.key;
  if (/^[a-zA-Z]$/.test(key)) {
    if (cur.value.length < targetLen.value) cur.value += key.toLowerCase();
    return;
  }
  if (key === 'Backspace') { cur.value = cur.value.slice(0, -1); return; }
  if (key === 'Enter') submitGuess();
}
function press(k) {
  if (statusMsg.value || revealingRowIndex.value !== -1) return;
  if (k === 'Enter') return submitGuess();
  if (k === 'Backspace') { cur.value = cur.value.slice(0, -1); return; }
  if (/^[A-Z]$/.test(k)) {
    if (cur.value.length < targetLen.value) cur.value += k.toLowerCase();
  }
}

// 提交一行并逐格翻转
function submitGuess() {
  if (cur.value.length !== targetLen.value) return;

  const guess = cur.value;
  const res = scoreGuess(guess, answer.value);

  const rowIndex = guesses.length;
  guesses.push(guess);
  status.push(Array(targetLen.value).fill('pending')); // 先占位
  cur.value = '';

  revealingRowIndex.value = rowIndex;          // 开始翻这一行

  // 逐格写入最终状态（与 CSS 动画延时对齐）
  res.forEach((st, i) => {
    setTimeout(() => {
      status[rowIndex][i] = st;
      if (i === res.length - 1) {
        // 最后一格翻完
        revealingRowIndex.value = -1;
        afterReveal(guess);
      }
    }, i * REVEAL_GAP + 250); // 250ms 单格翻面时长
  });
}

function afterReveal(guess) {
  if (guess === answer.value) {
    statusMsg.value = '🎉 You Win!';
    launchConfetti();
  } else if (guesses.length >= maxAttempts) {
    statusMsg.value = `😵 You Lose — Answer: ${answer.value.toUpperCase()}`;
  } else {
    // 比如猜两次自动展示 hint
    if (guesses.length === 2 && currentHint.value) hintVisible.value = true;
  }
}

// 判分
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

// 渲染
function letterAt(r, c) {
  if (r < guesses.length) return guesses[r][c] ?? '';
  if (r === guesses.length) return cur.value[c] ?? '';
  return '';
}
function cellClass(r, c) {
  const base = [];
  // 已揭示完的行，使用最终状态
  if (r < status.length && r !== revealingRowIndex.value) base.push(status[r][c]);
  // 正在翻转的行，标记 flipping
  if (r === revealingRowIndex.value) base.push('flipping');
  // 当前输入行
  if (r === guesses.length && !statusMsg.value && revealingRowIndex.value === -1) {
    if (cur.value[c]) base.push('active');
  }
  return base;
}
function flipClass(r, c) {
  return r === revealingRowIndex.value ? 'flipping' : '';
}
function flipStyle(r, c) {
  if (r !== revealingRowIndex.value) return {};
  return { '--reveal-delay': `${c * REVEAL_GAP}ms` };
}
function focusHiddenInput() { hiddenInput.value?.focus(); }

// ===== 轻量礼花（无需第三方库） =====
function resizeCanvas() {
  const cvs = confettiCanvas.value;
  if (!cvs) return;
  const rect = cvs.parentElement.getBoundingClientRect();
  cvs.width = rect.width;
  cvs.height = 360; // 顶部区域即可
  cvs.style.background = 'transparent';
}
function launchConfetti() {
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
  confettiRunning.value = true;
  const start = performance.now();

  function frame(t) {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.a += p.va;
      const hue = (p.x / cvs.width) * 360;
      ctx.fillStyle = `hsl(${hue}, 90%, 60%)`;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
      ctx.restore();
    }
    if (t - start < 1800) { confettiTimer = requestAnimationFrame(frame); }
    else { stopConfetti(); }
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

/* 翻牌动画（逐格延迟通过 --reveal-delay 控制） */
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

/* 礼花画布 */
.wd-confetti {
  position: absolute;
  inset: 0;                /* 覆盖父容器 */
  height: 360px;           /* 你原来用的高度，保留即可 */
  pointer-events: none;
  background: transparent !important; /* 强制透明，覆盖全局白底 */
  outline: none;
  border: 0;
  display: block;
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
