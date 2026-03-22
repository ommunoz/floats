<script setup lang="ts">
import { ref } from 'vue'
import { Check, Heart, X } from 'lucide-vue-next'

defineProps<{
  floatValue: number
  merchantName: string
}>()

const emit = defineEmits<{
  (e: 'done'): void
  (e: 'fund'): void
}>()

const thankYouNote = ref('')
const noteSaved = ref(false)

const handleSaveNote = () => {
  if (thankYouNote.value.trim()) {
    noteSaved.value = true
  }
}
</script>

<template>
  <div class="consumed-container">
    <button class="close-btn" @click="emit('done')">
      <X :size="24" />
    </button>

    <div class="consumed-content">
      <div class="success-icon">
        <div class="success-icon__circle">
          <Check class="success-icon__check" />
        </div>
      </div>

      <h2 class="title" v-if="merchantName">You grabbed a float at {{ merchantName }}</h2>
      <h2 class="title" v-else>You grabbed a float</h2>

      <div class="note-card">
        <p class="note-card__title">Add a thank you note</p>
        <textarea
          v-if="!noteSaved"
          v-model="thankYouNote"
          placeholder="Leave a quick note for the community..."
          rows="1"
          class="note-textarea"
        ></textarea>
        <p v-else class="saved-note-text">"{{ thankYouNote }}"</p>
        
        <button 
          v-if="!noteSaved"
          class="save-btn" 
          :disabled="!thankYouNote.trim()"
          @click="handleSaveNote"
        >
          Save
        </button>
        <div v-else class="note-saved-badge">
          <Check :size="16" /> Saved to the wall!
        </div>
      </div>

      <div class="pay-forward-card">
        <div class="pay-forward-header">
          <Heart :size="16" fill="currentColor" />
          <span>Pay it forward?</span>
        </div>
        <p class="pay-forward-sub">Add to the tab and keep the cycle going</p>
        
        <button class="fund-btn" @click="emit('fund')">
          Add to this tab
        </button>
      </div>
      
      <button class="maybe-later-btn" @click="emit('done')">
        Maybe later
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.consumed-container {
  min-height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  color: white;
  position: relative;
  animation: fadeIn 0.4s ease-out;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  opacity: 0.6;
  padding: 0.5rem;
  transition: opacity 0.2s;
  z-index: 10;
  &:hover { opacity: 1; }
}

.consumed-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}

.success-icon {
  margin-bottom: 0.75rem;
  
  &__circle {
    width: 4rem;
    height: 4rem;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &__check {
    width: 2.25rem;
    height: 2.25rem;
    color: var(--floats-teal, #00BFA5);
  }
}

.title {
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.25rem;
  line-height: 1.3;
}

.note-card {
  background: white;
  border-radius: 1rem;
  width: 100%;
  padding: 1.25rem;
  color: #1a1a1a;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.25rem;

  &__title {
    font-weight: 800;
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.note-textarea {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  margin-bottom: 0.75rem;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;
  &::placeholder { color: #9ca3af; }
  &:focus {
    outline: none;
    border-color: var(--floats-teal, #00BFA5);
  }
}

.save-btn {
  width: 100%;
  background: var(--floats-teal, #00BFA5);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-weight: 700;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #00a892; }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.note-saved-badge {
  text-align: center;
  color: var(--floats-teal, #00BFA5);
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.saved-note-text {
  font-style: italic;
  color: #4b5563;
  margin-bottom: 0.75rem;
  text-align: center;
  font-size: 0.9375rem;
  line-height: 1.4;
}

.pay-forward-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 1.5rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.pay-forward-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 800;
  color: white;
}

.pay-forward-sub {
  font-size: 0.8125rem;
  opacity: 0.6;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.fund-btn {
  width: 100%;
  background: #ff7f11;
  color: white;
  border: none;
  border-radius: 0.85rem;
  padding: 0.875rem;
  font-weight: 800;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
  &:hover { background: #e6720f; transform: translateY(-1px); }
  &:active { transform: scale(0.98); }
}

.maybe-later-btn {
  background: transparent;
  border: none;
  color: white;
  font-weight: 600;
  opacity: 0.7;
  cursor: pointer;
  padding: 0.75rem;
  font-size: 0.875rem;
  &:hover { opacity: 1; text-decoration: underline; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
