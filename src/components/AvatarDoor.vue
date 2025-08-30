<template>
  <div class="scene" ref="sceneRef">
    <img
      ref="avatarRef"
      class="avatar"
      src="@/assets/avatar.png"
      alt="avatar"
      :style="avatarStyle"
      @transitionend="onAvatarArrive"
    />
    <img
      ref="doorRef"
      class="door"
      :class="{ glow: doorGlow }"
      src="@/assets/door.png"
      alt="door"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, defineExpose } from 'vue'

const sceneRef = ref(null)
const avatarRef = ref(null)
const doorRef = ref(null)

const state = reactive({
  tx: 0, ty: 0, running: false, doorGlow: false,
})

const avatarStyle = computed(() => ({
  transform: `translate(${state.tx}px, ${state.ty}px)`,
  transition: state.running ? 'transform 1.1s ease-in-out' : 'none'
}))
const doorGlow = computed(() => state.doorGlow)

function reset(){
  state.tx = 0; state.ty = 0; state.running = false; state.doorGlow = false
}

function calcDelta(){
  if (!sceneRef.value || !avatarRef.value || !doorRef.value) return { tx:0, ty:0 }
  const a = avatarRef.value.getBoundingClientRect()
  const d = doorRef.value.getBoundingClientRect()
  const s = sceneRef.value.getBoundingClientRect()
  const ax = a.left - s.left + a.width/2
  const ay = a.top  - s.top  + a.height/2
  const dx = d.left - s.left + d.width/2
  const dy = d.top  - s.top  + d.height/2
  return { tx: dx - ax, ty: dy - ay }
}

function runToDoor(){
  reset()
  requestAnimationFrame(() => {
    const { tx, ty } = calcDelta()
    if (!sceneRef.value) return
    state.running = true
    state.tx = tx
    state.ty = ty
  })
}

function onAvatarArrive(){ state.doorGlow = true }

function handleResize(){ reset() }

onMounted(() => window.addEventListener('resize', handleResize))
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  state.running = false
})

defineExpose({ runToDoor, reset })
</script>

<style scoped>
/* 场景整体上移：高度更矮、与内容更靠近 */
.scene{
  position:relative; height:160px; margin-top:8px;
  display:flex; align-items:flex-end; justify-content:center;
}
.avatar{
  position:absolute; left:18px; bottom:0; width:68px; height:auto;
  border:2px solid #111; background:#fff;
}
.door{
  position:absolute; bottom:0; width:82px; height:auto;
  border:2px solid #111; background:#fff;
  left:50%; transform:translateX(-50%);
}
.door.glow{
  box-shadow: 0 0 12px 4px rgba(255, 215, 0, .85), 0 0 28px 10px rgba(255, 215, 0, .45);
  filter: saturate(1.2);
}
</style>
