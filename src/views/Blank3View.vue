<template>
  <section class="swaps-page" @keyup.esc="closeModal" tabindex="0">
    <header class="page-header">
      <h1>Healthy Swaps</h1>
      <p class="subtitle">Tap a food and discover smarter swaps</p>
    </header>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading healthy swaps...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchSwaps" class="retry-btn">Try Again</button>
    </div>

    <!-- Main content -->
    <div v-else class="card-grid">
      <div
        v-for="(food, idx) in foods"
        :key="food.from_code"
        class="swap-card"
        @click="openModal(food)"
        @keyup.enter="openModal(food)"
        tabindex="0"
        role="button"
        :aria-label="'Open swaps for ' + food.from_food"
      >
        <div class="image-wrap">
          <img 
            :src="`/food_icons/${food.from_food}.png`" 
            :alt="food.from_food"
            class="food-image"
            @error="handleImageError"
          />
          <div class="overlay">
            <button class="swap-btn" @click.stop="openModal(food)">
              <span class="icon">⟲</span>
              <span>Click to Swap</span>
            </button>
          </div>
        </div>
        <h3 class="card-title">{{ food.from_food }}</h3>
      </div>
    </div>

    <!-- Modal: alternatives carousel -->
    <div v-if="isModalOpen" class="modal" @click.self="closeModal" role="dialog" aria-modal="true">
      <div class="modal-content" ref="modalRef" @touchstart="onTouchStart" @touchend="onTouchEnd">
        <button class="close" @click="closeModal" aria-label="Close">✕</button>
        <h2 class="modal-title">{{ activeFood?.from_food }} — Healthier Options</h2>

        <div class="alt-viewport">
          <transition name="slide-fade" mode="out-in">
            <div class="alt-card" :key="currentAltIndex">
              <img 
                :src="`/food_icons/${currentAlt.to_food}.png`" 
                :alt="currentAlt.to_food"
                class="alt-image"
                @error="handleImageError"
              />
            </div>
          </transition>
        </div>

        <p class="fun-fact">{{ currentAlt.rationale_short }}</p>

        <div class="controls">
          <button class="nav-btn" @click="prevAlt" aria-label="Previous">‹ Scroll Left</button>
          <button class="nav-btn" @click="nextAlt" aria-label="Next">Scroll Right ›</button>
        </div>
      </div>
    </div>
  </section>
  
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const foods = ref([])
const loading = ref(true)
const error = ref(null)
const isModalOpen = ref(false)
const activeFood = ref(null)
const currentAltIndex = ref(0)
const touchStartX = ref(0)
const modalRef = ref(null)

const currentAlt = computed(() => {
  if (!activeFood.value || !activeFood.value.swaps) return { to_food: '', rationale_short: '' }
  return activeFood.value.swaps[currentAltIndex.value]
})

async function fetchSwaps() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('https://nexgentech-api.onrender.com/api/swaps/grouped-sql')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    foods.value = data
  } catch (err) {
    console.error('Failed to fetch swaps:', err)
    error.value = 'Failed to load healthy swaps. Please try again.'
  } finally {
    loading.value = false
  }
}

function handleImageError(event) {
  // Replace broken image with a placeholder
  event.target.style.display = 'none'
  const placeholder = document.createElement('div')
  placeholder.className = 'image-placeholder'
  placeholder.innerHTML = `
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="100" height="100" rx="16" fill="#E8D8C3"/>
      <text x="60" y="70" text-anchor="middle" fill="#294B0A" style="font-size:12px">Image</text>
    </svg>
  `
  event.target.parentNode.appendChild(placeholder)
}

function openModal(food){
  activeFood.value = food
  currentAltIndex.value = 0
  isModalOpen.value = true
  // focus for accessibility
  requestAnimationFrame(() => modalRef.value?.focus?.())
}

function closeModal(){
  isModalOpen.value = false
  activeFood.value = null
}

function prevAlt(){
  if (!activeFood.value || !activeFood.value.swaps) return
  const total = activeFood.value.swaps.length
  currentAltIndex.value = (currentAltIndex.value - 1 + total) % total
}

function nextAlt(){
  if (!activeFood.value || !activeFood.value.swaps) return
  const total = activeFood.value.swaps.length
  currentAltIndex.value = (currentAltIndex.value + 1) % total
}

function onTouchStart(e){
  touchStartX.value = e.changedTouches[0].clientX
}

function onTouchEnd(e){
  const dx = e.changedTouches[0].clientX - touchStartX.value
  if (Math.abs(dx) < 40) return
  if (dx > 0) prevAlt(); else nextAlt()
}

