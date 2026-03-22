<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'keep'): void
  (e: 'discard'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-icon modal-icon--danger">
            <AlertCircle :size="32" />
          </div>
          
          <h2 class="modal-title">Discard this float?</h2>
          <p class="modal-body">
            If you discard this float, it will be returned to the community tab for someone else to claim.
          </p>
          
            <div class="modal-actions">
            <button 
              class="btn btn--danger btn--full btn--loading" 
              :disabled="loading" 
              @click="emit('discard')"
            >
              <span v-if="loading" class="spinner-small"></span>
              <span>{{ loading ? 'Discarding...' : 'Discard Float' }}</span>
            </button>
            <button 
              class="btn btn--ghost btn--full" 
              :disabled="loading" 
              @click="emit('keep')"
            >
              Keep It
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.btn--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

// Higher z-index to sit above the active float overlay
.modal-backdrop {
  z-index: 3000;
}
</style>
