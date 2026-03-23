<script setup lang="ts">
import { CreditCard, ArrowRight } from 'lucide-vue-next'

defineProps<{
  onClick: () => void
}>()
</script>

<template>
  <button @click="onClick" class="card-link">
    <div class="icon-wrapper">
      <CreditCard class="card-icon" />
    </div>
    <div class="card-info">
      <p class="card-title">Floats Card</p>
      <p class="card-sub">View your virtual card details</p>
    </div>
    <ArrowRight class="arrow-icon" />
  </button>
</template>

<style lang="scss" scoped>
.card-link {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: 0.75rem;
  background-color: var(--card);
  border: 1px solid var(--border);
  padding: 1.15rem;
  cursor: pointer;
  transition: box-shadow 0.2s;
  text-align: left;
  color: var(--card-foreground);

  &:hover {
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .icon-wrapper {
    height: 3rem;
    width: 3rem;
    border-radius: 0.65rem;
    background-color: hsl(218, 46%, 20%); /* Navy */
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    .card-icon {
      height: 1.35rem;
      width: 1.35rem;
      color: white;
    }
  }

  .card-info {
    flex: 1 1 0%;
    .card-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: hsl(218, 46%, 20%);
      margin: 0;
    }
    .card-sub {
      font-size: 0.8rem;
      color: var(--muted-foreground);
      margin: 0;
    }
  }

  .arrow-icon {
    height: 1.15rem;
    width: 1.15rem;
    color: var(--muted-foreground);
  }
}
</style>
