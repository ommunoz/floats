<script setup lang="ts">
defineProps<{
  cardholderName: string
}>()
</script>

<template>
  <div class="virtual-card">
    <!-- Shimmer overlay -->
    <div class="shimmer-wrapper">
      <div class="shimmer-effect"></div>
    </div>

    <div class="card-content">
      <div class="card-top">
        <span class="brand">floats</span>
        <span class="badge">VIRTUAL</span>
      </div>

      <div class="card-middle">
        <p class="card-number">
          •••• •••• •••• 4242
        </p>
      </div>

      <div class="card-bottom">
        <div>
          <p class="label">Cardholder</p>
          <p class="value">{{ cardholderName }}</p>
        </div>
        <div class="text-right">
          <p class="label">Expires</p>
          <p class="value shrink">12/28</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.virtual-card {
  position: relative;
  width: 100%;
  aspect-ratio: 1.586 / 1;
  border-radius: 1rem;
  overflow: hidden;
  background-image: linear-gradient(
    to bottom right, 
    hsl(174, 100%, 35%), 
    hsla(174, 100%, 35%, 0.8), 
    hsla(174, 100%, 35%, 0.6)
  );
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.shimmer-wrapper {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.shimmer-effect {
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    to right, 
    transparent, 
    rgba(255, 255, 255, 0.1), 
    transparent
  );
  animation: shimmer 2.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.card-content {
  position: relative;
  z-index: 10;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem;
  color: #ffffff;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .brand {
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: 0.025em;
  }

  .badge {
    font-size: 0.75rem;
    opacity: 0.6;
  }
}

.card-middle {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .card-number {
    font-size: 1.125rem;
    letter-spacing: 0.25em;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-variant-numeric: tabular-nums;
    margin: 0;
  }
}

.card-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  div {
    display: flex;
    flex-direction: column;
  }

  .text-right {
    align-items: flex-end;
  }

  .label {
    font-size: 10px;
    opacity: 0.6;
    text-transform: uppercase;
    margin: 0 0 0.25rem 0;
  }

  .value {
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;

    &.shrink {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-variant-numeric: tabular-nums;
    }
  }
}
</style>
