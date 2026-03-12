<template>
  <span :class="['status-pill', `status-pill--${status.replace('_', '-')}`]">
    <span :class="['status-dot', `status-dot--${status.replace('_', '-')}`]" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'open' | 'low' | 'empty'
}>()

const label = computed(() => {
  if (props.status === 'open') return 'Tab open'
  if (props.status === 'low') return 'Tab running low'
  return 'Tab empty'
})
</script>

<style lang="scss" scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;

  &--open {
    background: hsla(174, 100%, 35%, 0.15);
    color: var(--floats-teal);
  }
  &--low {
    background: hsla(38, 92%, 50%, 0.15);
    color: var(--floats-amber);
  }
  &--empty {
    background: #F1F5F9;
    color: #475569;
  }
}

.status-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;

  &--open    { background: var(--floats-teal); }
  &--low     { background: var(--floats-amber); }
  &--empty   { background: #94A3B8; }
}
</style>
