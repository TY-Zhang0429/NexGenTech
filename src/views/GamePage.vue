<template>
  <main class="home">
    <BreadcrumbNav />
    <!-- top random title -->
    <div class="title-banner" :class="{ visible: selectedTitle }">
      <span style="font-family: 'Merriweather', serif;">{{ selectedTitle || 'What adventure will you get?' }}</span>
    </div>

    <section class="content">
      <!-- left: Avatar & Door -->
      <div class="left-section">
        <img class="guide-img" src="@/assets/guide.png" alt="guide" />
        <div class="scene-container">
          <img class="backbottom" src="@/assets/backbottom.png" alt="backbottom" />
          <AvatarDoor ref="avatarDoorRef" />
        </div>
      </div>

      <!-- center wheel svg method -->
      <div class="center-section">
        <WheelSvg
          ref="wheelRef"
          :titles="sectorTitles"
          :routes="sectorRoutes"
          :startAtTop="true"
          :enableSpin="true"
          :innerRatio="0.40"
          :outerRatio="0.92"
          :spinMs="2000"
          @spun="handleSpun"
          @sector-click="onSectorClick"
        />
        <div class="btn-row">
          <button class="btn btn-primary" :disabled="!selectedTitle" @click="goBegin">Begin</button>
          <button class="btn btn-ghost" @click="doReset">Reset</button>
        </div>
      </div>

      <!-- right avatar preview -->
      <aside class="side-box">
        <div class="boss-container">
          <img class="bossguide-preview" src="@/assets/bossguide.png" alt="boss guide" />
          <img class="boss-preview" src="@/assets/boss1.png" alt="boss preview" />
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import WheelSvg from '@/components/WheelSvg.vue'     // ← add：import SVG version wheel
import AvatarDoor from '@/components/AvatarDoor.vue'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'

const router = useRouter()

// fan area selection
const sectorTitles = ['Wordle', 'Food Swap']
const sectorRoutes = ['/wordle-game', '/food-swap']


const titles = sectorTitles
const selectedTitle = ref('')
const wheelRef = ref(null)
const avatarDoorRef = ref(null)

onMounted(() => {
  selectedTitle.value = ''
  document.body.classList.add('home-bg')
})
onBeforeUnmount(() => {
  document.body.classList.remove('home-bg')
})

function handleSpun(pickedTitle) {
  // SVG wheel end will emit('spun', title)
  selectedTitle.value = pickedTitle
  avatarDoorRef.value?.runToDoor?.()
}

// optional: if you want to see which sector was clicked
function onSectorClick(p) {
  // console.log('sector-click:', p)  // { index, title, route, from }
}

function goBegin() {
  const map = {
    'Wordle': '/wordle-game',
    'Food Swap': '/food-swap',
  }
  router.push(map[selectedTitle.value] || '/wordle-game')
}

function doReset() {
  selectedTitle.value = ''
  wheelRef.value?.reset?.()
  avatarDoorRef.value?.reset?.()
}
</script>

<style scoped>
/* —— original style —— */
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(16px, 3vw, 24px);
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.home .breadcrumb {
  margin-bottom: 20px;
}

.title-banner {
  width: min(640px, 92%);
  margin: 8px auto 48px;
  padding: 16px 16px;
  text-align: center;
  color: #00515c;
  font-family: 'Slackey', cursive;
  font-size: 2rem;
  transition: opacity .2s ease;
  opacity: 1;
  background: none;
  border: none;
  backdrop-filter: none;
  line-height: 1.4;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 2;
}

.content {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(400px, 480px) minmax(200px, 1fr);
  gap: clamp(18px, 3vw, 28px);
  align-items: start;
  margin-top: 6px;
}

.left-section { display: flex; flex-direction: column; gap: 30px; position: relative; z-index: 1; overflow: visible; }
.guide-img {
  width: clamp(280px, 120%, 460px);
  height: auto;
  margin: 0px 0 0px auto;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
  transition: transform 0.3s ease, filter 0.3s ease;
  cursor: pointer; object-fit: contain; position: relative; z-index: 2;
}
.guide-img:hover { transform: scale(1.05); filter: drop-shadow(0 8px 24px rgba(0,0,0,0.3)); }

.center-section { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: -20px; position: relative; z-index: 1; }

.side-box { display: flex; align-items: flex-start; justify-content: flex-start; position: relative; margin-top: 180px; }

.btn-row { display: flex; gap: 12px; justify-content: center; margin-top: -20px; margin-bottom: 20px; }
.btn { padding: 10px 24px; border: none; border-radius: 6px; font-weight: 600; letter-spacing: 0.5px; cursor: pointer; transition: all 0.3s ease;
  background: linear-gradient(135deg, #b85c2e, #a84c1a); color: white; box-shadow: 0 4px 15px rgba(184,92,46,0.18); font-family: 'Joti One', cursive; }
.btn:hover { transform: scale(1.12) translateY(-2px); box-shadow: 0 8px 24px rgba(184,92,46,0.28); filter: brightness(1.08); }
.btn.btn-ghost { background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.8); }
.btn.btn-primary { background: linear-gradient(135deg, var(--brand), var(--brand-2)); color: var(--text); border: none; }

.avatar-preview { width: 120px; height: auto; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3)); }

.boss-container { position: relative; width: fit-content; }
.boss-preview { width: clamp(260px, 30vw, 350px); height: auto; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.25)); transition: transform 0.3s ease; transform-origin: center; position: relative; z-index: 2; margin-top: -60px; }
.bossguide-preview { position: absolute; top: -50%; left: 50%; transform: translateX(-50%); width: 100%; height: auto; z-index: 3; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
.boss-container:hover .bossguide-preview { opacity: 1; }
.boss-preview:hover { transform: scale(1.05); filter: drop-shadow(0 12px 24px rgba(0,0,0,0.3)); }

:deep(.scene) { width: 140%; height: clamp(180px, 32vh, 300px); margin-top: -50 px; position: relative; overflow: hidden; margin-left: -20%; }
.backbottom { position: absolute; left: 50%; bottom: 8.5px; transform: translateX(-50%); width: 100%; height: auto; z-index: -1; pointer-events: none; object-fit: contain; }

:deep(.avatar) { left: -5% !important; bottom: 30px !important; transform-origin: bottom center; }
:deep(.door) { right: 5% !important; bottom: 20px !important; transform-origin: bottom center; }

/* responsive */
@media (max-width: 980px) {
  .content { grid-template-columns: 1fr; gap: 24px; padding: 0 clamp(16px, 4vw, 32px); }
  .left-section { order: 2; align-items: center; }
  .guide-img { width: clamp(240px, 80vw, 340px); margin: 0 auto; }
  .center-section { order: 1; margin-top: 0; }
  .backbottom { width: 120%; }
}
@media (max-width: 480px) {
  .backbottom { width: 150%; }
}
.side-box:last-child { order: 3; }

:deep(.scene) { width: 100%; height: clamp(160px, 28vh, 260px); margin: 0 auto; }
:deep(.avatar) { left: 0% !important; transform: scale(0.9); }
:deep(.door) { right: 0% !important; transform: scale(0.9); }

@media (max-width: 480px) {
  .guide-img { max-width: 280px; }
  :deep(.scene) { height: clamp(140px, 25vh, 220px); }
  .btn-row { margin-top: -10px; }
  .btn { padding: 8px 20px; font-size: 0.9rem; }
  .avatar-preview { width: 100px; }
}

.title-banner.visible .options { display: none; }
.scene-container { position: relative; width: 100%; height: auto; z-index: 2; overflow: visible; isolation: isolate; }
</style>
