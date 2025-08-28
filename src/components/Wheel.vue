<template>
  <div class="wheel-wrap">
    <div class="pointer" aria-hidden="true">▼</div>
    <div
      class="wheel"
      :style="{ transform:`rotate(${angle}deg)` }"
      role="img"
      aria-label="Spin the wheel"
    />
    <div class="actions">
      <button class="btn" @click="spin" aria-label="Spin">Spin</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const angle = ref(0)
const emit = defineEmits(['result'])

function spin(){
  const fullTurns = 360 * 5
  const stop = Math.floor(Math.random() * 3) // 0/1/2
  // 每区 120°，让指针落在区中
  const target = fullTurns + (stop * 120 + 60)
  angle.value = target
  // 和 CSS 过渡时间匹配（1.2s）
  setTimeout(() => emit('result', stop), 1200)
}
</script>

<style scoped>
.wheel-wrap{display:grid;place-items:center;gap:14px}
.pointer{font-size:24px;line-height:1}
.wheel{
  width:280px;height:280px;border-radius:50%;
  background: conic-gradient(#fde68a 0 33.333%, #bbf7d0 0 66.666%, #bfdbfe 0 100%);
  box-shadow: var(--shadow);
  transition: transform 1.2s cubic-bezier(.22,.61,.36,1);
  border: 6px solid #fff;
}
.actions{display:flex;gap:10px}
.btn{background:var(--indigo);color:#fff;border:0;border-radius:var(--radius);padding:10px 16px;font-weight:800}
</style>
