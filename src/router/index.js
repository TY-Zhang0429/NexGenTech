import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import WordleGameView from '@/views/WordleGameView.vue'
import FoodSwapView from '@/views/FoodSwapView.vue'
import GamePage from '@/views/GamePage.vue'
import CalculatorView from '@/views/CalculatorView.vue'
import AvatarView from '@/views/AvatarView.vue'
import SupportView from '@/views/SupportView.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/avatar', name: 'avatar', component: AvatarView },
  { path: '/game', name: 'game', component: GamePage },
  { path: '/calculator', name: 'calculator', component: CalculatorView },
  { path: '/food-swap', name: 'food-swap', component: FoodSwapView },
  { path: '/support', name: 'support', component: SupportView },
  { path: '/wordle-game', name: 'wordle-game', component: WordleGameView },
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
