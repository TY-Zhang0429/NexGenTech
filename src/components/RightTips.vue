<template>
  <!-- ===== Desktop panel ===== -->
  <aside class="tips-panel" aria-label="Health Tips (desktop)">
    <header class="tips-h">
      <strong>Health Tips</strong>
      <div class="spacer"></div>
      <button class="icon" @click="prevTip" aria-label="Prev">‹</button>
      <button class="icon" @click="nextTip" aria-label="Next">›</button>
      <button class="icon close" @click="collapse" aria-label="Collapse">×</button>
    </header>

    <section class="tips-body">
      <article class="tip-card">
        <div class="tip-tag">{{ currentTip.tag }}</div>
        <h4 class="tip-title">{{ currentTip.title }}</h4>
        <p class="tip-text">{{ currentTip.text }}</p>
        <ul v-if="currentTip.bullets?.length" class="tip-bullets">
          <li v-for="(b,i) in currentTip.bullets" :key="i">{{ b }}</li>
        </ul>

        <div class="tip-actions">
          <button class="btn" @click="markDone">I’ll try it</button>
          <button class="btn ghost" @click="shuffleTip">Shuffle</button>
          <button
            class="heart"
            :class="{ active: liked[currentTip.id] }"
            @click="toggleLike(currentTip.id)"
            :aria-pressed="!!liked[currentTip.id]"
          >♥</button>
        </div>

        <div v-if="tipToast" class="tip-toast">{{ tipToast }}</div>
      </article>

      <!-- Mini challenges -->
      <article class="box">
        <h5 class="box-title">Mini Challenges</h5>
        <div class="chips">
          <button class="chip" @click="toast('Deep breath ✨')">30s Breathing</button>
          <button class="chip" @click="toast('Stretch done ✅')">30s Stretch</button>
        </div>
      </article>

      <!-- Weekly theme -->
      <article class="box">
        <h5 class="box-title">Weekly Theme: Colorful Week</h5>
        <div class="row">
          <button class="chip" @click="toast('Logged ✔')">Log 1 serving</button>
          <span class="muted">5/5</span>
        </div>
        <div class="bar"><div class="bar-fill"></div></div>
        <div class="muted done">🏅 Completed!</div>
      </article>

      <!-- Water tracker -->
      <article class="box">
        <h5 class="box-title">Water today</h5>
        <div class="dots">
          <button
            v-for="i in 8"
            :key="i"
            class="dot"
            :class="{ on: i <= waterGlasses }"
            @click="setWater(i)"
            :aria-label="`Glasses ${i}`"
          />
          <button class="chip ghost" @click="setWater(0)" aria-label="Reset">↺</button>
        </div>
      </article>
    </section>
  </aside>

  <!-- ===== Mobile drawer (bottom sheet) ===== -->
  <div class="tips-drawer" :class="{ open: mobileOpen }" role="dialog" aria-label="Health Tips (mobile)">
    <header class="drawer-h">
      <span class="drawer-title">Health Tips</span>
      <button class="x" @click="closeDrawer" aria-label="Close">×</button>
    </header>

    <!-- IMPORTANT: body is scrollable and always visible when open -->
    <div class="drawer-body">
      <!-- 同一份内容（为保证移动端不空白，直接复用） -->
      <article class="tip-card">
        <div class="tip-tag">{{ currentTip.tag }}</div>
        <h4 class="tip-title">{{ currentTip.title }}</h4>
        <p class="tip-text">{{ currentTip.text }}</p>
        <ul v-if="currentTip.bullets?.length" class="tip-bullets">
          <li v-for="(b,i) in currentTip.bullets" :key="i">{{ b }}</li>
        </ul>

        <div class="tip-actions">
          <button class="btn" @click="markDone">I’ll try it</button>
          <button class="btn ghost" @click="shuffleTip">Shuffle</button>
          <button
            class="heart"
            :class="{ active: liked[currentTip.id] }"
            @click="toggleLike(currentTip.id)"
          >♥</button>
        </div>

        <div v-if="tipToast" class="tip-toast">{{ tipToast }}</div>
      </article>

      <article class="box">
        <h5 class="box-title">Mini Challenges</h5>
        <div class="chips">
          <button class="chip" @click="toast('Deep breath ✨')">30s Breathing</button>
          <button class="chip" @click="toast('Stretch done ✅')">30s Stretch</button>
        </div>
      </article>

      <article class="box">
        <h5 class="box-title">Weekly Theme: Colorful Week</h5>
        <div class="row">
          <button class="chip" @click="toast('Logged ✔')">Log 1 serving</button>
          <span class="muted">5/5</span>
        </div>
        <div class="bar"><div class="bar-fill"></div></div>
        <div class="muted done">🏅 Completed!</div>
      </article>

      <article class="box">
        <h5 class="box-title">Water today</h5>
        <div class="dots">
          <button
            v-for="i in 8"
            :key="i"
            class="dot"
            :class="{ on: i <= waterGlasses }"
            @click="setWater(i)"
          />
          <button class="chip ghost" @click="setWater(0)">↺</button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
