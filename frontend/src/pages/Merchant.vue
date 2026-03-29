<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTabsStore } from '../stores/tabs'
import { fetchTab, type HistoryEvent, type FunderStats } from '../services/tabs'
import { getDisplayName } from '../utils/demoIdentities'
import * as fcl from '@onflow/fcl'
import { CONTRACT_ADDRESS } from '../flow/config'

// Modular Components
import MerchantHeader from '../components/merchant/MerchantHeader.vue'
import MerchantStats from '../components/merchant/MerchantStats.vue'
import MerchantPatrons from '../components/merchant/MerchantPatrons.vue'
import MerchantActivity from '../components/merchant/MerchantActivity.vue'
import MerchantSettingsModal from '../components/merchant/MerchantSettingsModal.vue'

const route = useRoute()
const tabsStore = useTabsStore()

const showSettings = ref(false)

// Default to the first tab for the demo if no ID is provided
const tabId = (route.params.id as string) || 'neighborhood-coffee-01'
const tabBase = computed(() => tabsStore.tabs.find(t => t.id === tabId) || (tabsStore.tabs.length > 0 ? tabsStore.tabs[0] : null))

const totalSales = ref(0)
const neighborVisits = ref(0)
const remainingCapacity = ref(0)
const totalBalance = ref(0)
const history = ref<HistoryEvent[]>([])
const leaderboard = ref<Record<string, FunderStats>>({})
const isLoading = ref(true)

const eventSubscriptions: (() => void)[] = []

const loadDashboardData = async () => {
  if (!tabBase.value) return

  try {
    const tabData = await fetchTab(tabBase.value.id)
    if (tabData) {
      totalSales.value = tabData.struct.totalConsumed
      neighborVisits.value = tabData.struct.redemptionCount
      remainingCapacity.value = tabData.floatsAvailable
      totalBalance.value = tabData.availableBalance
      // Only show consumptions for the merchant dashboard, limit to 7
      history.value = tabData.struct.history
        .filter(e => e.type === 'consume')
        .slice(0, 7)
      leaderboard.value = tabData.struct.funders
    }
  } catch (e) {
    console.error('Failed to load Merchant data:', e)
  } finally {
    isLoading.value = false
  }
}

// Watch for tabBase becoming available (e.g. after tabsStore loads tabs.json)
watch(tabBase, (newVal) => {
  if (newVal && isLoading.value) {
    loadDashboardData()
  }
}, { immediate: true })

onMounted(() => {
  if (tabBase.value) {
    loadDashboardData()
  }

  // Real-time FCL Event Sync
  const contractId = CONTRACT_ADDRESS.replace('0x', '')
  const consumedEventName = `A.${contractId}.FloatsTabManager.FloatConsumed`
  const fundedEventName = `A.${contractId}.FloatsTabManager.TabFunded`

  const unsubConsumed = fcl.events(consumedEventName).subscribe(() => {
    loadDashboardData()
  })
  
  const unsubFunded = fcl.events(fundedEventName).subscribe(() => {
    loadDashboardData()
  })

  eventSubscriptions.push(unsubConsumed, unsubFunded)
})

onUnmounted(() => {
  eventSubscriptions.forEach(unsub => unsub())
})

const sortedSponsors = computed(() => {
  return Object.entries(leaderboard.value)
    .map(([address, stats]) => ({
      address,
      name: getDisplayName(address),
      email: `${getDisplayName(address).split(' ')[0].toLowerCase()}@email.com`,
      amount: stats.totalFunded,
      tier: stats.tier
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
})
</script>

<template>
  <div v-if="tabBase" class="merchant-dashboard">
    <MerchantHeader 
      :merchant-name="tabBase.merchantName" 
      :merchant-logo="tabBase.merchantLogo"
      :tab-id="tabBase.id"
      @open-settings="showSettings = true"
    />

    <main class="dashboard-main" :class="{ 'is-loading': isLoading }">
      <MerchantStats 
        :total-sales="totalSales"
        :neighbor-visits="neighborVisits"
        :total-balance="totalBalance"
        :remaining-capacity="remainingCapacity"
      />

      <div class="tables-grid">
        <MerchantPatrons :patrons="sortedSponsors" />
        <MerchantActivity :history="history" />
      </div>
    </main>

    <MerchantSettingsModal
      v-if="showSettings"
      :show="showSettings"
      :merchant-name="tabBase.merchantName"
      :address="tabBase.address"
      :float-value="tabBase.floatValue"
      @close="showSettings = false"
    />
  </div>
</template>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.merchant-dashboard {
  min-height: 100vh;
  background-color: var(--background);
  padding-bottom: 4rem;
}

.dashboard-main {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  transition: opacity 0.3s ease;

  &.is-loading {
    opacity: 0.6;
    pointer-events: none;
  }
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
