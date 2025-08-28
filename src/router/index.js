import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Swaps from '../pages/Swaps.vue'
import Games from '../pages/Games.vue'
import Avatar from '../pages/Avatar.vue'

const routes = [
  { path: '/', component: Home, name: 'home' },
  { path: '/swaps', component: Swaps, name: 'swaps' },
  { path: '/games', component: Games, name: 'games' },
  { path: '/avatar', component: Avatar, name: 'avatar' },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

