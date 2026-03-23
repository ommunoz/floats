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
        <BaseAvatar :src="getAvatarUrl(c.address)" class="avatar" />
        <div class="info">
          <div class="name-row">
            <span class="address">{{ getDisplayName(c.address) }}</span>
            <Crown v-if="c.amount === sortedLeaderboard[0]?.amount" :size="14" class="crown" />
          </div>
          <span class="tier" :class="c.tier.toLowerCase()">{{ c.tier }}</span>
        </div>
        <span class="amount">${{ c.amount }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FunderStats } from '../services/tabs'
import { Crown } from 'lucide-vue-next'
import { getDisplayName, getAvatarUrl } from '../utils/demoIdentities'
import BaseAvatar from './BaseAvatar.vue'

const props = defineProps<{
  leaderboard: Record<string, FunderStats>
}>()

const sortedLeaderboard = computed(() => {
  return Object.entries(props.leaderboard)
    .map(([address, stats]) => ({
      address,
      amount: stats.totalFunded,
      tier: stats.tier
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
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
      height: 2.5rem !important;
      width: 2.5rem !important;
      border-radius: 50%;
      background: var(--muted);
      flex-shrink: 0;
    }


    .info {
      display: flex;
      flex-direction: column;
      flex: 1;

      .name-row {
        display: flex;
        align-items: center;
        gap: 0.25rem;

        .address {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .crown {
          color: #fbbf24; // Gold
          filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.4));
        }
      }

      .tier {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        margin-top: -0.1rem;

        &.legend {
          color: #fbbf24; // Amber 400 (Gold)
          filter: drop-shadow(0 0 1px rgba(251, 191, 36, 0.2));
        }

        &.hero {
          color: #f59e0b; // Amber 600/Orange
        }

        &.supporter {
          color: var(--muted-foreground);
          font-weight: 600;
          opacity: 0.8;
        }
      }
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
