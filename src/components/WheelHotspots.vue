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
    <!-- background layer (whole wheel.png) -->
    <div class="wheel-bg" aria-hidden="true"></div>

    <!-- sector hot area -->
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
      <!-- highlight layer (only shows on hover/focus) -->
      <span class="highlight" :class="{ show: hoverIndex === i }"></span>
      <!-- optional: show title on outer arc -->
      <span class="label" v-if="showLabels" :style="labelStyle(i)">
        {{ titles[i] || `#${i+1}` }}
      </span>
    </button>

    <!-- pointer (does not participate in rotation) -->
    <img class="needle" src="@/assets/needle.png" alt="" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

/**
 * props:
 * - bgSrc: picture (default '@/assets/wheel.png')
 * - routes: each sector's navigation route
 * - titles: each sector's title (for aria and outer arc text)
 * - startAtTop: whether the 0th sector starts from the top
 * - innerRatio: inner radius dead zone ratio (0~1)
 * - outerRatio: outer radius ratio (0~1), <1 can avoid hitting the border
 * - showLabels: whether to show outer arc text
 * - rotateDeg/rotating: if you want to do rotation animation, you can pass in to keep the hotspots following
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
  // angle: 0°=right; if you want to start from the top, add 90° to the angle
  let a = angleDeg
  if (props.startAtTop) a = (a - 90 + 360) % 360
  const rad = (a * Math.PI) / 180
  const x = 50 + Math.cos(rad) * 50 * radiusRatio
  const y = 50 + Math.sin(rad) * 50 * radiusRatio
  return `${x}% ${y}%`
}

/**
 * generate i sector clip-path polygon
 * adopt: inner arc two points + outer arc two points (quadrilateral approximates sector)
 * you can also increase the steps to insert more points to improve the arc fitting
 */
function sectorStyle(i) {
  const size = 360 / sectorCount.value
  const start = i * size
  const end = start + size

  const ir = props.innerRatio
  const or = props.outerRatio

  // four-point method: inner start -> inner end -> outer end -> outer start (clockwise)
  const p1 = toPolarPoint(start, ir)
  const p2 = toPolarPoint(end, ir)
  const p3 = toPolarPoint(end, or)
  const p4 = toPolarPoint(start, or)

  const polygon = `polygon(${p1}, ${p2}, ${p3}, ${p4})`
  return {
    clipPath: polygon
  }
}

/** label placement (take the sector's central angle, use outerRatio for radius) */
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

/* every sector as a button (focusable and keyboard accessible) */
.sector {
  position: absolute;
  inset: 0;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  /* let the button itself not cover the background */
  outline: none;
}

/* highlight layer (only shows on hover/focus) */
.highlight {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  transition: opacity .18s ease;
  /* overlay with semi-transparent color */
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

/* outer arc label (optional) */
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

/* pointer */
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