function onKeyDown(e){
  if (!isModalOpen.value) return
  if (e.key === 'ArrowLeft') prevAlt()
  if (e.key === 'ArrowRight') nextAlt()
}

onMounted(() => {
  fetchSwaps()
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
</script>

<style scoped>
.swaps-page{
  max-width: 1000px;
  margin: 0 auto;
  padding: 16px;
  font-family: 'Joti One', cursive;
}

.page-header{
  text-align: center;
  margin: 16px 0 8px;
}

.page-header h1{
  color:#294B0A;
  font-size: 1.8rem;
}

.subtitle{ color: rgba(41,75,10,0.7); }

.loading, .error{
  text-align: center;
  padding: 40px 20px;
  color: #294B0A;
}

.loading-spinner{
  width: 40px;
  height: 40px;
  border: 4px solid #E8D8C3;
  border-top: 4px solid #A3B394;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin{
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn{
  background: #A3B394;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;
  transition: background .2s ease;
}

.retry-btn:hover{
  background: #8BA385;
}

.card-grid{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

@media (max-width: 900px){
  .card-grid{ grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px){
  .card-grid{ grid-template-columns: 1fr; }
}

.swap-card{
  background: #FFFFFF;
  border: 2px solid #E8D8C3;
  border-radius: 16px;
  padding: 12px;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}
.swap-card:hover{ transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.10); background: rgba(255,255,255,0.92); }
.swap-card:focus{ outline: 3px solid #A3B394; }

.image-wrap{ position: relative; border-radius: 12px; overflow: hidden; background: #F8F8F6; }
.food-image{ width: 100%; height: 160px; object-fit: contain; display: block; transform: translateZ(0); transition: transform .3s ease; }
.swap-card:hover .food-image{ transform: scale(1.05); }
.image-placeholder{ width: 100%; height: 160px; display: flex; align-items: center; justify-content: center; }

.overlay{
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0); transition: background .25s ease;
}
.swap-card:hover .overlay{ background: rgba(255,255,255,0.35); }

.swap-btn{
  display: inline-flex; align-items: center; gap: 8px;
  background: #FFFFFF; color: #294B0A; border: 2px solid #A3B394; border-radius: 999px;
  padding: 10px 14px; font-size: .95rem; font-weight: 600;
  box-shadow: 0 4px 10px rgba(163,179,148,0.35);
  transition: transform .2s ease, box-shadow .2s ease;
}
.swap-btn:hover{ transform: translateY(-1px) scale(1.02); box-shadow: 0 8px 18px rgba(163,179,148,0.45); }
.swap-btn .icon{ font-size: 18px; }

.card-title{ text-align: center; margin: 10px 0 2px; color:#294B0A; font-size: 1rem; }

/* Modal */
.modal{ position: fixed; inset:0; background: rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; padding:14px; z-index:1000; }
.modal-content{ background:#FFFFFF; width:min(640px, 100%); border-radius:16px; border:2px solid #E8D8C3; padding:14px 14px 18px; position:relative; box-shadow:0 12px 30px rgba(0,0,0,0.25); outline:none; }
.close{ position:absolute; top:8px; right:8px; border:none; background:#F8F8F6; border-radius:10px; padding:6px 10px; cursor:pointer; }
.modal-title{ text-align:center; color:#294B0A; margin:8px 0 12px; }

.alt-viewport{ background:#F8F8F6; border:1px solid #E8D8C3; border-radius:14px; padding:8px; display:flex; align-items:center; justify-content:center; min-height:200px; }
.alt-card{ width:100%; display:flex; align-items:center; justify-content:center; }
.alt-image{ width:100%; max-width:420px; height:220px; object-fit: contain; }

.fun-fact{ margin:10px auto; text-align:center; color:#294B0A; background:#E8D8C3; padding:8px 10px; border-radius:10px; max-width:90%; }

.controls{ display:flex; justify-content:space-between; gap:8px; margin-top:8px; }
.nav-btn{ flex:1; background:#A3B394; color:white; border:none; padding:12px; border-radius:12px; cursor:pointer; transition:filter .2s ease, transform .2s ease; }
.nav-btn:hover{ filter:brightness(1.05); transform: translateY(-1px); }

/* Transitions */
.slide-fade-enter-active, .slide-fade-leave-active { transition: all .25s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateX(8px); }
.slide-fade-leave-to { opacity: 0; transform: translateX(-8px); }
</style>
