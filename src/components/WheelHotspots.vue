<template>
  <div
    ref="wrapRef"
    class="wheel-wrap"
    :style="{
      '--bg': `url(${bgSrc})`,
      transform: `rotate(${rotateDeg}deg)`,
      transition: rotating ? 'transform 2s cubic-bezier(.2,.75,.25,1)' : 'none'
    }"
    @mouseleave="hoverIndex = -1"
  >
    <!-- 背景图层（整张 wheel.png） -->
    <div class="wheel-bg" aria-hidden="true"></div>

    <!-- 扇区热点层 -->
    <button
      v-for="(t, i) in sectorCount"
      :key="i"
      class="sector"
      type="button"
      :aria-label="titles[i] || `Sector ${i+1}`"
      :style="sectorStyle(i)"
      @mouseenter="hoverIndex = i"
      @focus="hoverIndex = i"
      @blur="hoverIndex = -1"
      @click="goto(i)"
    >
      <!-- 高亮层（只在 hover/focus 时显示） -->
      <span class="highlight" :class="{ show: hoverIndex === i }"></span>
      <!-- 可选：在扇区外弧显示标题 -->
      <span class="label" v-if="showLabels" :style="labelStyle(i)">
        {{ titles[i] || `#${i+1}` }}
      </span>
    </button>

    <!-- 指针（你的 needle.png），不挡事件 -->
    <img class="needle" src="@/assets/needle.png" alt="" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

/**
 * props:
 * - bgSrc: 你的整张转盘图片（默认 '@/assets/wheel.png'）
 * - routes: 每个扇区的跳转路由
 * - titles: 每个扇区标题（用于 aria 和外弧文案）
 * - startAtTop: 0 号扇区是否从正上方开始
 * - innerRatio: 内圈死区半径比例（0~1）
 * - outerRatio: 外圈半径比例（0~1），<1 可避免点到边框
 * - showLabels: 是否显示外弧文字
 * - rotateDeg/rotating: 若你还要做旋转动画，可传入以保持热点跟随
 */
const props = defineProps({
  bgSrc: { type: String, default: () => new URL('@/assets/wheel.png', import.meta.url).href },
  routes: { type: Array, default: () => [] },
  titles: { type: Array, default: () => [] },
  startAtTop: { type: Boolean, default: true },
  innerRatio: { type: Number, default: 0.18 },
  outerRatio: { type: Number, default: 0.98 },
  showLabels: { type: Boolean, default: true },
  rotateDeg: { type: Number, default: 0 },
  rotating: { type: Boolean, default: false }
})

const router = useRouter()
const wrapRef = ref(null)
const hoverIndex = ref(-1)
const sectorCount = computed(() => Math.max(props.routes.length, props.titles.length, 8))

function toPolarPoint(angleDeg, radiusRatio) {
  // angle: 0°=正右；如果希望从正上方开始，把角度整体+90°
  let a = angleDeg
  if (props.startAtTop) a = (a - 90 + 360) % 360
  const rad = (a * Math.PI) / 180
  const x = 50 + Math.cos(rad) * 50 * radiusRatio
  const y = 50 + Math.sin(rad) * 50 * radiusRatio
  return `${x}% ${y}%`
}

/**
 * 生成第 i 个扇区的 clip-path 多边形
 * 采用：内弧两点 + 外弧两点（四边形近似扇形）
 * 你也可以把 steps 调大，插入更多点提高圆弧拟合度
 */
function sectorStyle(i) {
  const size = 360 / sectorCount.value
  const start = i * size
  const end = start + size

  const ir = props.innerRatio
  const or = props.outerRatio

  // 四点法：内起 -> 内止 -> 外止 -> 外起（顺时针）
  const p1 = toPolarPoint(start, ir)
  const p2 = toPolarPoint(end, ir)
  const p3 = toPolarPoint(end, or)
  const p4 = toPolarPoint(start, or)

  const polygon = `polygon(${p1}, ${p2}, ${p3}, ${p4})`
  return {
    clipPath: polygon
  }
}

/** 外弧标签的放置（取本扇区中心角，半径用 outerRatio） */
function labelStyle(i) {
  const size = 360 / sectorCount.value
  const mid = i * size + size / 2
  let a = mid
  if (props.startAtTop) a = (a - 90 + 360) % 360
  const rad = (a * Math.PI) / 180
  const rr = (props.innerRatio + props.outerRatio) / 2
  const x = 50 + Math.cos(rad) * 50 * rr
  const y = 50 + Math.sin(rad) * 50 * rr
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%,-50%) rotate(${a}deg)`
  }
}

function goto(i) {
  const route = props.routes[i]
  if (route) router.push(route)
}
</script>

<style scoped>
.wheel-wrap {
  position: relative;
  width: clamp(260px, min(30vw, 85vw), 420px);
  aspect-ratio: 1 / 1;
  margin: 30px auto;
  isolation: isolate;
}

.wheel-bg {
  position: absolute;
  inset: 0;
  background-image: var(--bg);
  background-size: cover;
  background-position: center;
  border-radius: 50%;
  overflow: hidden;
}

/* 每个扇区作为按钮（可聚焦、可键盘） */
.sector {
  position: absolute;
  inset: 0;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  /* 让按钮本身不遮住背景 */
  outline: none;
}

/* 高亮层（用 conic-gradient + 透明叠加描边光晕） */
.highlight {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  transition: opacity .18s ease;
  /* 用半透明色叠加 */
  background: radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,.08), rgba(255,255,255,0) 60%);
  box-shadow:
    0 0 0 2px rgba(255,255,255,.25) inset,
    0 4px 18px rgba(0,0,0,.25),
    0 0 28px rgba(124,240,255,.35);
}

.highlight.show {
  opacity: 1;
}

.sector:focus .highlight {
  opacity: 1;
}

/* 外弧标签（可选） */
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
}

/* 指针 */
.needle {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 15%;
  transform: translateY(-143%) rotate(180deg);
  z-index: 3;
  pointer-events: none;
  filter: drop-shadow(0 8px 18px rgba(0,0,0,.4));
}
</style>
