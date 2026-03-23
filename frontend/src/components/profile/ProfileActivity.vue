<script setup lang="ts">
import { DollarSign, Coffee, Ticket } from 'lucide-vue-next'
import { getMerchantName, timeAgo } from '../../utils/formatters'
import type { UserHistoryItem } from '../../services/profile'

defineProps<{
  items: UserHistoryItem[]
}>()

function getActivityDescription(item: UserHistoryItem) {
  const amount = parseFloat(item.amount).toFixed(0)
  const mName = getMerchantName(item.tabID)
  
  if (item.type === 'fund') {
    return `Added $${amount} to ${mName} tab`
  } else if (item.type === 'claim') {
    return `Claimed a float at ${mName}`
  }
  return `Grabbed a $${amount} float at ${mName}`
}
</script>

<template>
  <section class="activity-section">
    <h3 class="section-title">Recent Activity</h3>
    
    <div v-if="items.length === 0" class="empty-state">
      No recent activity found.
    </div>
    
    <div v-else class="activity-list">
      <div v-for="item in items" :key="item.id" class="activity-item">
        <div class="activity-icon-wrapper" :class="item.type">
          <DollarSign v-if="item.type === 'fund'" class="act-icon" />
          <Coffee v-else-if="item.type === 'claim'" class="act-icon" />
          <Ticket v-else class="act-icon" />
        </div>
        <div class="activity-details">
          <p class="desc">{{ getActivityDescription(item) }}</p>
          <p class="time">{{ timeAgo(item.timestamp) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.activity-section {
  .section-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: hsl(218, 46%, 20%);
    margin-bottom: 1rem;
    margin-top: 0;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .activity-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    border-radius: 0.85rem;
    background-color: var(--card);
    border: 1px solid var(--border);
    padding: 1rem 1.15rem;
    color: var(--card-foreground);

    .activity-icon-wrapper {
      height: 2.25rem;
      width: 2.25rem;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      &.fund {
        background-color: hsl(25, 95%, 53%); /* Orange */
        color: white;
      }
      &.claim, &.consume {
        background-color: hsl(174, 100%, 35%); /* Teal */
        color: white;
      }
      
      .act-icon {
        height: 1.1rem;
        width: 1.1rem;
      }
    }

    .activity-details {
      flex: 1 1 0%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      
      .desc {
        font-size: 0.9rem;
        color: hsl(218, 46%, 20%);
        font-weight: 500;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .time {
        font-size: 0.75rem;
        color: var(--muted-foreground);
        margin: 0;
      }
    }
  }
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--muted-foreground);
  font-size: 0.875rem;
}
</style>
