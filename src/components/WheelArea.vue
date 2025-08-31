<template>
  <div class="wheel-wrap" @click="canSpin && onSpin()">
    <div class="wheel" :class="{ spun: hasSpun }" :style="wheelStyle">
      <img class="wheel-img" src="@/assets/wheel.png" alt="wheel" />
      <div class="wheel-overlay">
        <span class="spin-text">SPIN NOW</span>
      </div>
    </div>
    <img class="needle" src="@/assets/needle.png" alt="needle" />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, defineExpose } from 'vue'

const props = defineProps({ titles: { type: Array, default: () => [] } })
const emit = defineEmits(['spun'])

const spinning = ref(false)
const hasSpun = ref(false)
const rotateDeg = ref(0)
let spinTimer = null

const canSpin = computed(() => !spinning.value && !hasSpun.value)

const wheelStyle = computed(() => ({
  transform: `rotate(${rotateDeg.value}deg)`,
  transition: spinning.value ? 'transform 2s cubic-bezier(.2,.75,.25,1)' : 'none'
}))

function onSpin(){
  if(!canSpin.value) return
  spinning.value = true
  const baseTurns = 360 * 4
  const randomTail = Math.floor(Math.random() * 360)
  rotateDeg.value = baseTurns + randomTail

  spinTimer = setTimeout(() => {
    spinning.value = false
    hasSpun.value = true
    const picked = props.titles[Math.floor(Math.random() * props.titles.length)]
    emit('spun', picked)
  }, 2000)
}

function reset(){
  if (spinTimer) clearTimeout(spinTimer)
  spinning.value = false
  hasSpun.value = false
  rotateDeg.value = 0
}

onBeforeUnmount(() => { if (spinTimer) clearTimeout(spinTimer) })
defineExpose({ reset })
</script>

<style scoped>
.wheel-wrap {
  position: relative;
  width: clamp(260px, min(30vw, 85vw), 420px);
  aspect-ratio: 1/1;
  margin: 30px auto;
  isolation: isolate;
  cursor: pointer;
}

.wheel {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transform: scale(1);
  transition: transform 0.3s ease;
}

.wheel-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 遮罩层样式 */
.wheel-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
}

/* 文字样式 */
.spin-text {
  color: #000000;
  font-size: 3.8rem;
  font-family: 'Slackey', cursive;
  text-transform: uppercase;
  letter-spacing: 3px;
  transition: opacity 0.3s ease;
  opacity: 0;
  text-align: center;
  line-height: 1.2;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

/* 悬浮时显示遮罩和文字 */
.wheel:hover .wheel-overlay,
.wheel:hover .spin-text {
  opacity: 1;
}

/* 旋转后的状态 */
.wheel.spun .wheel-overlay {
  opacity: 1;
  background: rgba(51, 51, 51, 0.75);
}

/* 旋转后隐藏文字 */
.wheel.spun .spin-text {
  opacity: 0;
}

.needle {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 15%;
  transform: translateY(-143%) rotate(180deg);
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