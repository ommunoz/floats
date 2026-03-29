<script setup lang="ts">
withDefaults(defineProps<{
  src: string
  alt?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  alt: '',
  size: 'md',
})
</script>

<template>
  <div class="merchant-logo-wrapper" :class="`size-${size}`">
    <img :src="src" :alt="alt" class="merchant-logo-img" />
  </div>
</template>

<style scoped lang="scss">
.merchant-logo-wrapper {
  border-radius: 50%;
  background: white;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  flex-shrink: 0;

  &.size-sm {
    width: 3.25rem;
    height: 3.25rem;
  }

  &.size-md {
    width: 4rem;
    height: 4rem;
  }

  &.size-lg {
    width: 4.5rem;
    height: 4.5rem;
  }
}

.merchant-logo-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  transform: scale(1.3);
  transition: transform 0.3s ease;
}
</style>
