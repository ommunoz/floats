import { defineStore } from 'pinia'
import { ref } from 'vue'
import tabsData from '../data/tabs.json'
import { fetchTabBalance, fetchRedemptionCount } from '../services/tabs'



export interface Tab {
  id: string
  merchantName: string
  merchantLogo: string
  neighborhood: string
  coverImage: string
  healthStatus: 'open' | 'low' | 'empty'
  floatsAvailable: number
  floatValue: number
  floatsGrabbed: number
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<Tab[]>(tabsData as Tab[])
  const balancesLoaded = ref(false)

  async function refreshBalances() {
    await Promise.all(
      tabs.value.map(async (tab) => {
        try {
          const [{ floatsAvailable, healthStatus }, floatsGrabbed] = await Promise.all([
            fetchTabBalance(tab.id),
            fetchRedemptionCount(tab.id)
          ])
          tab.floatsAvailable = floatsAvailable
          tab.healthStatus = healthStatus
          tab.floatsGrabbed = floatsGrabbed
        } catch {
          // Tab not yet on-chain or network unavailable — keep mock data
        }
      })
    )
    balancesLoaded.value = true
  }

  refreshBalances()

  return { tabs, balancesLoaded, refreshBalances }
})
