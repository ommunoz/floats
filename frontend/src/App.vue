<template>
  <div class="app-layout">
    <!-- Main Content Area -->
    <SetupWarning v-if="authStore.isLoaded && authStore.hasSetupError" />
    <main v-else-if="authStore.isLoaded" class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import SetupWarning from './components/SetupWarning.vue'

const authStore = useAuthStore()

onMounted(() => {
  // Try to load the demo credentials dynamically on boot
  authStore.loadDemoUser()
})
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  width: 100%;
  position: relative;
  background-color: var(--background);
}
</style>
