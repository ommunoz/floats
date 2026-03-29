import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDemoUser } from '../utils/demoIdentities'

export interface DemoUser {
  address: string
  name: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<DemoUser | null>(null)
  const isLoaded = ref(false)
  const hasSetupError = ref(false)

  const loadDemoUser = async () => {
    try {
      const demo = getDemoUser()
      if (demo) {
        user.value = demo
      } else {
        console.warn("No user with isDemoUser: true found in users.json")
        hasSetupError.value = true
      }
    } catch (e) {
      console.error("Could not load users:", e)
      hasSetupError.value = true
    } finally {
      isLoaded.value = true
    }
  }

  return {
    user,
    isLoaded,
    hasSetupError,
    loadDemoUser
  }
})
