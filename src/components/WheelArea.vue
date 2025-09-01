<template>
  <div ref="wrapRef" class="wheel-wrap">
    <!-- 旋转容器：图片 + 扇区热点层 一起旋转 -->
    <div class="wheel" :class="{ spun: hasSpun }" :style="wheelStyle">
      <!-- 背景转盘图 -->
      <img class="wheel-img" src="@/assets/wheel.png" alt="wheel" />

      <!-- 扇区热点层：hover 高亮 + 点击跳转（跟随旋转） -->
      <button
        v-for="(_, i) in sectorCount"
        :key="i"
        class="sector"
        type="button"
        :aria-label="titles[i] || `Sector ${i+1}`"
        :style="sectorStyle(i)"
        :disabled="spinning"
        @mouseenter="hoverIndex = i"
        @focus="hoverIndex = i"
        @mouseleave="hoverIndex = -1"
        @blur="hoverIndex = -1"
        @click="gotoByIndex(i, { from: 'click' })"
      >
        <span class="highlight" :class="{ show: hoverIndex === i }"></span>
        <span v-if="showLabels" class="label" :style="labelStyle(i)">
          {{ titles[i] || `#${i+1}` }}
        </span>
      </button>

      <!-- 中心“SPIN NOW”按钮（只负责随机旋转，不拦截扇区） -->
      <button
        class="spin-center"
        type="button"
        :disabled="spinning"
        @click.stop="onSpin"
      >
        SPIN NOW
      </button>
    </div>

    <!-- 指针（不参与旋转） -->
    <img class="needle" src="@/assets/needle.png" alt="needle" />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, defineExpose } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  titles: { type: Array, default: () => [] },
  routes: { type: Array, default: () => [] },
  startAtTop: { type: Boolean, default: true },
  enableSpin: { type: Boolean, default: true },
  innerRatio: { type: Number, default: 0.20 },   // 扇区内半径
  outerRatio: { type: Number, default: 0.985 },  // 扇区外半径
  showLabels: { type: Boolean, default: true }
})
const emit = defineEmits(['spun', 'sector-click'])

const router = useRouter()

const wrapRef = ref(null)
const spinning = ref(false)
const hasSpun = ref(false)
const rotateDeg = ref(0)
let spinTimer = null

const hoverIndex = ref(-1)
const sectorCount = computed(() => props.routes.length || props.titles.length || 8)

const wheelStyle = computed(() => ({
  transform: `rotate(${rotateDeg.value}deg)`,
  transition: spinning.value ? 'transform 2s cubic-bezier(.2,.75,.25,1)' : 'none'
}))

/** 随机旋转，结束后按停留角度计算扇区并跳转 */
function onSpin() {
  if (!props.enableSpin || spinning.value) return
  spinning.value = true
  hasSpun.value = true

  const baseTurns = 360 * 4
  const randomTail = Math.floor(Math.random() * 360)
  rotateDeg.value = (rotateDeg.value + baseTurns + randomTail) % 360

  spinTimer = setTimeout(() => {
    spinning.value = false
    const idx = angleToIndex(0) // 指针在上方
    gotoByIndex(idx, { from: 'spin' })
  }, 2000)
}

/** 角度 -> 扇区索引（注意扣掉当前旋转） */
function angleToIndex(angleDeg) {
  const effective = (angleDeg - (rotateDeg.value % 360) + 360) % 360
  const size = 360 / sectorCount.value
  return Math.floor(effective / size)
}

/** 跳转 */
function gotoByIndex(index, meta = {}) {
  const title = props.titles?.[index]
  const route = props.routes?.[index]
  emit('sector-click', { index, title, route, ...meta })
  if (title) emit('spun', title)
  if (route) router.push(route)
}

/* ===== 扇区形状与标签定位 ===== */

function toPolarPoint(angleDeg, radiusRatio) {
  // 0°在右侧；若从正上方开始，整体旋转 -90°
  let a = angleDeg
  if (props.startAtTop) a = (a - 90 + 360) % 360
  const rad = (a * Math.PI) / 180
  const x = 50 + Math.cos(rad) * 50 * radiusRatio
  const y = 50 + Math.sin(rad) * 50 * radiusRatio
  return `${x}% ${y}%`
}

