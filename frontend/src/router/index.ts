import { createRouter, createWebHistory } from 'vue-router'
import Discover from '../pages/Discover.vue'
import Profile from '../pages/Profile.vue'
import Tab from '../pages/Tab.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'discover',
      component: Discover
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile
    },
    {
      path: '/tab/:id',
      name: 'tab',
      component: Tab
    },
    {
      path: '/card',
      name: 'card',
      component: () => import('../pages/Card.vue')
    }
  ]
})

export default router
