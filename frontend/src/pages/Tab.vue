<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabsStore } from '../stores/tabs'
import { fetchTab, type HistoryEvent, type FunderStats } from '../services/tabs'
import type { Tab } from '../stores/tabs'
import TabStatusPill from '../components/TabStatusPill.vue'
import PoolHero from '../components/PoolHero.vue'
import TabLeaderboard from '../components/TabLeaderboard.vue'
import TabHistory from '../components/TabHistory.vue'
import FundSheet from '../components/FundSheet.vue'
import { 
  ArrowLeft, 
  MapPin
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

const tabId = route.params.id as string
const tab = computed(() => tabsStore.tabs.find(t => t.id === tabId))

const history = ref<HistoryEvent[]>([])
const leaderboard = ref<Record<string, FunderStats>>({})
// Health tracking
const healthStatus = ref<Tab['healthStatus'] | null>(null)
const floatsAvailable = ref(0)
const isLoading = ref(true)
const isFirstLoad = ref(true)
const canClaim = computed(() => floatsAvailable.value > 0)

const showFundSheet = ref(false)
const needsRefresh = ref(false)

onMounted(async () => {
  // Fire off the cadence struct fetch instantly regardless of whether the local JSON dictionary is fully populated yet
  try {
    const tabData = await fetchTab(tabId)
    if (tabData) {
      healthStatus.value = tabData.healthStatus
      floatsAvailable.value = tabData.floatsAvailable
      history.value = tabData.struct.history
      leaderboard.value = tabData.struct.funders
    }
  } catch (e) {
    console.error('Failed to load full Tab object via Master Script:', e)
  } finally {
    isLoading.value = false
    isFirstLoad.value = false
  }
})

const handleFundSuccess = () => {
  needsRefresh.value = true
}

const handleCloseSheet = async () => {
  showFundSheet.value = false
  
  if (needsRefresh.value) {
    needsRefresh.value = false
    isLoading.value = true
    
    // Refresh the tab data natively; the block is already sealed by the sheet delay.
    try {
      const tabData = await fetchTab(tabId)
      if (tabData) {
        healthStatus.value = tabData.healthStatus
        floatsAvailable.value = tabData.floatsAvailable
        history.value = tabData.struct.history
        leaderboard.value = tabData.struct.funders
      }
    } catch (e) {
      console.error('Refresh via Master Script failed:', e)
    } finally {
      isLoading.value = false
    }
  }
}
</script>

<template>
  <div v-if="tab" class="tab-page">
    <!-- Full Width Cover Section -->
    <div class="tab-cover">
      <img :src="tab.coverImage" alt="" class="cover-image" />
      <div class="cover-overlay" />
      
      <!-- Center aligned constraint wrapper for Back Button -->
      <div class="cover-inner">
        <button @click="router.back()" class="back-btn" aria-label="Go back">
          <ArrowLeft class="icon" />
        </button>
      </div>
    </div>

    <!-- Merchant Header Bar (Cohesive with TabCard) -->
    <div class="merchant-header-bar">
      <div class="merchant-header-content">
        <div class="logo-wrapper">
          <img :src="tab.merchantLogo" alt="" class="merchant-logo" />
        </div>
        
        <div class="merchant-info-column">
          <div class="merchant-title-row">
            <h1 class="merchant-name">{{ tab.merchantName }}</h1>
            <TabStatusPill v-if="healthStatus" :status="healthStatus" />
          </div>
          
          <div class="location-row" v-if="tab.address">
            <MapPin class="location-icon" />
            <span class="address">{{ tab.address }}</span>
          </div>
        </div>
      </div>
    </div>

    <main class="tab-content" :class="{ 'is-loading': isLoading }">
      <!-- Pool hero -->
      <PoolHero 
        v-if="!isFirstLoad"
        :tab="tab" 
        :floatsAvailable="floatsAvailable" 
        :healthStatus="healthStatus || 'empty'" 
        :is-loading="isLoading"
      />

      <!-- Community Panels -->
      <TabLeaderboard :leaderboard="leaderboard" />
      <TabHistory :history="history" />
    </main>

    <!-- Sticky footer -->
    <footer class="persistent-footer">
      <div class="footer-actions">
        <button
          class="btn btn-claim"
          :disabled="!canClaim"
        >
          Claim a Float
        </button>
        <button class="btn btn-fund" @click="showFundSheet = true">
          Add to this Tab
        </button>
      </div>
    </footer>

    <!-- Sheets -->
    <FundSheet 
      v-if="showFundSheet && tab" 
      :tab="tab"
      @close="handleCloseSheet"
      @funded="handleFundSuccess"
    />
  </div>
  
  <div v-else-if="tabsStore.isInitialized" class="not-found">
    <p>Tab not found</p>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.tab-page {
  min-height: 100vh;
  background-color: var(--background);
  padding-bottom: 6rem; // pb-24 = 6rem
}

.tab-cover {
  position: relative;
  height: 9rem; // Reduced from 13rem to take less screen space (was h-52, now h-36)
  overflow: hidden;

  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-overlay {
    position: absolute;
    inset: 0;
    // bg-gradient-to-t from-secondary/90 via-secondary/40 to-transparent
    background: linear-gradient(to top, rgba(27, 43, 76, 0.9), rgba(27, 43, 76, 0.4) 50%, transparent); // Approximating navy --secondary
  }

  .cover-inner {
    position: absolute;
    inset: 0;
    max-width: 28rem;
    margin: 0 auto;
    width: 100%;
  }

  .back-btn {
    position: absolute;
    top: 1rem; // top-4
    left: 1rem; // left-4
    padding: 0.5rem; // p-2
    border-radius: 9999px; // rounded-full
    background: rgba(0, 0, 0, 0.3); // bg-black/30
    color: white;
    border: none;
    transition: background-color 0.2s; // transition

    &:hover { background: rgba(0, 0, 0, 0.5); } // hover:bg-black/50
    .icon { width: 1.25rem; height: 1.25rem; } // h-5 w-5
  }
}

.merchant-header-bar {
  background: white;
  border-bottom: 1px solid var(--border);
}

.merchant-header-content {
  max-width: 28rem;
  margin: 0 auto;
  padding: 0 1rem 1.25rem 1rem;
  position: relative;
}

.logo-wrapper {
  margin-top: -2.25rem; 
  margin-bottom: 0.75rem;
  width: 4.5rem; 
  height: 4.5rem; 
  border-radius: 50%;
  background: white;
  padding: 0.25rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08); // matches TabCard shadow
  position: relative;
  z-index: 10;
}

