<template>
  <section class="wordly">
    <!-- 顶部工具栏 -->
    <header class="toolbar">
      <div class="left">
        <label class="label">Difficulty</label>
        <select v-model="difficulty" @change="startGame" class="select">
          <option value="Easy">Easy (5)</option>
          <option value="Medium">Medium (5)</option>
          <option value="Hard">Hard (6)</option>
        </select>

        <button class="btn" @click="startGame">New Game</button>
        <span class="status" v-if="statusMsg">{{ statusMsg }}</span>
      </div>

      <div class="right">
        <div class="hint">
          <strong>Hint</strong>
          <div class="hint-content">—</div>
        </div>
      </div>
    </header>

    <!-- 加载 / 报错 -->
    <div class="notice" v-if="loading">Loading words…</div>
    <div class="notice error" v-else-if="error">{{ error }}</div>

    <!-- 游戏棋盘 -->
    <main class="board-wrap" v-else @click="focusHiddenInput">
      <div
        class="board"
        :style="{ gridTemplateColumns: `repeat(${targetLen}, var(--cell))` }"
      >
        <template v-for="r in maxAttempts" :key="r">
          <div
            v-for="c in targetLen"
            :key="`${r}-${c}`"
            class="cell"
            :class="cellClass(r-1, c-1)"
          >
            {{ letterAt(r-1, c-1) }}
          </div>
        </template>
      </div>

      <!-- 隐藏输入（捕获物理键盘） -->
      <input
        ref="hiddenInput"
        class="hidden-input"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        @keydown.prevent="onKeydown"
      />
    </main>

    <!-- 屏幕键盘（移动端友好） -->
    <footer class="kbd" v-if="!loading">
      <div class="row">
        <button v-for="k in row1" :key="k" class="key" @click="press(k)">{{ k }}</button>
      </div>
      <div class="row">
        <button v-for="k in row2" :key="k" class="key" @click="press(k)">{{ k }}</button>
      </div>
      <div class="row">
        <button class="key wide" @click="press('Enter')">Enter</button>
        <button v-for="k in row3" :key="k" class="key" @click="press(k)">{{ k }}</button>
        <button class="key wide" @click="press('Backspace')">Back</button>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';

/** === API 配置 ===
 * 走 CloudFront 同域代理：保持空字符串 ''，请求 /api/words
 * 如需直连 Render（不推荐）：改成 'https://nexgentech-api.onrender.com'
 */
const API_BASE = '';

/** === 状态 === */
const difficulty = ref('Easy');
const targetLen = computed(() => (difficulty.value === 'Hard' ? 6 : 5));
const maxAttempts = 6;

const loading = ref(true);
const error = ref('');
const wordsRaw = ref([]);     // 全量词库
const answer = ref('');       // 当前谜底（小写）
const guesses = reactive([]); // 提交过的行（字符串）
const cur = ref('');          // 当前输入
const status = reactive([]);  // 每行每格状态：'correct'|'present'|'absent'
const statusMsg = ref('');

const hiddenInput = ref(null);

/** === 屏幕键盘布局 === */
const row1 = ['Q','W','E','R','T','Y','U','I','O','P'];
const row2 = ['A','S','D','F','G','H','J','K','L'];
const row3 = ['Z','X','C','V','B','N','M'];

/** === 启动流程 === */
onMounted(async () => {
  try {
    await fetchWords();
    startGame();
  } catch (e) {
    error.value = 'Failed to load words. Please retry later.';
  } finally {
    loading.value = false;
  }
});

/** 拉取词库 */
async function fetchWords() {
  const res = await fetch(`${API_BASE}/api/words`);
  if (!res.ok) throw new Error('fetch words failed');
  const data = await res.json();
  wordsRaw.value = Array.isArray(data) ? data : [];
}

/** 选择一个符合难度与长度的词作为谜底 */
function pickAnswer() {
  const needLen = targetLen.value;
  const pool = wordsRaw.value.filter(
    (w) =>
      (w?.difficulty === difficulty.value) &&
      typeof w?.word === 'string' &&
      w.word.length === needLen
  );
  if (pool.length === 0) {
    // 兜底：取同难度任意词并适配长度（极少会用到）
    const fallback = wordsRaw.value.filter((w) => w?.difficulty === difficulty.value);
    const choice = fallback[Math.floor(Math.random() * Math.max(fallback.length, 1))] || { word: 'apple' };
    return (choice.word || 'apple').toLowerCase().slice(0, needLen).padEnd(needLen, 'a');
  }
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return (choice.word || '').toLowerCase();
}

/** 重置棋盘并开始新一局 */
function resetBoard() {
  guesses.splice(0);
  status.splice(0);
  cur.value = '';
  statusMsg.value = '';
}

function startGame() {
  if (!wordsRaw.value.length) return;
  resetBoard();
  answer.value = pickAnswer();
  nextTick(() => hiddenInput.value?.focus());
}

/** 键盘输入（物理） */
function onKeydown(e) {
  if (statusMsg.value) return; // 游戏结束后不再处理输入
  const key = e.key;

  if (/^[a-zA-Z]$/.test(key)) {
    if (cur.value.length < targetLen.value) {
      cur.value += key.toLowerCase();
    }
    return;
  }
  if (key === 'Backspace') {
    cur.value = cur.value.slice(0, -1);
    return;
  }
  if (key === 'Enter') {
    submitGuess();
    return;
  }
}

