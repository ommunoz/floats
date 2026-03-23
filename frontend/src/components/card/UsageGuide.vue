<script setup lang="ts">
// No logic needed for static guide
</script>

<template>
  <div class="usage-guide">
    <h3 class="guide-title">How to use</h3>
    
    <div class="guide-steps">
      <div class="guide-step">
        <div class="guide-step__marker">1</div>
        <div class="guide-step__content">
          <strong>Discover</strong>
          <p class="guide-step__desc">Find an active community tab on the map or feed.</p>
        </div>
      </div>
      <div class="guide-step">
        <div class="guide-step__marker">2</div>
        <div class="guide-step__content">
          <strong>Claim</strong>
          <p class="guide-step__desc">When you're at the merchant, claim a community float to cover your purchase.</p>
        </div>
      </div>
      <div class="guide-step">
        <div class="guide-step__marker">3</div>
        <div class="guide-step__content">
          <strong>Tap</strong>
          <p class="guide-step__desc">Use your phone to tap-to-pay at the register. Your Floats Card automatically applies the claimed amount.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.usage-guide {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.5rem;
  padding: 1.15rem 1rem;
  text-align: left;
  margin-top: 1rem;
}

.guide-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 0.85rem 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.guide-step {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;

  &__marker {
    flex-shrink: 0;
    width: 1.75rem;
    height: 1.75rem;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.85rem;
    font-weight: 800;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.15rem;
  }

  &__content {
    flex: 1;
    font-size: 0.95rem;
    font-weight: 600;
    color: white;
    line-height: 1.4;

    strong {
      color: white;
      font-weight: 800;
      display: block;
      margin-bottom: 0.1rem;
    }

    .guide-step__desc {
      color: white;
      font-weight: 400;
      font-size: 0.85rem;
      margin: 0;
    }
  }
}
</style>
