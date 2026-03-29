<script setup lang="ts">
import { ArrowLeft, MapPin } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import TabStatusPill from './TabStatusPill.vue'
import MerchantLogo from './MerchantLogo.vue'
import type { Tab } from '../stores/tabs'

defineProps<{
  tab: {
    merchantName: string
    merchantLogo: string
    coverImage: string
    address?: string
  }
  healthStatus?: Tab['healthStatus']
}>()

const router = useRouter()
</script>

<template>
  <div class="tab-header">
    <div class="tab-cover">
      <img :src="tab.coverImage" alt="" class="cover-image" />
      <div class="cover-overlay" />
      <div class="cover-inner">
        <button @click="router.back()" class="back-btn" aria-label="Go back">
          <ArrowLeft class="icon" />
        </button>
      </div>
    </div>

    <div class="merchant-header-bar">
      <div class="merchant-header-content">
        <MerchantLogo :src="tab.merchantLogo" :alt="tab.merchantName" size="lg" class="header-logo" />
        
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
  </div>
</template>

<style scoped lang="scss">
.tab-cover {
  position: relative;
  height: 9rem;
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
    background: linear-gradient(to top, rgba(27, 43, 76, 0.9), rgba(27, 43, 76, 0.4) 50%, transparent);
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
    top: 1rem;
    left: 1rem;
    padding: 0.5rem;
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.3);
    color: white;
    border: none;
    transition: background-color 0.2s;

    &:hover { background: rgba(0, 0, 0, 0.5); }
    .icon { width: 1.25rem; height: 1.25rem; }
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

.header-logo {
  margin-top: -2.25rem;
  margin-bottom: 0.75rem;
  position: relative;
  z-index: 10;
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
  font-size: 0.875rem;
  color: var(--muted-foreground);
  font-weight: 500;
  width: 100%;
  
  .location-icon {
    width: 1rem;
    height: 1rem;
    opacity: 0.7;
  }
}
</style>
