<template>
  <div id="app" class="container">
    <h1>Audio Transcription Annotation Tool</h1>
    <p>✅ Frontend loaded</p>
    <div class="status">
      <p><strong>Status:</strong> Ready for Phase 1</p>
      <p><strong>Backend API:</strong> <span v-if="backendStatus">{{ backendStatus }}</span><span v-else>Checking...</span></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const backendStatus = ref<string>('')

onMounted(async () => {
  try {
    const response = await fetch('/api/health')
    if (response.ok) {
      backendStatus.value = '✅ Connected'
    }
  } catch {
    backendStatus.value = '❌ Not connected'
  }
})
</script>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #333;
  margin-top: 0;
}

p {
  color: #666;
  font-size: 16px;
}

.status {
  margin-top: 30px;
  padding: 15px;
  background-color: #f9f9f9;
  border-left: 4px solid #007bff;
  border-radius: 4px;
}

.status strong {
  color: #333;
}
</style>