/** 屏幕键盘输入 */
function press(k) {
  if (statusMsg.value) return;
  if (k === 'Enter') return submitGuess();
  if (k === 'Backspace') {
    cur.value = cur.value.slice(0, -1);
    return;
  }
  if (/^[A-Z]$/.test(k)) {
    if (cur.value.length < targetLen.value) {
      cur.value += k.toLowerCase();
    }
  }
}

/** 提交一行猜测并评分 */
function submitGuess() {
  if (cur.value.length !== targetLen.value) return;

  const guess = cur.value;
  const res = scoreGuess(guess, answer.value);
  guesses.push(guess);
  status.push(res);
  cur.value = '';

  if (guess === answer.value) {
    statusMsg.value = '🎉 You Win!';
  } else if (guesses.length >= maxAttempts) {
    statusMsg.value = `😵 You Lose — Answer: ${answer.value.toUpperCase()}`;
  }
}

/** Wordle 评分：两遍算法避免重复字母误判 */
function scoreGuess(guess, ans) {
  const n = ans.length;
  const res = Array(n).fill('absent');
  const used = Array(n).fill(false);

  // 第一遍：位置正确
  for (let i = 0; i < n; i++) {
    if (guess[i] === ans[i]) {
      res[i] = 'correct';
      used[i] = true;
    }
  }
  // 第二遍：存在但位置不对
  for (let i = 0; i < n; i++) {
    if (res[i] === 'correct') continue;
    const ch = guess[i];
    let found = false;
    for (let j = 0; j < n; j++) {
      if (!used[j] && ans[j] === ch) {
        found = true;
        used[j] = true;
        break;
      }
    }
    if (found) res[i] = 'present';
  }
  return res;
}

/** 渲染格子字符/样式 */
function letterAt(r, c) {
  if (r < guesses.length) return guesses[r][c] ?? '';
  if (r === guesses.length) return cur.value[c] ?? '';
  return '';
}
function cellClass(r, c) {
  if (r < status.length) return status[r][c];
  if (r === guesses.length) return (cur.value[c] ? 'active' : '');
  return '';
}

/** 聚焦隐藏输入框（点击棋盘时） */
function focusHiddenInput() {
  hiddenInput.value?.focus();
}
</script>

<style scoped>
:root { --cell: 52px; }

.wordly {
  max-width: 860px;
  margin: 24px auto;
  padding: 0 16px 48px;
  color: #e6e6eb;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
}

/* 顶部工具栏 */
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
}
.left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.label { opacity: .85; margin-right: 4px; }
.select {
  background: #1e1f26; color: #e6e6eb; border: 1px solid #343644;
  padding: 6px 10px; border-radius: 8px; outline: none;
}
.btn {
  background: #4f46e5; color: white; border: 0; padding: 6px 12px;
  border-radius: 8px; cursor: pointer; font-weight: 600;
}
.btn:hover { filter: brightness(1.07); }
.status { margin-left: 6px; opacity: .9; }

/* Hint 卡片 */
.right .hint {
  display: flex; align-items: center; gap: 10px;
  background: #1b1c22; border: 1px dashed #343644; padding: 8px 12px; border-radius: 10px;
}
.hint-content { opacity: .8; }

/* 提示 */
.notice {
  background: #1b1c22; border: 1px solid #343644;
  padding: 10px 12px; border-radius: 10px; margin: 8px 0 16px;
}
.notice.error { border-color: #b91c1c; color: #fecaca; }

/* 棋盘 */
.board-wrap { display: flex; justify-content: center; }
.board {
  display: grid;
  grid-template-rows: repeat(6, var(--cell));
  gap: 10px;
}
.cell {
  width: var(--cell); height: var(--cell);
  display: grid; place-items: center;
  border: 2px solid #343644; border-radius: 8px;
  font-weight: 800; font-size: 20px; text-transform: uppercase;
  background: #16171d; color: #e6e6eb;
  transition: transform .08s ease, background .2s ease, border-color .2s ease;
}
.cell.active { border-color: #6b7280; }
.cell.correct { background: #16a34a; border-color: #16a34a; color: #0b0c0f; }
.cell.present { background: #eab308; border-color: #eab308; color: #0b0c0f; }
.cell.absent  { background: #272935; border-color: #3a3d4b; color: #9aa0ad; }

/* 隐藏输入 */
.hidden-input {
  position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0;
}

/* 屏幕键盘 */
.kbd { max-width: 640px; margin: 18px auto 0; user-select: none; }
.kbd .row { display: flex; justify-content: center; gap: 8px; margin-top: 8px; }
.key {
  background: #1f2230; color: #e7e9f0; border: 1px solid #343a55;
  padding: 10px 12px; border-radius: 8px; min-width: 34px;
  font-weight: 700; cursor: pointer;
}
.key.wide { min-width: 72px; }
.key:active { transform: translateY(1px); }

@media (max-width: 560px) {
  :root { --cell: 46px; }
  .key { padding: 8px 10px; }
}
</style>