/* English comments to help future you 🙂 */
import { ref, reactive, computed, onMounted, defineExpose } from 'vue';

defineProps({
  hint: String,
  difficulty: String,
  targetLen: [Number, String],
});

/* Tips data */
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

const liked = reactive(JSON.parse(localStorage.getItem('tips_liked') || '{}'));
const doneTips = reactive(JSON.parse(localStorage.getItem('tips_done') || '{}'));
function saveLikes(){ localStorage.setItem('tips_liked', JSON.stringify(liked)); }
function saveDone(){ localStorage.setItem('tips_done', JSON.stringify(doneTips)); }

const tipToast = ref('');
function toast(msg){ tipToast.value = msg; setTimeout(() => tipToast.value = '', 1200); }
function toggleLike(id){ liked[id] = !liked[id]; saveLikes(); toast(liked[id] ? 'Saved ❤️' : 'Unsaved'); }
function markDone(){ doneTips[currentTip.value.id] = true; saveDone(); toast('Nice! 🙌'); }

/* Water tracker (daily reset) */
const waterGlasses = ref(0);
function setWater(n){ waterGlasses.value = n; localStorage.setItem('water_glasses', String(n)); }

/* Desktop collapse (optional – keeps the box height sane when user wants) */
function collapse(){ /* noop, but kept for header "×" consistency */ }

/* Mobile drawer state */
const mobileOpen = ref(false);
function openDrawer(){ mobileOpen.value = true; document.body.style.overflow = 'hidden'; }
function closeDrawer(){ mobileOpen.value = false; document.body.style.overflow = ''; }
defineExpose({ openDrawer, closeDrawer });

onMounted(() => {
  // restore water tracker (daily)
  const today = new Date().toISOString().slice(0, 10);
  const saved = localStorage.getItem('water_day');
  if (saved !== today){
    localStorage.setItem('water_day', today);
    localStorage.setItem('water_glasses', '0');
  }
  waterGlasses.value = parseInt(localStorage.getItem('water_glasses') || '0', 10);
});
</script>

<style scoped>
/* ===== Desktop panel ===== */
.tips-panel{
  background:#10121a; border:1px solid #343644; border-radius:12px; color:#cfd2dd;
  padding:10px 12px;
  position: sticky; top: 84px;
  max-height: calc(100vh - 120px);      /* 固定自身高度，内部滚动，不挤压棋盘/键盘 */
  overflow: auto;
}
.tips-h{ display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.tips-h .spacer{ flex:1; }
.icon{ background:#1f2230; border:1px solid #343a55; color:#e7e9f0; width:28px; height:28px; border-radius:8px; cursor:pointer; }
.icon.close{ width:28px; }

/* Shared content */
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
.tip-toast{ margin-top:8px; font-size:12px; color:#bfe6c2; }

/* other cards */
.box{ background:#0f1118; border:1px solid #2b2d3b; border-radius:10px; padding:12px; margin-top:12px; }
.box-title{ margin:0 0 8px; font-weight:800; color:#e8e9f3; }
.chips{ display:flex; gap:10px; flex-wrap:wrap; }
.chip{ background:#2a2f45; color:#e6e9f7; border:1px solid #3c415f; border-radius:10px; padding:6px 10px; cursor:pointer; }
.chip.ghost{ background:transparent; border:1px dashed #4f46e5; color:#cfd3ff; }
.row{ display:flex; align-items:center; gap:10px; }
.muted{ opacity:.8; font-size:13px; }
.done{ margin-top:6px; }
.bar{ height:8px; background:#1c2030; border-radius:999px; overflow:hidden; }
.bar-fill{ width:100%; height:100%; background:#22c55e; }

/* water */
.dots{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.dot{ width:16px; height:16px; border-radius:50%; border:1px solid #4a4e69; background:#161923; cursor:pointer; }
.dot.on{ background:#22c55e; border-color:#22c55e; }

/* ===== Mobile drawer ===== */
.tips-drawer{
  position: fixed; left:0; right:0; bottom:0;
  background:#0b0d14; border-top:1px solid #2b2d3b; color:#e6e6eb;
  transform: translateY(100%); transition: transform .28s ease;
  z-index: 10000;  /* above keyboard area */
  max-height: 90dvh; border-top-left-radius:16px; border-top-right-radius:16px;
}
.tips-drawer.open{ transform: translateY(0); }
.drawer-h{ display:flex; align-items:center; justify-content:center; padding:10px 12px; position:relative; }
.drawer-title{ font-weight:800; }
.drawer-h .x{
  position:absolute; right:10px; top:6px;
  width:30px; height:30px; border-radius:8px; border:1px solid #37415b; background:#1a2032; color:#e6e6eb;
}
.drawer-body{
  padding:12px;
  overflow:auto;                /* << 内容可滚动，绝不会“空白” */
  max-height: calc(90dvh - 54px);
}

/* Responsive: hide drawer on desktop */
@media (min-width: 981px){
  .tips-drawer{ display:none; }
}
</style>
