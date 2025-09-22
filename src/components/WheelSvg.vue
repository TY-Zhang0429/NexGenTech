<template>
  <div class="wheel-svg-wrap">
    <svg class="wheel" viewBox="-55 -55 110 110" role="application" aria-label="Food Kingdom wheel">
      <!-- wheel rotate -->
      <g
        class="disc"
        :transform="`rotate(${initialOffset + rotateDeg})`"
        :style="{ transition: spinning ? `transform ${spinMs}ms cubic-bezier(.2,.75,.25,1)` : 'none' }"
      >
        <!-- outer and inner rims -->
        <circle r="52" class="rim-outer" />
        <circle r="48" class="rim-inner" />

        <!-- text arc paths (invisible; placed in the rotating group to follow the wheel) -->
        <g class="label-arcs" aria-hidden="true">
          <path
            v-for="(_, i) in sectorCount"
            :key="`arc-${i}`"
            :id="`label-arc-${i}`"
            :d="labelArcPath(i)"
            fill="none" stroke="none" pointer-events="none"
          />
        </g>

        <!-- sectors (donut wedges) -->
        <g class="sectors">
          <path
            v-for="(_, i) in sectorCount"
            :key="`slice-${i}`"
            :d="sectorPath(i)"
            class="sector"
            :class="{ 'is-hover': hoverIndex === i }"
            :style="sectorFillStyle(i)"
            tabindex="0"
            role="button"
            :aria-label="titles[i] || `Sector ${i+1}`"
            @mouseenter="hoverIndex = i"
            @mouseleave="hoverIndex = -1"
            @click="gotoByIndex(i, { from: 'click' })"
            @keydown.enter.prevent="gotoByIndex(i, { from: 'kbd' })"
            @keydown.space.prevent="gotoByIndex(i, { from: 'kbd' })"
          />
        </g>

        <!-- sector labels (along the arc) -->
        <g class="labels">
          <text
            v-for="(_, i) in sectorCount"
            :key="`label-${i}`"
            class="sector-label"
            text-anchor="middle"
            style="font-family: 'Merriweather', serif;"
          >
            <textPath :href="`#label-arc-${i}`" startOffset="50%">
              {{ titles[i] || `Game ${i+1}` }}
            </textPath>
          </text>
        </g>

        <!-- center button (random spin) -->
        <g class="center">
          <!-- pulse ring -->
          <circle r="16" class="pulse-ring" />
          <circle r="16" class="center-bg" />
          <foreignObject x="-16" y="-16" width="32" height="32">
            <button class="spin-btn" :disabled="spinning || !enableSpin" @click="onSpin" style="font-family: 'Merriweather', serif;">
              SPIN<br/>NOW
            </button>
          </foreignObject>
        </g>
      </g>

      <!-- pointer (fixed at the top, slightly swaying) -->
      <g class="pointer" aria-hidden="true">
        <polygon points="0,-41 -3,-49 3,-49" />
        <circle r="3.2" cy="-49" />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, defineExpose } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  titles: { type: Array, default: () => [] },
  routes: { type: Array, default: () => [] },      // when clicking a sector, it will jump
  colors: { type: Array, default: () => [] },
  startAtTop: { type: Boolean, default: true },
  enableSpin: { type: Boolean, default: true },
  innerRatio: { type: Number, default: 0.40 },     // donut inner radius (0~1)
  outerRatio: { type: Number, default: 0.92 },     // donut outer radius (0~1)
  spinMs: { type: Number, default: 2000 },
  labelSize: { type: Number, default: 6 }          // text size (px)
})
const emit = defineEmits(['spun', 'sector-click'])

const router = useRouter()

const spinning = ref(false)
const rotateDeg = ref(0)
let spinTimer = null

const hoverIndex = ref(-1)

const sectorCount = computed(() => props.routes.length || props.titles.length || 8)

/* palette per design; first two are Wordle/Match3 */
const defaultPalette = ['#045c5c', '#556b2f', '#64B5F6', '#F06292', '#FFD54F', '#4DB6AC', '#BA68C8', '#E57373']
const palette = computed(() => (props.colors.length ? props.colors : defaultPalette))

const initialOffset = computed(() => (props.startAtTop ? -90 : 0))

function onSpin() {
  if (!props.enableSpin || spinning.value) return
  spinning.value = true
  const baseTurns = 360 * 4
  const randomTail = Math.floor(Math.random() * 360)
  rotateDeg.value = (rotateDeg.value + baseTurns + randomTail) % 360
  spinTimer = setTimeout(() => {
    spinning.value = false
    const idx = angleToIndex(0)           // pointer is at the top
    gotoByIndex(idx, { from: 'spin' })    // only emit, do not jump
  }, props.spinMs)
}

function angleToIndex(angleDeg) {
  const effective = (angleDeg - (rotateDeg.value % 360) + 360) % 360
  const size = 360 / sectorCount.value
  return Math.floor(effective / size)
}

/** click/kbd: jump immediately; Spin: do not jump, just notify parent component */
function gotoByIndex(index, meta = {}) {
  const title = props.titles?.[index]
  const route = props.routes?.[index]
  emit('sector-click', { index, title, route, ...meta })
  if (title) emit('spun', title)

  if ((meta.from === 'click' || meta.from === 'kbd') && route) {
    router.push(route)
  }
}

