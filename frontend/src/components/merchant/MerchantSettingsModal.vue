<script setup lang="ts">
import { X } from 'lucide-vue-next'
import MerchantConfig from './MerchantConfig.vue'

defineProps<{
  show: boolean
  merchantName: string
  address: string
  floatValue: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-card settings-modal">
          <button class="close-btn" @click="emit('close')">
            <X :size="20" />
          </button>
          
          <MerchantConfig 
            :merchant-name="merchantName"
            :address="address"
            :float-value="floatValue"
          />

          <div class="modal-footer">
            <button class="btn btn--primary btn--full" @click="emit('close')">Close</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal-card.settings-modal {
  background: var(--card);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 32rem;
  padding: 2.5rem 2rem 2rem;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: var(--muted);
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--border);
    color: var(--foreground);
  }
}

.modal-footer {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
  
  .modal-card {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  
  .modal-card {
    transform: scale(0.95) translateY(10px);
  }
}
</style>
