<script setup lang="ts">
import { DollarSign, Users, Zap } from 'lucide-vue-next'

defineProps<{
  totalSales: number
  neighborVisits: number
  totalBalance: number
  remainingCapacity: number
}>()
</script>

<template>
  <div class="stats-grid">
    <!-- Sales Hero -->
    <div class="stat-card hero-card">
      <div class="stat-header">
        <span class="stat-title">Tab Earnings</span>
        <DollarSign :size="16" class="stat-icon" />
      </div>
      <div class="stat-value hero-value">${{ totalSales.toFixed(2) }}</div>
      <div class="stat-desc">All-time sales covered by the tab</div>
    </div>

    <!-- Visits -->
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-title">Floats RedeemFed</span>
        <Users :size="16" class="stat-icon" />
      </div>
      <div class="stat-value">{{ neighborVisits }}</div>
      <div class="stat-desc">Neighbor visits covered by the tab</div>
    </div>

    <!-- Community Pool -->
    <div class="stat-card community-pool-card">
      <div class="stat-header">
        <span class="stat-title">Current Tab Balance</span>
        <Zap :size="16" class="stat-icon" />
      </div>
      <div class="pool-hero-inner">
         <div class="pool-balance">${{ totalBalance.toFixed(2) }}</div>
         <div class="pool-label-row">
           <span class="pool-floats">{{ remainingCapacity }} floats available</span>
         </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);

  &.hero-card {
    background: linear-gradient(135deg, var(--card), rgba(20, 184, 166, 0.05));
    border-color: rgba(20, 184, 166, 0.2);
  }

  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    .stat-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-icon {
      color: var(--muted-foreground);
      opacity: 0.7;
    }
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--foreground);
    line-height: 1;
    margin-bottom: 0.5rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
    letter-spacing: -0.02em;

    &.hero-value {
      color: var(--floats-teal);
    }
  }

  .stat-desc {
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
}

.community-pool-card {
  .pool-balance { color: var(--floats-navy); }
  
  .pool-hero-inner {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.5rem;

    .pool-balance {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1;
      font-family: 'SF Mono', 'Fira Code', monospace;
      letter-spacing: -0.02em;
    }

    .pool-label-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .pool-floats {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--muted-foreground);
    }
  }
}
</style>
