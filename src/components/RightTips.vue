<template>
  <aside class="rtips">
    <!-- Collapsed bar (keeps width in parent flex to preserve centering) -->
    <div v-if="!open" class="rtips-collapsed">
      <button class="btn ghost" @click="toggleOpen(true)" aria-label="Show tips">Health Tips</button>
    </div>

    <div v-else class="rtips-wrap">
      <header class="rtips-header">
        <strong>Health Tips</strong>
        <span class="spacer"></span>
        <button class="ico" @click="prevTip" aria-label="Previous tip">‹</button>
        <button class="ico" @click="nextTip" aria-label="Next tip">›</button>
        <button class="ico close" @click="toggleOpen(false)" aria-label="Hide tips">×</button>
      </header>

      <!-- TIP CARD -->
      <article class="tip-card">
        <div class="tip-head">
          <span class="tip-tag">{{ currentTip.tag }}</span>
          <button
            class="heart"
            :class="{ active: liked[currentTip.id] }"
            @click="toggleLike(currentTip.id)"
            :aria-pressed="!!liked[currentTip.id]"
            aria-label="Like this tip"
          >♥</button>
        </div>
        <h4 class="tip-title">{{ currentTip.title }}</h4>
        <p class="tip-text">{{ currentTip.text }}</p>
        <ul v-if="currentTip.bullets?.length" class="tip-bullets">
          <li v-for="(b,i) in currentTip.bullets" :key="i">{{ b }}</li>
        </ul>

        <div class="tip-actions">
          <button class="btn mini" @click="markDone">I’ll try it</button>
          <button class="btn ghost mini" @click="shuffleTip">Shuffle</button>
        </div>

        <div v-if="toastMsg" class="tip-toast">{{ toastMsg }}</div>
      </article>

      <!-- MINI CHALLENGES -->
      <section class="mini">
        <div class="mini-title">Mini Challenges</div>

        <div class="mini-row">
          <button class="btn mini" :disabled="challengeActive" @click="startChallenge('breath')">30s Breathing</button>
          <button class="btn mini" :disabled="challengeActive" @click="startChallenge('stretch')">30s Stretch</button>
          <button v-if="challengeActive" class="btn ghost mini" @click="cancelChallenge">Cancel</button>
        </div>

        <div v-if="challengeActive" class="timer">
          <div class="timer-label">
            {{ challengeType === 'breath' ? 'Breathing' : 'Stretching' }}: {{ timeLeft }}s
          </div>
          <div class="bar"><div class="bar-fill" :style="{ width: barPct + '%' }"></div></div>
        </div>

        <div v-if="challengeDone" class="done-msg">Great job! ✨</div>
      </section>

      <!-- WEEKLY THEME -->
      <section class="weekly">
        <div class="mini-title">Weekly Theme: {{ themeTitle }}</div>
        <div class="weekly-row">
          <button class="btn mini" @click="logThemeOne">Log 1 serving</button>
          <span class="wk-count">{{ weekCount }}/{{ weekTarget }}</span>
        </div>
        <div class="bar"><div class="bar-fill" :style="{ width: weekPct + '%' }"></div></div>
        <div v-if="weekCount >= weekTarget" class="badge">🏅 Completed!</div>
      </section>

      <!-- DAILY WATER TRACKER -->
      <section class="water">
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
          <button class="reset" @click="setWater(0)" aria-label="Reset water">↺</button>
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup>
/**
 * RightTips.vue
 * Desktop-only sticky tips column with:
 * - Context-aware tips (based on props.hint / difficulty)
 * - Mini 30s challenges with countdown
 * - Weekly theme progress & badge
 * - Likes, "I'll try it", and daily water tracker
 * 全部使用 localStorage 做轻量持久化
 */

import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';

/* ----------- Props (runtime typed) ----------- */
const props = defineProps({
  hint: { type: String, default: '' },
  difficulty: { type: String, default: '' },
  targetLen: { type: [Number, String], default: 5 }
});

/* ----------- Base tips ----------- */
const baseTips = [
  { id: 'hydration', tag: 'Hydration', title: 'Drink a glass of water', text: 'Dehydration can feel like hunger. Sip water before your next snack.', bullets: ['Sparkling + lemon', 'Keep a bottle nearby'] },
  { id: 'color',     tag: 'Micronutrients', title: 'Eat the rainbow', text: 'Add one colorful veggie/fruit to your next meal—fiber + vitamins!', bullets: ['Bell pepper, berries, spinach'] },
  { id: 'protein',   tag: 'Protein', title: 'Palm-sized protein', text: 'Aim for a palm-sized protein each meal to support satiety & recovery.' },
  { id: 'move',      tag: 'Movement', title: '1-minute reset', text: 'Stand, roll shoulders, stretch neck & wrists. Quick reset boosts focus.' },
  { id: 'swap',      tag: 'Smart swap', title: 'Soda → sparkling water', text: 'Cut ~140 kcal. Add citrus or mint for flavor without sugar.' },
];

