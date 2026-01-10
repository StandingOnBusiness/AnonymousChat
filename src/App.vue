<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { socket } from './socket'
import { cryptoService } from './status/CryptoService'
import { useToast } from './util/toast'

import LoginView from './components/LoginView.vue'
import LobbyView from './components/LobbyView.vue'
import ChatView from './components/ChatView.vue'
import ToastContainer from './components/ToastContainer.vue'
import TextEditorView from './components/TextEditorView.vue'

// --- STATE ---
const view = ref('login') // 'login', 'lobby', 'chat'
const myUsername = ref('')
const connectedUsers = ref([])

const toast = useToast()

// Chat State
const chatPartner = ref(null) // { id, name, publicKey }
const messages = ref([]) // Array of msg objects
const incomingRequest = ref(null) // { requesterId, requesterName, requesterPublicKey }
const isPartnerTyping = ref(false)
let typingTimeout = null

// --- SOCKET EVENTS ---

// --- SOCKET EVENTS ---

onMounted(() => {
  // Simple "Routing" check
  if (window.location.pathname === '/text-editor') {
    view.value = 'text-editor'
    return
  }

  // 1. User List Update
  socket.on('update_users', (users) => {
    connectedUsers.value = users
  })

  // 2. Incoming Connection Request
  socket.on('connection_request', (req) => {
    // req: { requesterId, requesterName, requesterPublicKey }
    incomingRequest.value = req
  })

  // 3. Chat Started (Accepted)
  socket.on('chat_started', (partnerInfo) => {
    // partnerInfo: { partnerId, partnerName, partnerPublicKey }
    startChat(partnerInfo)
    toast.success(`Secure connection established with ${partnerInfo.partnerName}`)
  })

  // 4. Receive Message
  socket.on('private_message', async ({ senderId, encryptedPayload }) => {
    if (!chatPartner.value || senderId !== chatPartner.value.id) return

    // Hide typing indicator immediately on new message
    isPartnerTyping.value = false

    try {
      // Decrypt & Verify Signature
      const plaintext = await cryptoService.decryptAndVerify(
        encryptedPayload,
        chatPartner.value.publicKey
      )
      
      messages.value.push({
        id: Date.now(),
        sender: 'partner',
        text: plaintext,
        timestamp: Date.now()
      })
    } catch (err) {
      console.error("Verification Failed:", err)
      messages.value.push({
        id: Date.now(),
        sender: 'partner',
        text: "CORRUPT MESSAGE OR INVALID SIGNATURE",
        error: true,
        timestamp: Date.now()
      })
      toast.error("Signature verification error!")
    }
  })

  // 5. Partner Typing
  socket.on('partner_typing', ({ senderId }) => {
    if (!chatPartner.value || senderId !== chatPartner.value.id) return
    
    isPartnerTyping.value = true
    
    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      isPartnerTyping.value = false
    }, 3000)
  })

  // 6. Partner Left (Explicit exit)
  socket.on('partner_left', ({ senderId }) => {
    if (chatPartner.value && senderId === chatPartner.value.id) {
      toast.info(`${chatPartner.value.name} has left the chat.`)
      // Ensure we close immediately
      closeChat()
    }
  })
})

// Check if partner disconnected via user list update
watch(connectedUsers, (newUsers) => {
  if (view.value === 'chat' && chatPartner.value) {
    const partnerStillOnline = newUsers.find(u => u.id === chatPartner.value.id)
    if (!partnerStillOnline) {
      toast.error(`Lost connection with ${chatPartner.value.name}.`)
      closeChat()
    }
  }
})

// --- ACTIONS ---

const handleLoginSuccess = (username) => {
  myUsername.value = username
  view.value = 'lobby'
  toast.success(`Welcome, ${username}!`)
}

const handleConnectRequest = (targetId) => {
  socket.emit('request_connect', { targetId })
  toast.info("Connection request sent...")
}

const acceptRequest = () => {
  if (!incomingRequest.value) return
  
  const { requesterId, requesterName, requesterPublicKey } = incomingRequest.value
  
  socket.emit('accept_connect', { requesterId })
  
  startChat({
    partnerId: requesterId,
    partnerName: requesterName,
    partnerPublicKey: requesterPublicKey
  })
  
  incomingRequest.value = null
  toast.success(`Chat started with ${requesterName}`)
}

const rejectRequest = () => {
  incomingRequest.value = null
  toast.info("Request rejected.")
}

const startChat = (partnerInfo) => {
  chatPartner.value = {
    id: partnerInfo.partnerId,
    name: partnerInfo.partnerName,
    publicKey: partnerInfo.partnerPublicKey
  }
  messages.value = []
  view.value = 'chat'
}

