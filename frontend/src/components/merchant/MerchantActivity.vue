<script setup lang="ts">
import BaseAvatar from '../BaseAvatar.vue'
import { getAvatarUrl } from '../../utils/demoIdentities'
import { timeAgo } from '../../utils/formatters'
import type { HistoryEvent } from '../../services/tabs'

defineProps<{
  history: HistoryEvent[]
}>()
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <h2 class="panel-title">RECENT REDEMPTIONS</h2>
    </div>
    <div class="panel-body list-body">
      <div v-for="event in history" :key="event.timestamp + event.userAddress" class="activity-row">
        <BaseAvatar :src="getAvatarUrl(event.userAddress)" size="sm" class="activity-avatar" />
        <div class="activity-details">
          <div class="activity-time">{{ timeAgo(event.timestamp.toString()) }}</div>
          <div class="activity-amount">
            <span class="consumed-text">${{ event.amount.toFixed(2) }} redeemed</span>
          </div>
        </div>
        <div class="status-approved">APPROVED</div>
      </div>
      <div v-if="history.length === 0" class="empty-state">No redemptions yet.</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.panel-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);

  .panel-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;

    .panel-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      color: var(--foreground);
    }
  }

  .panel-body {
    padding: 0;
    
    &.list-body {
      padding: 0.5rem 1.5rem;
    }
  }
}

.activity-badge {
  background: rgba(20, 184, 166, 0.1);
  color: var(--floats-teal);
  border: 1px solid rgba(20, 184, 166, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.activity-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);

  &:last-child { border-bottom: none; }

  .activity-avatar {
    filter: blur(1.5px); 
    opacity: 0.8;
  }

  .activity-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .activity-time {
      font-size: 0.75rem;
      color: var(--muted-foreground);
    }

    .activity-amount {
      font-family: monospace;
      font-size: 0.875rem;

      .consumed-text {
        font-weight: 600;
        color: var(--foreground);
      }
    }
  }

  .status-approved {
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--floats-teal);
    background: rgba(20, 184, 166, 0.1);
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    letter-spacing: 0.05em;
  }
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--muted-foreground);
}
</style>