/* ----------- Context tips from hint/difficulty ----------- */
const contextTips = computed(() => {
  const h = (props.hint || '').toLowerCase();
  const dif = (props.difficulty || '').toLowerCase();
  const tips = [];

  // super-light keyword routing
  if (/(salad|greens|veggie|vegetable|leaf|spinach|kale)/.test(h)) {
    tips.push({ id:'ctx_salad', tag:'Veggies', title:'Power up your salad', text:'Add protein (egg/beans/chicken) + healthy fat (olive oil/nuts) → fuller & tastier.' });
  }
  if (/(fruit|berries|apple|banana|citrus)/.test(h)) {
    tips.push({ id:'ctx_fruit', tag:'Fruit', title:'Fruit as dessert', text:'Sweet tooth? Switch dessert to a fruit bowl 2–3x/week.' });
  }
  if (/(water|drink|thirst)/.test(h)) {
    tips.push({ id:'ctx_water', tag:'Hydration', title:'Front-load hydration', text:'Start your day with a glass of water; you’ll hit your target easier.' });
  }
  if (/(fried|soda|sugar|sweet|dessert)/.test(h)) {
    tips.push({ id:'ctx_sugar', tag:'Smart swap', title:'Reduce added sugar', text:'Trade sugary drinks for sparkling water + lemon, or iced tea (unsweetened).' });
  }
  if (dif === 'hard') {
    tips.push({ id:'ctx_focus', tag:'Focus', title:'Focus micro-break', text:'Hard mode needs focus: after a round, stand for 20–30s and relax your eyes/neck.' });
  }
  return tips;
});

/* ----------- Merge (context first, then base; unique by id) ----------- */
const tipsMerged = computed(() => {
  const map = new Map();
  [...contextTips.value, ...baseTips].forEach(t => { if (!map.has(t.id)) map.set(t.id, t); });
  return Array.from(map.values());
});

/* ----------- Open/close & navigation ----------- */
const open = ref(true);
const idx = ref(0);
const currentTip = computed(() => tipsMerged.value[idx.value] || tipsMerged.value[0]);

function nextTip(){ idx.value = (idx.value + 1) % tipsMerged.value.length; }
function prevTip(){ idx.value = (idx.value - 1 + tipsMerged.value.length) % tipsMerged.value.length; }
function shuffleTip(){ idx.value = Math.floor(Math.random() * tipsMerged.value.length); }
function toggleOpen(v){ open.value = v; localStorage.setItem('rtips_open', v ? '1' : '0'); }

/* ----------- Likes / done (persist) ----------- */
function safeParse(defKey, defVal='{}'){
  try{ return JSON.parse(localStorage.getItem(defKey) || defVal); }catch{ return JSON.parse(defVal); }
}
const liked   = reactive(safeParse('rtips_like'));
const doneMap = reactive(safeParse('rtips_done'));
function persistLikes(){ localStorage.setItem('rtips_like', JSON.stringify(liked)); }
function persistDone (){ localStorage.setItem('rtips_done', JSON.stringify(doneMap)); }

const toastMsg = ref('');
function toast(s){ toastMsg.value = s; setTimeout(()=>toastMsg.value='', 1200); }
function toggleLike(id){ liked[id] = !liked[id]; persistLikes(); toast(liked[id] ? 'Saved ❤️' : 'Unsaved'); }
function markDone(){ doneMap[currentTip.value.id] = true; persistDone(); toast('Nice! 🙌'); }

/* ----------- Mini challenges (30s) ----------- */
const challengeActive = ref(false);
const challengeType   = ref('breath'); // 'breath' | 'stretch'
const timeLeft        = ref(30);
let timer = null;
const barPct = computed(() => ((30 - timeLeft.value) / 30) * 100);
const challengeDone = ref(false);

function startChallenge(type){
  if(challengeActive.value) return;
  challengeType.value = type;
  challengeActive.value = true;
  timeLeft.value = 30;
  challengeDone.value = false;
  timer = setInterval(()=>{
    timeLeft.value -= 1;
    if(timeLeft.value <= 0){
      clearInterval(timer); timer = null;
      challengeActive.value = false;
      challengeDone.value = true;
      incWeek(1); // reward weekly theme +1
    }
  }, 1000);
}
function cancelChallenge(){ if(timer){ clearInterval(timer); timer=null; } challengeActive.value=false; }
onBeforeUnmount(()=>{ if(timer) clearInterval(timer); });

/* ----------- Weekly theme (ISO week key) ----------- */
const themeTitle = 'Colorful Week';
const weekTarget = 5;

