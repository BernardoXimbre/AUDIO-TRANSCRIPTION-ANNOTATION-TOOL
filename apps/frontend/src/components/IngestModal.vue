<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg w-full max-w-lg flex flex-col">
      <!-- Header -->
      <div class="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h2 class="text-lg font-bold">📤 Ingest Audio & Transcript</h2>
        <button @click="closeModal" class="text-slate-500 hover:text-slate-900 font-bold">✕</button>
      </div>

      <!-- Content -->
      <div class="flex-1 p-6 space-y-6">
        <!-- Audio Files -->
        <div>
          <label class="block text-sm font-bold mb-2">🎵 Audio Files</label>
          <input
            type="file"
            multiple
            accept=".wav,.mp3,.m4a"
            @change="handleAudioFiles"
            class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
          />
          <p class="text-xs text-slate-500 mt-1">{{ audioFiles.length }} file(s) selected</p>
        </div>

        <!-- Transcript Mode -->
        <div>
          <label class="block text-sm font-bold mb-2">📝 Transcript (JSON)</label>
          <div class="flex gap-2 mb-3">
            <button
              @click="transcriptMode = 'file'"
              :class="['px-3 py-1.5 text-xs rounded font-medium transition-colors',
                       transcriptMode === 'file'
                         ? 'bg-blue-500 text-white'
                         : 'bg-slate-200 text-slate-700 hover:bg-slate-300']"
            >
              Upload File
            </button>
            <button
              @click="transcriptMode = 'paste'"
              :class="['px-3 py-1.5 text-xs rounded font-medium transition-colors',
                       transcriptMode === 'paste'
                         ? 'bg-blue-500 text-white'
                         : 'bg-slate-200 text-slate-700 hover:bg-slate-300']"
            >
              Paste JSON
            </button>
          </div>

          <!-- File Input -->
          <div v-if="transcriptMode === 'file'">
            <input
              type="file"
              accept=".json"
              @change="handleTranscriptFile"
              class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
            />
            <p class="text-xs text-slate-500 mt-1">{{ transcriptFile ? transcriptFile.name : 'No file selected' }}</p>
          </div>

          <!-- Paste Textarea -->
          <div v-else>
            <textarea
              v-model="transcriptText"
              placeholder='[{"path": "audio.wav", "label": "transcript text"}]'
              class="w-full h-32 p-3 border border-slate-300 rounded font-mono text-xs resize-none"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-slate-200 px-6 py-4 flex gap-2 justify-end bg-slate-50">
        <button
          @click="closeModal"
          class="px-4 py-2 text-xs font-medium rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="submitIngest"
          class="px-4 py-2 text-xs font-bold rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          Ingest & Pair
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { computed, ref } from 'vue';
import { useAnnotationStore } from '@/store/annotationStore';

const store = useAnnotationStore();

const audioFiles = ref<File[]>([]);
const transcriptFile = ref<File | null>(null);
const transcriptText = ref('');
const transcriptMode = ref<'file' | 'paste'>('file');

const isOpen = computed(() => store.ingestModalOpen);

const handleAudioFiles = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files) {
    audioFiles.value = Array.from(input.files);
  }
};

const handleTranscriptFile = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files) {
    transcriptFile.value = input.files[0];
  }
};

const closeModal = () => {
  store.setIngestModalOpen(false);
  audioFiles.value = [];
  transcriptFile.value = null;
  transcriptText.value = '';
};

const submitIngest = async () => {
  if (audioFiles.value.length === 0) {
    alert('Please select audio files');
    return;
  }

  if (transcriptMode.value === 'file' && !transcriptFile.value) {
    alert('Please select a transcript file');
    return;
  }

  if (transcriptMode.value === 'paste' && !transcriptText.value.trim()) {
    alert('Please paste transcript JSON');
    return;
  }

  try {
    const formData = new FormData();

    // Add audio files
    audioFiles.value.forEach(file => {
      formData.append('audio', file);
    });

    // Add transcript (must be named 'transcripts' for backend)
    if (transcriptMode.value === 'file' && transcriptFile.value) {
      formData.append('transcripts', transcriptFile.value);
    } else {
      formData.append('transcripts', transcriptText.value);
    }

    const response = await fetch('/api/ingest', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.reason || error.error || 'Ingest failed');
    }

    // Reload queue from backend
    await store.fetchTranscripts();
    closeModal();
  } catch (err) {
    console.error('❌ Ingest error:', err);
    alert(`Ingest failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};
</script>
