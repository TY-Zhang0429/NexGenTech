import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import WordleGameView from '@/views/WordleGameView.vue'
import FoodSwapView from '@/views/FoodSwapView.vue'
import GamePage from '@/views/GamePage.vue'
import CalculatorView from '@/views/CalculatorView.vue'
import GenerateRecipe from '@/views/GenerateRecipe.vue'
import AvatarView from '@/views/AvatarView.vue'
import SupportView from '@/views/SupportView.vue'
import Match3View from '@/views/Match3View.vue'
import CatcherView from '@/views/CatcherView.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/avatar', name: 'avatar', component: AvatarView },
  { path: '/game', name: 'game', component: GamePage },
  { path: '/calculator', name: 'calculator', component: CalculatorView },
  { path: '/generate-recipe', name: 'generate-recipe', component: GenerateRecipe },
  { path: '/food-swap', name: 'food-swap', component: FoodSwapView },
  { path: '/support', name: 'support', component: SupportView },
  { path: '/wordle-game', name: 'wordle-game', component: WordleGameView },
  { path: '/match3', name: 'match3', component: Match3View },
  { path: '/catcher', name: 'catcher', component: CatcherView },
]

// Use hash history for production to avoid 404 on refresh with static hosting
const isProduction = import.meta.env.PROD
const base = import.meta.env.BASE_URL || '/'

const history = isProduction
  ? createWebHashHistory(base)
  : createWebHistory(base)

export default createRouter({
  history,
  routes,
  scrollBehavior: () => ({ top: 0 }),
})