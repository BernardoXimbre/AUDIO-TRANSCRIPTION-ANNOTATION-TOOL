<template>
  <div class="home-container">
    <div class="content max-w-2xl mx-auto">
      <h1>Audio Transcription Annotation Tool</h1>
      <p class="subtitle">✅ Frontend loaded</p>

      <div class="status-box">
        <p><strong>Status:</strong> Ready for Phase 1</p>
        <p>
          <strong>Backend API:</strong>
          <span v-if="backendStatus">{{ backendStatus }}</span>
          <span v-else>Checking...</span>
        </p>
      </div>

      <div class="info-box">
        <h2>Next Steps</h2>
        <p>
          <router-link to="/upload" class="link-button">
            Go to Upload →
          </router-link>
        </p>
      </div>

      <div class="features">
        <h2>Features</h2>
        <ul>
          <li>🎙️ Upload audio files (.wav, .mp3, .m4a)</li>
          <li>📝 Upload or paste transcripts (JSON format)</li>
          <li>🔗 Auto-match audio to transcripts by filename</li>
          <li>✏️ Edit and annotate transcripts</li>
          <li>📊 Export annotated data as JSONL</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const backendStatus = ref<string>('');

onMounted(async () => {
  try {
    const response = await fetch('/api/health');
    if (response.ok) {
      backendStatus.value = '✅ Connected';
    }
  } catch {
    backendStatus.value = '❌ Not connected';
  }
});
</script>

<style scoped>
.home-container {
  background: white;
  min-height: 100vh;
  padding: 40px 20px;
}

.content {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #333;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.status-box {
  background: #f9f9f9;
  border-left: 4px solid #007bff;
  border-radius: 4px;
  padding: 1.5rem;
  margin: 2rem 0;
}

.status-box p {
  margin: 0.5rem 0;
  color: #555;
}

.info-box {
  background: #e7f3ff;
  border: 1px solid #bde4ff;
  border-radius: 4px;
  padding: 2rem;
  margin: 2rem 0;
  text-align: center;
}

.link-button {
  display: inline-block;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.2s;
}

.link-button:hover {
  background: #0056b3;
}

.features {
  margin-top: 3rem;
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.features h2 {
  color: #333;
  margin-top: 0;
}

.features ul {
  list-style: none;
  padding: 0;
}

.features li {
  padding: 0.5rem 0;
  color: #555;
}
</style>
