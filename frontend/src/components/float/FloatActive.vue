<script setup lang="ts">
import { Ticket, Plus } from 'lucide-vue-next'

defineProps<{
  merchantName: string
  merchantLogo: string
  floatValue: number
  minutes: number
  seconds: number
  isUrgent: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'discard'): void
}>()
</script>

<template>
  <div class="active-content">
    <!-- Header -->
    <div class="header-section">
      <div class="voucher-icon-orb">
        <Ticket :size="32" />
      </div>
      <h2 class="voucher-heading">Float claimed!</h2>
    </div>

    <!-- Hero Card -->
    <div class="hero-section">
      <div class="merchant-badge">
        <img :src="merchantLogo" alt="" class="merchant-logo" />
        <span class="merchant-name">{{ merchantName }}</span>
      </div>
      <div class="float-amount" :class="{ 'float-amount--urgent': isUrgent }">
        ${{ floatValue }}.00
      </div>
      <div class="timer-display" :class="{ 'urgent': isUrgent }">
        <span v-if="isUrgent">Expiring soon: </span>
        <span v-else>Valid for </span>
        {{ String(minutes).padStart(2, '0') }}:{{ String(seconds).padStart(2, '0') }}
      </div>
    </div>

    <!-- Main Container for Guide & Rules -->
    <div class="info-container">
      <div class="usage-guide">
        <h3 class="guide-title">How to use</h3>
        
        <div class="guide-steps">
          <!-- Step 1 -->
          <div class="guide-step">
            <div class="guide-step__marker">1</div>
            <div class="guide-step__content">
              Add the <strong>Floats card</strong> to your phone wallet:
            </div>
          </div>
          
          <button class="btn btn--primary btn--full wallet-btn">
            <Plus :size="18" />
            Add to Wallet
          </button>

          <!-- Step 2 -->
          <div class="guide-step">
            <div class="guide-step__marker">2</div>
            <div class="guide-step__content">
              Make sure your total is <strong>${{ floatValue }}.00</strong> or under.
            </div>
          </div>

          <!-- Step 3 -->
          <div class="guide-step">
            <div class="guide-step__marker">3</div>
            <div class="guide-step__content">
              At the register, <strong>tap your phone</strong> to pay with the Floats card.
            </div>
          </div>
        </div>
      </div>

      <!-- Simplified Rules Row -->
      <div class="disclaimers-card">
        <div class="disclaimers-text">
          Single purchase up to ${{ floatValue }}.00. No split payments.
        </div>
      </div>
    </div>

    <!-- Final Actions Section -->
    <div class="footer-actions">
      <button class="btn discard-btn btn--full" @click="emit('discard')">
        Discard Float
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
  background: rgba(255, 255, 255, 0.1);
  color: white;
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
  font-size: 3.5rem; // Reduced for mobile
  font-weight: 800;
  color: white;
  line-height: 1;
  letter-spacing: -0.04em;
  margin-bottom: 0.75rem;
  &--urgent { animation: pulse 1s infinite; }
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
  gap: 0.85rem; // Reduced gap between steps
}

.guide-step {
  display: flex;
  gap: 0.75rem; // Reduced gap between bullet and text
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
    color: white;
    line-height: 1.45;

    strong {
      color: var(--floats-teal);
      font-weight: 800;
    }
  }
}

.wallet-btn {
  height: 2.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 0.85rem;
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

.discard-btn {
  background: transparent;
  border: none;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: underline;
  text-underline-offset: 4px;
  &:hover { color: white; }
}

.timer-display {
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.08);
  padding: 0.4rem 1.15rem;
  border-radius: 9999px;
  
  &.urgent {
    color: #ff4d4d;
    background: rgba(255, 77, 77, 0.15);
  }
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }

@media (min-height: 800px) {
  .active-content { gap: 1.75rem; }
}
</style>
