import { defineStore } from 'pinia'
import { ref } from 'vue'

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
      // Use runtime fetch instead of dynamic import so Vite's static analyzer
      // doesn't flag it as a missing dependency and crash the dev server overlay.
      const response = await fetch('/src/data/demo_user.json')
      
      if (!response.ok) {
        hasSetupError.value = true
        return
      }

      const data = await response.json()

      if (data && data.address && data.name) {
        user.value = {
          address: data.address,
          name: data.name
        }
      } else {
        hasSetupError.value = true
      }
    } catch (e) {
      console.warn("Could not load demo_user.json. Did you run `npm run seed` in the backend?")
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
