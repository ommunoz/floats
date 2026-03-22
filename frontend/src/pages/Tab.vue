<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTabsStore } from '../stores/tabs'
import { fetchTab, type HistoryEvent, type FunderStats } from '../services/tabs'
import { useFloatStore } from '../stores/float'
import type { Tab } from '../stores/tabs'

// Modular Components
import PoolHero from '../components/PoolHero.vue'
import TabLeaderboard from '../components/TabLeaderboard.vue'
import TabHistory from '../components/TabHistory.vue'
import FundSheet from '../components/FundSheet.vue'
import GeofenceBanner from '../components/GeofenceBanner.vue'
import DemoGeofenceToggle from '../components/demo-controls/DemoGeofenceToggle.vue'
import TabHeader from '../components/TabHeader.vue'
import GeofenceWarningModal from '../components/GeofenceWarningModal.vue'
import ClaimConfirmModal from '../components/ClaimConfirmModal.vue'

const route = useRoute()
const tabsStore = useTabsStore()
const floatsStore = useFloatStore()

const tabId = route.params.id as string
const tab = computed(() => tabsStore.tabs.find(t => t.id === tabId))

const history = ref<HistoryEvent[]>([])
const leaderboard = ref<Record<string, FunderStats>>({})

const healthStatus = ref<Tab['healthStatus'] | null>(null)
const floatsAvailable = ref(0)
const totalBalance = ref(0)
const isLoading = ref(true)
const isFirstLoad = ref(true)

const isInsideGeofence = ref(false)
const showGeofenceWarning = ref(false)
const showClaimConfirm = ref(false)
const needsRefresh = ref(false)
const showFundSheet = ref(false)

const canClaim = computed(() => {
  return floatsAvailable.value > 0 && 
         floatsStore.floatState === 'IDLE' && 
         healthStatus.value !== 'empty'
})

const handleClaimClick = () => {
  if (!canClaim.value) return
  if (!isInsideGeofence.value) {
    showGeofenceWarning.value = true
    return
  }
  showClaimConfirm.value = true
}

const confirmClaim = async () => {
  if (!tab.value) return
  await floatsStore.claimFloat(tabId)
  if (!floatsStore.claimError) showClaimConfirm.value = false
}

onMounted(async () => {
  // Fire off the cadence struct fetch instantly 
  try {
    const tabData = await fetchTab(tabId)
    if (tabData) {
      healthStatus.value = tabData.healthStatus
      floatsAvailable.value = tabData.floatsAvailable
      totalBalance.value = tabData.availableBalance
      history.value = tabData.struct.history
      leaderboard.value = tabData.struct.funders
    }
    
    // Check if user already has an active float on-chain for this tab
    await floatsStore.rehydrateFloat(tabId)
  } catch (e) {
    console.error('Failed to load full Tab object via Master Script:', e)
  } finally {
    isLoading.value = false
    isFirstLoad.value = false
  }
})

// Shared re-fetch helper used by both the discard watcher and FundSheet close handler
const refreshTabData = async () => {
  isLoading.value = true
  try {
    const tabData = await fetchTab(tabId)
    if (tabData) {
      healthStatus.value = tabData.healthStatus
      floatsAvailable.value = tabData.floatsAvailable
      totalBalance.value = tabData.availableBalance
      history.value = tabData.struct.history
      leaderboard.value = tabData.struct.funders
    }
  } catch (e) {
    console.error('Tab refresh failed:', e)
  } finally {
    isLoading.value = false
  }
}

// Re-fetch the tab whenever a float lifecycle ends (discard, expire, consume).
// The overlay is a Teleport — it can't emit to Tab.vue — so we watch the
// store directly instead of using events.
const ACTIVE_FLOAT_STATES = new Set(['ACTIVE', 'EXPIRED', 'CONSUMED'])
watch(() => floatsStore.floatState, (newState, oldState) => {
  if (newState === 'IDLE' && ACTIVE_FLOAT_STATES.has(oldState)) {
    refreshTabData()
  }
})

// Listen for fund actions triggered from the global overlay
watch(() => floatsStore.pendingFundAction, (val) => {
  if (val) {
    showFundSheet.value = true
    floatsStore.pendingFundAction = false
  }
})

const handleFundSuccess = () => {
  needsRefresh.value = true
}

const handleCloseSheet = async () => {
  showFundSheet.value = false
  if (needsRefresh.value) {
    needsRefresh.value = false
    await refreshTabData()
  }
}
</script>

<template>
  <div v-if="tab" class="tab-page">
    <TabHeader :tab="tab" :healthStatus="healthStatus || undefined" />

    <main class="tab-content" :class="{ 'is-loading': isLoading }">
      <GeofenceBanner v-if="isInsideGeofence" :merchantName="tab.merchantName" />

      <PoolHero 
        v-if="!isFirstLoad"
        :tab="tab" 
        :floatsAvailable="floatsAvailable" 
        :totalBalance="totalBalance"
        :healthStatus="healthStatus || 'empty'" 
        :is-loading="isLoading"
      />

      <TabLeaderboard :leaderboard="leaderboard" />
      <TabHistory :history="history" />
    </main>

    <footer class="persistent-footer">
      <div class="footer-actions">
        <button
          class="btn btn--primary btn--full"
          :disabled="!canClaim || floatsStore.floatState === 'CLAIMING'"
          @click="handleClaimClick"
        >
          <span v-if="floatsStore.floatState === 'CLAIMING'" class="spinner"></span>
          <span v-else>Claim a Float</span>
        </button>
        <button class="btn btn--orange btn--full" @click="showFundSheet = true">
          Add to this Tab
        </button>
      </div>
    </footer>

    <DemoGeofenceToggle v-model="isInsideGeofence" />

    <FundSheet 
      v-if="showFundSheet && tab" 
      :tab="tab"
      @close="handleCloseSheet"
      @funded="handleFundSuccess"
    />

    <GeofenceWarningModal 
      :show="showGeofenceWarning"
      :merchantName="tab.merchantName"
      :address="tab.address"
      @close="showGeofenceWarning = false"
    />

    <ClaimConfirmModal
      :show="showClaimConfirm"
      :floatValue="tab.floatValue"
      :loading="floatsStore.floatState === 'CLAIMING'"
      :error="floatsStore.claimError"
      @close="showClaimConfirm = false"
      @confirm="confirmClaim"
    />
  </div>
  
  <div v-else-if="tabsStore.isInitialized" class="not-found">
    <p>Tab not found</p>
  </div>
</template>

<style scoped lang="scss">
.tab-page {
  min-height: 100vh;
  background-color: var(--background);
  padding-bottom: 6rem;
}

.tab-content {
  padding: 1.25rem 1rem;
  max-width: 28rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem; 
  transition: opacity 0.3s ease;
  
  &.is-loading {
    opacity: 0.5;
    pointer-events: none;
  }
}

.persistent-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border);
  padding: 1rem;
  z-index: 20;

  .footer-actions {
    display: flex;
    gap: 0.75rem;
    max-width: 28rem;
    margin: 0 auto;
  }
}

.spinner {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 9999px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: currentColor;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-foreground);
}
</style>
