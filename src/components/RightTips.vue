<template>
  <!-- ===== DESKTOP：fixed right panel ===== -->
  <aside v-if="mode === 'desktop'" class="tips-panel" aria-label="Health Tips (desktop)">
    <header class="tips-h">
      <strong>Health Tips</strong>
      <div class="spacer"></div>
      <button class="icon" @click="prevTip" aria-label="Prev">‹</button>
      <button class="icon" @click="nextTip" aria-label="Next">›</button>
    </header>

    <section class="tips-body">
      <!-- Tip cards -->
      <article class="tip-card">
        <div class="tip-tag">{{ currentTip.tag }}</div>
        <h4 class="tip-title">{{ currentTip.title }}</h4>
        <p class="tip-text">{{ currentTip.text }}</p>
        <ul v-if="currentTip.bullets?.length" class="tip-bullets">
          <li v-for="(b,i) in currentTip.bullets" :key="i">{{ b }}</li>
        </ul>

        <div class="tip-actions">
          <!-- removed: I’ll try it -->
          <button class="btn ghost" @click="shuffleTip">Shuffle</button>
          <button
            class="heart"
            :class="{ active: liked[currentTip.id] }"
            @click="toggleLike(currentTip.id)"
            :aria-pressed="!!liked[currentTip.id]"
          >♥</button>
        </div>
      </article>

      <!-- Mini challenges (with countdown timer) -->
      <!-- <article class="box">
        <h5 class="box-title">Mini Challenges</h5>

        <div class="challenge">
          <button class="chip" @click="toggleTimer(breath, 30)">
            {{ breath.running ? ('Breathing · ' + breath.leftLabel) : '30s Breathing' }}
          </button>
          <div class="mini-bar" v-if="breath.running">
            <div class="mini-fill" :style="{ width: (breath.pct * 100) + '%' }"></div>
          </div>
        </div>

        <div class="challenge">
          <button class="chip" @click="toggleTimer(stretch, 30)">
            {{ stretch.running ? ('Stretch · ' + stretch.leftLabel) : '30s Stretch' }}
          </button>
          <div class="mini-bar" v-if="stretch.running">
            <div class="mini-fill" :style="{ width: (stretch.pct * 100) + '%' }"></div>
          </div>
        </div>
      </article> -->

      <!-- weekly goals + streak + countdown -->
      <!-- <article class="box">
        <div class="row between">
          <h5 class="box-title">Weekly Theme: Colorful Week</h5>
          <div class="muted">Resets in {{ countdownText }}</div>
        </div>

        <div class="row wrap gap">
          <button class="chip" @click="checkIn()">Log 1 serving</button>
          <span class="muted">{{ Math.min(weekCount, WEEK_GOAL) }}/{{ WEEK_GOAL }}</span>
          <span class="muted"> • Streak: <b>{{ streak }}</b> 🔥 (Best {{ bestStreak }})</span>
        </div>

        <div class="bar">
          <div class="bar-fill" :style="{ width: (Math.min(weekCount, WEEK_GOAL)/WEEK_GOAL*100)+'%' }"></div>
        </div>
      </article> -->

      <!-- water times -->
      <!-- <article class="box">
        <div class="row between">
          <h5 class="box-title">Water today</h5>
          <button class="chip ghost" @click="setWater(0)" aria-label="Reset">↺</button>
        </div>
        <div class="dots">
          <button v-for="i in 8" :key="i" class="dot" :class="{ on: i <= waterGlasses }" @click="setWater(i)" />
        </div>
      </article> -->
    </section>
  </aside>

  <!-- ===== MOBILE：only for content ===== -->
  <div v-else class="tips-mobile">
    <section class="tips-body">
      <article class="tip-card">
        <div class="tip-tag">{{ currentTip.tag }}</div>
        <h4 class="tip-title">{{ currentTip.title }}</h4>
        <p class="tip-text">{{ currentTip.text }}</p>
        <ul v-if="currentTip.bullets?.length" class="tip-bullets">
          <li v-for="(b,i) in currentTip.bullets" :key="i">{{ b }}</li>
        </ul>

        <div class="tip-actions">
          <!-- removed: I’ll try it -->
          <button class="btn ghost" @click="shuffleTip">Shuffle</button>
          <button
            class="heart"
            :class="{ active: liked[currentTip.id] }"
            @click="toggleLike(currentTip.id)"
            :aria-pressed="!!liked[currentTip.id]"
          >♥</button>
        </div>
      </article>

      <!-- Mini challenges (with countdown timer) -->
      <!-- <article class="box">
        <h5 class="box-title">Mini Challenges</h5>

        <div class="challenge">
          <button class="chip" @click="toggleTimer(breath, 30)">
            {{ breath.running ? ('Breathing · ' + breath.leftLabel) : '30s Breathing' }}
          </button>
          <div class="mini-bar" v-if="breath.running">
            <div class="mini-fill" :style="{ width: (breath.pct * 100) + '%' }"></div>
          </div>
        </div>

        <div class="challenge">
          <button class="chip" @click="toggleTimer(stretch, 30)">
            {{ stretch.running ? ('Stretch · ' + stretch.leftLabel) : '30s Stretch' }}
          </button>
          <div class="mini-bar" v-if="stretch.running">
            <div class="mini-fill" :style="{ width: (stretch.pct * 100) + '%' }"></div>
          </div>
        </div>
      </article> -->
        
      <!-- weekly goals + streak + countdown -->
      <!-- <article class="box">
        <div class="row between">
          <h5 class="box-title">Weekly Theme: Colorful Week</h5>
          <div class="muted">Resets in {{ countdownText }}</div>
        </div>

        <div class="row wrap gap">
          <button class="chip" @click="checkIn()">Log 1 serving</button>
          <span class="muted">{{ Math.min(weekCount, WEEK_GOAL) }}/{{ WEEK_GOAL }}</span>
          <span class="muted"> • Streak: <b>{{ streak }}</b> 🔥 (Best {{ bestStreak }})</span>
        </div>

        <div class="bar">
          <div class="bar-fill" :style="{ width: (Math.min(weekCount, WEEK_GOAL)/WEEK_GOAL*100)+'%' }"></div>
        </div>
      </article> -->

      <!-- water times -->
      <!-- <article class="box">
        <div class="row between">
          <h5 class="box-title">Water today</h5>
        </div>
        <div class="dots">
          <button v-for="i in 8" :key="i" class="dot" :class="{ on: i <= waterGlasses }" @click="setWater(i)" />
          <button class="chip ghost" @click="setWater(0)" aria-label="Reset">↺</button>
        </div>
      </article> -->
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watchEffect } from 'vue';

