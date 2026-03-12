<script setup lang="ts">
import { computed } from 'vue'
import type { Tab } from '../stores/tabs'

const props = defineProps<{
  tab: Tab
  floatsAvailable: number
  healthStatus: Tab['healthStatus']
}>()

const fillPercent = computed(() => {
  if (props.healthStatus === 'open') return 100
  if (props.healthStatus === 'low') return 40
  return 0
})
</script>

<template>
  <div :class="['pool-hero', `hero--${healthStatus}`]">
    <!-- Water fill -->
    <div
      class="water-indicator"
      :style="{ height: `${fillPercent}%` }"
    />
    <div class="content">
      <div class="floats-amount">
        {{ floatsAvailable }}
      </div>
      <div class="label">
        {{ floatsAvailable === 1 ? 'float' : 'floats' }} available
      </div>
      <div class="sub-label">
        ${{ tab.floatValue }} per float · Must be at the shop to claim
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.pool-hero {
  position: relative;
  border-radius: 0.75rem; // rounded-xl
  border: 1px solid var(--border); // border-border
  background: var(--card); // bg-card
  overflow: hidden;
  &.hero--open {
    .water-indicator { background: hsla(174, 100%, 35%, 0.12); }
    .floats-amount { color: var(--floats-teal); }
  }

  &.hero--low {
    .water-indicator { background: hsla(38, 92%, 50%, 0.12); }
    .floats-amount { color: var(--floats-amber); }
  }

  &.hero--empty {
    .floats-amount { color: #64748b; }
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
    padding: 1.25rem; // p-5
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.5rem; // space-y-2

    .floats-amount {
      font-size: 1.875rem; // text-3xl
      font-weight: 700; // font-bold
      letter-spacing: -0.025em; // tracking-tight
      font-variant-numeric: tabular-nums;
      transition: color 0.3s;
    }

    .label {
      font-size: 0.875rem; // text-sm
      font-weight: 500; // font-medium
      color: var(--foreground); // text-foreground
    }

    .sub-label {
      font-size: 0.75rem; // text-xs
      color: var(--muted-foreground); // text-muted-foreground
    }
  }
}
</style>
