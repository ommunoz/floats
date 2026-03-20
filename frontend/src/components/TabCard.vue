<template>
  <button class="tab-card" @click="$router.push(`/tab/${tab.id}`)">
    <div class="cover">
      <img :src="tab.coverImage" :alt="tab.merchantName" class="cover-img" />
    </div>

    <div class="card-body">
      <div class="logo-wrapper">
        <img :src="tab.merchantLogo" alt="" class="merchant-logo" />
      </div>

      <div class="merchant-header-row">
        <h3 class="merchant-name">{{ tab.merchantName }}</h3>
        <TabStatusPill v-if="store.balancesLoaded && tab.healthStatus" :status="tab.healthStatus" />
      </div>

      <div class="location-row" v-if="tab.address">
        <MapPin class="location-icon" />
        <span class="merchant-address">{{ tab.address }}</span>
      </div>

      <div class="card-bottom" v-if="store.balancesLoaded && (tab.floatsGrabbed || 0) > 0">
        <AvatarStack :seeds="dynamicSeeds" />
        <span class="floats-count">{{ tab.floatsGrabbed }} {{ tab.floatsGrabbed === 1 ? 'float' : 'floats' }} grabbed</span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AvatarStack from './AvatarStack.vue'
import TabStatusPill from './TabStatusPill.vue'
import { MapPin } from 'lucide-vue-next'
import type { Tab } from '../stores/tabs'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tab: Tab }>()
const store = useTabsStore()

const dynamicSeeds = computed(() => {
  // 1. If we have real on-chain claimers, use those first
  if (props.tab.claimerAddresses && props.tab.claimerAddresses.length > 0) {
    return props.tab.claimerAddresses
  }

  // 2. Fallback to deterministic placeholders based on ID
  const grabs = props.tab.floatsGrabbed || 0
  return Array.from({ length: grabs }).map((_, i) => 
    `${props.tab.id}-${i}`
  )
})
</script>

<style lang="scss" scoped>
.tab-card {
  width: 100%;
  text-align: left;
  border-radius: 1rem;
  overflow: hidden;
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }
}

.cover {
  height: 10rem;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-body {
  padding: 0 1.25rem 1.25rem 1.25rem;
  position: relative;
}

.logo-wrapper {
  margin-top: -2rem;
  margin-bottom: 0.75rem;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: white;
  padding: 0.25rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.merchant-logo {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.merchant-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.merchant-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.merchant-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0;
  line-height: 1.2;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.location-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--muted-foreground);
  opacity: 0.7;
}

.merchant-address {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  font-weight: 500;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.floats-count {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  font-weight: 600;
}
</style>
