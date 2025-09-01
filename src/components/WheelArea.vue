<template>
  <div ref="wrapRef" class="wheel-wrap" @click="onWheelClick">
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
import { useRouter } from 'vue-router'

/**
 * props.titles: 扇区标题（可选）
 * props.routes: 每个扇区对应的路由（必填，用于点击或旋转结束后跳转）
 * props.startAtTop: 是否以正上方为0扇区（默认true）
 * props.enableClickToGoto: 是否开启“点扇区直接进入游戏”（默认true）
 * props.enableSpin: 是否允许点击空白处触发随机旋转（默认true）
 */
const props = defineProps({
  titles: { type: Array, default: () => [] },
  routes: { type: Array, default: () => [] },
  startAtTop: { type: Boolean, default: true },
  enableClickToGoto: { type: Boolean, default: true },
  enableSpin: { type: Boolean, default: true }
})
const emit = defineEmits(['spun', 'sector-click'])

const router = useRouter()

const wrapRef = ref(null)
const spinning = ref(false)
const hasSpun = ref(false)
const rotateDeg = ref(0)
let spinTimer = null

const sectorCount = computed(() => props.routes.length || props.titles.length || 8)
const canSpin = computed(() => !spinning.value)

const wheelStyle = computed(() => ({
  transform: `rotate(${rotateDeg.value}deg)`,
  transition: spinning.value ? 'transform 2s cubic-bezier(.2,.75,.25,1)' : 'none'
}))

/** 随机旋转，结束后按停留角度计算扇区并跳转 */
function onSpin() {
  if (!props.enableSpin || !canSpin.value) return
  spinning.value = true
  hasSpun.value = true

  const baseTurns = 360 * 4
  const randomTail = Math.floor(Math.random() * 360)
  rotateDeg.value = (rotateDeg.value + baseTurns + randomTail) % 360

  spinTimer = setTimeout(() => {
    spinning.value = false
    const idx = angleToIndex(visualZeroAngle())
    gotoByIndex(idx, { from: 'spin' })
  }, 2000)
}

/** 点击转盘：优先识别点击扇区；若点击在中心小圆或关闭点击直达，则作为一次spin */
function onWheelClick(e) {
  if (spinning.value) return

  const { index, isCenter } = pickSectorByClick(e)
  if (props.enableClickToGoto && index != null && !isCenter) {
    gotoByIndex(index, { from: 'click' })
    return
  }
  // 启用“点击空白触发随机旋转”
  if (props.enableSpin) onSpin()
}

/** —— 工具函数 —— */

/** 根据点击坐标 → 角度 → 扇区索引 */
function pickSectorByClick(e) {
  const rect = wrapRef.value.getBoundingClientRect()
  const cx = rect.width / 2
  const cy = rect.height / 2
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const dx = x - cx
  const dy = y - cy

  // 半径&中心点击判定（避免点在甜甜圈中心或外圈）
  const r = Math.min(cx, cy)
  const dist = Math.hypot(dx, dy)
  const innerDead = r * 0.18    // 内圈死区比例，可调
  const outerDead = r * 0.98    // 外圈边缘死区，防止点到边框
  const isCenter = dist < innerDead || dist > outerDead
  if (isCenter) return { index: null, isCenter: true }

  // 以x轴为0°，逆时针；结果转到 [0,360)
  let angle = Math.atan2(dy, dx) * 180 / Math.PI
  if (angle < 0) angle += 360

  // 若希望0扇区从正上方开始，则把几何0°(右侧)平移到上方
  if (props.startAtTop) angle = (angle + 90) % 360

  // 视觉角度要扣掉当前顺时针旋转角度
  const effective = (angle - (rotateDeg.value % 360) + 360) % 360
  const size = 360 / sectorCount.value
  const index = Math.floor(effective / size)
  return { index, isCenter: false }
}

/** 当前指针所指的“视觉0°”对应的角度（用于spin后计算停留扇区） */
function visualZeroAngle() {
  // 指针在正上方，且startAtTop=true 时，视觉上就是0°
  // 这里只需要返回 0 就行；保留函数是为了以后改指针位置时只改这里
  return 0
}

/** 角度 -> 扇区索引 */
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

.wheel-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: all 0.3s ease;
}
.spin-text {
  color: #000; font-size: 3.8rem; font-family: 'Slackey', cursive;
  text-transform: uppercase; letter-spacing: 3px; opacity: 0;
  text-align: center; line-height: 1.2; display: flex;
  justify-content: center; align-items: center; height: 100%;
}
.wheel:hover .wheel-overlay, .wheel:hover .spin-text { opacity: 1; }

.wheel.spun .wheel-overlay { opacity: 1; background: rgba(51,51,51,.75); }
.wheel.spun .spin-text { opacity: 0; }

.needle {
  position: absolute; inset: 0; margin: auto; width: 15%;
  transform: translateY(-143%) rotate(180deg);
  z-index: 4; pointer-events: none;
  filter: drop-shadow(0 8px 18px rgba(0,0,0,.4));
}
.wheel-wrap::after {
  content:""; position:absolute; inset:-6%;
  background: radial-gradient(60% 60% at 50% 40%, rgba(124,240,255,.15), transparent 60%);
  opacity:0; transition: opacity .25s ease; z-index:1;
}
.wheel-wrap:hover::after { opacity:1; }
</style>
