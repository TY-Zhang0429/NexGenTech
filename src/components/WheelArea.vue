<template>
  <div class="wheel-wrap">
    <!-- 轮盘本体（只让图转动） -->
    <div class="wheel" :style="wheelStyle">
      <img class="wheel-img" src="@/assets/wheel.png" alt="wheel" />
    </div>

    <!-- 居中的 spin 按钮（不跟着转） -->
    <button
      class="spin-btn"
      :disabled="spinning"
      @click="onSpin"
    >
      spin
    </button>

    <!-- 指针覆盖在最上层 -->
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
.wheel-wrap{
  position:relative;
  width: clamp(260px, 30vw, 420px);
  aspect-ratio: 1/1;
  margin: 0 auto;
  isolation: isolate; /* 保证内部 z-index 正确 */
}

/* 轮盘本体：柔光 + 内阴影 */
.wheel{
  position:absolute; inset:0;
  border-radius:50%;
  background: radial-gradient(120% 120% at 20% 15%, rgba(124,240,255,.1), transparent 60%), #151b2c;
  overflow:hidden;
  box-shadow:
    inset 0 10px 20px rgba(255,255,255,.03),
    inset 0 -10px 20px rgba(0,0,0,.35),
    0 22px 40px rgba(0,0,0,.35);
}
.wheel-img{
  position:absolute; inset:0; width:100%; height:100%; object-fit:cover; pointer-events:none;
  filter: saturate(1.02) contrast(1.02);
}

/* 悬停时出现柔光环 */
.wheel-wrap::after{
  content:""; position:absolute; inset:-6%;
  background: radial-gradient(60% 60% at 50% 40%, rgba(124,240,255,.15), transparent 60%);
  opacity: 0; transition: opacity .25s ease;
  z-index: 1;
}
.wheel-wrap:hover::after{ opacity: 1; }

/* 指针：永远覆盖最上层，不旋转 */
.needle{
  position:absolute; inset: 0;
  margin:auto; width: 16%;
  transform: translateY(-90%);
  z-index: 4; pointer-events:none;
  filter: drop-shadow(0 8px 18px rgba(0,0,0,.4));
}

/* 居中 SPIN 按钮：渐变 + 悬浮 */
.spin-btn{
  position:absolute; inset:0; margin:auto;
  width: 5.2rem; height: 5.2rem; border-radius:999px;
  color:#0b1020; font-weight:800; letter-spacing:.06em;
  background-image: linear-gradient(135deg, var(--brand), var(--brand-2));
  box-shadow: 0 14px 30px rgba(108,180,255,.28);
  border:0; cursor:pointer;
  z-index: 3;
  opacity:0; transform: translateY(2px);
  transition: opacity .25s ease, transform .2s ease, box-shadow .2s ease;
}
.wheel-wrap:hover .spin-btn{ opacity:1; transform: translateY(0); }
.spin-btn:hover{ box-shadow: 0 18px 34px rgba(108,180,255,.36); }
.spin-btn:disabled{ opacity:.55; cursor:not-allowed; }

/* 结果标题（若由此组件渲染） */
.result{
  position:absolute; left:50%; bottom: -2.8rem; transform: translateX(-50%);
  font-weight:700; color: var(--text);
  text-shadow: 0 6px 18px rgba(0,0,0,.35);
}
</style>
