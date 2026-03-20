<template>
  <section v-if="history.length > 0" class="panel">
    <h2 class="section-title">History</h2>
    <div class="history-list">
      <div v-for="event in history" :key="event.timestamp + event.userAddress" class="history-item">
        <div class="timeline">
          <div class="timeline-icon" :class="`icon-${event.type}`">
            <component :is="getEventIcon(event.type)" class="icon-svg" />
          </div>
          <div class="timeline-line" />
        </div>
        <div class="event-details">
          <div class="event-header">
            <BaseAvatar :seed="event.userAddress" size="xs" class="avatar" />
            <span class="address">{{ getDisplayName(event.userAddress) }}</span>
            <span class="action">{{ getEventDescription(event) }}</span>
          </div>
          <p class="event-note">"{{ getEventNote(event) }}"</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { HistoryEvent } from '../services/tabs'
import { getDisplayName } from '../utils/demoIdentities'
import { getRandomMockNote } from '../utils/mockNotes'
import { useNotesStore } from '../stores/notes'
import BaseAvatar from './BaseAvatar.vue'
import { DollarSign, Gift, Zap } from 'lucide-vue-next'

const props = defineProps<{
  history: HistoryEvent[]
}>()

const notesStore = useNotesStore()

function getEventIcon(type: string) {
  switch (type) {
    case 'fund': return DollarSign
    case 'consume': return Gift
    default: return Zap
  }
}

function getEventNote(event: HistoryEvent) {
  const lookupKey = `${event.timestamp}_${event.userAddress}`
  const sessionNote = notesStore.getNote(lookupKey)
  if (sessionNote) return sessionNote
  
  const seedStr = `${event.timestamp}_${event.userAddress}_${event.amount}`
  return getRandomMockNote(seedStr, event.type)
}

function getEventDescription(event: HistoryEvent) {
  if (event.type === 'fund') return `added $${event.amount.toFixed(0)} to the tab`
  if (event.type === 'consume') return `grabbed a $${event.amount.toFixed(0)} float`
  return 'grabbed a float'
}
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

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .history-item {
    display: flex;
    gap: 0.75rem;

    .timeline {
      display: flex;
      flex-direction: column;
      align-items: center;

      .timeline-icon {
        height: 1.75rem;
        width: 1.75rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;

        &.icon-fund { background: var(--floats-orange); }
        &.icon-consume, &.icon-claim { background: var(--floats-teal); }
        &.icon-float { background: var(--floats-amber); }

        .icon-svg { width: 0.875rem; height: 0.875rem; }
      }

      .timeline-line {
        width: 1px;
        flex: 1;
        background: var(--border);
      }
    }

    .event-details {
      padding-bottom: 1rem;

      .event-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .avatar {
          height: 1.25rem;
          width: 1.25rem;
          border-radius: 50%;
          object-fit: cover;
        }

        .address {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .action {
          font-size: 0.75rem;
          color: var(--muted-foreground);
        }
      }

      .event-note {
        font-size: 0.75rem;
        color: var(--muted-foreground);
        margin: 0.25rem 0 0 1.75rem;
      }
    }
  }
}
</style>
