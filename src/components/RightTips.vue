<template>
  <!-- ========= DESKTOP PANEL ========= -->
  <aside v-if="mode === 'desktop'" class="tips-panel" aria-label="Health Tips (desktop)">
    <header class="tips-h">
      <strong>Health Tips</strong>
      <div class="spacer"></div>
      <button class="icon" @click="prevTip" aria-label="Prev">‹</button>
      <button class="icon" @click="nextTip" aria-label="Next">›</button>
    </header>
    <TipsBody
      :current-tip="currentTip"
      :liked="liked"
      :streak="streak"
      :best-streak="bestStreak"
      :week-count="weekCount"
      :week-goal="WEEK_GOAL"
      :countdown="countdownText"
      :water-glasses="waterGlasses"
      @toggle-like="toggleLike"
      @shuffle="shuffleTip"
      @done="markDone"
      @check-in="checkIn"
      @set-water="setWater"
      @reset-water="() => setWater(0)"
    />
  </aside>

  <!-- ========= MOBILE BODY（给底部抽屉用） ========= -->
  <div v-else class="tips-mobile">
    <TipsBody
      :current-tip="currentTip"
      :liked="liked"
      :streak="streak"
      :best-streak="bestStreak"
      :week-count="weekCount"
      :week-goal="WEEK_GOAL"
      :countdown="countdownText"
      :water-glasses="waterGlasses"
      @toggle-like="toggleLike"
      @shuffle="shuffleTip"
      @done="markDone"
      @check-in="checkIn"
      @set-water="setWater"
      @reset-water="() => setWater(0)"
    />
  </div>
</template>

<script setup>
/**
 * RightTips
 * - desktop: 固定右栏，内部滚动
 * - mobile: 仅渲染“内容体”（由页面的底部抽屉包裹）
 * - 含：随机小贴士、打卡+连续天数（streak）、周目标进度、喝水计数、每日重置倒计时
 */
import { ref, reactive, computed, onMounted, onBeforeUnmount, watchEffect } from 'vue';

const props = defineProps({
  mode: { type: String, default: 'desktop' } // 'desktop' | 'mobile'
});

/* ------- Tips data ------- */
const tipsList = ref([
  { id: 'hydration', tag: 'Hydration', title: 'Drink a glass of water',
    text: 'Dehydration can feel like hunger. Sip water before your next snack.',
    bullets: ['Sparkling + lemon', 'Keep a bottle nearby'] },
  { id: 'color', tag: 'Micronutrients', title: 'Eat the rainbow',
    text: 'Add one colorful veggie/fruit to your next meal—fiber + vitamins!',
    bullets: ['Bell pepper · Berries · Spinach'] },
  { id: 'protein', tag: 'Protein', title: 'Palm-sized protein',
    text: 'A palm-sized protein each meal helps satiety & recovery.' },
  { id: 'move', tag: 'Movement', title: '1-minute reset',
    text: 'Stand up, roll shoulders, stretch neck & wrists for a quick reset.' },
  { id: 'swap', tag: 'Smart swap', title: 'Soda → sparkling water',
    text: 'Cut ~140 kcal. Add citrus or mint for flavor without sugar.' },
]);
const tipIndex = ref(0);
const currentTip = computed(() => tipsList.value[tipIndex.value]);
function nextTip(){ tipIndex.value = (tipIndex.value + 1) % tipsList.value.length; }
function prevTip(){ tipIndex.value = (tipIndex.value - 1 + tipsList.value.length) % tipsList.value.length; }
function shuffleTip(){ tipIndex.value = Math.floor(Math.random() * tipsList.value.length); }

/* ------- Persistence helpers ------- */
const liked = reactive(JSON.parse(localStorage.getItem('ht_liked') || '{}'));
function toggleLike(id){ liked[id] = !liked[id]; localStorage.setItem('ht_liked', JSON.stringify(liked)); }

/* ------- Streak + Weekly goal ------- */
const WEEK_GOAL = 5; // 当周目标 5 次
const streak = ref(parseInt(localStorage.getItem('ht_streak') || '0', 10));
const bestStreak = ref(parseInt(localStorage.getItem('ht_best') || '0', 10));
const lastCheckDate = ref(localStorage.getItem('ht_last') || ''); // YYYY-MM-DD

const weekKey = computed(() => {
  const d = new Date();
  const y = d.getFullYear();
  const w = isoWeek(d);
  return `ht_week_${y}-${String(w).padStart(2,'0')}`;
});
const weekCount = ref(parseInt(localStorage.getItem(weekKey.value) || '0', 10));
watchEffect(() => {
  // 当周切换（跨周）自动取新 key
  const n = parseInt(localStorage.getItem(weekKey.value) || '0', 10);
  weekCount.value = n;
});

