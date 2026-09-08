<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface TranscriptData {
  id: string;
  audioFileId: string;
  originalText: string;
  correctedText: string;
}

const props = defineProps<{
  transcriptId: string;
}>();

const emit = defineEmits<{
  'update:correctedText': [text: string];
  'save': [text: string];
}>();

// State
const transcript = ref<TranscriptData | null>(null);
const correctedText = ref('');
const isEditing = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Computed
const hasChanges = computed(() => {
  return transcript.value && correctedText.value !== transcript.value.correctedText;
});

// Methods
async function loadTranscript() {
  try {
    errorMessage.value = '';
    const response = await fetch(`/api/transcript/${props.transcriptId}`);

    if (!response.ok) {
      throw new Error(`Failed to load transcript: ${response.statusText}`);
    }

    const data = await response.json();
    transcript.value = data;
    correctedText.value = data.correctedText;
  } catch (error) {
    console.error('Error loading transcript:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load transcript';
  }
}

async function saveChanges() {
  if (!transcript.value) return;

  try {
    isSaving.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    const response = await fetch(`/api/transcript/${props.transcriptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correctedText: correctedText.value })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save transcript');
    }

    // Update local state
    transcript.value.correctedText = correctedText.value;
    isEditing.value = false;

    // Emit events
    emit('update:correctedText', correctedText.value);
    emit('save', correctedText.value);

    successMessage.value = 'Transcript saved successfully';
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error('Error saving transcript:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to save transcript';
  } finally {
    isSaving.value = false;
  }
}

function discardChanges() {
  if (transcript.value) {
    correctedText.value = transcript.value.correctedText;
    isEditing.value = false;
    errorMessage.value = '';
  }
}

function toggleEdit() {
  isEditing.value = !isEditing.value;
  if (!isEditing.value && hasChanges.value) {
    discardChanges();
  }
}

onMounted(() => {
  loadTranscript();
});
</script>

<template>
  <div class="transcript-editor">
    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>

    <div v-if="!transcript" class="loading">
      Loading transcript...
    </div>

    <div v-else class="transcript-container">
      <!-- Header -->
      <div class="editor-header">
        <h2>Transcript Editor</h2>
        <div class="controls">
          <button
            v-if="!isEditing"
            @click="toggleEdit"
            class="btn btn-primary"
          >
            Edit Transcript
          </button>
          <div v-else class="edit-actions">
            <button
              @click="saveChanges"
              :disabled="!hasChanges || isSaving"
              class="btn btn-success"
            >
              {{ isSaving ? 'Saving...' : 'Save' }}
            </button>
            <button
              @click="discardChanges"
              :disabled="isSaving"
              class="btn btn-secondary"
            >
              Discard
            </button>
          </div>
        </div>
      </div>

      <!-- Original Transcript (Read-only) -->
      <div class="original-section">
        <h3>Original Transcript (AI-generated, immutable)</h3>
        <div class="transcript-text original-text">
          {{ transcript.originalText }}
        </div>
      </div>

      <!-- Corrected Transcript (Editable) -->
      <div class="corrected-section">
        <h3>Corrected Transcript</h3>
        <div v-if="!isEditing" class="transcript-text corrected-text">
          {{ correctedText }}
        </div>
        <textarea
          v-else
          v-model="correctedText"
          class="transcript-textarea"
          placeholder="Edit the corrected transcript here..."
          rows="12"
        />
      </div>

      <!-- Status indicator -->
      <div v-if="hasChanges" class="status-indicator unsaved">
        ⚠ Unsaved changes
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.transcript-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
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

.loading {
  text-align: center;
  padding: 32px;
  color: #999;
}

.transcript-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #ddd;
}

.editor-header h2 {
  margin: 0;
  font-size: 20px;
}

.controls {
  display: flex;
  gap: 8px;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #0066cc;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0052a3;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.original-section {
  background: white;
  padding: 12px;
  border-radius: 4px;
}

.original-section h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
}

.original-text {
  background: #f9f9f9;
  color: #888;
  border-left: 4px solid #ddd;
}

.corrected-section {
  background: white;
  padding: 12px;
  border-radius: 4px;
}

.corrected-section h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
  text-transform: uppercase;
}

.transcript-text {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 14px;
}

.corrected-text {
  background: #fff;
  border-left: 4px solid #0066cc;
}

.transcript-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #0066cc;
  border-radius: 4px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
}

.transcript-textarea:focus {
  outline: none;
  border-color: #0052a3;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.status-indicator {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.unsaved {
  background: #fffacd;
  color: #997700;
  border-left: 4px solid #ffb700;
}
</style>
