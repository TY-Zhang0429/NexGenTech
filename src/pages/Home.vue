<template>
  <section class="home">
    <h2>Spin to begin</h2>
    <Wheel @result="onResult"/>
    <button class="begin" @click="begin">Begin</button>

    <section id="more-games" class="more">
      <h3>Other games (placeholder)</h3>
      <ul>
        <li>Crossword – coming soon</li>
        <li>Quiz – coming soon</li>
        <li>Bingo – coming soon</li>
      </ul>
    </section>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Wheel from '../components/Wheel.vue'
const router = useRouter()
function onResult(/* seg */){ /* 后续可按分区路由到不同页面 */ }
function begin(){ setTimeout(() => router.push({ name:'Swaps' }), 3000) } // 3 秒进入
</script>

<style scoped>
.home{padding:28px 0}
h2{margin:0 0 10px 0}
.begin{margin-top:12px;background:var(--blue);color:#fff;border:0;border-radius:var(--radius);padding:10px 16px;font-weight:800}
.more{margin-top:54px}
</style>
