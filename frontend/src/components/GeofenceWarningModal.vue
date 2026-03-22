<script setup lang="ts">
import { MapPin, Navigation } from 'lucide-vue-next'

defineProps<{
  show: boolean
  merchantName?: string
  address?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-icon modal-icon--location">
            <Navigation :size="26" />
          </div>
          <h2 class="modal-title">Visit {{ merchantName }} to claim</h2>
          <p class="modal-body">
            Floats are only available in‑store. Stop by and tap claim when you're there.
          </p>

          <div v-if="address" class="address-pill">
            <MapPin :size="13" />
            <span>{{ address }}</span>
          </div>

          <div class="modal-actions">
            <a
              v-if="address"
              :href="`https://maps.google.com/?q=${encodeURIComponent(address)}`"
              target="_blank"
              class="btn btn--primary btn--full"
              @click="emit('close')"
            >
              Get Directions
            </a>
            <button class="btn btn--ghost btn--full" @click="emit('close')">Maybe later</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-icon--location {
  background: rgba(20, 184, 166, 0.12);
  color: var(--floats-teal);
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.address-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--muted);
  color: var(--muted-foreground);
  border-radius: 9999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 500;
  margin-bottom: 1rem;
}
</style>
