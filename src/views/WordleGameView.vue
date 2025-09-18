<template>
  <section class="wordly">
    <!-- Avatar & Breadcrumbs -->
    <DraggableAvatar />
    <BreadcrumbNav />

    <!-- ===== Toolbar ===== -->
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

    <!-- ===== Desktop stage: LEFT (instructions) | CENTER (board+keyboard) | RIGHT (ghost) ===== -->
    <div class="wd-stage" v-if="!loading && !error">
      <!-- LEFT: two independent collapsible cards -->
      <aside class="wd-left-stack" aria-label="Instructions (desktop)">
        <!-- Card 1 -->
        <div class="wd-aside wd-aside-collapsible" :class="{ open: playOpen }">
          <button class="wd-aside-toggle" @click="playOpen = !playOpen" :aria-expanded="playOpen">
            <span class="chev" :class="{ open: playOpen }">▸</span>
            How to Play
          </button>
          <div class="wd-aside-body">
            <h3 class="wd-aside-title">How to Play</h3>
            <ol class="wd-steps">
              <li>Guess the word in <strong>{{ maxAttempts }}</strong> tries.</li>
              <li>Each guess must be a valid <strong>{{ targetLen }}</strong>-letter word. Press <kbd>Enter</kbd> to submit.</li>
              <li>The tile colors show how close your guess was:</li>
            </ol>
            <div class="wd-legend">
              <div class="legend-row"><span class="wd-cell tiny correct">A</span><span>Right letter, right spot</span></div>
              <div class="legend-row"><span class="wd-cell tiny present">A</span><span>Right letter, wrong spot</span></div>
              <div class="legend-row"><span class="wd-cell tiny absent">A</span><span>Letter not in the word</span></div>
            </div>
            <p class="wd-note">Use the on-screen keyboard or your physical keyboard.</p>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="wd-aside wd-aside-collapsible" :class="{ open: rulesOpen }">
          <button class="wd-aside-toggle" @click="rulesOpen = !rulesOpen" :aria-expanded="rulesOpen">
            <span class="chev" :class="{ open: rulesOpen }">▸</span>
            Rules & Tips
          </button>
          <div class="wd-aside-body">
            <h3 class="wd-aside-title">Rules & Tips</h3>
            <ul class="wd-bullets">
              <li><strong>Difficulty</strong>: {{ difficulty }} ({{ targetLen }} letters)</li>
              <li><strong>Attempts</strong>: {{ maxAttempts }}</li>
              <li><strong>Duplicates</strong>: Letters can repeat.</li>
              <li><strong>Hints</strong>: Click “Show” in the toolbar to view.</li>
            </ul>
          </div>
        </div>
      </aside>

      <!-- CENTER: board + mobile panels + keyboard -->
      <main class="wd-center" @click="maybeFocusMobile" aria-label="Game board">
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

          <!-- Hidden input to summon mobile soft keyboard -->
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

        <!-- Mobile-only accordions -->
        <div class="wd-mobile-panels">
          <details class="wd-coll">
            <summary>How to Play</summary>
            <ol class="wd-steps">
              <li>Guess the word in <strong>{{ maxAttempts }}</strong> tries.</li>
              <li>Each guess must be a valid <strong>{{ targetLen }}</strong>-letter word. Press <kbd>Enter</kbd> to submit.</li>
              <li>The tile colors show how close your guess was:</li>
            </ol>
            <div class="wd-legend">
              <div class="legend-row"><span class="wd-cell tiny correct">A</span><span>Right letter, right spot</span></div>
              <div class="legend-row"><span class="wd-cell tiny present">A</span><span>Right letter, wrong spot</span></div>
              <div class="legend-row"><span class="wd-cell tiny absent">A</span><span>Letter not in the word</span></div>
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

        <!-- On-screen keyboard INSIDE center column -->
        <div class="wd-kbd">
          <div class="wd-row">
            <button v-for="k in row1" :key="k" class="wd-key" :class="keyState[k.toLowerCase()]" @click="press(k)">{{ k }}</button>
          </div>
          <div class="wd-row">
            <button v-for="k in row2" :key="k" class="wd-key" :class="keyState[k.toLowerCase()]" @click="press(k)">{{ k }}</button>
          </div>
          <div class="wd-row">
            <button class="wd-key wd-wide" @click="press('Enter')">Enter</button>
            <button v-for="k in row3" :key="k" class="wd-key" :class="keyState[k.toLowerCase()]" @click="press(k)">{{ k }}</button>
            <button class="wd-key wd-wide" @click="press('Backspace')">Back</button>
          </div>
        </div>
      </main>

      <!-- RIGHT: Health tips (desktop only) -->
      <aside class="wd-right-tips" aria-label="Healthy Tips (desktop)">
        <!-- Collapsed state keeps width so the board stays centered -->
        <div v-if="!tipsOpen" class="tips-collapsed">
          <button class="wd-btn ghost" @click="openTips" aria-label="Show tips">Health Tips</button>
        </div>

        <div v-else class="tips-wrap">
          <header class="tips-header">
            <strong>Health Tips</strong>
            <div class="spacer"></div>
            <button class="icon" @click="prevTip" aria-label="Previous tip">‹</button>
            <button class="icon" @click="nextTip" aria-label="Next tip">›</button>
            <button class="icon close" @click="closeTips" aria-label="Hide tips">×</button>
          </header>

          <article class="tip-card">
            <div class="tip-tag">{{ currentTip.tag }}</div>
            <h4 class="tip-title">{{ currentTip.title }}</h4>
            <p class="tip-text">{{ currentTip.text }}</p>
            <ul v-if="currentTip.bullets?.length" class="tip-bullets">
              <li v-for="(b,i) in currentTip.bullets" :key="i">{{ b }}</li>
            </ul>

            <div class="tip-actions">
              <button class="wd-btn mini" @click="markDone">I’ll try it</button>
              <button class="wd-btn ghost mini" @click="shuffleTip">Shuffle</button>
              <button
                class="heart"
                :class="{ active: liked[currentTip.id] }"
                @click="toggleLike(currentTip.id)"
                :aria-pressed="!!liked[currentTip.id]"
                aria-label="Like this tip"
              >♥</button>
            </div>

            <div v-if="tipToast" class="tip-toast">{{ tipToast }}</div>
          </article>

          <!-- Tiny tracker: water glasses today -->
          <section class="mini-track">
            <div class="mini-title">Water today</div>
            <div class="dots">
              <button
                v-for="i in 8"
                :key="i"
                class="dot"
                :class="{ on: i <= waterGlasses }"
                @click="setWater(i)"
                :aria-label="`Glasses ${i}`"
              ></button>
              <button class="reset" @click="setWater(0)" aria-label="Reset water count">↺</button>
            </div>
          </section>
        </div>
      </aside>

    </div>

    <!-- Confetti -->
    <canvas v-if="confettiRunning" ref="confettiCanvas" class="wd-confetti"></canvas>
  </section>
