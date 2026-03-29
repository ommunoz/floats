<script setup lang="ts">
import { ref } from 'vue'
import { Share2, Check, Settings } from 'lucide-vue-next'

const props = defineProps<{
  merchantName: string
  merchantLogo: string
  tabId: string
}>()

const emit = defineEmits<{
  (e: 'openSettings'): void
}>()

const isCopied = ref(false)

const handleShare = async () => {
  const url = `${window.location.origin}/tab/${props.tabId}`
  
  try {
    await navigator.clipboard.writeText(url)
    isCopied.value = true
    setTimeout(() => { isCopied.value = false }, 2000)
  } catch (err) {
    console.error('Clipboard failed:', err)
  }
}
</script>

<template>
  <header class="dashboard-header">
    <div class="header-container">
      <div class="merchant-identity">
        <img :src="merchantLogo" :alt="merchantName" class="merchant-logo" />
        <div class="merchant-titles">
          <div class="title-row">
            <h1 class="merchant-name">{{ merchantName }}</h1>
            <div class="live-badge">
              <span class="pulse-dot"></span>
              Live Sync
            </div>
          </div>
          <p class="dashboard-label">Merchant Dashboard</p>
        </div>
      </div>
      
      <div class="header-actions">
        <button class="icon-btn" title="Settings" @click="emit('openSettings')">
          <Settings :size="18" />
        </button>

        <button class="share-btn" @click="handleShare" :class="{ 'is-copied': isCopied }">
          <Check v-if="isCopied" :size="14" />
          <Share2 v-else :size="14" />
          {{ isCopied ? 'Copied!' : 'Share Tab' }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.dashboard-header {
  background: var(--card);
  border-bottom: 1px solid var(--border);
  padding: 1rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-container {
  max-width: 72rem;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.merchant-identity {
  display: flex;
  align-items: center;
  gap: 1rem;

  .merchant-logo {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    background: var(--muted);
    object-fit: cover;
  }

  .merchant-titles {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .merchant-name {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--foreground);
    margin: 0;
    line-height: 1.2;
  }

  .dashboard-label {
    font-size: 0.75rem;
    color: var(--muted-foreground);
    margin: 0;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (min-width: 640px) {
    gap: 1.25rem;
  }
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  .pulse-dot {
    width: 0.35rem;
    height: 0.35rem;
    border-radius: 50%;
    background-color: #10b981;
    animation: pulse 1.5s infinite;
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--muted);
    color: var(--foreground);
    border-color: var(--muted-foreground);
  }
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--floats-navy);
  border: 1px solid var(--floats-navy);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &.is-copied {
    background: var(--floats-teal);
    border-color: var(--floats-teal);
  }
}
</style>
