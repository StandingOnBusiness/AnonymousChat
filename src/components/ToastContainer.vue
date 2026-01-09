<script setup>
import { useToast } from '../util/toast'

const { toasts } = useToast()
</script>

<template>
    <div class="toast-container">
        <transition-group name="toast">
            <div 
                v-for="toast in toasts" 
                :key="toast.id" 
                class="toast" 
                :class="toast.type"
            >
                {{ toast.message }}
            </div>
        </transition-group>
    </div>
</template>

<style scoped>
.toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 9999;
}

.toast {
    padding: 12px 20px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    color: var(--color-text-main);
    font-size: 0.9rem;
    font-weight: 500;
    min-width: 250px;
    border-left: 4px solid var(--color-primary);
    display: flex;
    align-items: center;
}

.toast.success {
    border-left-color: #10b981;
}

.toast.error {
    border-left-color: #ef4444;
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
