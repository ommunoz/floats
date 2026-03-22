<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <Teleport to="body">
    <div class="demo-geo">
      <span class="demo-geo__label">⚙ GEOFENCE</span>
      <button
        class="demo-geo__toggle"
        :class="model ? 'demo-geo__toggle--on' : 'demo-geo__toggle--off'"
        @click="model = !model"
      >
        <span class="demo-geo__knob" />
      </button>
      <span class="demo-geo__state">{{ model ? 'Inside' : 'Outside' }}</span>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.demo-geo {
  position: fixed;
  top: 1rem;
  right: 0.75rem;
  z-index: 100;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(15, 15, 20, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
  padding: 0.35rem 0.75rem 0.35rem 0.6rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &__label {
    font-size: 0.65rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  &__toggle {
    position: relative;
    width: 2.2rem;
    height: 1.1rem;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: background 0.2s;

    &--on  { background: #8b5cf6; }
    &--off { background: rgba(255, 255, 255, 0.18); }
  }

  &__knob {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
    transition: left 0.18s cubic-bezier(0.4, 0, 0.2, 1);

    .demo-geo__toggle--on  & { left: calc(100% - 0.9rem); }
    .demo-geo__toggle--off & { left: 0.12rem; }
  }

  &__state {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 0.01em;
  }
}
</style>
