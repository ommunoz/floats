<script setup lang="ts">
import { X } from 'lucide-vue-next'
import type { Tab } from '../../stores/tabs'

const props = defineProps<{
  tab: Tab
  numericAmount: number
  isProcessing: boolean
  errorMessage: string
  modelValue: string // note
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'back'): void
  (e: 'pay'): void
  (e: 'close'): void
}>()
</script>

<template>
  <div class="fund-view">
    <div class="sheet-header">
      <h2 class="sheet-title">Add to this Tab</h2>
      <button class="close-btn" @click="emit('close')">
        <X class="icon-sm" />
      </button>
    </div>

    <div class="checkout-summary">
      <span class="checkout-amount">${{ numericAmount }}</span>
      <span class="checkout-label">being added to the tab at <strong>{{ tab?.merchantName }}</strong></span>
    </div>

    <!-- Mock Card Input -->
    <div class="mock-card-container">
      <div class="mock-card">
        <input type="text" placeholder="4242 4242 4242 4242" class="mock-input full-width" readonly />
        <div class="mock-row">
          <input type="text" placeholder="MM/YY" class="mock-input width-sm" readonly />
          <input type="text" placeholder="CVC" class="mock-input width-xs" readonly />
        </div>
      </div>
      <p class="demo-warning">Demo mode — no real charges</p>
    </div>

    <p v-if="errorMessage" class="payment-error">{{ errorMessage }}</p>

    <textarea
      :value="modelValue"
      @input="e => emit('update:modelValue', (e.target as HTMLTextAreaElement).value)"
      placeholder="Leave a note for the community... (optional)"
      class="note-input-checkout"
      rows="2"
    ></textarea>

    <div class="checkout-actions">
      <button class="btn btn-secondary w-full" @click="emit('back')" :disabled="isProcessing">Back</button>
      <button 
        @click="emit('pay')" 
        class="btn btn-primary w-full"
        :disabled="isProcessing"
      >
        <span v-if="isProcessing">Processing...</span>
        <span v-else>Pay ${{ numericAmount }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fund-view {
  padding: 1rem 1.5rem 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .sheet-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: var(--floats-navy);
  }

  .close-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--muted-foreground);
    padding: 0.25rem;
    border-radius: 9999px;

    &:hover { background: var(--muted); }
    .icon-sm { width: 1.25rem; height: 1.25rem; }
  }
}

.checkout-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--floats-orange);
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  gap: 0.25rem;
  color: white;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);

  .checkout-amount {
    font-size: 2.5rem;
    font-weight: 800;
    color: white;
    line-height: 1;
  }

  .checkout-label {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    strong { color: white; font-weight: 700; }
  }
}

.mock-card-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mock-card {
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background: rgba(248, 250, 251, 0.5);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .mock-input {
    background: transparent;
    border: none;
    font-size: 0.875rem;
    outline: none;
    padding: 0;
    color: var(--foreground);
    &::placeholder { color: var(--muted-foreground); opacity: 0.5; }
    &.full-width { width: 100%; }
    &.width-sm { width: 5rem; }
    &.width-xs { width: 4rem; }
  }

  .mock-row {
    display: flex;
    gap: 0.5rem;
  }
}

.demo-warning {
  font-size: 0.625rem;
  color: var(--muted-foreground);
  margin: 0;
}

.note-input-checkout {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  font-size: 0.875rem;
  outline: none;
  resize: none;
  transition: border-color 0.2s;
  font-family: inherit;
  color: var(--foreground);
  background: white;

  &::placeholder { color: var(--muted-foreground); }
  &:focus { border-color: var(--floats-navy); }
}

.payment-error {
  font-size: 0.8125rem;
  color: #dc2626;
  margin: 0;
  text-align: center;
}

.checkout-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.w-full { width: 100%; }

.btn {
  height: 3rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  &:disabled { opacity: 0.7; cursor: not-allowed; }
}

.btn-primary {
  background: var(--floats-orange);
  color: white;
  gap: 0.5rem;
  &:not(:disabled):hover { background: #f06900; }
}

.btn-secondary {
  background: var(--muted);
  color: var(--foreground);
  &:hover { background: #e2e8f0; }
}
</style>
