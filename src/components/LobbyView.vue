<script setup>
import { computed, ref, nextTick } from 'vue'
import { stringToColor, stringToTextColor } from '../util/color'

const props = defineProps({
  users: Array,
  myId: String
})

const emit = defineEmits(['connect'])
const searchQuery = ref('')
const isSearchOpen = ref(false)
const searchInputRef = ref(null)

const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value
  if (isSearchOpen.value) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  } else {
    searchQuery.value = '' // Clear search when closing
  }
}

const otherUsers = computed(() => {
  return props.users.filter(u => u.id !== props.myId)
})

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return otherUsers.value
  
  const query = searchQuery.value.toLowerCase()
  return otherUsers.value.filter(u => 
    u.username.toLowerCase().startsWith(query)
  )
})

const availableUsers = computed(() => {
  return filteredUsers.value.filter(u => u.status !== 'busy')
})

const unavailableUsers = computed(() => {
  return filteredUsers.value.filter(u => u.status === 'busy')
})
</script>

<template>
  <div class="lobby-card fade-in">
    <div class="lobby-header">
      <h3>Connected Users</h3>
      <div class="search-container">
        <input 
          ref="searchInputRef"
          v-model="searchQuery" 
          type="text" 
          class="search-input" 
          :class="{ 'active': isSearchOpen }"
          placeholder="Search..."
          @blur="!searchQuery && (isSearchOpen = false)" 
        />
        <button class="icon-btn" @click="toggleSearch" title="Search Users">
          🔍
        </button>
      </div>
    </div>

    <!-- MAIN CONTENT SCROLL AREA -->
    <div class="user-lists" v-if="otherUsers.length > 0">
      
      <!-- AVAILABLE SECTION -->
      <div v-if="availableUsers.length > 0" class="list-section">
        <h4 class="section-title">Available</h4>
        <ul>
          <li v-for="user in availableUsers" :key="user.id" class="user-item">
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
      </div>

      <!-- UNAVAILABLE SECTION -->
      <div v-if="unavailableUsers.length > 0" class="list-section">
        <h4 class="section-title muted">Unavailable</h4>
        <ul>
          <li v-for="user in unavailableUsers" :key="user.id" class="user-item disabled">
            <div class="user-info">
              <span 
                class="avatar grayscale"
                :style="{ 
                  backgroundColor: stringToColor(user.username),
                  color: stringToTextColor(user.username)
                }"
              >
                {{ user.username.charAt(0).toUpperCase() }}
              </span>
              <span class="name muted-text">{{ user.username }}</span>
            </div>
            <button disabled class="btn-busy">Unavailable</button>
          </li>
        </ul>
      </div>

      <!-- NO RESULTS -->
      <div v-if="availableUsers.length === 0 && unavailableUsers.length === 0" class="empty-search">
        <p>No users found starting with "{{ searchQuery }}"</p>
      </div>

    </div>

    <!-- EMPTY STATE (No other users at all) -->
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
  height: 600px; /* Fixed height for scrolling */
  display: flex;
  flex-direction: column;
}

h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.lobby-header {
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--color-bg);
}

.search-input {
  width: 0;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
}

.search-input.active {
  width: 180px;
  padding: 0.5rem 0.75rem;
  border-color: var(--color-border);
  background: var(--color-bg);
  opacity: 1;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: white;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.user-lists {
  flex: 1;
  overflow-y: auto;
}

.list-section {
  border-bottom: 1px solid var(--color-border);
}

.list-section:last-child {
  border-bottom: none;
}

.section-title {
  padding: 0.75rem 1.5rem;
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.section-title.muted {
  background: #f3f4f6;
}

.user-item.disabled {
  background: #f9fafb;
}

.avatar.grayscale {
  filter: grayscale(100%);
  opacity: 0.7;
}

.name.muted-text {
  color: var(--color-text-muted);
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

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  border-color: var(--color-border);
  color: var(--color-text-muted);
  background: var(--color-bg);
}

.btn-busy {
  font-style: italic;
  font-size: 0.8rem;
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
