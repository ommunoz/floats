<script setup lang="ts">
import { MapPin } from 'lucide-vue-next'

defineProps<{
  merchantName: string
  address: string
  floatValue: number
}>()
</script>

<template>
  <div class="config-form">
    <header class="form-header">
      <h2 class="form-title">Tab Settings</h2>
      <p class="form-subtitle">Overview of the current tab configuration and merchant details.</p>
    </header>

    <div class="form-body">
      <div class="form-group">
        <label class="form-label">Merchant Identity</label>
        <div class="readonly-input">
          <span class="input-text">{{ merchantName }}</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Location Address</label>
        <div class="readonly-input">
          <MapPin :size="14" class="field-icon" />
          <span class="input-text">{{ address }}</span>
        </div>
      </div>

      <div class="row-grid">
        <div class="form-group">
          <label class="form-label">Float Value</label>
          <div class="readonly-input">
            <span class="input-text">${{ floatValue.toFixed(2) }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Geofence Radius</label>
          <div class="readonly-input">
            <span class="input-text">150 meters</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.config-form {
  .form-header {
    margin-bottom: 2rem;

    .form-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--foreground);
      margin: 0 0 0.25rem 0;
    }

    .form-subtitle {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin: 0;
      line-height: 1.5;
    }
  }

  .form-body {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--muted-foreground);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .readonly-input {
    background: var(--muted);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: 2.75rem;

    .input-text {
      font-size: 0.9rem;
      color: var(--foreground);
      font-weight: 500;
    }

    .field-icon {
      color: var(--muted-foreground);
      flex-shrink: 0;
    }
  }

  .row-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
}
</style>
