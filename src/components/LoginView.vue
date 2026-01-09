<script setup>
import { ref, onMounted } from 'vue'
import { cryptoService } from '../status/CryptoService'
import { socket } from '../socket'

const username = ref('')
const isLoading = ref(true)
const status = ref('Generating cryptographic keys...')
const hasKeys = ref(false)
const myPublicKeys = ref(null)

onMounted(async () => {
  try {
    myPublicKeys.value = await cryptoService.generateKeys()
    hasKeys.value = true
    isLoading.value = false
    status.value = 'Keys generated successfully.'
  } catch (e) {
    status.value = 'Error generating keys: ' + e.message
    console.error(e)
  }
})

const login = () => {
  if (!username.value || !hasKeys.value) return
  
  // Connect socket and emit join
  socket.connect()
  socket.emit('join', {
    username: username.value,
    publicKey: myPublicKeys.value
  })

  // Emit 'login-success' to parent to switch view
  emit('login-success', username.value)
}

const emit = defineEmits(['login-success'])

</script>

<template>
  <div class="login-card fade-in">
    <h2>Welcome to SecureChat</h2>
    <p class="status" :class="{ error: status.includes('Error') }">{{ status }}</p>
    
    <div v-if="hasKeys" class="input-area">
      <input 
        v-model="username" 
        type="text" 
        placeholder="Username" 
        @keyup.enter="login"
      />
      <button @click="login" :disabled="!username">Enter</button>
    </div>
  </div>
</template>

<style scoped>
.login-card {
  background: var(--color-surface);
  padding: 2.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  text-align: center;
  max-width: 420px;
  width: 100%;
  margin: 4rem auto 0;
  border: 1px solid var(--color-border);
}

h2 {
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  margin-bottom: 2rem;
}

.status {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  padding: 0.75rem;
  background: var(--color-bg);
  border-radius: 0.5rem;
}

.status.error {
  color: #b91c1c;
  background: #fef2f2;
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

input {
  padding: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

button {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
  padding: 0.875rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 1rem;
}

button:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: var(--color-text-muted);
}
</style>
