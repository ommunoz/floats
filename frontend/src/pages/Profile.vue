<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { getAvatarUrl, getDisplayName } from '../utils/demoIdentities'
import { getUserStats, getUserHistory, type UserStats, type UserHistoryItem } from '../services/profile'

// Modular components
import ProfileHeader from '../components/profile/ProfileHeader.vue'
import ProfileStats from '../components/profile/ProfileStats.vue'
import ProfileCardLink from '../components/profile/ProfileCardLink.vue'
import ProfileActivity from '../components/profile/ProfileActivity.vue'

const router = useRouter()
const auth = useAuthStore()

const stats = ref<UserStats>({ tabsBacked: 0, floatsGrabbed: 0 })
const historyItems = ref<UserHistoryItem[]>([])
const isLoading = ref(true)

const activeProfile = computed(() => {
  if (!auth.user) return null
  return {
    name: getDisplayName(auth.user.address),
    avatar: getAvatarUrl(auth.user.address),
    memberSince: "Jan 2025", 
    tabsBacked: stats.value.tabsBacked,
    floatsGrabbed: stats.value.floatsGrabbed
  }
})

onMounted(async () => {
  if (auth.user?.address) {
    try {
      const [s, h] = await Promise.all([
        getUserStats(auth.user.address),
        getUserHistory(auth.user.address)
      ])
      stats.value = s
      historyItems.value = h
    } catch(e) {
      console.error("Failed to load profile data:", e)
    } finally {
      isLoading.value = false
    }
  } else {
    isLoading.value = false
  }
})

const goBack = () => router.back()
const goCard = () => router.push('/card')
</script>

<template>
  <div class="profile-page">
    <header class="header">
      <button @click="goBack" class="back-btn">
        <ArrowLeft class="icon" />
      </button>
      <h1 class="title">Profile</h1>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>Loading profile...</p>
    </div>

    <div v-else-if="activeProfile" class="content">
      <ProfileHeader 
        :avatar="activeProfile.avatar" 
        :name="activeProfile.name" 
        :member-since="activeProfile.memberSince" 
      />

      <ProfileStats 
        :floats-grabbed="activeProfile.floatsGrabbed" 
        :tabs-backed="activeProfile.tabsBacked" 
      />

      <ProfileCardLink :on-click="goCard" />

      <ProfileActivity :items="historyItems" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background-color: var(--background);
  color: var(--foreground);
}

.header {
  position: sticky;
  top: 0;
  z-index: 30;
  background-color: hsl(var(--background) / 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid transparent;
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

    &:hover {
      background-color: var(--muted);
    }
    
    .icon {
      width: 1.25rem;
      height: 1.25rem;
      color: var(--foreground);
    }
  }

  .title {
    font-weight: 600;
    font-size: 1.125rem;
    margin: 0;
  }
}

.loading-state {
  padding: 2rem;
  text-align: center;
  color: var(--muted-foreground);
  font-size: 0.875rem;
}

.content {
  padding: 1.5rem 1rem;
  max-width: 28rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>

