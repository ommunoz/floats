<template>
  <div class="avatar-stack">
    <img
      v-for="(src, i) in shown"
      :key="i"
      :src="src"
      alt=""
      :class="['avatar-img', `avatar-img--${size}`]"
    />
    <div v-if="overflow > 0" :class="['avatar-overflow', `avatar-overflow--${size}`]">
      +{{ overflow }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  avatars: string[]
  max?: number
  size?: 'sm' | 'md'
}>(), {
  max: 4,
  size: 'sm',
})

const shown = computed(() => props.avatars.slice(0, props.max))
const overflow = computed(() => props.avatars.length - props.max)
</script>

<style lang="scss" scoped>
.avatar-stack {
  display: flex;
  align-items: center;
}

.avatar-img {
  border-radius: 9999px;
  border: 2px solid var(--card);
  background: var(--muted);
  margin-left: -0.5rem;
  object-fit: cover;

  &:first-child { margin-left: 0; }

  &--sm { width: 1.75rem; height: 1.75rem; }
  &--md { width: 2.25rem; height: 2.25rem; }
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
