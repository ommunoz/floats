<script setup lang="ts">
defineProps<{
  show: boolean
  floatValue?: number
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-hero-amount">
            ${{ floatValue?.toFixed(2) }}
          </div>
          <h2 class="modal-title">Ready to grab your float?</h2>
          <p class="modal-body">
            Once claimed, you have <strong>15 minutes</strong> to tap at the register.<br>If unused, the float will return to the tab.
          </p>

          <!-- Error banner -->
          <div v-if="error" class="modal-error">
            <span class="modal-error__icon">⚠</span>
            <span>{{ error }}</span>
          </div>

          <div class="modal-actions">
            <button
              class="btn btn--primary btn--full"
              @click="emit('confirm')"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner"></span>
              <span v-else-if="error">Try Again</span>
              <span v-else>Claim It!</span>
            </button>
            <button class="btn btn--ghost btn--full" :disabled="loading" @click="emit('close')">Cancel</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-error {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: rgba(255, 77, 77, 0.1);
  border: 1px solid rgba(255, 77, 77, 0.3);
  border-radius: 0.75rem;
  padding: 0.65rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ff4d4d;
  line-height: 1.4;
  text-align: left;

  &__icon {
    flex-shrink: 0;
    font-size: 0.9rem;
    margin-top: 0.05rem;
  }
}
</style>
