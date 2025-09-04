import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import WordleGameView from '@/views/WordleGameView.vue'
import FoodSwapView from '@/views/FoodSwapView.vue'
import GamePage from '@/views/GamePage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage  },
  { path: '/game', name: 'game', component: GamePage  },
  { path: '/wordle-game', name: 'wordle-game', component: WordleGameView  },
  { path: '/food-swap', name: 'food-swap', component: FoodSwapView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
