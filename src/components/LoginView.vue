<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { cryptoService } from '../status/CryptoService'
import { socket } from '../socket'

const username = ref('')
const isLoading = ref(true)
const status = ref('Generating cryptographic keys...')
const hasKeys = ref(false)
const myPublicKeys = ref(null)
const showInfo = ref(false)

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

  // Listen for login responses
  socket.on('login_success', ({ username: confirmedName }) => {
    emit('login-success', confirmedName)
  })

  socket.on('login_error', ({ message }) => {
    status.value = `Error: ${message}`
    isLoading.value = false
  })
})

onUnmounted(() => {
  socket.off('login_success')
  socket.off('login_error')
})

const login = () => {
  if (!username.value || !hasKeys.value) return
  
  status.value = 'Connecting...'
  
  // Connect socket and emit join
  socket.connect()
  socket.emit('join', {
    username: username.value,
    publicKey: myPublicKeys.value
  })

  // We wait for server response now
}

const emit = defineEmits(['login-success'])

</script>

<template>
  <div class="login-view-wrapper">
    <div class="login-card fade-in">
      <h2>Welcome to P2PChat</h2>
      <div class="intro-text">
        <p>
          This is a fully anonymous, peer-to-peer chat application. 
          P2PChat offers private messaging functionality where your messages are end-to-end encrypted using keys generated right here in your browser. 
          No one—not even the server—can read your p2p messaging. 
          Once you reload or leave, your identity and keys are wiped forever.
        </p>
      </div>
      <p class="status" :class="{ error: status.includes('Error') }">{{ status }}</p>
      
      <div v-if="hasKeys" class="input-area">
        <input 
          v-model="username" 
          type="text" 
          placeholder="Username" 
          @keyup.enter="login"
        />
        <button @click="login" :disabled="!username">Enter</button>
        <p class="username-warning">
          Note: Your username is temporary. If you reload the page, you will lose your identity and current chats.
        </p>
      </div>

      <button class="btn-info" @click="showInfo = true">More Information</button>
    </div>

    <!-- INFO MODAL -->
    <transition name="fade">
      <div v-if="showInfo" class="modal-overlay" @click.self="showInfo = false">
        <div class="modal">
          <h3>Why P2PChat?</h3>
          <div class="info-content">
            <p>
              I built P2PChat because I was tired of chat services that require accounts, 
              store your personal data, and track your every move with cookies. 
              As a <strong>"no login chat"</strong>, privacy shouldn't be optional—it should be the default.
            </p>
            <h4>How it works</h4>
            <p>
              <strong>End-to-End Encryption:</strong> When you open this page, your browser generates a unique pair of cryptographic keys. 
              Your private key <em>never</em> leaves your device. Messages are encrypted on your device and can only be decrypted by your chat partner.
            </p>
            <p>
              <strong>No Database, No Logs:</strong> The server acts only as a relay. It blindly passes encrypted data between users without being able to read it. 
              We store no messages, no user profiles, and no history.
            </p>
            <p>
              <strong>Truly Ephemeral:</strong> Since there are no accounts, once you close this tab, your identity and keys are gone forever. 
              There is no "password recovery" because there is nothing to recover.
            </p>
          </div>
          <button class="btn-close" @click="showInfo = false">Close</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.login-view-wrapper {
  /* Default: just a block wrapper */
  width: 100%;
}

.login-card {
  background: var(--color-surface);
  padding: 2.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  text-align: center;
  max-width: 500px;
  width: 100%;
  margin: 4rem auto 0;
  border: 1px solid var(--color-border);
}

h2 {
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.intro-text {
  margin-bottom: 1.5rem;
  color: var(--color-text-main);
  font-size: 0.95rem;
  line-height: 1.5;
  padding: 0 1rem;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  margin-bottom: 2rem;
}

.status {
  color: var(--color-text-main);
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

.username-warning {
  font-size: 0.8rem;
  color: #92400e; /* Amber-800 */
  margin-top: 0.5rem;
  background: #fffbeb; /* Amber-50 */
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #fcd34d; /* Amber-300 */
  line-height: 1.4;
}

.btn-info {
  margin-top: 1.5rem;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem;
  border: 1px solid transparent;
}

.btn-info:hover {
  text-decoration: underline;
  color: var(--color-primary);
  background: transparent;
}

/* Modal Styles specific to this view */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--color-surface);
  padding: 2.5rem;
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 90%;
  box-shadow: var(--shadow-xl);
  text-align: left;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-top: 0;
  color: var(--color-primary);
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.info-content {
  color: var(--color-text-main);
  line-height: 1.6;
  font-size: 0.95rem;
}

.info-content h4 {
  margin: 1.5rem 0 0.5rem;
  color: var(--color-text-main);
  font-weight: 700;
}

.info-content p {
  margin-bottom: 1rem;
}

.btn-close {
  display: block;
  width: 100%;
  margin-top: 2rem;
  background: var(--color-bg);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
}

.btn-close:hover {
  background: #e5e7eb;
}

@media (max-width: 640px) {
  .login-view-wrapper {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-card {
    padding: 1.5rem;
    margin-top: 0;
    margin: 0;
  }
  
  .modal {
    padding: 1.5rem;
    width: 95%;
  }
  
  h2 {
    font-size: 1.3rem;
  }
}
</style>
