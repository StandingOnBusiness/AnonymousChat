<script setup>
import { computed } from 'vue'
import { stringToColor, stringToTextColor } from '../util/color'

const props = defineProps({
  users: Array,
  myId: String
})

const emit = defineEmits(['connect'])

const otherUsers = computed(() => {
  return props.users.filter(u => u.id !== props.myId)
})
</script>

<template>
  <div class="lobby-card fade-in">
    <h3>Connected Users</h3>
    <ul v-if="otherUsers.length > 0">
      <li v-for="user in otherUsers" :key="user.id" class="user-item">
        <div class="user-info">
          <span 
            class="avatar"
            :style="{ 
              backgroundColor: stringToColor(user.username),
              color: stringToTextColor(user.username)
            }"
          >
            {{ user.username.charAt(0).toUpperCase() }}
          </span>
          <span class="name">{{ user.username }}</span>
        </div>
        <button @click="emit('connect', user.id)">Connect</button>
      </li>
    </ul>
    <div v-else class="empty-state">
      <p>Waiting for other users...</p>
      <div class="loader"></div>
    </div>
  </div>
</template>

<style scoped>
.lobby-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

h3 {
  margin: 0;
  padding: 1.5rem;
  color: var(--color-text-main);
  background: white;
  border-bottom: 1px solid var(--color-border);
  font-size: 1.125rem;
  font-weight: 600;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.2s;
}

.user-item:hover {
  background: var(--color-bg);
}

.user-item:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  background: #e0e7ff;
  color: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.name {
  font-weight: 500;
  color: var(--color-text-main);
  font-size: 1rem;
}

button {
  background: white;
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-main);
  transition: all 0.2s;
}

button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: #eef2ff;
}

.empty-state {
  text-align: center;
  color: var(--color-text-muted);
  padding: 3rem;
}

.loader {
  border: 3px solid #e5e7eb;
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  animation: spin 1s linear infinite;
  margin: 1.5rem auto 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