</template>

<script setup>
/* ===== Imports ===== */
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import BreadcrumbNav from '@/components/BreadcrumbNav.vue';
import DraggableAvatar from '@/components/DraggableAvatar.vue';

const API_BASE = '';

/* ===== Game state ===== */
const difficulty = ref('Medium');
const targetLen = computed(() => (difficulty.value === 'Hard' ? 6 : 5));
const maxAttempts = 6;

const loading = ref(true);
const error = ref('');
const wordsRaw = ref([]);
const answer = ref('');
const currentHint = ref('');
const hintVisible = ref(false);

const guesses = reactive([]);
const status  = reactive([]);
const cur = ref('');
const statusMsg = ref('');

/* Desktop collapsibles */
const playOpen  = ref(false);
const rulesOpen = ref(false);

/* Animations */
const revealingRowIndex = ref(-1);
const REVEAL_GAP  = 140;
const SINGLE_FLIP = 250;
const HALF_FLIP   = Math.floor(SINGLE_FLIP / 2);

/* Keyboard coloring */
const keyState = reactive(Object.fromEntries('abcdefghijklmnopqrstuvwxyz'.split('').map(ch => [ch, ''])));
function updateKeyState(letter, newState) {
  const curSt = keyState[letter];
  if (curSt === 'correct') return;
  if (curSt === 'present' && newState === 'absent') return;
  keyState[letter] = newState;
}

/* Confetti */
const confettiCanvas = ref(null);
let confettiTimer = null;
const confettiRunning = ref(false);

/* Input helpers */
const mobileInput = ref(null);
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

/* Keyboard rows */
const row1 = ['Q','W','E','R','T','Y','U','I','O','P'];
const row2 = ['A','S','D','F','G','H','J','K','L'];
const row3 = ['Z','X','C','V','B','N','M'];

/* ===== Lifecycle ===== */
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

