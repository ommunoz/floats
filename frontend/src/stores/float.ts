import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTabsStore } from './tabs'
import { useAuthStore } from './auth'
import { fetchFloatReceipt, claimFloat as claimFloatService, discardFloat as discardFloatService } from '../services/float'
import { fetchBlockTimestamp } from '../utils/flow'

export type FloatState = 'IDLE' | 'INSIDE' | 'CLAIMING' | 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'DISCARDED'

export const useFloatStore = defineStore('float', () => {
  const tabsStore = useTabsStore()
  const authStore = useAuthStore()

  const floatState = ref<FloatState>('IDLE')
  const activeTabId = ref<string | null>(null)
  const ttlSeconds = ref(0)
  const isHydrated = ref(false)
  const serverTimeOffset = ref(0) // Difference between block time and local time
  const claimError = ref<string | null>(null)
  const pendingFundAction = ref(false)
  
  let timerInterval: ReturnType<typeof setInterval> | null = null

  const startTimer = (expiresAt: number) => {
    if (timerInterval) clearInterval(timerInterval)
    
    const update = () => {
      // THE SOURCE OF TRUTH: 
      // Current Block Time = Local Time + Server Time Offset
      const nowBlockTime = (Date.now() / 1000) + serverTimeOffset.value
      const remaining = Math.max(0, Math.floor(expiresAt - nowBlockTime))
      
      ttlSeconds.value = remaining
      
      if (remaining <= 0) {
        floatState.value = 'EXPIRED'
        if (timerInterval) clearInterval(timerInterval)
      }
    }
    
    update()
    timerInterval = setInterval(update, 1000)
  }

  const activeTab = computed(() => 
    activeTabId.value ? tabsStore.tabs.find(t => t.id === activeTabId.value) : null
  )

  const claimFloat = async (tabId: string) => {
    if (floatState.value !== 'IDLE' && floatState.value !== 'INSIDE') return
    const tab = tabsStore.tabs.find(t => t.id === tabId)
    if (!tab || tab.floatsAvailable == null || tab.floatsAvailable <= 0) return
    // Capture as non-optional so TS doesn't lose narrowing across await boundaries
    const safeTab = tab
    
    claimError.value = null
    floatState.value = 'CLAIMING'
    
    try {
      if (!authStore.user) throw new Error("No demo user loaded")

      const data = await claimFloatService(tabId, authStore.user.address, safeTab.floatValue)
      console.log(`Backend Claim Proxy returned txId: ${data.txId}`)

      activeTabId.value = tabId
      floatState.value = 'ACTIVE'

      // Read the real expiresAt directly from the sealed FloatReceipt on-chain.
      // We cannot use blockNow + 900 here because the block that sealed the tx
      // is different from the block we query after — that drift would cause the
      // UI timer to be ahead of the actual on-chain expiry, which could be
      // visible to the user or cause a reject at the register.
      const [receipt, blockNow] = await Promise.all([
        fetchFloatReceipt(authStore.user.address),
        fetchBlockTimestamp()
      ])

      if (!receipt) throw new Error('Receipt not found on-chain after claim')

      // Calibrate the local clock once against the sealed block time
      serverTimeOffset.value = blockNow - (Date.now() / 1000)
      startTimer(receipt.expiresAt)

      // Subtract from UI to match
      safeTab.floatsAvailable = safeTab.floatsAvailable! - 1
    } catch (e: any) {
      console.error("Claim failed", e)
      // Strip verbose Cadence stack traces down to the first meaningful line
      const raw: string = e?.message ?? 'Something went wrong. Please try again.'
      const cadenceMatch = raw.match(/error:\s*(.+?)(?:\s*-->|$)/s)
      claimError.value = (cadenceMatch?.[1]?.trim() ?? raw.split('\n')[0]?.trim()) || null
      floatState.value = 'IDLE'
    }
  }

  const discardFloat = async () => {
    if (!activeTab.value || !authStore.user) return
    
    // We notify the backend to physically return the funds on-chain
    try {
      const data = await discardFloatService(activeTab.value.id, authStore.user.address)
      console.log(`Float discarded on-chain. TX: ${data.txId}`)

      // Only on success do we update local UI
      if (activeTab.value && activeTab.value.floatsAvailable != null) {
        activeTab.value.floatsAvailable++
      }
      floatState.value = 'IDLE'
      activeTabId.value = null
      ttlSeconds.value = 0
      if (timerInterval) clearInterval(timerInterval)
    } catch (e) {
      console.error("Discard failed", e)
      throw e
    }
  }

  const setFloatState = (state: FloatState) => {
    floatState.value = state
    if (state === 'IDLE') {
      activeTabId.value = null
      ttlSeconds.value = 0
      if (timerInterval) clearInterval(timerInterval)
    }
  }

  const consumeFloat = () => {
    // This is for the Simulate POS Tap
    floatState.value = 'CONSUMED'
    ttlSeconds.value = 0
    if (timerInterval) clearInterval(timerInterval)
  }

  const triggerFundAction = () => {
    pendingFundAction.value = true
    setFloatState('IDLE') // Close the overlay
  }

  const rehydrateFloat = async (tabId: string) => {
    if (isHydrated.value) return
    if (!authStore.user) return

    try {
      const [data, blockNow] = await Promise.all([
        fetchFloatReceipt(authStore.user.address),
        fetchBlockTimestamp()
      ])

      if (data) {
        // Calibrate clocks: block time - local time
        serverTimeOffset.value = blockNow - (Date.now() / 1000)
        
        activeTabId.value = tabId
        floatState.value = 'ACTIVE'
        startTimer(data.expiresAt)
      }
      isHydrated.value = true
    } catch (e) {
      console.error("Rehydration failed", e)
    }
  }

  return {
    floatState,
    claimError,
    activeTab,
    ttlSeconds,
    pendingFundAction,
    claimFloat,
    discardFloat,
    consumeFloat,
    setFloatState,
    rehydrateFloat,
    triggerFundAction
  }
})
