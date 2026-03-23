<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import * as fcl from '@onflow/fcl'
import { useAuthStore } from '../stores/auth'
import type { Tab } from '../stores/tabs'

// Subcomponents
import FundAmountStep from './fund/FundAmountStep.vue'
import FundCheckoutStep from './fund/FundCheckoutStep.vue'
import FundSuccessStep from './fund/FundSuccessStep.vue'

const props = defineProps<{
  tab: Tab
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'funded', amount: number): void
}>()

const authStore = useAuthStore()

// Shared State
const step = ref<'amount' | 'checkout' | 'success'>('amount')
const selectedAmount = ref<number | string>(5)
const note = ref('')
const isProcessing = ref(false)
const errorMessage = ref('')
const isCopied = ref(false)
const showQuote = ref(false)

// Computed
const numericAmount = computed(() => {
  const parsed = typeof selectedAmount.value === 'string' ? parseFloat(selectedAmount.value) : selectedAmount.value
  return isNaN(parsed) || parsed < 0 ? 0 : parsed
})

const floatsFromAmount = computed(() => {
  const tabValue = props.tab?.floatValue || 5
  return Math.floor(numericAmount.value / tabValue)
})

const shareText = computed(() => {
  const url = window.location.href.split('?')[0]
  return `I just added $${numericAmount.value} to the community tab at ${props.tab?.merchantName}! Anyone nearby can grab a float → ${url}`
})

// Lifecycle
onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

// Actions
const handleFund = async () => {
  if (!props.tab) return
  isProcessing.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('http://localhost:3001/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: numericAmount.value * 100,
        merchantID: props.tab.id,
        flowAddress: authStore.user?.address
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to create payment')

    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    if (!stripe) throw new Error('Stripe failed to load')

    const { paymentIntent, error } = await stripe.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: { token: 'tok_visa' },
        billing_details: { name: authStore.user?.name || 'Demo User' }
      }
    })

    if (error) throw new Error(error.message)

    // Wait for the backend webhook to process the flow deposit
    const waitRes = await fetch('http://localhost:3001/api/wait-for-deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId: paymentIntent.id })
    })
    
    if (!waitRes.ok) {
      const errData = await waitRes.json().catch(() => ({}))
      throw new Error(errData.error || 'Blockchain deposit failed')
    }

    const { txId } = await waitRes.json()

    // Wait for transaction to seal on-chain
    await new Promise<void>((resolve, reject) => {
      fcl.tx(txId).subscribe((tx: any) => {
        if (fcl.tx.isSealed(tx)) {
          resolve()
        } else if (tx.errorMessage) {
          reject(new Error(tx.errorMessage))
        }
      })
    })

    step.value = 'success'
    emit('funded', numericAmount.value)
  } catch (err: any) {
    console.error('Funding failed:', err)
    errorMessage.value = err.message || 'Payment failed. Please try again.'
  } finally {
    isProcessing.value = false
  }
}

const handleShare = async () => {
  showQuote.value = true
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Yurny - Floats',
        text: shareText.value,
        url: window.location.href
      })
    } catch (err) {
      console.error('Share failed:', err)
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareText.value)
      isCopied.value = true
      setTimeout(() => { isCopied.value = false }, 2000)
    } catch (err) {
      console.error('Clipboard failed:', err)
    }
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="fund-sheet-overlay">
    <div class="fund-sheet">
      <!-- Handle bar -->
      <div class="sheet-handle" @click="handleClose">
        <div class="handle-bar"></div>
      </div>

      <FundSuccessStep
        v-if="step === 'success'"
        :tab="tab"
        :numeric-amount="numericAmount"
        :floats-from-amount="floatsFromAmount"
        :share-text="shareText"
        :is-copied="isCopied"
        :show-quote="showQuote"
        @share="handleShare"
        @close="handleClose"
      />

      <FundCheckoutStep
        v-else-if="step === 'checkout'"
        v-model="note"
        :tab="tab"
        :numeric-amount="numericAmount"
        :is-processing="isProcessing"
        :error-message="errorMessage"
        @back="step = 'amount'"
        @pay="handleFund"
        @close="handleClose"
      />

      <FundAmountStep
        v-else
        v-model="selectedAmount"
        :tab="tab"
        @continue="step = 'checkout'"
        @close="handleClose"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.fund-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 50;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fund-sheet {
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
  max-height: 85vh;
  background: white;
  border-radius: 1.25rem 1.25rem 0 0;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.sheet-handle {
  padding: 1rem 0 0.5rem 0;
  display: flex;
  justify-content: center;
  cursor: pointer;

  .handle-bar {
    width: 2.5rem;
    height: 0.25rem;
    border-radius: 9999px;
    background: var(--muted-foreground);
    opacity: 0.3;
  }
}
</style>
