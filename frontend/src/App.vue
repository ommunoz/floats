<template>
  <div class="app-layout">
    
    <!-- Top Navigation Bar -->
    <header class="app-header">
      <div class="header-container">
        
        <!-- Left: Wordmark -->
        <div class="wordmark-container">
          <RouterLink to="/" class="wordmark-link">
            <span class="logo-mark">f</span>
            floats
          </RouterLink>
        </div>

        <!-- Center: Feed/Map Pill -->
        <div v-if="$route.path === '/'" class="nav-pill-group">
           <span class="pill-item active">Feed</span>
           <span class="pill-item">Map</span>
        </div>

        <!-- Right: Profile Avatar Link -->
        <div class="avatar-container">
          <RouterLink to="/profile" class="avatar-link">
            <div class="avatar-fallback">O</div>
          </RouterLink>
        </div>

      </div>
    </header>

    <!-- Main Content Area -->
    <main class="app-main">
      <RouterView />
    </main>
    
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  border-bottom: 1px solid var(--border);
  background-color: var(--card); // White
}

.header-container {
  display: flex;
  height: 3.5rem; /* 56px (h-14) */
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  max-width: 28rem; /* 448px (max-w-md) */
  margin: 0 auto;
}

.wordmark-container {
  display: flex;
  align-items: center;
}

.wordmark-link {
  font-size: 1.125rem; /* text-lg */
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: 0.025em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-mark {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  background-color: var(--floats-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--card); /* white */
  font-size: 0.75rem;
  font-weight: bold;
}

.nav-pill-group {
  display: flex;
  background-color: hsla(210, 20%, 94%, 0.5); /* muted/50 */
  padding: 0.25rem;
  border-radius: 9999px;
  align-items: center;
  
  @media (max-width: 640px) {
    display: none; // hidden sm:flex
  }
}

.pill-item {
  padding: 0.375rem 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  color: var(--gray-400);

  &.active {
    background-color: var(--foreground);
    color: var(--card);
  }
}

.avatar-container {
  display: flex;
  align-items: center;
}

.avatar-link {
  height: 2.5rem;
  width: 2.5rem;
  overflow: hidden;
  border-radius: 9999px;
  box-shadow: 0 0 0 2px hsla(174, 100%, 35%, 0.2); // ring-primary/20
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    box-shadow: 0 0 0 2px hsla(174, 100%, 35%, 0.5);
  }
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom right, var(--floats-teal), hsla(174,100%,35%,0.6));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--card);
  font-weight: 700;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
  position: relative;
  background-color: var(--background);
}
</style>
