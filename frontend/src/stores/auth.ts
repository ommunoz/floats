import { defineStore } from 'pinia'
import { ref } from 'vue'
import { setUsersData } from '../utils/demoIdentities'

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
      // Import directly for type safety and build reliability
      const data = await import('../data/users.json')
      const users = data.default || data
      
      setUsersData(users)
      
      // Look for the user explicitly tagged by the seeder
      for (const [address, meta] of Object.entries(users)) {
         const m = meta as { name: string, isDemoUser: boolean }
         if (m.isDemoUser) {
           user.value = {
             address,
             name: m.name
           }
           break
         }
      }

      if (!user.value) {
        console.warn("No user with isDemoUser: true found in users.json")
        hasSetupError.value = true
      }
    } catch (e) {
      console.error("Could not load users.json:", e)
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
