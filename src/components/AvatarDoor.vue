<template>
  <div class="scene" ref="sceneRef">
    <div
      ref="avatarRef"
      class="avatar"
      :class="{ running: state.running }"
      :style="avatarStyle"
      @transitionend="onAvatarArrive"
    >
      <div class="sprite-img"></div>
    </div>
    <img
      ref="doorRef"
      class="door"
      :class="{ glow: doorGlow }"
      :src="currentDoorImage"
      alt="door"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, defineExpose } from 'vue'

const frames = 24
const spriteUrl = '/assets/walk-sprites.png'
const frameW = ref(96)
const frameH = ref(96)


const ENTER_EXTRA_PX = 16     // enter door extra px
const ALIGN_PIVOT    = 0.38   // avatar width 38% as align pivot

// DOM references
const sceneRef = ref(null)
const avatarRef = ref(null)
const doorRef = ref(null)

// State
const state = reactive({
  tx: 0,
  ty: 0,
  running: false,
  doorGlow: false,
  isDoorClosed: true
})

// door images
const doorOpenImage = '/assets/door.png'
const doorClosedImage = '/assets/doorclose.png'

// computed
const avatarStyle = computed(() => ({
  transform: `translateX(${state.tx}px)`,
  transition: state.running ? 'transform 2s ease-out' : 'none'
}))
const doorGlow = computed(() => state.doorGlow)
const currentDoorImage = computed(() => (state.isDoorClosed ? doorClosedImage : doorOpenImage))

// Methods
function reset() {
  state.doorGlow = false
  state.running = false
  state.isDoorClosed = true

  avatarRef.value.style.transition = 'none'
  state.tx = 0
  state.ty = 0
  // eslint-disable-next-line no-unused-expressions
  avatarRef.value.offsetHeight
  avatarRef.value.style.transition = ''
}

/** calculate delta to move avatar to door
 *  extraPx: extra px to push avatar closer to door
 *  align:   avatar align point (0 left ~ 1 right), default 0.38 closer to "front foot"
 */
function calcDelta(extraPx = 0, align = 0.5) {
  if (!sceneRef.value || !avatarRef.value || !doorRef.value) return { tx: 0, ty: 0 }

  const a = avatarRef.value.getBoundingClientRect()
  const d = doorRef.value.getBoundingClientRect()
  const s = sceneRef.value.getBoundingClientRect()

  // use align point on avatar width
  const ax = a.left - s.left + a.width * align
  const ay = a.top - s.top + a.height / 2

  // door use geographic centre + extra px
  const dx = d.left - s.left + d.width / 2 + extraPx
  const dy = d.top - s.top + d.height / 2

  return { tx: dx - ax, ty: dy - ay }
}

function runToDoor(opts = {}) {
  const extra = typeof opts.extraPx === 'number' ? opts.extraPx : ENTER_EXTRA_PX
  const align = typeof opts.align === 'number' ? opts.align : ALIGN_PIVOT

  // reset position
  avatarRef.value.style.transition = 'none'
  state.tx = 0
  state.ty = 0
  state.doorGlow = false
  state.running = false
  state.isDoorClosed = false // open door


  // eslint-disable-next-line no-unused-expressions
  avatarRef.value.offsetHeight

  // start animation
  requestAnimationFrame(() => {
    avatarRef.value.style.transition = ''
    const { tx } = calcDelta(extra, align)
    if (!sceneRef.value) return

    state.running = true
    state.tx = tx
    state.ty = 0
  })
}

function onAvatarArrive() {
  state.doorGlow = true
  state.running = false
}

function handleResize() {
  reset()
}

// lifecycle
onMounted(() => {
  const img = new Image()
  img.src = spriteUrl
  img.onload = () => {
    frameW.value = Math.floor(img.naturalWidth / frames)
    frameH.value = img.naturalHeight
  }
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  state.running = false
})

defineExpose({ runToDoor, reset })
</script>

<style scoped>
.scene {
  position: relative;
  width: 100%;
  height: clamp(180px, 34vh, 320px);
  margin: 0;
  border-radius: var(--radius);
  background: transparent;
  overflow: visible !important;
  isolation: isolate;
  padding: 40px;  
  margin: -40px;
}


.door {
  position: absolute;
  right: 15%;
  bottom: 0;
  width: clamp(80px, 13vw, 140px);
  transition: all .3s var(--ease);
  filter: drop-shadow(0 10px 24px rgba(0,0,0,.35));
  transform-origin: bottom center;
  z-index: 3;  /* ↑ */
}
.door::before {
  content: '';
  position: absolute;
  inset: -80%;
  background: radial-gradient(
    circle at center,
    rgba(255,210,90,0) 20%,
    rgba(255,210,90,0.25) 50%,
    rgba(255,210,90,0) 70%
  );
  opacity: 0;
  transition: opacity .3s var(--ease);
  z-index: -1;
  transform: scale(2);
  pointer-events: none;
}
.door.glow {
  filter:
    drop-shadow(0 0 25px rgba(255,210,90,0.9))
    drop-shadow(0 0 50px rgba(255,210,90,0.5))
    drop-shadow(0 0 75px rgba(255,210,90,0.3));
  transform: translateY(-1px) scale(1.02);
}
.door.glow::before { opacity: 1; }

.avatar {
  position: absolute;
  left: 5%;
  bottom: 0;
  width: clamp(80px, 10vw, 96px);
  height: auto;
  aspect-ratio: 1/1;
  overflow: hidden;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,.35));
  transform-origin: bottom center;
  z-index: 2; 
}

.sprite-img {
  position: absolute;
  left: 0;
  top: 0;
  height: 96px;
  width: 96px;
  background-image: url('/assets/walk-sprites.png');
  background-size: 2304px 96px;
  image-rendering: pixelated;
  will-change: transform;
}
.avatar.running .sprite-img {
  animation: sprite-run 1.6s steps(24) infinite;
}
@keyframes sprite-run {
  from { background-position-x: 0; }
  to   { background-position-x: -2304px; }
}
</style>
