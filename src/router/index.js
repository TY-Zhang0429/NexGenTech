import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import Blank1View from '@/views/Blank1View.vue'
import Blank2View from '@/views/Blank2View.vue'
import Blank3View from '@/views/Blank3View.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView  },
  { path: '/blank1', name: 'blank1', component: Blank1View  },
  { path: '/blank2', name: 'blank2', component: Blank2View  },
  { path: '/blank3', name: 'blank3', component: Blank3View },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
