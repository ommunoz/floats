<script setup lang="ts">
import { Zap } from 'lucide-vue-next'

defineProps<{
  isSimulating: boolean
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <div class="demo-pos">
    <span class="demo-pos__label">⚙ POS TAP</span>
    <button 
      class="demo-pos__btn"
      :disabled="isSimulating"
      @click="$emit('click')"
    >
      <div v-if="isSimulating" class="spinner-small"></div>
      <Zap v-else :size="12" fill="currentColor" />
      <span>{{ isSimulating ? 'Tapping...' : 'Simulate' }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.demo-pos {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1010;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  padding: 0.35rem 0.5rem 0.35rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: auto;

  &__label {
    font-size: 0.6rem;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.08em;
    font-family: monospace;
  }

  &__btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.75rem;
    background: #8b5cf6;
    border: none;
    border-radius: 9999px;
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    cursor: pointer;
    transition: filter 0.2s;
    &:hover:not(:disabled) { filter: brightness(1.1); }
    &:disabled { opacity: 0.6; }
  }
}

.spinner-small {
  width: 0.75rem;
  height: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
