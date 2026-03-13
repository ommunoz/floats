<script setup lang="ts">
import { Check, X, Share2 } from 'lucide-vue-next'
import type { Tab } from '../../stores/tabs'

defineProps<{
  tab: Tab
  numericAmount: number
  floatsFromAmount: number
  shareText: string
  isCopied: boolean
  showQuote: boolean
}>()

const emit = defineEmits<{
  (e: 'share'): void
  (e: 'close'): void
}>()
</script>

<template>
  <div class="success-view">
    <div class="success-header">
      <button class="close-btn success-close" @click="emit('close')">
        <X class="icon-sm" />
      </button>
    </div>

    <div class="success-content">
      <div class="success-icon-wrapper">
        <Check class="icon-lg" />
      </div>
      <h3 class="success-subtitle">
        You just added ${{ numericAmount }} to the tab at {{ tab?.merchantName }}
      </h3>
      <p v-if="floatsFromAmount > 0" class="success-impact">
        That's {{ floatsFromAmount }} {{ floatsFromAmount === 1 ? "float" : "floats" }} for the community
      </p>
      <p v-else class="success-impact">
        Your contribution helps fuel the next float
      </p>

      <div v-if="showQuote" class="share-quote">
        <div class="quote-content">{{ shareText }}</div>
      </div>

      <div class="success-actions">
        <button @click="emit('share')" class="btn btn-primary w-full share-action-btn">
          <Share2 v-if="!isCopied" class="icon-btn-sm" />
          <span>{{ isCopied ? "Copied to clipboard!" : "Spread the word" }}</span>
        </button>

        <button @click="emit('close')" class="btn btn-ghost done-btn">
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.success-view {
  background: var(--floats-orange);
  color: white;
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  overflow: hidden;

  .success-header {
    display: flex;
    justify-content: flex-end;
    padding: 0.75rem;
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    z-index: 10;
  }

  .success-content {
    min-height: 30rem;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .success-close {
    color: white !important;
    opacity: 0.6;
    background: transparent !important;
    padding: 0.5rem;
    border-radius: 9999px;
    transition: all 0.2s;
    &:hover { background: rgba(255, 255, 255, 0.15) !important; opacity: 1; }
  }
}

.success-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  .icon-lg { width: 1.75rem; height: 1.75rem; }
}

.success-subtitle {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.25;
  letter-spacing: -0.01em;
  text-align: center;
}

.success-impact {
  font-size: 0.9375rem;
  opacity: 0.9;
  margin: 0 0 1rem 0;
  font-weight: 400;
  text-align: center;
}

.share-quote {
  width: 100%;
  background: rgba(255, 255, 255, 0.12);
  border-left: 3px solid rgba(255, 255, 255, 0.3);
  padding: 0.875rem 1rem;
  border-radius: 0.375rem;
  margin: 0.75rem 0 1.25rem 0;
  text-align: left;

  .quote-content {
    font-size: 0.875rem;
    line-height: 1.4;
    font-style: italic;
    color: white;
    opacity: 0.9;
    word-break: break-word;
  }
}

.success-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn {
  height: 3rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-primary {
  background: var(--floats-orange);
  color: white;
  gap: 0.5rem;
  &:not(:disabled):hover { background: #f06900; }
}

.share-action-btn {
  background: white !important;
  color: var(--floats-orange) !important;
  margin-bottom: 0.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  &:hover { background: rgba(255, 255, 255, 0.9) !important; }
  .icon-btn-sm { width: 1.125rem; height: 1.125rem; }
}

.done-btn {
  color: white !important;
  font-size: 0.9375rem;
  font-weight: 600;
  padding: 0 1.5rem !important;
  background: transparent !important;
  opacity: 0.8;
  transition: all 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.1) !important; opacity: 1; }
}

.btn-ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  gap: 0.5rem;
  font-size: 0.875rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.w-full { width: 100%; }
.icon-sm { width: 1.25rem; height: 1.25rem; }
</style>