const props = defineProps({ mode: { type: String, default: 'desktop' } });

/* ========= Tips ========= */
const tipsList = ref([
  { id: 'hydration', tag: 'Hydration', title: 'Drink a glass of water',
    text: 'Dehydration can feel like hunger. Sip water before your next snack.',
    bullets: ['Sparkling + lemon','Keep a bottle within reach'] },
  { id: 'color', tag: 'Micronutrients', title: 'Eat the rainbow',
    text: 'Add one colorful veggie/fruit to your next meal—fiber + vitamins!',
    bullets: ['Bell pepper • Berries • Spinach'] },
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

/* ========= Like ========= */
const liked = reactive(JSON.parse(localStorage.getItem('ht_liked') || '{}'));
function setLS(key, val){
  localStorage.setItem(key, val);
  // component still reactive update
  window.dispatchEvent(new CustomEvent('ht-sync', { detail: { key, value: val }}));
  // over the air sync
  try{
    if ('BroadcastChannel' in window){
      bc?.postMessage({ key, value: val });
    }
  }catch{}
}
function toggleLike(id){
  liked[id] = !liked[id];
  setLS('ht_liked', JSON.stringify(liked));
}

/* ========= Weekly / streak ========= */
// const WEEK_GOAL = 5;
// const streak = ref(parseInt(localStorage.getItem('ht_streak') || '0', 10));
// const bestStreak = ref(parseInt(localStorage.getItem('ht_best') || '0', 10));
// const lastCheckDate = ref(localStorage.getItem('ht_last') || ''); // YYYY-MM-DD

// const weekKey = computed(() => {
//   const d = new Date();
//   const y = d.getFullYear();
//   const w = isoWeek(d);
//   return `ht_week_${y}-${String(w).padStart(2,'0')}`;
// });
// const weekCount = ref(parseInt(localStorage.getItem(weekKey.value) || '0', 10));
// watchEffect(() => {
//   weekCount.value = parseInt(localStorage.getItem(weekKey.value) || '0', 10);
// });

// function checkIn(){
//   const today = new Date().toISOString().slice(0,10);
//   // only once per day
//   if (lastCheckDate.value === today) return;

//   if (lastCheckDate.value){
//     const diff = daysBetween(lastCheckDate.value, today);
//     streak.value = (diff === 1) ? streak.value + 1 : 1;
//   } else {
//     streak.value = 1;
//   }
//   lastCheckDate.value = today;
//   bestStreak.value = Math.max(bestStreak.value, streak.value);

//   const nowCount = parseInt(localStorage.getItem(weekKey.value) || '0', 10) + 1;
//   setLS(weekKey.value, String(nowCount));
//   weekCount.value = nowCount;

//   setLS('ht_streak', String(streak.value));
//   setLS('ht_best', String(bestStreak.value));
//   setLS('ht_last', lastCheckDate.value);
// }

// function daysBetween(isoA, isoB){
//   const a = new Date(isoA + 'T00:00:00');
//   const b = new Date(isoB + 'T00:00:00');
//   return Math.round((b - a) / 86400000);
// }
// function isoWeek(d){
//   d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
//   const dayNum = d.getUTCDay() || 7;
//   d.setUTCDate(d.getUTCDate() + 4 - dayNum);
//   const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
//   return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
// }

/* ========= Water + midnight countdown ========= */
// const waterGlasses = ref(parseInt(localStorage.getItem('ht_water') || '0', 10));
// function setWater(n){ waterGlasses.value = n; setLS('ht_water', String(n)); }

// const countdownText = ref('');
// let timer = null;
// function updateCountdown(){
//   const now = new Date();
//   const midnight = new Date(now); midnight.setHours(24,0,0,0);
//   const ms = Math.max(0, midnight - now);
//   const hh = String(Math.floor(ms/3600000)).padStart(2,'0');
//   const mm = String(Math.floor((ms%3600000)/60000)).padStart(2,'0');
//   const ss = String(Math.floor((ms%60000)/1000)).padStart(2,'0');
//   countdownText.value = `${hh}:${mm}:${ss}`;
// }

/* ========= Mini timers (30s progress bars) ========= */
// function makeTimer(){
//   return reactive({ running:false, end:0, left:0, pct:0, leftLabel:'', iv:null });
// }
// const breath  = makeTimer();
// const stretch = makeTimer();

// function toggleTimer(t, seconds){
//   if (t.running){
//     stopTimer(t);
//     return;
//   }
//   startTimer(t, seconds);
// }
// function startTimer(t, seconds){
//   t.running = true;
//   t.end = Date.now() + seconds * 1000;
//   tick(t, seconds);
//   t.iv = setInterval(() => tick(t, seconds), 100);
// }
// function stopTimer(t){
//   t.running = false; t.end = 0; t.left = 0; t.pct = 0; t.leftLabel = '';
//   if (t.iv){ clearInterval(t.iv); t.iv = null; }
// }
// function tick(t, total){
//   const leftMs = Math.max(0, t.end - Date.now());
//   t.left = leftMs;
//   t.pct = 1 - leftMs / (total*1000);
//   t.leftLabel = String(Math.ceil(leftMs/1000)) + 's';
//   if (leftMs <= 0){ stopTimer(t); }
// }

/* ========= Cross-instance sync ========= */
let bc = null;
function applySync({key, value}){
  if (!key) return;
//   if (key === 'ht_water'){ waterGlasses.value = parseInt(value || '0', 10); }
//   else if (key === 'ht_last'){ lastCheckDate.value = value || ''; }
//   else if (key === 'ht_streak'){ streak.value = parseInt(value || '0', 10); }
//   else if (key === 'ht_best'){ bestStreak.value = parseInt(value || '0', 10); }
//   else if (key.startsWith('ht_week_')){ if (key === weekKey.value) weekCount.value = parseInt(value || '0', 10); }
  if (key === 'ht_liked'){ try{ const obj = JSON.parse(value||'{}'); Object.assign(liked, obj); }catch{} }
}

onMounted(() => {
  // reset daily water count (only on first load)
//   const today = new Date().toISOString().slice(0,10);
//   const savedDay = localStorage.getItem('ht_day');
//   if (savedDay !== today){
//     setLS('ht_day', today);
//     setLS('ht_water', '0');
//     waterGlasses.value = 0;
//   }

//   updateCountdown();
//   timer = setInterval(updateCountdown, 1000);

  window.addEventListener('ht-sync', (e) => applySync(e.detail || {}));
  try{
    if ('BroadcastChannel' in window){
      bc = new BroadcastChannel('ht_sync');
      bc.onmessage = (e) => applySync(e.data || {});
    }
  }catch{}
});

onBeforeUnmount(() => {
//   if (timer) clearInterval(timer);
  if (bc) try{ bc.close(); }catch{}
});

// removed: function markDone(){ /* with toast*/ }
</script>

<style scoped>
/* Desktop wrapper */
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

/* mini challenge progress */
.challenge{ margin-top:6px; }
.mini-bar{ height:6px; background:#1c2030; border-radius:999px; overflow:hidden; margin-top:6px; }
.mini-fill{ height:100%; background:#60a5fa; transition:width .1s linear; }

/* Mobile wrapper（only for content） */
.tips-mobile{ padding:0; }
</style>