function sectorStyle(i) {
  const size = 360 / sectorCount.value
  const start = i * size
  const end = start + size
  const ir = props.innerRatio
  const or = props.outerRatio
  const p1 = toPolarPoint(start, ir)
  const p2 = toPolarPoint(end, ir)
  const p3 = toPolarPoint(end, or)
  const p4 = toPolarPoint(start, or)
  return { clipPath: `polygon(${p1}, ${p2}, ${p3}, ${p4})` }
}

function labelStyle(i) {
  const size = 360 / sectorCount.value
  const mid = i * size + size / 2
  let a = mid
  if (props.startAtTop) a = (a - 90 + 360) % 360
  const rad = (a * Math.PI) / 180
  const rr = (props.innerRatio + props.outerRatio) / 2
  const x = 50 + Math.cos(rad) * 50 * rr
  const y = 50 + Math.sin(rad) * 50 * rr
  return { left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) rotate(${a}deg)` }
}

function reset() {
  if (spinTimer) clearTimeout(spinTimer)
  spinning.value = false
  hasSpun.value = false
  rotateDeg.value = 0
}
onBeforeUnmount(() => { if (spinTimer) clearTimeout(spinTimer) })
defineExpose({ reset, onSpin })
</script>

<style scoped>
.wheel-wrap {
  position: relative;
  width: clamp(260px, min(30vw, 85vw), 420px);
  aspect-ratio: 1 / 1;
  margin: 30px auto;
  isolation: isolate;
}

/* 旋转容器（图片 + 热点层一起转） */
.wheel {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  overflow: hidden;
  transform: scale(1);
  transition: transform 0.3s ease;
  z-index: 2; /* 确保在 ::after 上面 */
}

.wheel-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* —— 扇区热点 —— */
.sector {
  position: absolute;
  inset: 0;
  background: transparent;
  border: 0;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  z-index: 3;          /* 高于图片，低于指针 */
  outline: none;
}

.highlight {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  transition: opacity .18s ease;
  background: radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,.08), rgba(255,255,255,0) 60%);
  box-shadow:
    0 0 0 2px rgba(255,255,255,.25) inset,
    0 4px 18px rgba(0,0,0,.25),
    0 0 28px rgba(124,240,255,.35);
}
.highlight.show,
.sector:focus .highlight { opacity: 1; }

.label {
  position: absolute;
  padding: .2em .5em;
  font-weight: 700;
  font-size: clamp(10px, 1.4vw, 14px);
  color: #0e2b2f;
  background: rgba(255,255,255,.85);
  border-radius: 999px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,.12);
  transform-origin: center;
  user-select: none;
  pointer-events: none;
  z-index: 4;
}

/* 中心 SPIN 按钮 */
.spin-center {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 36%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  z-index: 4;
  font-family: 'Slackey', cursive;
  font-size: clamp(18px, 3.2vw, 28px);
  letter-spacing: 2px;
  color: #0b2a2e;
  background:
    radial-gradient(60% 60% at 50% 40%, rgba(255,255,255,.85), rgba(255,255,255,.6)),
    rgba(255,255,255,.75);
  box-shadow:
    inset 0 0 0 2px rgba(14,43,47,.12),
    0 8px 20px rgba(0,0,0,.25);
  transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
}
.spin-center:hover:not(:disabled) {
  transform: translate(-50%, -50%) scale(1.03);
  box-shadow:
    inset 0 0 0 2px rgba(14,43,47,.2),
    0 10px 26px rgba(0,0,0,.3);
}
.spin-center:active:not(:disabled) {
  transform: translate(-50%, -50%) scale(0.98);
}
.spin-center:disabled { opacity: .6; cursor: not-allowed; }

/* 指针（不吃事件） */
.needle {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 15%;
  transform: translateY(-143%) rotate(180deg);
  z-index: 5;
  pointer-events: none;
  filter: drop-shadow(0 8px 18px rgba(0,0,0,.4));
}

/* 外圈柔光：禁止吃事件 */
.wheel-wrap::after {
  content:"";
  position:absolute;
  inset:-6%;
  background: radial-gradient(60% 60% at 50% 40%, rgba(124,240,255,.15), transparent 60%);
  opacity:0; transition: opacity .25s ease; z-index:1;
  pointer-events: none; /* 关键：不拦截点击 */
}
.wheel-wrap:hover::after { opacity:1; }
</style>
