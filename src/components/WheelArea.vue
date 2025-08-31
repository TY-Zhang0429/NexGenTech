<template>
  <div class="wheel-wrap" @click="!spinning && onSpin()">
    <div class="wheel" :style="wheelStyle">
      <img class="wheel-img" src="@/assets/wheel.png" alt="wheel" />
      <div class="spin-text" v-if="!spinning">SPIN</div>
    </div>
    <img class="needle" src="@/assets/needle.png" alt="needle" />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, defineExpose } from 'vue'

const props = defineProps({ titles: { type: Array, default: () => [] } })
const emit = defineEmits(['spun'])

const spinning = ref(false)
const rotateDeg = ref(0)
let spinTimer = null

const wheelStyle = computed(() => ({
  transform: `rotate(${rotateDeg.value}deg)`,
  transition: spinning.value ? 'transform 2s cubic-bezier(.2,.75,.25,1)' : 'none'
}))

function onSpin(){
  if(spinning.value) return
  spinning.value = true
  const baseTurns = 360 * 4
  const randomTail = Math.floor(Math.random() * 360)
  rotateDeg.value = baseTurns + randomTail

  spinTimer = setTimeout(() => {
    spinning.value = false
    const picked = props.titles[Math.floor(Math.random() * props.titles.length)]
    emit('spun', picked)
  }, 2000)
}

function reset(){
  if (spinTimer) clearTimeout(spinTimer)
  spinning.value = false
  rotateDeg.value = 0
}

onBeforeUnmount(() => { if (spinTimer) clearTimeout(spinTimer) })
defineExpose({ reset })
</script>

<style scoped>
.wheel-wrap {
  position: relative;
  width: clamp(260px, 30vw, 420px);
  aspect-ratio: 1/1;
  margin: 30px auto;
  isolation: isolate;
  cursor: pointer;
}

.wheel {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(120% 120% at 20% 15%, rgba(124,240,255,.1), transparent 60%), #151b2c;
  overflow: hidden;
  box-shadow:
    inset 0 10px 20px rgba(255,255,255,.03),
    inset 0 -10px 20px rgba(0,0,0,.35),
    0 22px 40px rgba(0,0,0,.35);
  opacity: 0.85;
  transition: opacity 0.3s ease;
}

.wheel:hover {
  opacity: 1;
}

.wheel-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  filter: saturate(1.02) contrast(1.02);
}

.spin-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 5;
}

.wheel:hover .spin-text {
  opacity: 1;
}

.needle {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 18%;
  transform: translateY(-100%) rotate(180deg);
  z-index: 4;
  pointer-events: none;
  filter: drop-shadow(0 8px 18px rgba(0,0,0,.4));
}

.wheel-wrap::after {
  content: "";
  position: absolute;
  inset: -6%;
  background: radial-gradient(60% 60% at 50% 40%, rgba(124,240,255,.15), transparent 60%);
  opacity: 0;
  transition: opacity .25s ease;
  z-index: 1;
}

.wheel-wrap:hover::after {
  opacity: 1;
}
</style>