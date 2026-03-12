<template>
  <div class="base-avatar" :class="[`size-${size}`, { 'has-border': border }]">
    <img :src="url" alt="avatar" class="avatar-img" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  seed: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  border?: boolean
}>(), {
  size: 'md',
  border: false
})

const url = computed(() => `https://api.dicebear.com/7.x/avataaars/svg?seed=${props.seed}`)
</script>

<style lang="scss" scoped>
.base-avatar {
  border-radius: 9999px;
  background-color: var(--muted);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid transparent;

  &.has-border {
    border-color: var(--card);
  }

  &.size-xs { width: 1.25rem; height: 1.25rem; &.has-border { border-width: 1px; } }
  &.size-sm { width: 1.75rem; height: 1.75rem; }
  &.size-md { width: 2.25rem; height: 2.25rem; }
  &.size-lg { width: 3.5rem; height: 3.5rem; }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
