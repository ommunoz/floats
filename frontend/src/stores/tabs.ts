import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchTab } from '../services/tabs'

export interface Tab {
  id: string
  merchantId: string
  merchantName: string
  merchantLogo: string
  address: string
  coverImage: string
  healthStatus?: 'open' | 'low' | 'empty'
  floatsAvailable?: number
  floatValue: number
  floatsGrabbed?: number
  claimerAddresses?: string[]
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<Tab[]>([])
  const balancesLoaded = ref(false)
  const isInitialized = ref(false)
  const discoverView = ref<'feed' | 'map'>('feed')

  async function loadTabsData() {
    try {
      const data = await import('../data/tabs.json')
      tabs.value = data.default || data
      isInitialized.value = true
      await refreshBalances()
    } catch (e) {
      console.warn("Could not load tabs.json fallback.", e)
    }
  }

  loadTabsData()

  async function refreshBalances() {
    await Promise.all(
      tabs.value.map(async (tab) => {
        try {
          const tabData = await fetchTab(tab.id)
          if (!tabData) return
          
          tab.floatsAvailable = tabData.floatsAvailable
          tab.healthStatus = tabData.healthStatus
          tab.floatsGrabbed = tabData.struct.redemptionCount
          
          // Get unique claimers for the avatar stack
          tab.claimerAddresses = [...new Set(
            tabData.struct.history
              .filter(e => e.type === 'consume')
              .map(e => e.userAddress)
          )].slice(0, 8) // Limit to a reasonable number for the stack
        } catch {
          // Tab not yet on-chain or network unavailable — keep mock data
        }
      })
    )
    balancesLoaded.value = true
  }

  return { tabs, balancesLoaded, isInitialized, discoverView, refreshBalances }
})
