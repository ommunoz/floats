import { createRouter, createWebHistory } from 'vue-router'
import Discover from '../pages/Discover.vue'
import Profile from '../pages/Profile.vue'

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
    }
  ]
})

export default router
