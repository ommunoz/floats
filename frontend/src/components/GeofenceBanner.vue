<script setup lang="ts">
defineProps<{
  merchantName: string
}>()
</script>

<template>
  <div class="geofence-banner">
    <svg class="geofence-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
    <span>You're at {{ merchantName }}</span>
  </div>
</template>

<style scoped lang="scss">
.geofence-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--floats-teal);
  color: white;
  margin-block: -0.75rem; // reduce gap above/below inside .tab-content

  &__icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
}
</style>
