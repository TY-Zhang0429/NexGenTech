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

// DOM引用
const sceneRef = ref(null)
const avatarRef = ref(null)
const doorRef = ref(null)

// 状态管理
const state = reactive({
  tx: 0,
  ty: 0,
  running: false,
  doorGlow: false,
  isDoorClosed: true  // 默认关闭状态
})

// 门的图片资源
const doorOpenImage = '/assets/door.png'      // 修改对应关系
const doorClosedImage = '/assets/doorclose.png'

// 计算属性
const avatarStyle = computed(() => ({
  transform: `translateX(${state.tx}px)`,
  transition: state.running ? 'transform 2s ease-out' : 'none'
}))

const doorGlow = computed(() => state.doorGlow)

const currentDoorImage = computed(() => {
  return state.isDoorClosed ? doorClosedImage : doorOpenImage
})

// 方法
function reset() {
  state.doorGlow = false
  state.running = false
  state.isDoorClosed = true  // reset时关闭门
  
  // 直接重置位置，无过渡动画
  avatarRef.value.style.transition = 'none'
  state.tx = 0
  state.ty = 0
  
  // 强制重绘
  avatarRef.value.offsetHeight
  avatarRef.value.style.transition = ''
}

function calcDelta() {
  if (!sceneRef.value || !avatarRef.value || !doorRef.value) return { tx: 0, ty: 0 }
  
  const a = avatarRef.value.getBoundingClientRect()
  const d = doorRef.value.getBoundingClientRect()
  const s = sceneRef.value.getBoundingClientRect()
  
  const ax = a.left - s.left + a.width/2
  const ay = a.top - s.top + a.height/2
  const dx = d.left - s.left + d.width/2
  const dy = d.top - s.top + d.height/2
  
  return { tx: dx - ax, ty: dy - ay }
}

function runToDoor() {
  // 先重置到起点，无动画
  avatarRef.value.style.transition = 'none'
  state.tx = 0
  state.ty = 0
  state.doorGlow = false
  state.running = false
  state.isDoorClosed = false  // spin时立即打开门
  
  // 强制重绘
  avatarRef.value.offsetHeight

  // 然后开始新的动画
  requestAnimationFrame(() => {
    avatarRef.value.style.transition = ''
    const { tx, ty } = calcDelta()
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

// 生命周期
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
  width: min(1000px, 95vw);
  height: clamp(180px, 34vh, 320px);
  margin: 6px auto 0;
  border-radius: var(--radius);
  background: transparent;
}

.door {
  position: absolute;
  right: 2%;
  bottom: 6%;
  width: clamp(80px, 13vw, 140px);
  transition: all .3s var(--ease);
  filter: drop-shadow(0 10px 24px rgba(0,0,0,.35));
}

.door.glow {
  filter: drop-shadow(0 0 36px rgba(255,210,90,.45));
  transform: translateY(-1px) scale(1.02);
}

.avatar {
  position: absolute;
  left: 18px;
  bottom: 6%;
  width: 96px;
  height: 96px;
  overflow: hidden;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,.35));
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
  from {
    background-position-x: 0;
  }
  to {
    background-position-x: -2304px;
  }
}
</style>