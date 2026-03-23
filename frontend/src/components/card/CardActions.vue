<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'
</script>

<template>
  <div class="actions">
    <button class="wallet-btn">
      <Wallet class="wallet-icon" />
      Add to Google Wallet
    </button>
  </div>
</template>

<style lang="scss" scoped>
.actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.wallet-btn {
  width: 100%;
  height: 3rem;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .wallet-icon {
    width: 1.25rem;
    height: 1.25rem;
  }
}
</style>
