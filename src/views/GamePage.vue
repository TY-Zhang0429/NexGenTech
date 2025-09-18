<template>
  <main class="home" role="main" aria-label="Home hub with game selector">
    <BreadcrumbNav />

    <!-- top title -->
    <div class="title-banner" :class="{ visible: !!selectedTitle }" aria-live="polite">
      <span style="font-family: 'Merriweather', serif;">
        {{ selectedTitle || 'What adventure will you get?' }}
      </span>
    </div>

    <section class="content">
      <!-- left: Avatar & Door -->
      <div class="left-section">
        <div class="scene-container">
          <img class="backbottom" src="@/assets/backbottom.png" alt="" aria-hidden="true" />
          <AvatarDoor ref="avatarDoorRef" />
        </div>
      </div>

      <!-- center wheel + tips -->
      <div class="center-section">
        <div class="wheel-wrap">
          <!-- 翅膀：左上两个、右上两个 -->
          <div class="tip tip-tl-outer">Spin the wheel to pick a game</div>
          <div class="tip tip-tl-inner">Watch Avatar run to reach chosen game</div>
          <div class="tip tip-tr-outer">Click “Spin Now” and press “Begin” to start the game.</div>
          <div class="tip tip-tr-inner">Click Reset to spin again and try different game</div>

          <WheelSvg
            ref="wheelRef"
            :titles="sectorTitles"
            :routes="sectorRoutes"
            :startAtTop="true"
            :enableSpin="true"
            :innerRatio="0.40"
            :outerRatio="0.92"
            :spinMs="2000"
            role="application"
            aria-label="Game wheel selector"
            @spun="handleSpun"
            @sector-click="onSectorClick"
          />
        </div>

        <div class="btn-row">
          <button
            class="btn btn-primary"
            :disabled="!selectedTitle"
            :aria-disabled="!selectedTitle"
            @click="goBegin"
            title="Start the selected game"
          >
            Begin
          </button>
          <button class="btn btn-ghost" @click="doReset" title="Reset the wheel and avatar">
            Reset
          </button>
        </div>
      </div>

      <!-- right avatar preview -->
      <aside class="side-box" aria-label="Boss preview">
        <div class="boss-container">
          <img class="bossguide-preview" src="@/assets/bossguide.png" alt="" aria-hidden="true" />
          <img class="boss-preview" src="@/assets/boss1.png" alt="Boss preview" />
        </div>
      </aside>
    </section>

    <!-- ===== Game Previews (纯视觉交互) ===== -->
    <section class="previews" aria-label="Game previews (visual only)">
      <!-- Card 1 -->
      <article class="preview-card" aria-hidden="false">
        <h3 class="preview-title">Wordle</h3>
        <div class="stage">
          <div class="img-wrap">
            <!-- 换成你的实际图片 -->
            <img src="@/assets/wordle-preview.png" alt="" />
          </div>
          <div class="hover-text">
            Guess the word in 6 tries. Each guess reveals the correct letter and its location.
          </div>
        </div>
      </article>

      <!-- Card 2 -->
      <article class="preview-card" aria-hidden="false">
        <h3 class="preview-title">Match 3</h3>
        <div class="stage">
          <div class="img-wrap">
            <!-- 换成你的实际图片 -->
            <img src="@/assets/match3-preview.png" alt="" />
          </div>
          <div class="hover-text">
            Swap the food items to make a match of 3 tiles and progress the levels gaining points.
          </div>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import WheelSvg from '@/components/WheelSvg.vue'
import AvatarDoor from '@/components/AvatarDoor.vue'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'

const router = useRouter()

const sectorTitles = ['Wordle', '3 Match']
const sectorRoutes = ['/wordle-game', '/match3']

const selectedTitle = ref('')
const wheelRef = ref(null)
const avatarDoorRef = ref(null)