function checkIn(){
  const today = new Date().toISOString().slice(0,10);
  if (lastCheckDate.value === today) return; // 当天已打卡

  // streak 逻辑
  if (lastCheckDate.value){
    const diff = daysBetween(lastCheckDate.value, today);
    streak.value = (diff === 1) ? streak.value + 1 : 1;
  }else{
    streak.value = 1;
  }
  lastCheckDate.value = today;
  bestStreak.value = Math.max(bestStreak.value, streak.value);

  // 周累计
  const nowCount = parseInt(localStorage.getItem(weekKey.value) || '0', 10) + 1;
  localStorage.setItem(weekKey.value, String(nowCount));
  weekCount.value = nowCount;

  // 持久化
  localStorage.setItem('ht_streak', String(streak.value));
  localStorage.setItem('ht_best', String(bestStreak.value));
  localStorage.setItem('ht_last', lastCheckDate.value);
}

function daysBetween(isoA, isoB){
  const a = new Date(isoA + 'T00:00:00'); const b = new Date(isoB + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}
function isoWeek(d){
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

/* ------- Water tracker + countdown ------- */
const waterGlasses = ref(parseInt(localStorage.getItem('ht_water') || '0', 10));
function setWater(n){ waterGlasses.value = n; localStorage.setItem('ht_water', String(n)); }

const countdownText = ref('');
let timer = null;
function updateCountdown(){
  const now = new Date();
  const midnight = new Date(now); midnight.setHours(24,0,0,0);
  const ms = midnight - now;
  const hh = String(Math.floor(ms/3600000)).padStart(2,'0');
  const mm = String(Math.floor((ms%3600000)/60000)).padStart(2,'0');
  const ss = String(Math.floor((ms%60000)/1000)).padStart(2,'0');
  countdownText.value = `${hh}:${mm}:${ss}`;
}
onMounted(() => {
  // 每日重置：提供 day key；重置只影响 water 计数和“当天已打卡”状态（不清 streak）
  const today = new Date().toISOString().slice(0,10);
  const savedDay = localStorage.getItem('ht_day');
  if (savedDay !== today){
    localStorage.setItem('ht_day', today);
    localStorage.setItem('ht_water', '0');
    waterGlasses.value = 0;
    // 当跨天但没打卡，不重置 streak；streak 的滚动由用户是否打卡决定
  }
  updateCountdown();
  timer = setInterval(updateCountdown, 1000);
});
onBeforeUnmount(() => { if (timer) clearInterval(timer); });

/* ------- Expose minimal API for parent (可选) ------- */
// 不需要方法暴露了；抽屉在父组件控制开关。
</script>

<!-- 共用内容体组件（避免重复模板） -->
<script setup name="TipsBody">
const emits = defineEmits(['toggle-like','shuffle','done','check-in','set-water','reset-water']);
const bodyProps = defineProps({
  currentTip: { type: Object, required: true },
  liked: { type: Object, required: true },
  streak: { type: Number, required: true },
  bestStreak: { type: Number, required: true },
  weekCount: { type: Number, required: true },
  weekGoal: { type: Number, required: true },
  countdown: { type: String, required: true },
  waterGlasses: { type: Number, required: true },
});
</script>

<template #default>
  <section class="tips-body">
    <!-- Tip -->
    <article class="tip-card">
      <div class="tip-tag">{{ bodyProps.currentTip.tag }}</div>
      <h4 class="tip-title">{{ bodyProps.currentTip.title }}</h4>
      <p class="tip-text">{{ bodyProps.currentTip.text }}</p>
      <ul v-if="bodyProps.currentTip.bullets?.length" class="tip-bullets">
        <li v-for="(b,i) in bodyProps.currentTip.bullets" :key="i">{{ b }}</li>
      </ul>

      <div class="tip-actions">
        <button class="btn" @click="$emit('done'); $emit('check-in')">I’ll try it</button>
        <button class="btn ghost" @click="$emit('shuffle')">Shuffle</button>
        <button
          class="heart"
          :class="{ active: bodyProps.liked[bodyProps.currentTip.id] }"
          @click="$emit('toggle-like', bodyProps.currentTip.id)"
          :aria-pressed="!!bodyProps.liked[bodyProps.currentTip.id]"
        >♥</button>
      </div>
    </article>

    <!-- Mini Challenges -->
    <article class="box">
      <h5 class="box-title">Mini Challenges</h5>
      <div class="chips">
        <button class="chip" @click="$emit('check-in')">30s Breathing</button>
        <button class="chip" @click="$emit('check-in')">30s Stretch</button>
      </div>
    </article>

    <!-- Weekly theme + streak -->
    <article class="box">
      <div class="row between">
        <h5 class="box-title">Weekly Theme: Colorful Week</h5>
        <div class="muted">Resets in {{ bodyProps.countdown }}</div>
      </div>

      <div class="row wrap gap">
        <button class="chip" @click="$emit('check-in')">Log 1 serving</button>
        <span class="muted"> {{ Math.min(bodyProps.weekCount, bodyProps.weekGoal) }}/{{ bodyProps.weekGoal }}</span>
        <span class="muted"> • Streak: <b>{{ bodyProps.streak }}</b> 🔥 (Best {{ bodyProps.bestStreak }})</span>
      </div>

      <div class="bar">
        <div class="bar-fill" :style="{ width: (Math.min(bodyProps.weekCount, bodyProps.weekGoal)/bodyProps.weekGoal*100)+'%' }"></div>
      </div>
    </article>

    <!-- Water tracker -->
    <article class="box">
      <div class="row between">
        <h5 class="box-title">Water today</h5>
        <button class="chip ghost" @click="$emit('reset-water')" aria-label="Reset">↺</button>
      </div>
      <div class="dots">
        <button v-for="i in 8" :key="i" class="dot" :class="{ on: i <= bodyProps.waterGlasses }" @click="$emit('set-water', i)"></button>
      </div>
    </article>
  </section>
</template>

<style scoped>
/* Desktop panel wrapper */
.tips-panel{
  background:#10121a; border:1px solid #343644; border-radius:12px; color:#cfd2dd;
  padding:10px 12px; position: sticky; top:84px;
  max-height: calc(100vh - 120px); overflow:auto;
}
.tips-h{ display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.tips-h .spacer{ flex:1; }
.icon{ background:#1f2230; border:1px solid #343a55; color:#e7e9f0; width:28px; height:28px; border-radius:8px; cursor:pointer; }

/* Shared content */
.tips-body{ display:block; }
.tip-card{ background:#0f1118; border:1px solid #2b2d3b; border-radius:10px; padding:12px; }
.tip-tag{ font-size:12px; opacity:.8; margin-bottom:4px; }
.tip-title{ margin:2px 0 6px; font-size:16px; font-weight:800; color:#e8e9f3; }
.tip-text{ margin:0 0 6px; line-height:1.45; }
.tip-bullets{ margin:6px 0 0 18px; padding:0; line-height:1.45; }
.tip-actions{ display:flex; align-items:center; gap:8px; margin-top:8px; }
.btn{ background:#4f46e5; color:#fff; border:0; padding:6px 10px; border-radius:8px; font-weight:700; cursor:pointer; }
.btn.ghost{ background:transparent; border:1px dashed #4f46e5; color:#cfd3ff; }
.heart{ background:#1f2230; border:1px solid #343a55; color:#e7e9f0; padding:6px 10px; border-radius:8px; font-weight:800; cursor:pointer; }
.heart.active{ background:#e11d48; border-color:#e11d48; color:#0b0c0f; }

.box{ background:#0f1118; border:1px solid #2b2d3b; border-radius:10px; padding:12px; margin-top:12px; }
.box-title{ margin:0 0 8px; font-weight:800; color:#e8e9f3; }
.row{ display:flex; align-items:center; gap:10px; }
.row.between{ justify-content:space-between; }
.row.wrap{ flex-wrap:wrap; }
.row.gap{ gap:10px; }
.chips{ display:flex; gap:10px; flex-wrap:wrap; }
.chip{ background:#2a2f45; color:#e6e9f7; border:1px solid #3c415f; border-radius:10px; padding:6px 10px; cursor:pointer; }
.chip.ghost{ background:transparent; border:1px dashed #4f46e5; color:#cfd3ff; }
.muted{ opacity:.8; font-size:13px; }
.bar{ height:8px; background:#1c2030; border-radius:999px; overflow:hidden; }
.bar-fill{ width:0; height:100%; background:#22c55e; transition:width .25s ease; }
.dots{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.dot{ width:16px; height:16px; border-radius:50%; border:1px solid #4a4e69; background:#161923; cursor:pointer; }
.dot.on{ background:#22c55e; border-color:#22c55e; }

/* Mobile body wrapper（仅内容，不带抽屉皮肤） */
.tips-mobile{ padding:0; }
</style>
