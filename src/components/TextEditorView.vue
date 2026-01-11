<script setup>
import { ref } from 'vue'

const text = ref('P2PChat')
const fontSize = ref(64)
</script>

<template>
  <div class="editor-container">
    <div class="preview-card">
      <h1 
        class="gradient-text"
        :style="{ fontSize: fontSize + 'px' }"
      >
        {{ text }}
      </h1>
    </div>

    <div class="controls-card">
      <label class="control-label">Your Text</label>
      <textarea 
        v-model="text" 
        rows="2" 
        placeholder="Type something..."
        class="text-input"
      ></textarea>
      
      <div class="size-control">
        <label class="control-label">Size: {{ fontSize }}px</label>
        <input 
          type="range" 
          v-model="fontSize" 
          min="24" 
          max="300" 
          class="range-input"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 2rem;
  width: 100%;
}

.preview-card {
  padding: 3rem;
  border-radius: var(--radius-lg);
  min-height: 200px;
  text-align: center;
  background: white; /* Clean background for screenshot */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
  line-height: 1.1;
  margin: 0;
  word-break: break-word;
  white-space: pre-wrap;
}

.controls-card {
  width: 100%;
  max-width: 500px;
  background: var(--color-surface);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid var(--color-border);
}

.control-label {
  font-weight: 600;
  color: var(--color-text-main);
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  display: block;
}

.text-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  background: white;
}

.text-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.size-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.range-input {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
}

.range-input::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}
</style>
