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

// checker if it's archive mode
const isArchive = import.meta.env.VITE_ARCHIVE === '1'

const history = isArchive
  ? createWebHashHistory()                // archive uses hash mode to avoid 404
  : createWebHistory(import.meta.env.BASE_URL) // main site uses history mode

export default createRouter({
  history,
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
