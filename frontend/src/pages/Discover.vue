<template>
  <div class="discover-page">
    <div class="feed">
      <TabCard
        v-for="tab in store.tabs"
        :key="tab.id"
        :tab="tab"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TabCard from '../components/TabCard.vue'
import { useTabsStore } from '../stores/tabs'

const store = useTabsStore()
</script>

<style lang="scss" scoped>
.discover-page {
  padding: 1rem;
}

.feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