.merchant-logo {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.merchant-info-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.merchant-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.merchant-name {
  font-size: 1.5rem; 
  font-weight: 700; 
  color: var(--floats-navy);
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem; // text-sm
  color: var(--muted-foreground);
  font-weight: 500;
  width: 100%; // Ensure it breaks below the title row
  
  .location-icon {
    width: 1rem;
    height: 1rem;
    opacity: 0.7;
  }
}

.tab-content {
  padding: 1.25rem 1rem; // px-4 py-5
  max-width: 28rem; // max-w-md
  margin: 0 auto; // mx-auto
  display: flex;
  flex-direction: column;
  gap: 1.5rem; // space-y-6
  transition: opacity 0.3s ease;
  
  &.is-loading {
    opacity: 0.5;
    pointer-events: none;
  }
}

// Styles moved to sub-components


.persistent-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0; // inset-x-0
  background: rgba(255, 255, 255, 0.8); // bg-card/80
  backdrop-filter: blur(8px); // backdrop-blur
  border-top: 1px solid var(--border); // border-t border-border
  padding: 1rem; // p-4
  z-index: 20; // z-20

  .footer-actions {
    display: flex;
    gap: 0.75rem; // gap-3
    max-width: 28rem; // max-w-md
    margin: 0 auto; // mx-auto

    .btn {
      flex: 1; // flex-1
      height: 3rem; // h-12
      border-radius: 0.375rem; // rounded-md from shadcn button
      font-weight: 600; // font-semibold
      font-size: 0.875rem; // text-sm
      color: white;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.btn-claim {
        background: var(--floats-teal); // bg-primary
        &:not(:disabled):hover { background: rgba(20, 184, 166, 0.9); } // hover:bg-primary/90
      }

      &.btn-fund {
        background: var(--floats-orange); // bg-accent
        &:not(:disabled):hover { background: rgba(249, 115, 22, 0.9); } // hover:bg-accent/90
      }
    }
  }
}

.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-foreground);
}
</style>
