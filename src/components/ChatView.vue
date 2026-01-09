<script setup>
import { ref, nextTick, watch } from 'vue'

const props = defineProps({
  partnerName: String,
  messages: Array, // { id, sender: 'me'|'partner', text, error?: boolean }
  isTyping: Boolean
})

const emit = defineEmits(['send', 'back', 'typing'])
const newMessage = ref('')
const messagesContainer = ref(null)

let typingTimeout = null

const handleInput = () => {
  emit('typing')
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  emit('send', newMessage.value)
  newMessage.value = ''
}

// Auto-scroll to bottom
watch(() => props.messages.length, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})

const formatTime = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="chat-card fade-in">
    <header>
      <button @click="emit('back')" class="btn-back">←</button>
      <div class="header-info">
        <h3>{{ partnerName }}</h3>
        <div class="status-badge">
          <span class="dot"></span> E2E Encryption
        </div>
      </div>
    </header>
    
    <div class="messages" ref="messagesContainer">
      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        class="message-bubble"
        :class="{ 'sent': msg.sender === 'me', 'received': msg.sender === 'partner', 'error': msg.error }"
      >
        <span v-if="msg.error" class="warning-icon">⚠️</span>
        {{ msg.text }}
        <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
      </div>
      <div v-if="messages.length === 0" class="start-msg">
        Start secure conversation with {{ partnerName }}
      </div>
    </div>

    <div v-if="isTyping" class="typing-indicator">
      <span>{{ partnerName }} is typing...</span>
    </div>

    <div class="input-area">
      <textarea 
        v-model="newMessage" 
        placeholder="Type an encrypted message..."
        @input="handleInput"
        @keyup.enter.exact.prevent="sendMessage"
      ></textarea>
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<style scoped>
.chat-card {
  display: flex;
  flex-direction: column;
  height: 600px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
}

.btn-back {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: var(--color-text-muted);
}
.btn-back:hover {
  background: var(--color-bg);
  color: var(--color-text-main);
}

.header-info h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #059669;
  font-weight: 500;
  margin-top: 0.1rem;
}

.dot {
  width: 6px;
  height: 6px;
  background-color: #059669;
  border-radius: 50%;
}

.messages {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--color-bg);
}

.message-bubble {
  max-width: 75%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 120px;
}

.timestamp {
  font-size: 0.7rem;
  opacity: 0.8;
  align-self: flex-end;
  margin-top: 0.2rem;
}

.sent {
  align-self: flex-end;
  background: var(--color-primary);
  color: white;
  border-bottom-right-radius: 0.25rem;
}

.received {
  align-self: flex-start;
  background: white;
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 0.25rem;
}

.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.start-msg {
  text-align: center;
  color: var(--color-text-muted);
  margin: auto;
  font-size: 0.875rem;
}

.typing-indicator {
  padding: 0.5rem 1.5rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-style: italic;
  background: var(--color-bg);
}

.input-area {
  padding: 1.25rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 0.75rem;
  background: white;
}

textarea {
  flex: 1;
  resize: none;
  height: 38px;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.9375rem;
  transition: border-color 0.2s;
}

textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
}

button {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  height: 48px;
  transition: background 0.2s;
}

button:hover {
  background: var(--color-primary-dark);
}

@media (max-width: 640px) {
  .chat-card {
    height: 100%; /* Fill parent flex container */
    border-radius: 0;
  }
  
  header {
    padding: 0.75rem 1rem;
  }
  
  .messages {
    padding: 1rem;
  }
  
  .input-area {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  button {
    padding: 0 1rem;
  }
}
</style>
