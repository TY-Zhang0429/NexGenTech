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
  width:440px; height:440px;   /* 比原来更小 */
  margin:0 auto;
}
.wheel{
  position:absolute; inset:0;
  border-radius:50%;
  border:2px solid #111;
  overflow:hidden; background:#fff;
}
.wheel-img{
  position:absolute; inset:0; width:100%; height:100%; object-fit:cover; pointer-events:none;
}

/* 指针压最上层，不旋转 */
.needle{
  position:absolute; top:-6px; left:50%; transform:translateX(-50%);
  width:84px; height:auto; border:2px solid #111; background:#fff;
  z-index:3;
}

/* spin 按钮独立、只在 hover 轮盘时显示 */
.spin-btn{
  position:absolute; left:50%; top:50%; transform:translate(-50%, -50%);
  border:2px solid #111; background:#fff; padding:10px 16px; cursor:pointer;
  z-index:2;
  opacity:0; transition:opacity .2s ease;
}
.wheel-wrap:hover .spin-btn{ opacity:1; }
.spin-btn:disabled{ opacity:.4; cursor:not-allowed; }
</style>
