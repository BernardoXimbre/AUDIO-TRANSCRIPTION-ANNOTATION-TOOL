<script setup lang="ts">
/* eslint-disable no-undef */
import { ref } from 'vue';

const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

async function downloadExport() {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    const response = await fetch('/api/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to export dataset');
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'annotations-export.jsonl';
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="?([^"]+)"?/);
      if (matches) filename = matches[1];
    }

    // Get the blob data
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    successMessage.value = `Successfully exported ${filename}`;
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error('Error exporting:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to export dataset';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="export-page">
    <div class="container">
      <h1>📊 Export Dataset</h1>
      <p class="subtitle">Download all annotations and corrected transcripts as JSONL</p>

      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div class="export-card">
        <div class="info-section">
          <h2>JSONL Format</h2>
          <p>
            The exported file contains one JSON object per line, with the following structure:
          </p>
          <pre><code>
{
  "audioPath": "filename.wav",
  "duration": 45.2,
  "recordingConditions": {
    "sampleRate": 16000,
    "channels": 1,
    "bitDepth": 16,
    "speechRate": 125,
    "distanceEstimate": "close"
  },
  "transcript": {
    "original": "Original AI transcript...",
    "corrected": "Corrected version..."
  },
  "annotations": [
    {
      "type": "MEDICAL_TERM",
      "startOffset": 0,
      "endOffset": 24,
      "attributes": { "category": "procedure" }
    }
  ]
}</code></pre>
        </div>

        <div class="action-section">
          <button
            @click="downloadExport"
            :disabled="isLoading"
            class="btn btn-primary"
          >
            {{ isLoading ? '⏳ Preparing export...' : '📥 Download JSONL' }}
          </button>
          <p class="hint">
            This will download all non-rejected transcripts with their annotations
          </p>
        </div>
      </div>

      <div class="info-box">
        <h3>📋 What's included</h3>
        <ul>
          <li>✅ All corrected transcripts</li>
          <li>✅ Original (immutable) transcripts for comparison</li>
          <li>✅ Recording metadata (sample rate, channels, bit depth)</li>
          <li>✅ Recording conditions (speech rate, distance estimate)</li>
          <li>✅ All annotations with type and attributes</li>
          <li>❌ Auto-rejected items (< 15 seconds)</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.export-page {
  padding: 32px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  color: white;
  font-size: 32px;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  margin-bottom: 32px;
}

.alert {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-weight: 500;
}

.alert-error {
  background: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

.alert-success {
  background: #efe;
  color: #3c3;
  border: 1px solid #cfc;
}

.export-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.info-section {
  margin-bottom: 32px;
}

.info-section h2 {
  color: #333;
  margin-bottom: 12px;
  font-size: 20px;
}

.info-section p {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.6;
}

pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  border-left: 4px solid #667eea;
}

code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #333;
}

.action-section {
  text-align: center;
  padding: 24px;
  background: #f9f9f9;
  border-radius: 8px;
}

.btn {
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-width: 200px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint {
  margin-top: 12px;
  color: #999;
  font-size: 12px;
}

.info-box {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border-left: 4px solid #667eea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.info-box h3 {
  color: #333;
  margin-bottom: 16px;
  font-size: 18px;
}

.info-box ul {
  list-style: none;
  padding: 0;
}

.info-box li {
  color: #555;
  margin-bottom: 8px;
  line-height: 1.6;
  font-size: 14px;
}
</style>