const closeChat = () => {
  chatPartner.value = null
  messages.value = []
  isPartnerTyping.value = false
  view.value = 'lobby'
}

const handleLeaveChat = () => {
  if (chatPartner.value) {
    socket.emit('leave_chat', { targetId: chatPartner.value.id })
    // Close my side immediately
    closeChat()
    toast.info("You have left the chat.")
  }
}

const handleEmitTyping = () => {
  if (chatPartner.value) {
    socket.emit('typing', { targetId: chatPartner.value.id })
  }
}

const handleSendMessage = async (text) => {
  if (!chatPartner.value) return

  try {
    // Encrypt & Sign
    const encryptedPackage = await cryptoService.signAndEncrypt(
      text,
      chatPartner.value.publicKey
    )

    // Emit
    socket.emit('private_message', {
      targetId: chatPartner.value.id,
      encryptedPayload: encryptedPackage
    })

    // Add to UI
    messages.value.push({
      id: Date.now(),
      sender: 'me',
      text: text,
      timestamp: Date.now()
    })

  } catch (e) {
    console.error("Send Error", e)
    toast.error("Error sending message: " + e.message)
  }
}

// Helper to get my socket ID
const myId = ref(socket.id)

onMounted(() => {
  // Update socket ID if it changes (e.g. reconnect)
  socket.on('connect', () => {
    myId.value = socket.id
  })
})

import { stringToColor, stringToTextColor } from './util/color'
</script>

<template>
  <div class="app-layout">
    <ToastContainer />
    <!-- APP HEADER -->
    <header class="main-header">
      <div class="brand">
        <img src="/p2p-logo.png" alt="P2P Chat Logo" class="logo-icon" />
        <h1 class="gradient-text">P2PChat</h1>
      </div>
      <div v-if="myUsername" class="user-profile">
        <span 
          class="avatar-sm"
          :style="{ 
            backgroundColor: stringToColor(myUsername),
            color: stringToTextColor(myUsername)
          }"
          :title="myUsername"
        >
          {{ myUsername.charAt(0).toUpperCase() }}
        </span>
        <span class="username">{{ myUsername }}</span>
      </div>
    </header>

    <main class="app-container" :class="{ 'fluid-container': view === 'text-editor' }">
      <!-- MODAL -->
      <transition name="fade">
        <div v-if="incomingRequest" class="modal-overlay">
          <div class="modal">
            <h3>New Request</h3>
            <p><strong>{{ incomingRequest.requesterName }}</strong> wants to chat with you.</p>
            <div class="modal-actions">
              <button @click="rejectRequest" class="btn-secondary">Reject</button>
              <button @click="acceptRequest" class="btn-primary">Accept</button>
            </div>
          </div>
        </div>
      </transition>

      <!-- VIEWS -->
      <transition name="slide-fade" mode="out-in">
        <TextEditorView v-if="view === 'text-editor'" />

        <LoginView 
          v-else-if="view === 'login'"
          @login-success="handleLoginSuccess"
        />

        <LobbyView 
          v-else-if="view === 'lobby'"
          :users="connectedUsers"
          :myId="myId"
          @connect="handleConnectRequest"
        />

        <ChatView 
          v-else-if="view === 'chat'"
          :partnerName="chatPartner?.name"
          :messages="messages"
          :isTyping="isPartnerTyping"
          @send="handleSendMessage"
          @typing="handleEmitTyping"
          @back="handleLeaveChat" 
        />
      </transition>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand h1 {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
}

.logo-icon {
  height: 38px;
  width: auto;
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  background: var(--color-bg);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
}

.username {
  font-weight: 500;
  color: var(--color-text-main);
}

.app-container {
  flex: 1;
  max-width: 800px; /* Wider for pro feel */
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.app-container.fluid-container {
  max-width: 98vw;
  padding: 1rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--color-surface);
  padding: 2rem;
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 360px;
  text-align: center;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
}

.modal h3 { 
  margin-top: 0;
  color: var(--color-text-main);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: white;
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--color-bg);
  border-color: var(--color-text-muted);
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from {
  transform: translateY(20px);
  opacity: 0;
}
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

@media (max-width: 640px) {
  /* Lock Layout on Mobile */
  .app-layout {
    height: 100vh;
    overflow: hidden;
    min-height: unset;
  }
  
  .app-container {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 1rem 0.5rem;
    height: 100%;
  }

  .main-header {
    padding: 0.75rem 1rem;
  }
  
  .brand h1 {
    font-size: 1.25rem;
  }
  
  .logo-icon {
    height: 32px;
  }
  
  .app-container {
    padding: 1rem 0.5rem;
  }
}
</style>
