<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { getDisplayName } from '../utils/demoIdentities'

// Modular components
import VirtualCard from '../components/card/VirtualCard.vue'
import CardActions from '../components/card/CardActions.vue'
import UsageGuide from '../components/card/UsageGuide.vue'

const router = useRouter()
const auth = useAuthStore()

const activeProfile = computed(() => {
  return {
    name: auth.user ? getDisplayName(auth.user.address) : 'Guest'
  }
})

const goBack = () => router.back()
</script>

<template>
  <div class="card-page">
    <header class="header">
      <button @click="goBack" class="back-btn">
        <ArrowLeft class="icon" />
      </button>
      <h1 class="title">Floats Card</h1>
    </header>

    <div class="content">
      <div class="card-container">
        <VirtualCard :cardholder-name="activeProfile.name" />
        
        <div class="actions-wrapper">
          <CardActions />
          <UsageGuide />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-page {
  min-height: 100vh;
  background-color: hsl(218, 46%, 20%);
  color: #ffffff;
}

.header {
  position: sticky;
  top: 0;
  z-index: 30;
  background-color: hsla(218, 46%, 20%, 0.8);
  backdrop-filter: blur(8px);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .back-btn {
    padding: 0.25rem;
    border-radius: 9999px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .icon {
      width: 1.25rem;
      height: 1.25rem;
    }
  }

  .title {
    font-weight: 600;
    font-size: 1.125rem;
    margin: 0;
  }
}

.content {
  padding: 2rem 1rem;
  max-width: 28rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-container {
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.actions-wrapper {
  margin-top: 2rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>

