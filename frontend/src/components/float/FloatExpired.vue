<script setup lang="ts">
import { AlertCircle, Plus } from 'lucide-vue-next'

defineProps<{
  merchantName: string
  merchantLogo: string
  floatValue: number
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'discard'): void
}>()
</script>

<template>
  <div class="active-content expired-theme">
    <!-- Header -->
    <div class="header-section">
      <div class="voucher-icon-orb">
        <AlertCircle :size="32" />
      </div>
      <h2 class="voucher-heading">Float expired</h2>
    </div>

    <!-- Hero Card -->
    <div class="hero-section">
      <div class="merchant-badge">
        <img :src="merchantLogo" alt="" class="merchant-logo" />
        <span class="merchant-name">{{ merchantName }}</span>
      </div>
      <div class="float-amount">
        ${{ floatValue }}.00
      </div>
      <div class="status-badge">
        <span>Time's Up</span>
      </div>
    </div>

    <!-- Main Container for Guide & Rules -->
    <div class="info-container">
      <div class="usage-guide">
        <h3 class="guide-title">What happened?</h3>
        
        <div class="guide-steps">
          <div class="guide-step">
            <div class="guide-step__marker">!</div>
            <div class="guide-step__content">
              The 15-minute window to use this float has passed.
            </div>
          </div>
          
          <div class="guide-step">
            <div class="guide-step__marker">
              <Plus :size="14" />
            </div>
            <div class="guide-step__content">
              Funds were returned to the <strong>community tab</strong>.
            </div>
          </div>
        </div>
      </div>

      <!-- Simplified Rules Row -->
      <div class="disclaimers-card">
        <div class="disclaimers-text">
          You can claim another float if the tab is still open.
        </div>
      </div>
    </div>

    <!-- Final Actions Section -->
    <div class="footer-actions">
      <button 
        class="btn btn--outline-white btn--full btn--loading acknowledge-btn" 
        :disabled="loading" 
        @click="emit('discard')"
      >
        <span v-if="loading" class="spinner-small"></span>
        <span>{{ loading ? 'Dismissing...' : 'Dismiss' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.active-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 28rem;
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 0 0.75rem;
  gap: 0.75rem;
  margin: auto;
}

.header-section {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.25rem;
}

.voucher-icon-orb {
  background: rgba(239, 68, 68, 0.15); // Red-tinted for expired
  color: #ef4444;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voucher-heading {
  font-size: 1.35rem;
  font-weight: 800;
  color: white;
  margin: 0;
  letter-spacing: -0.02em;
}

.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.merchant-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  
  .merchant-logo {
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 50%;
    object-fit: cover;
  }

  .merchant-name {
    font-size: 0.8rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}

.float-amount {
  font-size: 3.5rem;
  font-weight: 800;
  color: #94a3b8; // Stale gray
  text-decoration: line-through;
  opacity: 0.6;
  line-height: 1;
  letter-spacing: -0.04em;
  margin-bottom: 0.75rem;
}

.status-badge {
  font-size: 0.85rem;
  font-weight: 800;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
  padding: 0.4rem 1.15rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

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
  gap: 0.85rem;
}

.guide-step {
  display: flex;
  gap: 0.75rem;
  align-items: center;

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
  }

  &__content {
    flex: 1;
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.45;

    strong {
      color: white;
      font-weight: 800;
    }
  }
}

.disclaimers-card {
  padding: 0.25rem 0;
}

.disclaimers-text {
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.01em;
}

.footer-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.acknowledge-btn {
  height: 3.25rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.btn--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (min-height: 800px) {
  .active-content { gap: 1.75rem; }
}
</style>