/* ===== sector path ===== */
function sectorPath(i) {
  const count = sectorCount.value
  const size = 360 / count
  const start = i * size
  const end = start + size
  const rIn = 50 * props.innerRatio
  const rOut = 50 * props.outerRatio
  return donutSlicePath(start, end, rIn, rOut)
}
function donutSlicePath(startDeg, endDeg, rIn, rOut) {
  const large = endDeg - startDeg > 180 ? 1 : 0
  const p = (r, a) => {
    const rad = (a * Math.PI) / 180
    return { x: Math.cos(rad) * r, y: Math.sin(rad) * r }
  }
  const a0 = startDeg, a1 = endDeg
  const o0 = p(rOut, a0), o1 = p(rOut, a1)
  const i1 = p(rIn, a1), i0 = p(rIn, a0)
  return [
    `M ${o0.x} ${o0.y}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${o1.x} ${o1.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${i0.x} ${i0.y}`,
    'Z'
  ].join(' ')
}

/* ===== label arc path ===== */
function labelArcPath(i) {
  const n = sectorCount.value
  const size = 360 / n
  const start = i * size
  const end = (i + 1) * size
  const mid = start + size / 2

  const ANG_PAD = Math.min(10, size / 2 - 1) // left and right padding (degrees)
  const RAD_MARGIN = 6                       // inward offset from outer circle (SVG coordinates)

  const aStartBase = start + ANG_PAD
  const aEndBase   = end   - ANG_PAD
  const rText = 50 * props.outerRatio - RAD_MARGIN

  const screenMid = (mid + initialOffset.value + (rotateDeg.value % 360) + 360) % 360
  const isBottom = screenMid > 90 && screenMid < 270

  let a1, a2, sweep
  if (!isBottom) { a1 = aStartBase; a2 = aEndBase; sweep = 1 }  // upper half: clockwise
  else           { a1 = aEndBase;   a2 = aStartBase; sweep = 0 } // lower half: counterclockwise

  const toPt = (r, a) => {
    const rad = (a * Math.PI) / 180
    return { x: Math.cos(rad) * r, y: Math.sin(rad) * r }
  }
  const p1 = toPt(rText, a1)
  const p2 = toPt(rText, a2)

  return `M ${p1.x} ${p1.y} A ${rText} ${rText} 0 0 ${sweep} ${p2.x} ${p2.y}`
}

/* ===== style calculation ===== */
function sectorFillStyle(i) {
  const base = palette.value[i % palette.value.length]
  return {
    fill: base,
    stroke: 'rgba(255,255,255,.35)',
    strokeWidth: 0.4,
    cursor: 'pointer'
  }
}

function reset() {
  if (spinTimer) clearTimeout(spinTimer)
  spinning.value = false
  rotateDeg.value = 0
}
onBeforeUnmount(() => { if (spinTimer) clearTimeout(spinTimer) })
defineExpose({ reset, onSpin })
</script>

<style scoped>

.wheel-svg-wrap { width: clamp(200px, 18vw, 300px); aspect-ratio: 1/1; margin: 30px auto; }

/* wheel zoom */
.wheel { width: 100%; height: 100%; transition: transform .25s ease; will-change: transform; }
.wheel-svg-wrap:hover .wheel { transform: scale(1.03); }

/* decorative rim */
.rim-outer { fill: #e7c399; stroke: #6b3a22; stroke-width: 2; }
.rim-inner { fill: #f8e6cd; stroke: #6b3a22; stroke-width: 1.2; }

/* sector: hover scale + highlight */
.sector {
  transition: transform .18s ease, filter .18s ease;
  transform-box: fill-box;
  transform-origin: center;
  outline: none;
  will-change: transform, filter;
}
.sector.is-hover {
  transform: scale(1.05);
  filter: drop-shadow(0 2px 3px rgba(0,0,0,.28));
}
.sector:focus { filter: drop-shadow(0 0 3px rgba(124,240,255,.6)); }

/* label arc (non-interactive) */
.labels { pointer-events: none; }
.sector-label {
  font-family: 'Joti One', cursive, system-ui;
  font-size: v-bind('labelSize + "px"');
  /* 设计图白字，配轻微暗描边提升对比度 */
  fill: #ffffff;
  paint-order: stroke fill;
  stroke: rgba(0,0,0,.28);
  stroke-width: .6px;
  letter-spacing: .4px;
}

/* center button and pulse ring */
.center-bg { fill: rgba(255,255,255,.88); stroke: rgba(0,0,0,.12); stroke-width: .6; filter: drop-shadow(0 1px 2px rgba(0,0,0,.2)); }
.pulse-ring {
  fill: none;
  stroke: rgba(255,255,255,.65);
  stroke-width: 1.2;
  transform-box: fill-box;
  transform-origin: 50% 50%;
  vector-effect: non-scaling-stroke;
  animation: pulse 2.6s ease-out infinite;
}
@keyframes pulse {
  0%   { transform: scale(1);    opacity: .9; }
  70%  { transform: scale(1.35); opacity: 0; }
  100% { transform: scale(1.35); opacity: 0; }
}

.spin-btn {
  width: 100%; height: 100%; background: transparent; border: none; cursor: pointer;
  font-family: 'Joti One', cursive; font-size: 7px; line-height: 1.05; letter-spacing: .6px;
  color: #0b2a2e; text-align: center; transition: transform .12s ease, opacity .12s ease;
}
.spin-btn:hover:not(:disabled){ transform: scale(1.06); }
.spin-btn:active:not(:disabled){ transform: scale(0.96); }
.spin-btn:disabled{ opacity:.6; cursor:not-allowed; }

/* pointer (arrow down, pivot at small circle center) */
.pointer {
  animation: bob 2.2s ease-in-out infinite;
  transform-origin: 0 -49px;
}
@keyframes bob {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-0.8px); }
}
.pointer polygon { fill: #ff6d6d; stroke: #7a2222; stroke-width: .6; }
.pointer circle  { fill: #fff; stroke: #7a2222; stroke-width: .6; }
</style>
