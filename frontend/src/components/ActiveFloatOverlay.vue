<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import * as fcl from '@onflow/fcl'
import { useFloatStore } from '../stores/float'
import { useAuthStore } from '../stores/auth'
import FloatActive from './float/FloatActive.vue'
import FloatConsumed from './float/FloatConsumed.vue'
import FloatExpired from './float/FloatExpired.vue'
import FloatDiscardModal from './float/FloatDiscardModal.vue'
import DemoPosButton from './demo-controls/DemoPosButton.vue'

const floatsStore = useFloatStore()
const authStore = useAuthStore()

const showDiscard = ref(false)
const isSimulatingJit = ref(false)
const isDiscarding = ref(false)
const tapError = ref<string | null>(null)

const handleDiscard = async () => {
  isDiscarding.value = true
  try {
    await floatsStore.discardFloat()
    showDiscard.value = false
  } finally {
    isDiscarding.value = false
  }
}

const isVisible = computed(() =>
  floatsStore.activeTab && ['ACTIVE', 'CONSUMED', 'EXPIRED'].includes(floatsStore.floatState)
)

// Prevent background scrolling when overlay is active
watch(isVisible, (val) => {
  if (val) document.body.style.overflow = 'hidden'
  else document.body.style.overflow = ''
}, { immediate: true })

const minutes = computed(() => Math.floor(floatsStore.ttlSeconds / 60))
const seconds = computed(() => floatsStore.ttlSeconds % 60)
const isUrgent = computed(() => floatsStore.ttlSeconds <= 120)

const overlayClass = computed(() => {
  if (floatsStore.floatState === 'CONSUMED') return 'bg-primary'
  if (floatsStore.floatState === 'EXPIRED') return 'bg-secondary'
  return 'bg-secondary'
})

const handleSimulateTap = async () => {
  if (!floatsStore.activeTab || !authStore.user) return
  isSimulatingJit.value = true
  tapError.value = null

  let unsubscribe: (() => void) | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const cleanup = () => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null }
    isSimulatingJit.value = false
  }

  try {
    // This call blocks on the backend until Stripe webhook fires and the
    // on-chain tx is sealed — then it returns the real txId.
    const res = await fetch('http://localhost:3001/api/simulate-tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantID: floatsStore.activeTab.id,
        flowAddress: authStore.user.address,
        amount: floatsStore.activeTab.floatValue
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Tap simulation failed')
    }

    const { txId } = await res.json()
    if (!txId) throw new Error('No txId returned from server')

    // 30s safety net in case the subscription stalls
    timeoutId = setTimeout(() => {
      cleanup()
      tapError.value = 'Card tap timed out. Please check with the merchant and try again.'
    }, 30_000)

    // Subscribe to this specific transaction — works on emulator + mainnet
    unsubscribe = fcl.tx(txId).subscribe((tx: any) => {
      if (fcl.tx.isSealed(tx)) {
        cleanup()
        floatsStore.consumeFloat()
      }
    })
  } catch (e: any) {
    cleanup()
    const raw: string = e?.message || 'Could not reach the payment network. Please try again.'
    const cadenceMatch = raw.match(/assertion failed:\s*(.+?)(?:\s*-->|$)/s) 
                      || raw.match(/error:\s*(.+?)(?:\s*-->|$)/s)
    tapError.value = cadenceMatch?.[1]?.trim() || raw.split('\n')[0]?.trim() || raw
  }
}


const handleExpiredAcknowledge = async () => {
  isDiscarding.value = true
  try {
    await floatsStore.discardFloat()
  } finally {
    isDiscarding.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isVisible" class="active-float-overlay" :class="overlayClass">
      <DemoPosButton
        v-if="floatsStore.floatState === 'ACTIVE'"
        :is-simulating="isSimulatingJit"
        @click="handleSimulateTap"
      />
      <div v-if="tapError" class="tap-error-toast" @click="tapError = null">
        ⚠️ {{ tapError }}
      </div>

      <div class="overlay-scroll-container">
        <FloatConsumed
          v-if="floatsStore.floatState === 'CONSUMED'"
          :floatValue="floatsStore.activeTab!.floatValue"
          :merchantName="floatsStore.activeTab!.merchantName"
          @done="floatsStore.setFloatState('IDLE')"
          @fund="floatsStore.triggerFundAction()"
        />

        <FloatExpired
          v-else-if="floatsStore.floatState === 'EXPIRED'"
          :merchantName="floatsStore.activeTab!.merchantName"
          :merchantLogo="floatsStore.activeTab!.merchantLogo"
          :floatValue="floatsStore.activeTab!.floatValue"
          :loading="isDiscarding"
          @discard="handleExpiredAcknowledge"
        />

        <template v-else>
          <FloatActive
            :merchantName="floatsStore.activeTab!.merchantName"
            :merchantLogo="floatsStore.activeTab!.merchantLogo"
            :floatValue="floatsStore.activeTab!.floatValue"
            :minutes="minutes"
            :seconds="seconds"
            :isUrgent="isUrgent"
            @discard="showDiscard = true"
          />
          <FloatDiscardModal
            v-if="showDiscard"
            :loading="isDiscarding"
            @keep="showDiscard = false"
            @discard="handleDiscard"
          />
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.active-float-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: var(--floats-navy);
  transition: background-color 0.5s ease;
  display: flex;
  flex-direction: column;

  &.bg-primary { background-color: var(--floats-teal); }
  &.bg-muted { background-color: var(--muted); }
}

.overlay-scroll-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.5rem 1rem;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

.tap-error-toast {
  position: absolute;
  top: 4rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(239, 68, 68, 0.9);
  color: white;
  font-size: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  white-space: nowrap;
  max-width: 90%;
  text-overflow: ellipsis;
  overflow: hidden;
  cursor: pointer;
  z-index: 10;
}
</style>
