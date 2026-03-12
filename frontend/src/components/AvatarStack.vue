<template>
  <div class="avatar-stack">
    <BaseAvatar
      v-for="(seed, i) in shown"
      :key="i"
      :seed="seed"
      :size="size"
      border
      class="stack-item"
    />
    <div v-if="overflow > 0" :class="['avatar-overflow', `avatar-overflow--${size}`]">
      +{{ overflow }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseAvatar from './BaseAvatar.vue'

const props = withDefaults(defineProps<{
  seeds: string[]
  max?: number
  size?: 'sm' | 'md'
}>(), {
  max: 4,
  size: 'sm',
})

const shown = computed(() => props.seeds.slice(0, props.max))
const overflow = computed(() => props.seeds.length - props.max)
</script>

<style lang="scss" scoped>
.avatar-stack {
  display: flex;
  align-items: center;
}

.stack-item {
  margin-left: -0.5rem;
  &:first-child { margin-left: 0; }
}

.avatar-overflow {
  border-radius: 9999px;
  border: 2px solid var(--card);
  background: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  color: var(--muted-foreground);
  margin-left: -0.5rem;

  &--sm { width: 1.75rem; height: 1.75rem; font-size: 10px; }
  &--md { width: 2.25rem; height: 2.25rem; font-size: 0.75rem; }
}
</style>
