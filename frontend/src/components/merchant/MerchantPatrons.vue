<script setup lang="ts">
export interface Patron {
  address: string
  name: string
  email: string
  amount: number
  tier: string
}

defineProps<{
  patrons: Patron[]
}>()
</script>

<template>
  <div class="panel-card">
    <div class="panel-header">
      <h2 class="panel-title">TOP PATRONS</h2>
    </div>
    <div class="panel-body">
      <div class="table">
        <div class="table-row table-head">
          <div class="col-rank">RANK</div>
          <div class="col-patron">PATRON</div>
          <div class="col-level">LEVEL</div>
          <div class="col-amount text-right">TOTAL ADDED</div>
        </div>
        <div v-for="(sponsor, i) in patrons" :key="sponsor.address" class="table-row">
          <div class="col-rank rank-number">#{{ i + 1 }}</div>
          <div class="col-patron sponsor-info">
            <span class="sponsor-name">{{ sponsor.name }}</span>
            <span class="sponsor-email">{{ sponsor.email }}</span>
          </div>
          <div class="col-level">
            <span class="tier-badge" :class="sponsor.tier.toLowerCase()">{{ sponsor.tier }}</span>
          </div>
          <div class="col-amount text-right font-mono">${{ sponsor.amount.toFixed(2) }}</div>
        </div>
        <div v-if="patrons.length === 0" class="empty-state">No patrons yet.</div>
      </div>
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
  }
}

.table {
  width: 100%;
  display: flex;
  flex-direction: column;

  .table-row {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border);

    &:last-child { border-bottom: none; }
  }

  .table-head {
    background: rgba(248, 250, 251, 0.5);
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted-foreground);
    text-transform: capitalize;
  }

  .col-rank { width: 3rem; flex-shrink: 0; }
  .col-patron { flex: 1; min-width: 0; }
  .col-level { width: 7rem; flex-shrink: 0; }
  .col-amount { width: 5rem; flex-shrink: 0; text-align: right; }

  .rank-number {
    font-family: monospace;
    color: var(--muted-foreground);
    font-weight: 600;
  }

  .sponsor-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;

    .sponsor-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--foreground);
    }
    .sponsor-email {
      font-size: 0.75rem;
      color: var(--muted-foreground);
    }
  }

  .font-mono {
    font-family: 'SF Mono', monospace;
    font-weight: 600;
  }
}

.tier-badge {
  display: inline-flex;
  padding: 0.25rem 0.6rem;
  border-radius: 0.35rem;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--muted);
  color: var(--muted-foreground);

  &.legend { background: rgba(251, 191, 36, 0.15); color: #d97706; }
  &.hero { background: rgba(249, 115, 22, 0.1); color: var(--floats-orange); }
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--muted-foreground);
}
</style>
