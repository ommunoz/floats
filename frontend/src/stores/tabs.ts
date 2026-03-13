import { defineStore } from 'pinia'
import { ref } from 'vue'
import tabsData from '../data/tabs.json'
import { fetchTabBalance, fetchRedemptionCount, fetchTabHistory } from '../services/tabs'



export interface Tab {
  id: string
  merchantName: string
  merchantLogo: string
  address: string
  coverImage: string
  healthStatus: 'open' | 'low' | 'empty'
  floatsAvailable: number
  floatValue: number
  floatsGrabbed: number
  claimerAddresses?: string[]
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<Tab[]>(tabsData as Tab[])
  const balancesLoaded = ref(false)
  const discoverView = ref<'feed' | 'map'>('feed')

  async function refreshBalances() {
    await Promise.all(
      tabs.value.map(async (tab) => {
        try {
          const [{ floatsAvailable, healthStatus }, floatsGrabbed, history] = await Promise.all([
            fetchTabBalance(tab.id),
            fetchRedemptionCount(tab.id),
            fetchTabHistory(tab.id)
          ])
          tab.floatsAvailable = floatsAvailable
          tab.healthStatus = healthStatus
          tab.floatsGrabbed = floatsGrabbed
          
          // Get unique claimers for the avatar stack
          tab.claimerAddresses = [...new Set(
            history
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

  refreshBalances()

  return { tabs, balancesLoaded, discoverView, refreshBalances }
})
