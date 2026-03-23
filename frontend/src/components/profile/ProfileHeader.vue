<script setup lang="ts">
defineProps<{
  avatar: string
  name: string
  memberSince: string
}>()
</script>

<template>
  <div class="profile-header">
    <img :src="avatar" alt="Avatar" class="avatar" />
    <div class="info">
      <h2 class="name">{{ name }}</h2>
      <p class="member-since">Member since {{ memberSince }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;

  .avatar {
    height: 4rem;
    width: 4rem;
    border-radius: 9999px;
    border: 2px solid var(--border);
    object-fit: cover;
  }

  .info {
    .name {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: hsl(218, 46%, 20%);
    }
    .member-since {
      font-size: 0.875rem;
      color: hsl(218, 20%, 46%);
      margin: 0;
    }
  }
}
</style>
