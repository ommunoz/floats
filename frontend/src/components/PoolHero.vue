<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import type { Tab } from '../stores/tabs'

const props = defineProps<{
  tab: Tab
  floatsAvailable: number
  totalBalance: number
  healthStatus: Tab['healthStatus']
  isLoading?: boolean
}>()

const fillTarget = computed(() => {
  if (props.healthStatus === 'open') return 100
  if (props.healthStatus === 'low') return 40
  return 0
})

const currentFill = ref(0)

// Watch for changes to healthStatus to update the fill animation live
watch(() => props.healthStatus, () => {
  currentFill.value = fillTarget.value
})

onMounted(() => {
  // Stagger the initial height update to trigger the entry animation
  setTimeout(() => {
    currentFill.value = fillTarget.value
  }, 50)
})
</script>

<template>
  <div :class="['pool-hero', `hero--${healthStatus}`, { 'is-refreshing': isLoading }]">
    <!-- Water fill -->
    <div
      class="water-indicator"
      :style="{ height: `${currentFill}%` }"
    />
    <div class="content">
      <div class="tab-funds-row">
        TAB FUNDS: ${{ totalBalance.toFixed(2) }}
      </div>
      <div class="floats-amount">
        {{ floatsAvailable }}
      </div>
      <div class="label">
        {{ floatsAvailable === 1 ? 'float' : 'floats' }} available
      </div>

      <div class="sub-label">
        ${{ tab.floatValue.toFixed(2) }} per float · Must be at the shop to claim
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.pool-hero {
  position: relative;
  border-radius: 0.75rem; 
  border: 1px solid var(--border);
  background: var(--card);
  overflow: hidden;
  transition: opacity 0.3s ease;
  
  &.is-refreshing {
    opacity: 0.7;
    pointer-events: none;
  }

  &.hero--open {
    .water-indicator { background: hsla(174, 100%, 35%, 0.12); }
    .floats-amount { color: var(--floats-teal); }
    .tab-funds-row { color: var(--floats-teal); }
  }

  &.hero--low {
    .water-indicator { background: hsla(38, 92%, 50%, 0.12); }
    .floats-amount { color: var(--floats-amber); }
    .tab-funds-row { color: var(--floats-amber); }
  }

  &.hero--empty {
    .floats-amount { color: #64748b; }
    .tab-funds-row { color: var(--muted-foreground); }
  }

  .water-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    transition: height 1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s;
  }

  .content {
    position: relative;
    z-index: 10;
    padding: 1.5rem 1.25rem 1.5rem 1.25rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;

    .floats-amount {
      font-size: 2.75rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      transition: color 0.3s;
      line-height: 1;
    }

    .label {
      font-size: 0.875rem; 
      font-weight: 600;
      color: var(--foreground);
      margin-top: 0.25rem;
    }

    .tab-funds-row {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 0 0 0.5rem 0;
      opacity: 0.9;
      position: relative;
      
      // Fine little lines on sides to give it some "hero" weight
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      &::before, &::after {
        content: '';
        height: 1px;
        width: 1.5rem;
        background: currentColor;
        opacity: 0.2;
      }
    }

    .sub-label {
      font-size: 0.75rem;
      color: var(--muted-foreground);
      opacity: 0.6;
    }
  }
}
</style>
