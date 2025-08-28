<template>
  <section class="swaps">
    <h2>Healthier Swaps</h2>

    <SwapSearch ref="searchRef" :loading="loading" @search="handleSearch" />

    <Notification ref="toast" />

    <transition name="fade">
      <section v-if="visible" class="results" aria-live="polite">
        <SwapCard
          :data="currentSwap"
          :index="index"
          :total="swaps.length"
          @prev="prev" @next="next"
        >
          <template #actions>
            <button class="btn blue" @click="playAgain">Play Again</button>
          </template>
        </SwapCard>
      </section>
    </transition>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import SwapSearch from '../components/SwapSearch.vue'
import SwapCard from '../components/SwapCard.vue'
import Notification from '../components/Notification.vue'

const loading = ref(false)
const visible = ref(false)
const swaps = ref([])     // 当前搜索的所有结果
const index = ref(0)
const searchRef = ref(null)
const toast = ref(null)

const currentSwap = computed(() => swaps.value[index.value] ?? null)

// 假数据：可以逐步扩充
const DB = {
  chips: [
    {
      original: 'Chips',
      alternative: 'Baked Potato',
      images: {
        original: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600',
        alternative: 'https://images.unsplash.com/photo-1484980972926-edee96e0960d?q=80&w=600'
      }
    },
    {
      original: 'Chips',
      alternative: 'Air-popped Popcorn',
      images: {
        original: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600',
        alternative: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=600'
      }
    }
  ],
  soda: [
    {
      original: 'Sugary Soda',
      alternative: 'Sparkling Water with Fruit',
      images: {
        original: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600',
        alternative: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?q=80&w=600'
      }
    }
  ]
}

async function handleSearch (food) {
  loading.value = true
  // 模拟请求延时
  await new Promise(r => setTimeout(r, 600))
  const key = food.toLowerCase()
  const list = DB[key] || []
  loading.value = false

  if (!list.length) {
    visible.value = false
    toast.value?.show('Sorry, no swaps found for that!', 'error', 4000) // AC 2.1.3
    return
  }

  swaps.value = list
  index.value = 0
  visible.value = true // AC 2.1.2：仅有结果时显示容器
}

function prev () { if (index.value > 0) index.value-- }
function next () {
  if (index.value < swaps.value.length - 1) index.value++
}
function playAgain () {
  visible.value = false
  searchRef.value?.focusInput()
}
</script>

<style scoped>
.swaps{padding:28px 0;max-width:980px;margin:0 auto}
.results{margin-top:16px}
.btn{border:0;border-radius:var(--radius);padding:10px 16px;font-weight:700}
.btn.blue{background:var(--blue);color:#fff}
</style>
