<script setup lang="ts">
defineProps<{
  floatsGrabbed: number
  tabsBacked: number
}>()
</script>

<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value text-teal">{{ floatsGrabbed }}</div>
      <div class="stat-label">Floats grabbed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value text-orange">{{ tabsBacked }}</div>
      <div class="stat-label">Tabs backed</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;

  .stat-card {
    border-radius: 0.75rem;
    background-color: var(--card);
    border: 1px solid var(--border);
    padding: 1.5rem 1rem;
    text-align: center;
    color: hsl(218, 46%, 20%);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      font-feature-settings: "tnum";
      font-variant-numeric: tabular-nums;
      
      &.text-teal {
        color: hsl(174, 100%, 35%);
      }
      &.text-orange {
        color: hsl(25, 95%, 53%);
      }
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: var(--muted-foreground);
      margin-top: 0.1rem;
    }
  }
}
</style>