function weekKey(){
  const d = new Date();
  const dayNum = (d.getDay()+6)%7; d.setDate(d.getDate()-dayNum+3);
  const firstThu = new Date(d.getFullYear(),0,4);
  const weekNo = 1 + Math.round(((d - firstThu)/86400000 - 3 + ((firstThu.getDay()+6)%7))/7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2,'0')}`;
}
function loadWeek(){
  const k = weekKey();
  const raw = safeParse('rtips_week');
  return { key:k, count: raw[k] || 0, raw };
}
function saveWeek(store){ localStorage.setItem('rtips_week', JSON.stringify(store)); }
const _week = reactive(loadWeek());
const weekCount = computed(()=> _week.count);
const weekPct   = computed(()=> Math.min(100, Math.round(weekCount.value / weekTarget * 100)));
function incWeek(n){
  const k = _week.key, store = _week.raw;
  store[k] = Math.min(weekTarget, (store[k] || 0) + n);
  _week.count = store[k];
  saveWeek(store);
}
function logThemeOne(){ incWeek(1); }

/* ----------- Water tracker (daily) ----------- */
const waterGlasses = ref(0);
function setWater(n){ waterGlasses.value = n; localStorage.setItem('rtips_water', String(n)); }

/* ----------- Restore persisted states ----------- */
onMounted(()=>{
  const op = localStorage.getItem('rtips_open');
  if(op === '0') open.value = false;

  const today = new Date().toISOString().slice(0,10);
  const savedDay = localStorage.getItem('rtips_water_day');
  if(savedDay !== today){
    localStorage.setItem('rtips_water_day', today);
    localStorage.setItem('rtips_water', '0');
  }
  waterGlasses.value = parseInt(localStorage.getItem('rtips_water') || '0', 10);
});

/* 当 hint / difficulty 变化时，优先跳到第一条“上下文”贴士 */
watch(() => [props.hint, props.difficulty], ()=>{
  if(contextTips.value.length){
    const firstId = contextTips.value[0].id;
    const i = tipsMerged.value.findIndex(t => t.id === firstId);
    if(i >= 0) idx.value = i;
  }
});
</script>

<style scoped>
/* ===== Layout ===== */
.rtips{ position: sticky; top: 84px; width: 100%; }
.rtips-collapsed{ display:flex; justify-content:center; }
.rtips-wrap{ background:#10121a; border:1px solid #343644; border-radius:12px; padding:10px 12px; color:#cfd2dd; }

/* ===== Header ===== */
.rtips-header{ display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.rtips-header .spacer{ flex:1; }
.ico{
  background:#1f2230; border:1px solid #343a55; color:#e7e9f0;
  width:28px; height:28px; border-radius:8px; cursor:pointer; line-height:26px;
}
.ico.close{ width:28px; }

/* ===== Tip card ===== */
.tip-card{ background:#0f1118; border:1px solid #2b2d3b; border-radius:10px; padding:10px; }
.tip-head{ display:flex; align-items:center; }
.tip-tag{ font-size:12px; opacity:.8; margin-right:auto; }
.heart{
  background:#1f2230; border:1px solid #343a55; color:#e7e9f0;
  padding:4px 8px; border-radius:8px; cursor:pointer; font-weight:800;
}
.heart.active{ background:#e11d48; border-color:#e11d48; color:#0b0c0f; }

.tip-title{ margin:6px 0; font-size:15px; font-weight:800; color:#e8e9f3; }
.tip-text{ margin:0 0 6px; line-height:1.45; }
.tip-bullets{ margin:6px 0 0 18px; padding:0; line-height:1.45; }

.tip-actions{ display:flex; align-items:center; gap:8px; margin-top:8px; }
.tip-toast{ margin-top:8px; font-size:12px; color:#bfe6c2; }

/* ===== Mini & trackers ===== */
.mini, .weekly, .water{ margin-top:10px; background:#0f1118; border:1px solid #2b2d3b; border-radius:10px; padding:10px; }
.mini-title{ font-weight:800; color:#e8e9f3; font-size:14px; margin-bottom:6px; }
.mini-row, .weekly-row{ display:flex; align-items:center; gap:8px; }
.wk-count{ margin-left:auto; opacity:.9; }

.timer{ margin-top:8px; }
.timer-label{ font-size:13px; margin-bottom:6px; opacity:.9; }
.bar{ height:8px; border:1px solid #343a55; border-radius:999px; overflow:hidden; background:#161923; }
.bar-fill{ height:100%; background:#22c55e; }

.done-msg{ margin-top:8px; color:#bfe6c2; font-size:13px; }

.badge{ margin-top:6px; font-weight:800; color:#f7d34a; }

.dots{ display:flex; align-items:center; gap:6px; }
.dot{
  width:16px; height:16px; border-radius:50%; border:1px solid #4a4e69; background:#161923; cursor:pointer;
}
.dot.on{ background:#22c55e; border-color:#22c55e; }
.reset{
  background:#1f2230; color:#e7e9f0; border:1px solid #343a55; border-radius:8px; padding:2px 6px; font-size:12px; cursor:pointer;
}

/* ===== Buttons (local) ===== */
.btn{ background:#4f46e5; color:#fff; border:0; padding:6px 10px; border-radius:8px; cursor:pointer; font-weight:700; }
.btn.ghost{ background:transparent; border:1px dashed #4f46e5; color:#cfd3ff; }
.btn.mini{ padding:4px 8px; font-size:13px; }

/* Hide on mobile — right column is desktop-only */
@media (max-width:980px){ .rtips{ display:none; } }
</style>