function handleSpun(pickedTitle) {
  selectedTitle.value = pickedTitle
  avatarDoorRef.value?.runToDoor?.()
}
function onSectorClick(_) {}
function goBegin() {
  const i = sectorTitles.indexOf(selectedTitle.value)
  router.push(sectorRoutes[i] ?? '/wordle-game')
}
function doReset() {
  selectedTitle.value = ''
  wheelRef.value?.reset?.()
  avatarDoorRef.value?.reset?.()
}
function onKey(e) {
  if ((e.key === 'Enter' || e.key === ' ') && selectedTitle.value) {
    e.preventDefault()
    goBegin()
  } else if (e.key.toLowerCase() === 'r') {
    doReset()
  }
}
onMounted(() => {
  selectedTitle.value = ''
  document.body.classList.add('home-bg')
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.body.classList.remove('home-bg')
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
/* —— layout —— */
.home { max-width: 1200px; margin: 0 auto; padding: clamp(16px, 3vw, 24px); position: relative; min-height: 100vh; overflow-x: hidden; }
.home :deep(.breadcrumb) { margin-bottom: 20px; }

/* —— title banner —— */
.title-banner {
  width: min(640px, 92%); margin: 8px auto 48px; padding: 16px 16px;
  text-align: center; color: #00515c; font-family: 'Slackey', cursive; font-size: 2rem;
  transition: opacity .2s ease; background: none; border: none; line-height: 1.4;
  display: flex; justify-content: center; align-items: center; position: relative; z-index: 2;
}

/* —— 3-column content —— */
.content {
  display: grid; grid-template-columns: minmax(300px, 1fr) minmax(400px, 480px) minmax(200px, 1fr);
  gap: clamp(18px, 3vw, 28px); align-items: start; margin-top: 6px;
}

/* —— left（avatar+door） —— */
.left-section { display: flex; flex-direction: column; position: relative; min-height: 520px; z-index: 1; overflow: visible; }
.scene-container { position: absolute; left: 0; bottom: 0; width: clamp(220px, 26vw, 360px); pointer-events: none; }
.scene-container > * { pointer-events: auto; }
.backbottom { position: absolute; left: 50%; bottom: 8.5px; transform: translateX(-50%); width: 100%; height: auto; z-index: -1; pointer-events: none; object-fit: contain; }
:deep(.scene)  { width: 100%; height: clamp(140px, 24vh, 220px); margin: 0; transform: scale(0.8); transform-origin: bottom left; overflow: hidden; }
:deep(.avatar) { left: -4% !important; bottom: 22px !important; transform-origin: bottom center; }
:deep(.door)   { right: 2% !important; bottom: 14px !important; transform-origin: bottom center; }

/* —— center —— */
.center-section { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: 80px; position: relative; z-index: 1; }
.wheel-wrap { position: relative; display: inline-block; padding: 8px 16px; }

/* —— tips（翅膀） —— */
.tip{
  position:absolute; left:50%; top:50%; --tx:0%; --ty:0%;
  transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty)));
  z-index:5; background:#fdfbef; color:#6b3a22;
  font:600 14px/1.35 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  padding:12px 14px; border-radius:16px; box-shadow:0 4px 10px rgba(0,0,0,.08);
  max-width:210px; text-align:center; animation: tipPulse 2.8s ease-in-out infinite; pointer-events:none;
}
.tip-tl-outer{ --tx:-250%; --ty:-250%; }
.tip-tl-inner{ --tx:-135%; --ty:-120%; }
.tip-tr-outer{ --tx: 250%; --ty:-200%; }
.tip-tr-inner{ --tx: 135%; --ty:-120%; }

@media (max-width:1200px){
  .tip-tl-outer{ --tx:-195%; --ty:-175%; }
  .tip-tl-inner{ --tx:-125%; --ty:-112%; }
  .tip-tr-outer{ --tx: 195%; --ty:-175%; }
  .tip-tr-inner{ --tx: 125%; --ty:-112%; }
}
@keyframes tipPulse{
  0%,100%{ transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1); box-shadow:0 4px 10px rgba(0,0,0,.08); }
  50%     { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.03); box-shadow:0 8px 18px rgba(0,0,0,.12); }
}