/* ===== API ===== */
async function fetchWords() {
  const res = await fetch(`${API_BASE}/api/words`);
  if (!res.ok) throw new Error('fetch words failed');
  const data = await res.json();
  wordsRaw.value = Array.isArray(data) ? data : [];
}

/* ===== New game ===== */
function pickAnswerObj() {
  const needLen = targetLen.value;
  const pool = wordsRaw.value.filter(
    (w) => w?.difficulty === difficulty.value && typeof w?.word === 'string' && w.word.length === needLen
  );
  if (!pool.length) {
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

/* ===== Input handling ===== */
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

/* ===== Submit & reveal ===== */
function submitGuess() {
  if (cur.value.length !== targetLen.value) { triggerRowShake(guesses.length); return; }

  const guess = cur.value;
  const res = scoreGuess(guess, answer.value);
  const rowIndex = guesses.length;

  guesses.push(guess);
  status.push(Array(targetLen.value).fill('pending'));
  cur.value = '';
  revealingRowIndex.value = rowIndex;

  for (let i = 0; i < targetLen.value; i++) {
    setTimeout(() => {
      const st = res[i];
      status[rowIndex][i] = st;
      updateKeyState(guess[i], st);
    }, i * REVEAL_GAP + HALF_FLIP);
  }

  const total = (targetLen.value - 1) * REVEAL_GAP + SINGLE_FLIP;
  setTimeout(() => {
    revealingRowIndex.value = -1;
    afterReveal(guess);
  }, total + 20);
}

function afterReveal(guess) {
  const rowIndex = guesses.length - 1;
  if (guess === answer.value) {
    statusMsg.value = '🎉 You Win!';
    launchConfetti();
  } else if (guesses.length >= maxAttempts) {
    statusMsg.value = `😵 You Lose — Answer: ${answer.value.toUpperCase()}`;
  } else if (status[rowIndex]?.every(st => st === 'absent')) {
    triggerRowShake(rowIndex);
  }
}

/* ===== Scoring ===== */
function scoreGuess(guess, ans) {
  const n = ans.length, res = Array(n).fill('absent'), used = Array(n).fill(false);
  for (let i = 0; i < n; i++) if (guess[i] === ans[i]) { res[i] = 'correct'; used[i] = true; }
  for (let i = 0; i < n; i++) {
    if (res[i] === 'correct') continue;
    const ch = guess[i]; let hit = false;
    for (let j = 0; j < n; j++) if (!used[j] && ans[j] === ch) { used[j] = true; hit = true; break; }
    if (hit) res[i] = 'present';
  }
  return res;
}

/* ===== Render helpers ===== */
function letterAt(r, c) {
  if (r < guesses.length) return guesses[r][c] ?? '';
  if (r === guesses.length) return cur.value[c] ?? '';
  return '';
}
function cellClass(r, c) {
  const base = [];
  if (r < status.length) base.push(status[r][c]);
  if (r === revealingRowIndex.value) base.push('flipping');
  if (shakingRows.has(r)) base.push('shaking');
  if (r === guesses.length && !statusMsg.value && revealingRowIndex.value === -1 && cur.value[c]) base.push('active');
  return base;
}
function flipStyle(r, c) {
  return r === revealingRowIndex.value ? { '--reveal-delay': `${c * REVEAL_GAP}ms` } : {};
}

/* ===== Confetti ===== */
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

/* ===== Row shake ===== */
const shakingRows = reactive(new Set());
function triggerRowShake(r) {
  shakingRows.add(r);
  setTimeout(() => shakingRows.delete(r), 600);
}

/* ===== Health tips (desktop right column) ===== */
// Tip list (simple, editable later or from API)
const tipsList = ref([
  {
    id: 'hydration',
    tag: 'Hydration',
    title: 'Drink a glass of water',
    text: 'Dehydration can feel like hunger. Sip some water before your next snack.',
    bullets: ['Try sparkling water + lemon', 'Keep a bottle within reach'],
  },
  {
    id: 'color_plate',
    tag: 'Micronutrients',
    title: 'Eat the rainbow',
    text: 'Add one colorful veggie/fruit to your next meal—fiber + vitamins!',
    bullets: ['Ideas: bell pepper, berries, spinach'],
  },
  {
    id: 'protein',
    tag: 'Protein',
    title: 'Palm-sized protein',
    text: 'Aim for a palm-sized protein each meal to support satiety & recovery.',
  },
  {
    id: 'movement',
    tag: 'Movement',
    title: '1-minute reset',
    text: 'Stand up, roll shoulders, stretch neck & wrists. Quick reset boosts focus.',
  },
  {
    id: 'swap',
    tag: 'Smart swap',
    title: 'Soda → sparkling water',
    text: 'Cut ~140 kcal. Add citrus or mint for flavor without sugar.',
  },
]);

const tipsOpen = ref(true);
const tipIndex = ref(0);
const currentTip = computed(() => tipsList.value[tipIndex.value]);

// like / done — persisted in localStorage (lightweight personalization)
const liked = reactive(JSON.parse(localStorage.getItem('tips_liked') || '{}'));
const doneTips = reactive(JSON.parse(localStorage.getItem('tips_done') || '{}'));

function saveLikes() { localStorage.setItem('tips_liked', JSON.stringify(liked)); }
function saveDone()  { localStorage.setItem('tips_done', JSON.stringify(doneTips)); }

function nextTip() { tipIndex.value = (tipIndex.value + 1) % tipsList.value.length; }
function prevTip() { tipIndex.value = (tipIndex.value - 1 + tipsList.value.length) % tipsList.value.length; }
function shuffleTip() { tipIndex.value = Math.floor(Math.random() * tipsList.value.length); }

const tipToast = ref('');
function toast(msg) { tipToast.value = msg; setTimeout(() => (tipToast.value = ''), 1200); }

function toggleLike(id) {
  liked[id] = !liked[id];
  saveLikes();
  toast(liked[id] ? 'Saved ❤️' : 'Unsaved');
}
function markDone() {
  doneTips[currentTip.value.id] = true;
  saveDone();
  toast('Nice! 🙌');
}

function closeTips() { tipsOpen.value = false; localStorage.setItem('tips_open', '0'); }
function openTips()  { tipsOpen.value = true;  localStorage.setItem('tips_open', '1'); }

// restore open state
onMounted(() => {
  const persisted = localStorage.getItem('tips_open');
  if (persisted === '0') tipsOpen.value = false;

  // Water tracker restore/reset daily
  const today = new Date().toISOString().slice(0, 10);
  const savedDay = localStorage.getItem('water_day');
  if (savedDay !== today) {
    localStorage.setItem('water_day', today);
    localStorage.setItem('water_glasses', '0');
  }
  waterGlasses.value = parseInt(localStorage.getItem('water_glasses') || '0', 10);
});

/* Mini water tracker */
const waterGlasses = ref(0);
function setWater(n) {
  waterGlasses.value = n;
  localStorage.setItem('water_glasses', String(n));
}

</script>

<style scoped>
/* ===== Base container ===== */
.wordly{
  --cell: 52px;
  max-width: 1100px;
  margin: 24px auto;
  padding: 0 16px 48px;
  color: #e6e6eb;
}

/* Toolbar */
.wd-toolbar{ display:flex; align-items:center; gap:12px; margin-bottom:16px; }
.wd-left{ display:flex; align-items:center; gap:10px; }
.wd-right{ margin-left:auto; }
.wd-label{ opacity:.85; margin-right:4px; }
.wd-select{ background:#1e1f26; color:#e6e6eb; border:1px solid #343644; padding:6px 10px; border-radius:8px; outline:none; }
.wd-btn{ background:#4f46e5; color:#fff; border:0; padding:6px 12px; border-radius:8px; cursor:pointer; font-weight:600; }
.wd-btn.ghost{ background:transparent; border:1px dashed #4f46e5; color:#cfd3ff; padding:4px 8px; }
.wd-status{ white-space:nowrap; }
.wd-right .wd-hint{ display:flex; align-items:center; gap:10px; background:#1b1c22; border:1px dashed #343644; padding:8px 12px; border-radius:10px; max-width:min(60vw,560px); }
.wd-hint-content{ opacity:.95; overflow:hidden; text-overflow:ellipsis; }

/* Info banners */
.wd-notice{ background:#1b1c22; border:1px solid #343644; padding:10px 12px; border-radius:10px; margin:8px 0 16px; }
.wd-error{ border-color:#b91c1c; color:#fecaca; }

/* ===== DESKTOP LAYOUT (pure flex) ===== */
.wd-stage{
  display:flex;
  align-items:flex-start;
  justify-content:center;  /* center middle column geometrically */
  gap: 28px;
}

/* LEFT column */
.wd-left-stack{
  flex: 0 0 300px;
  position: sticky;
  top: 84px;
}
.wd-left-stack .wd-aside + .wd-aside{ margin-top:14px; }

/* CENTER column */
.wd-center{ flex: 0 1 auto; min-width: 420px; display:flex; flex-direction:column; }
.wd-board-col{ display:flex; justify-content:center; }
.wd-board{ display:grid; grid-template-rows:repeat(6,var(--cell)); gap:10px; perspective:900px; }

/* RIGHT ghost mirrors left width */
.wd-right-ghost{ flex: 0 0 300px; }

/* Collapsible cards (smooth) */
.wd-aside{
  background:#10121a; border:1px solid #343644; border-radius:12px; color:#cfd2dd;
  padding:0; overflow:hidden;
}
.wd-aside-toggle{
  width:100%; display:flex; align-items:center; gap:8px;
  background:#151721; color:#e8e9f3; border:0; padding:10px 12px;
  cursor:pointer; font-weight:800;
}
.wd-aside-toggle .chev{ transition: transform .18s ease; }
.wd-aside-collapsible.open .wd-aside-toggle .chev{ transform: rotate(90deg); }
.wd-aside-body{
  padding:10px 12px; max-height:0; opacity:0; overflow:hidden;
  transition:max-height .28s ease, opacity .25s ease;
  border-top:1px solid #2a2c3a;
}
.wd-aside-collapsible.open .wd-aside-body{ max-height:900px; opacity:1; }

/* Inner content */
.wd-aside-title{ margin:2px 0 8px; font-size:15px; font-weight:800; color:#e8e9f3; }
.wd-steps{ margin:0 0 8px 18px; padding:0; line-height:1.5; }
.wd-legend{ margin:8px 0; }
.legend-row{ display:flex; align-items:center; gap:10px; margin:6px 0; }
.wd-note{ opacity:.9; font-size:13px; margin-top:4px; }
.wd-bullets{ margin:0; padding-left:18px; line-height:1.5; }

/* Tiles */
.wd-cell{
  width:var(--cell); height:var(--cell);
  display:grid; place-items:center;
  border:2px solid #343644; border-radius:8px;
  font-weight:800; font-size:20px; text-transform:uppercase;
  background:#16171d; color:#e6e6eb;
  transition: transform .08s ease, background .2s ease, border-color .2s ease, color .2s ease;
}
.wd-cell.active{ border-color:#6b7280; }
.wd-cell.tiny{ width:22px; height:22px; font-size:12px; border-radius:6px; border-width:2px; }
.wd-cell.correct{ background:#16a34a; border-color:#16a34a; color:#0b0c0f; }
.wd-cell.present{ background:#eab308; border-color:#eab308; color:#0b0c0f; }
.wd-cell.absent{ background:#272935; border-color:#3a3d4b; color:#9aa0ad; }

/* Flip */
.wd-cell.flipping{ animation: wd-flip 250ms ease forwards; animation-delay: var(--reveal-delay,0ms); transform-style: preserve-3d; }
@keyframes wd-flip{ 0%{transform:rotateX(0)} 49%{transform:rotateX(90deg)} 50%{transform:rotateX(-90deg)} 100%{transform:rotateX(0)} }

/* Hidden input */
.wd-hidden-input{ position:absolute; left:-9999px; width:0; height:0; opacity:0; pointer-events:none; }

/* Confetti */
.wd-confetti{ position:fixed; inset:0; pointer-events:none; background:transparent !important; z-index:9999; }

/* On-screen keyboard */
.wd-kbd{ max-width:640px; margin:18px auto 0; user-select:none; }
.wd-row{ display:flex; justify-content:center; gap:8px; margin-top:8px; }
.wd-key{ background:#1f2230; color:#e7e9f0; border:1px solid #343a55; padding:10px 12px; border-radius:8px; min-width:34px; font-weight:700; cursor:pointer; }
.wd-key.wd-wide{ min-width:72px; }
.wd-key:active{ transform:translateY(1px); }
.wd-key.correct{ background:#16a34a; border-color:#16a34a; color:#0b0c0f; }
.wd-key.present{ background:#eab308; border-color:#eab308; color:#0b0c0f; }
.wd-key.absent{ background:#272935; border-color:#3a3d4b; color:#9aa0ad; }

/* Sticky keyboard on desktop */
@media (min-width: 981px){ .wd-kbd{ position: sticky; bottom: 0; } }

/* Shake */
.wd-cell.shaking{ animation: wd-shake .6s ease; }
@keyframes wd-shake{ 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-6px)} 30%,60%,90%{transform:translateX(6px)} }

/* ===== HARD RESET visibility to avoid overrides ===== */
.wd-mobile-panels { display: none !important; } /* hide mobile accordions on desktop */
.wd-left-stack    { display: block !important; }
.wd-right-ghost   { display: block !important; }

/* ===== MOBILE (<=980px): board -> keyboard -> panels, with bordered cards ===== */
@media (max-width: 980px){
  .wd-stage{ display:block !important; }
  .wd-left-stack, .wd-right-ghost{ display:none !important; }

  .wd-center{ display:flex; flex-direction:column; }
  .wd-board-col{ order:1; }
  .wd-kbd{ order:2; margin-top:12px; }
  .wd-mobile-panels{ order:3; margin-top:12px; display:block !important; }

  .wordly{ --cell: 46px; }
  .wd-key{ padding:8px 10px; }

  /* Card look for <details> */
  .wd-coll{
    display:block;
    background:#10121a;
    border:1.5px solid #50536b;
    border-radius:12px;
    padding:10px 12px;
    box-shadow:0 0 0 1px rgba(80,83,107,.08) inset;
  }
  .wd-coll + .wd-coll{ margin-top:10px; }
  .wd-coll > summary{
    cursor:pointer; font-weight:800; color:#e8e9f3;
    list-style:none; display:flex; align-items:center; gap:8px;
    margin:-6px -6px 0 -6px; padding:6px; border-radius:10px;
  }
  .wd-coll > summary::-webkit-details-marker{ display:none; }
  .wd-coll > summary::before{ content:'▸'; display:inline-block; transform:translateY(1px); opacity:.9; }
  .wd-coll[open] > summary::before{ content:'▾'; }
  .wd-coll > *:not(summary){ margin-top:8px; }
}

/* ===== Right tips column (desktop) ===== */
.wd-right-tips{
  flex: 0 0 300px;             /* keep same width as left stack */
  position: sticky;
  top: 84px;
}
.tips-collapsed{ display:flex; justify-content:center; }
.tips-wrap{ background:#10121a; border:1px solid #343644; border-radius:12px; padding:10px 12px; color:#cfd2dd; }

.tips-header{ display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.tips-header .spacer{ flex:1; }
.tips-header .icon{
  background:#1f2230; border:1px solid #343a55; color:#e7e9f0;
  width:28px; height:28px; border-radius:8px; cursor:pointer; line-height:26px;
}
.tips-header .icon.close{ width:28px; }

.tip-card{ background:#0f1118; border:1px solid #2b2d3b; border-radius:10px; padding:10px; }
.tip-tag{ font-size:12px; opacity:.8; margin-bottom:4px; }
.tip-title{ margin:2px 0 6px; font-size:15px; font-weight:800; color:#e8e9f3; }
.tip-text{ margin:0 0 6px; line-height:1.45; }
.tip-bullets{ margin:6px 0 0 18px; padding:0; line-height:1.45; }

.tip-actions{ display:flex; align-items:center; gap:8px; margin-top:8px; }
.wd-btn.mini{ padding:4px 8px; font-size:13px; border-radius:8px; }
.heart{
  background:#1f2230; border:1px solid #343a55; color:#e7e9f0;
  padding:4px 8px; border-radius:8px; cursor:pointer; font-weight:800;
}
.heart.active{ background:#e11d48; border-color:#e11d48; color:#0b0c0f; }

.tip-toast{
  margin-top:8px; font-size:12px; color:#bfe6c2;
}

/* Mini tracker */
.mini-track{ margin-top:10px; background:#0f1118; border:1px solid #2b2d3b; border-radius:10px; padding:10px; }
.mini-title{ font-weight:800; color:#e8e9f3; font-size:14px; margin-bottom:6px; }
.dots{ display:flex; align-items:center; gap:6px; }
.dot{
  width:16px; height:16px; border-radius:50%; border:1px solid #4a4e69; background:#161923; cursor:pointer;
}
.dot.on{ background:#22c55e; border-color:#22c55e; }
.reset{
  background:#1f2230; color:#e7e9f0; border:1px solid #343a55; border-radius:8px; padding:2px 6px; font-size:12px; cursor:pointer;
}

/* Keep desktop-only; mobile hides right tips */
@media (max-width: 980px){
  .wd-right-tips{ display:none !important; }
}

</style>
