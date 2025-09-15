import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import WordleGameView from '@/views/WordleGameView.vue'
import FoodSwapView from '@/views/FoodSwapView.vue'
import GamePage from '@/views/GamePage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/game', name: 'game', component: GamePage },
  { path: '/wordle-game', name: 'wordle-game', component: WordleGameView },
  { path: '/food-swap', name: 'food-swap', component: FoodSwapView },
]

// Use hash history for archived versions to avoid 404 on refresh
const isArchive = import.meta.env.VITE_ARCHIVE === '1'
const base = import.meta.env.BASE_URL || '/'

const history = isArchive
  ? createWebHashHistory(base)          // use hash history for archived versions to avoid 404 on refresh
  : createWebHistory(base)

export default createRouter({
  history,
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
