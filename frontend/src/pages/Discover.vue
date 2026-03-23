<script setup lang="ts">
import { RouterLink } from 'vue-router'
import TabCard from '../components/TabCard.vue'
import TabMap from '../components/TabMap.vue'
import BaseAvatar from '../components/BaseAvatar.vue'
import { getAvatarUrl } from '../utils/demoIdentities'
import { useTabsStore } from '../stores/tabs'
import { useAuthStore } from '../stores/auth'

const store = useTabsStore()
const auth = useAuthStore()
</script>

<template>
  <div :class="['discover-page', { 'is-map-view': store.discoverView === 'map' }]">
    <!-- Top Navigation Bar natively within Discover -->
    <header class="app-header">
      <div class="header-container">
        
        <!-- Left: Wordmark -->
        <div class="wordmark-container">
          <RouterLink to="/" class="wordmark-link">
            <span class="logo-mark">f</span>
            floats
          </RouterLink>
        </div>

        <!-- Center: Feed/Map Pill -->
        <div class="nav-pill-group">
           <span 
             class="pill-item" 
             :class="{ active: store.discoverView === 'feed' }"
             @click="store.discoverView = 'feed'"
           >Feed</span>
           <span 
             class="pill-item" 
             :class="{ active: store.discoverView === 'map' }"
             @click="store.discoverView = 'map'"
           >Map</span>
        </div>

        <!-- Right: Profile Avatar Link -->
        <div class="avatar-container">
          <RouterLink to="/profile" class="avatar-link">
            <BaseAvatar :src="getAvatarUrl(auth.user?.address || 'user-01')" size="sm" />
          </RouterLink>
        </div>

      </div>
    </header>

    <!-- Main Content Area -->
    <main class="discover-content">
      <!-- Feed View -->
      <div v-if="store.discoverView === 'feed'" class="feed">
        <TabCard
          v-for="tab in store.tabs"
          :key="tab.id"
          :tab="tab"
        />
      </div>

      <!-- Map View -->
      <div v-else class="map-view">
        <TabMap :tabs="store.tabs" />
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.discover-page {
  min-height: 100vh;
  background-color: var(--background);
  
  &.is-map-view {
    height: 100vh;
    overflow: hidden;
  }
}

.feed {
  padding: 1rem;
  max-width: 28rem;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.map-view {
  height: calc(100vh - 3.5rem);
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header Styles ported closely from previous App.vue */
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  border-bottom: 1px solid var(--border);
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
}

.header-container {
  display: flex;
  height: 3.5rem; /* 56px (h-14) */
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  max-width: 28rem; /* 448px (max-w-md) */
  margin: 0 auto;
}

.wordmark-container {
  display: flex;
  align-items: center;
}

.wordmark-link {
  font-size: 1.125rem; /* text-lg */
  font-weight: 700;
  color: var(--floats-navy);
  letter-spacing: 0.025em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.logo-mark {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  background-color: var(--floats-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white; /* white */
  font-size: 0.75rem;
  font-weight: bold;
}

.nav-pill-group {
  display: flex;
  background-color: var(--muted); /* muted/50 */
  border-radius: 9999px;
  padding: 0.125rem; /* p-0.5 */
}

.pill-item {
  padding: 0.375rem 1rem; /* py-1.5 px-4 */
  font-size: 0.75rem; /* text-xs */
  font-weight: 500;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: capitalize;
  color: var(--muted-foreground);

  &:hover {
    color: var(--foreground);
  }

  &.active {
    background-color: var(--card);
    color: var(--foreground);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* shadow-sm */
  }
}

.avatar-container {
  display: flex;
  align-items: center;
}

.avatar-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem; /* w-8 */
  height: 2rem; /* h-8 */
  border-radius: 9999px;
  border: 2px solid var(--border);
  background-color: var(--muted);
  overflow: hidden;
  position: relative;
  text-decoration: none;
}

.avatar-fallback {
  color: var(--muted-foreground);
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
