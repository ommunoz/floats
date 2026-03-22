<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { X } from 'lucide-vue-next'
import type { Tab } from '../../stores/tabs'

const props = defineProps<{
  tab: Tab
  modelValue: number | string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: number | string): void
  (e: 'continue'): void
  (e: 'close'): void
}>()

const AMOUNTS = [5, 10, 25, 50, 100]
const customInputRef = ref<HTMLInputElement | null>(null)

const numericAmount = computed(() => {
  const parsed = typeof props.modelValue === 'string' ? parseFloat(props.modelValue) : props.modelValue
  return isNaN(parsed) || parsed < 0 ? 0 : parsed
})

const floatsFromAmount = computed(() => {
  const tabValue = props.tab?.floatValue || 5
  return Math.floor(numericAmount.value / tabValue)
})

const isValidAmount = computed(() => numericAmount.value >= 1)

onMounted(() => {
  nextTick(() => {
    if (customInputRef.value) customInputRef.value.focus()
  })
})

const handleBlur = () => {
  if (props.modelValue === '' || isNaN(Number(props.modelValue))) {
    emit('update:modelValue', 0)
  }
}

const selectPreset = (amt: number) => {
  emit('update:modelValue', amt)
}
</script>

<template>
  <div class="fund-view">
    <div class="sheet-header">
      <h2 class="sheet-title">Add to this Tab</h2>
      <button class="close-btn" @click="emit('close')">
        <X class="icon-sm" />
      </button>
    </div>

    <p class="fund-disclaimer">Every dollar fuels the community tab.</p>
    
    <div class="custom-amount-wrapper">
      <span class="currency-symbol">$</span>
      <input 
        ref="customInputRef"
        :value="modelValue" 
        @input="e => emit('update:modelValue', (e.target as HTMLInputElement).value)"
        type="number" 
        min="0"
        step="1"
        @blur="handleBlur"
        class="custom-amount-input"
      />
    </div>

    <div class="amount-presets">
      <button 
        v-for="amt in AMOUNTS" 
        :key="amt"
        @click="selectPreset(amt)"
        class="preset-btn"
        :class="{ active: Number(modelValue) === amt }"
      >
        ${{ amt }}
      </button>
    </div>

    <div class="impact-wrapper">
      <p v-if="floatsFromAmount > 0" class="impact-text">
        Unlocks {{ floatsFromAmount }} {{ floatsFromAmount === 1 ? "float" : "floats" }} for the community
      </p>
      <p v-else-if="numericAmount > 0" class="impact-text">
        Adds to the next float
      </p>
    </div>

    <button 
      @click="emit('continue')" 
      class="btn btn-primary w-full"
      :disabled="!isValidAmount"
    >
      Continue
    </button>
  </div>
</template>

<style scoped lang="scss">
.fund-view {
  padding: 1rem 1.5rem 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .sheet-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: var(--floats-navy);
  }

  .close-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--muted-foreground);
    padding: 0.25rem;
    border-radius: 9999px;

    &:hover { background: var(--muted); }
    .icon-sm { width: 1.25rem; height: 1.25rem; }
  }
}

.fund-disclaimer {
  text-align: center;
  font-size: 0.875rem;
  color: var(--muted-foreground);
  margin: 0 0 -0.5rem 0;
}

.custom-amount-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  margin-bottom: 0.5rem;
  
  .currency-symbol {
    font-size: 3rem;
    font-weight: 700;
    color: var(--foreground);
    margin-right: -0.25rem; 
    opacity: 0.8;
  }

  .custom-amount-input {
    font-size: 3rem;
    font-weight: 800;
    color: var(--floats-navy);
    background: transparent;
    border: none;
    outline: none;
    width: 8rem; 
    min-width: 4rem;
    padding: 0;
    margin: 0;
    text-align: center; 
    -moz-appearance: textfield;
    appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}

.amount-presets {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: -0.5rem;

  .preset-btn {
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
    border: 1px solid var(--border);
    transition: all 0.2s;
    background: white;
    color: var(--muted-foreground);
    cursor: pointer;

    &:hover { background: var(--muted); }
    
    &.active {
      background: var(--floats-orange);
      border-color: var(--floats-orange);
      color: white;
    }
  }
}

.impact-wrapper {
  min-height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.5rem 0 1rem 0;
}

.impact-text {
  font-size: 0.875rem;
  color: var(--floats-teal);
  font-weight: 600;
  text-align: center;
  margin: 0;
}

.w-full { width: 100%; }

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
  
  &:disabled { opacity: 0.7; cursor: not-allowed; }
}

.btn-primary {
  background: var(--floats-orange);
  color: white;
  gap: 0.5rem;
  &:not(:disabled):hover { background: #f06900; }
}
</style>
