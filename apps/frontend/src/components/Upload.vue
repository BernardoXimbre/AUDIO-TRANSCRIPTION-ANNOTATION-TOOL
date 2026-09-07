<template>
  <div class="upload-container">
    <div class="content max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Upload Audio & Transcripts</h1>

      <!-- Audio Files Drop Zone -->
      <div
        class="audio-drop-zone border-2 border-dashed border-blue-300 rounded-lg p-8 mb-6 cursor-pointer hover:border-blue-500 transition"
        @dragover.prevent="isDraggingAudio = true"
        @dragleave.prevent="isDraggingAudio = false"
        @drop.prevent="handleAudioDrop"
        :class="{ 'bg-blue-50': isDraggingAudio }"
      >
        <p class="text-center text-gray-600 mb-2">📁 Drag audio files here or</p>
        <button
          @click="triggerAudioInput"
          class="mx-auto block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Choose Audio Files
        </button>
        <input
          ref="audioInput"
          type="file"
          multiple
          accept=".wav,.mp3,.m4a"
          @change="handleAudioSelect"
          class="hidden"
        />
        <p class="text-center text-sm text-gray-400 mt-3">
          Supported: .wav, .mp3, .m4a (max 100MB each)
        </p>
      </div>

      <!-- Audio Files List -->
      <div v-if="audioFiles.length > 0" class="mb-6">
        <h2 class="text-lg font-semibold mb-3">
          Selected Audio Files ({{ audioFiles.length }})
        </h2>
        <div class="space-y-2">
          <div
            v-for="(file, idx) in audioFiles"
            :key="idx"
            class="flex items-center justify-between p-3 bg-gray-100 rounded"
          >
            <span class="text-sm font-mono">
              {{ file.name }} · {{ formatFileSize(file.size) }}
            </span>
            <button
              @click="removeAudioFile(idx)"
              class="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
        <div class="mt-3 text-sm text-gray-600">
          Total: {{ formatFileSize(totalAudioSize) }}
        </div>
      </div>

      <!-- Transcript JSON Input -->
      <div class="mb-6">
        <label class="block text-sm font-semibold mb-2">Transcripts (JSON)</label>
        <textarea
          v-model="transcriptJSON"
          placeholder='[{ "path": "audio.wav", "label": "Transcript text..." }]'
          class="w-full p-3 border border-gray-300 rounded font-mono text-sm h-32 focus:outline-none focus:border-blue-500"
        ></textarea>
        <p class="text-xs text-gray-500 mt-1">
          Paste JSON array of transcripts matching audio filenames
        </p>
      </div>

      <!-- JSON Validation Error -->
      <div
        v-if="jsonError"
        class="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm"
      >
        ❌ JSON Error: {{ jsonError }}
      </div>

      <!-- Size Validation Error -->
      <div
        v-if="sizeError"
        class="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm"
      >
        ❌ Size Error: {{ sizeError }}
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 mb-6">
        <button
          @click="validateAndPair"
          :disabled="audioFiles.length === 0 || !transcriptJSON.trim()"
          class="flex-1 px-6 py-3 bg-green-500 text-white font-semibold rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          ✓ Validate & Pair
        </button>
        <button
          @click="resetForm"
          class="px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-400"
        >
          Reset
        </button>
      </div>

      <!-- Loading State -->
      <div
        v-if="isValidating"
        class="p-4 bg-blue-50 border border-blue-300 rounded text-blue-700"
      >
        ⏳ Validating files...
      </div>

      <!-- Success Message -->
      <div
        v-if="validationSuccess"
        class="p-4 bg-green-50 border border-green-300 rounded text-green-700"
      >
        ✅ Validation successful! Ready for pairing UI (Task 1.6)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const audioFiles = ref<File[]>([]);
const audioInput = ref<HTMLInputElement>();
const transcriptJSON = ref<string>('');
const isDraggingAudio = ref(false);
const jsonError = ref<string>('');
const sizeError = ref<string>('');
const isValidating = ref(false);
const validationSuccess = ref(false);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_BATCH_SIZE = 500 * 1024 * 1024; // 500MB

const totalAudioSize = computed(() => {
  return audioFiles.value.reduce((sum, f) => sum + (f.size || 0), 0);
});

function handleAudioDrop(event: DragEvent) {
  isDraggingAudio.value = false;
  const files = event.dataTransfer?.files;
  if (files) {
    audioFiles.value.push(...Array.from(files));
  }
}

function triggerAudioInput() {
  audioInput.value?.click();
}

function handleAudioSelect() {
  const files = audioInput.value?.files;
  if (files) {
    audioFiles.value.push(...Array.from(files));
  }
}

function removeAudioFile(index: number) {
  audioFiles.value.splice(index, 1);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

function validateAndPair() {
  jsonError.value = '';
  sizeError.value = '';
  isValidating.value = true;
  validationSuccess.value = false;

  // Validate JSON
  let transcripts: unknown;
  try {
    transcripts = JSON.parse(transcriptJSON.value);
    if (!Array.isArray(transcripts)) {
      throw new Error('Must be an array');
    }
    if (transcripts.length === 0) {
      throw new Error('Array must not be empty');
    }
    for (let i = 0; i < transcripts.length; i++) {
      const t = transcripts[i] as Record<string, unknown>;
      if (!t.path || !t.label) {
        throw new Error(`Item ${i}: missing "path" or "label" field`);
      }
    }
  } catch (error) {
    jsonError.value = error instanceof Error ? error.message : 'Invalid JSON';
    isValidating.value = false;
    return;
  }

  // Validate individual file sizes
  for (const file of audioFiles.value) {
    if (file.size > MAX_FILE_SIZE) {
      sizeError.value = `File ${file.name} exceeds 100MB limit`;
      isValidating.value = false;
      return;
    }
  }

  // Validate batch size
  if (totalAudioSize.value > MAX_BATCH_SIZE) {
    sizeError.value = `Batch total (${formatFileSize(totalAudioSize.value)}) exceeds 500MB limit`;
    isValidating.value = false;
    return;
  }

  // Simulate validation delay
  setTimeout(() => {
    isValidating.value = false;
    validationSuccess.value = true;

    // TODO: Task 1.6 will integrate with pairing service
    console.log('Validation complete', {
      audioFiles: audioFiles.value.map((f) => f.name),
      transcripts
    });
  }, 500);
}

function resetForm() {
  audioFiles.value = [];
  transcriptJSON.value = '';
  jsonError.value = '';
  sizeError.value = '';
  validationSuccess.value = false;
}
</script>

<style scoped>
.upload-container {
  background: white;
  min-height: 100vh;
  padding: 20px;
}

.content {
  padding: 20px;
}

.audio-drop-zone {
  transition: all 0.2s ease;
}
</style>
