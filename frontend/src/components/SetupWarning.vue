<script setup lang="ts">
import { AlertCircle, Terminal } from 'lucide-vue-next'
</script>

<template>
  <div class="setup-warning-page">
    <div class="warning-card">
      <div class="icon-pulse-wrapper">
        <AlertCircle class="alert-icon" />
      </div>

      <h1 class="warning-title">Demo Setup Required</h1>
      <p class="warning-desc">
        We couldn't find your demo user credentials. To run the Floats demo, you need to execute the backend seed script first.
      </p>

      <div class="code-block">
        <Terminal class="term-icon" />
        <code>npm run seed</code>
      </div>

      <p class="warning-footer">
        Run this command at the root of the project, then restart your Vite server.
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.setup-warning-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background);
  padding: 1.5rem;
}

.warning-card {
  max-width: 28rem;
  width: 100%;
  background: white;
  border-radius: 1.25rem;
  padding: 2.5rem 2rem;
  text-align: center;
  border: 1px solid var(--border);
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-pulse-wrapper {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: rgba(249, 115, 22, 0.1); // floats-orange with opacity
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  animation: pulse 2s infinite;

  .alert-icon {
    width: 2rem;
    height: 2rem;
    color: var(--floats-orange);
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(249, 115, 22, 0); }
  100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
}

.warning-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--floats-navy);
  margin: 0 0 0.75rem 0;
}

.warning-desc {
  color: var(--muted-foreground);
  font-size: 0.9375rem;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.code-block {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--floats-navy);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  width: 100%;
  justify-content: center;

  .term-icon { width: 1.25rem; height: 1.25rem; opacity: 0.7; }
  code { font-family: monospace; font-size: 1rem; font-weight: 600; letter-spacing: 0.05em; }
}

.warning-footer {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  margin: 0;

  .badge {
    background: var(--muted);
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--foreground);
    border: 1px solid var(--border);
  }
}
</style>
