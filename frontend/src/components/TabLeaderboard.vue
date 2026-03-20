<template>
  <section v-if="sortedLeaderboard.length > 0" class="panel">
    <h2 class="section-title">Top Contributors</h2>
    <div class="leaderboard-list">
      <div
        v-for="(c, index) in sortedLeaderboard"
        :key="c.address"
        class="leaderboard-item"
      >
        <span class="rank">
          {{ index + 1 }}
        </span>
        <BaseAvatar :seed="c.address" size="sm" class="avatar" />
        <span class="address">{{ getDisplayName(c.address) }}</span>
        <span class="amount">${{ c.amount }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FunderStats } from '../services/tabs'
import { getDisplayName } from '../utils/demoIdentities'
import BaseAvatar from './BaseAvatar.vue'

const props = defineProps<{
  leaderboard: Record<string, FunderStats>
}>()

const sortedLeaderboard = computed(() => {
  return Object.entries(props.leaderboard)
    .map(([address, stats]) => ({
      address,
      amount: stats.totalFunded
    }))
    .sort((a, b) => b.amount - a.amount)
})
</script>

<style lang="scss" scoped>
.panel {
  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--foreground);
    margin: 0 0 0.75rem 0;
  }
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .leaderboard-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-radius: 0.5rem;
    background: var(--card);
    border: 1px solid var(--border);
    padding: 0.75rem;

    .rank {
      font-size: 0.75rem;
      font-weight: 700;
      width: 1.25rem;
      text-align: center;
      color: var(--muted-foreground);
    }

    .avatar {
      height: 2rem;
      width: 2rem;
      border-radius: 50%;
      background: var(--muted);
      object-fit: cover;
    }

    .address {
      font-size: 0.875rem;
      font-weight: 500;
      flex: 1;
    }

    .amount {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--floats-teal);
      font-variant-numeric: tabular-nums;
    }
  }
}
</style>
