import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Swaps from '../pages/Swaps.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: Home },
    { path: '/swaps', name: 'Swaps', component: Swaps }
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  }
})