/* —— buttons —— */
.btn-row{ display:flex; gap:12px; justify-content:center; margin-top:-8px; margin-bottom:20px; }
.btn{
  padding:10px 24px; border:none; border-radius:6px; font-weight:600; letter-spacing:.5px; cursor:pointer; transition:all .3s ease;
  background:#fae7ca; color:#007a3f; box-shadow:0 4px 10px rgba(0,0,0,.1); font-family:'Joti One', cursive;
}
.btn:hover{ transform:scale(1.08) translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.15); filter:brightness(1.05); }
.btn.btn-ghost{ background:#fae7ca; border:1px solid #007a3f; color:#007a3f; }
.btn.btn-primary{ background:#fae7ca; color:#007a3f; border:none; }
.btn[disabled], .btn[aria-disabled="true"]{ opacity:.6; cursor:not-allowed; transform:none; }

/* —— right —— */
.side-box{ display:flex; align-items:flex-start; justify-content:flex-start; position:relative; margin-top:180px; }
.side-box:last-child{ order:3; }
.boss-container{ position:relative; width:fit-content; }
.boss-preview{ width:clamp(260px,30vw,350px); height:auto; filter:drop-shadow(0 8px 16px rgba(0,0,0,.25)); transition:transform .3s ease; transform-origin:center; position:relative; z-index:2; margin-top:-60px; }
.bossguide-preview{ position:absolute; top:-50%; left:50%; transform:translateX(-50%); width:100%; height:auto; z-index:3; opacity:0; transition:opacity .3s ease; pointer-events:none; }
.boss-container:hover .bossguide-preview{ opacity:1; }
.boss-preview:hover{ transform:scale(1.05); filter:drop-shadow(0 12px 24px rgba(0,0,0,.3)); }

/* ===== Game Preview（图片居中 → hover 后移到左侧 + 文字淡入） ===== */
.previews{
  max-width:1100px; margin:18px auto 60px; padding:0 8px;
  display:grid; grid-template-columns:1fr 1fr; gap:clamp(18px,3vw,28px);
}
.preview-card{
  position:relative; background:#fae7ca; border-radius:16px; padding:18px 22px 22px;
  box-shadow:0 8px 22px rgba(0,0,0,.08); cursor:default; overflow:hidden;
}
.preview-title{
  margin:0 0 10px; font-weight:800; font-size:clamp(22px,2.2vw,32px); color:#007a3f; text-align:left; letter-spacing:.3px;
}

/* 舞台高度固定，便于做位移动画 */
.stage{ position:relative; height:160px; }

/* 图片：初始居中；hover 后贴左侧且微放大 */
.img-wrap{
  position:absolute; top:50%; left:50%;
  width:160px; height:140px; border-radius:10px; overflow:hidden;
  box-shadow:0 6px 14px rgba(0,0,0,.12);
  transform: translate(-50%,-50%); transition: left .35s ease, transform .35s ease;
}
.img-wrap img{ width:100%; height:100%; object-fit:cover; }

.preview-card:hover .img-wrap{ left:18px; transform: translate(0,-50%) scale(1.02); }

/* 文案：初始隐藏；hover 后在右侧淡入 */
.hover-text{
  position:absolute; inset:0; display:flex; align-items:center;
  padding-left: calc(18px + 160px + 18px); padding-right:6px;
  color:#6b3a22; font-weight:700; line-height:1.5;
  opacity:0; transform:translateX(8px); transition: opacity .28s ease, transform .28s ease;
}
.preview-card:hover .hover-text{ opacity:1; transform:translateX(0); }

/* 窄屏 / 触屏（无 hover）：直接用“图片在左 + 文字常显”的静态布局 */
@media (hover:none), (max-width: 900px){
  .previews{ grid-template-columns:1fr; }
  .stage{ height:auto; min-height:140px; }
  .img-wrap{ position:absolute; top:50%; left:18px; transform: translate(0,-50%); }
  .hover-text{ opacity:1; transform:none; }
}

/* —— reduce motion —— */
@media (prefers-reduced-motion: reduce){
  .img-wrap, .hover-text{ transition: none !important; }
}
</style>
