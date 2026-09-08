<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AnnotationRenderer from './AnnotationRenderer.vue';
import AnnotationForm from './AnnotationForm.vue';

interface Annotation {
  id: string;
  transcriptId: string;
  type: string;
  startOffset: number;
  endOffset: number;
  attributes: Record<string, unknown>;
  createdAt: string;
}

interface TranscriptData {
  id: string;
  audioFileId: string;
  originalText: string;
  correctedText: string;
}

const props = defineProps<{
  transcriptId: string;
}>();

// State
const transcript = ref<TranscriptData | null>(null);
const annotations = ref<Annotation[]>([]);
const pendingAnnotations = ref<Array<{ tempId: string; type: string; startOffset: number; endOffset: number; attributes: Record<string, unknown> }>>([]);
const deletedAnnotationIds = ref<Set<string>>(new Set());
const selectedText = ref('');
const selectedRange = ref<{ start: number; end: number } | null>(null);
const showForm = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isSaving = ref(false);
const isEditingTranscript = ref(false);

// Computed
const annotationsCount = computed(() => annotations.value.length + pendingAnnotations.value.length - deletedAnnotationIds.value.size);
const hasPendingChanges = computed(() => pendingAnnotations.value.length > 0 || deletedAnnotationIds.value.size > 0);
const displayAnnotations = computed(() => [
  ...annotations.value.filter(a => !deletedAnnotationIds.value.has(a.id)),
  ...pendingAnnotations.value.map(pa => ({
    ...pa,
    id: pa.tempId,
    transcriptId: props.transcriptId,
    createdAt: new Date().toISOString()
  }))
]);

// Color mapping for annotation types
const typeColors: Record<string, string> = {
  CRUD: '#FF6B6B',
  NUMBER: '#4ECDC4',
  FORMATTING_COMMAND: '#45B7D1',
  SPELLED_OUT: '#FFA07A',
  NAMED_ENTITY: '#98D8C8',
  MEDICAL_TERM: '#F7DC6F',
  MEASUREMENT: '#BB8FCC'
};

function getTypeColor(type: string): string {
  return typeColors[type] || '#999';
}

function formatAttributes(type: string, attributes: Record<string, unknown>): string {
  const parts: string[] = [];
  
  switch (type) {
    case 'CRUD':
      return 'No specific attributes';
    case 'NUMBER':
      parts.push(`rendering: ${attributes.rendering}`);
      parts.push(`value: ${attributes.value}`);
      break;
    case 'FORMATTING_COMMAND':
      parts.push(`command: ${attributes.command}`);
      parts.push(`isLiteral: ${attributes.isLiteral}`);
      break;
    case 'SPELLED_OUT':
      parts.push(`resolved: ${attributes.resolved}`);
      break;
    case 'NAMED_ENTITY':
      parts.push(`category: ${attributes.category}`);
      break;
    case 'MEDICAL_TERM':
      parts.push(`category: ${attributes.category}`);
      if (attributes.note) parts.push(`note: ${attributes.note}`);
      break;
    case 'MEASUREMENT':
      parts.push(`value: ${attributes.value}`);
      parts.push(`unit: ${attributes.unit}`);
      parts.push(`normalized: ${attributes.normalized}`);
      break;
  }
  
  return parts.length > 0 ? parts.join(', ') : '(no attributes)';
}

// Methods
async function loadTranscript() {
  try {
    isLoading.value = true;
    const response = await fetch(`/api/transcript/${props.transcriptId}`);
    if (!response.ok) throw new Error('Failed to load transcript');
    transcript.value = await response.json();
  } catch (error) {
    console.error('Error loading transcript:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load transcript';
  } finally {
    isLoading.value = false;
  }
}

async function loadAnnotations() {
  try {
    const response = await fetch(`/api/annotation?transcriptId=${props.transcriptId}`);
    if (!response.ok) throw new Error('Failed to load annotations');
    annotations.value = await response.json();
  } catch (error) {
    console.error('Error loading annotations:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load annotations';
  }
}

async function createAnnotation(data: { type: string; attributes: Record<string, unknown> }) {
  if (!selectedRange.value || !transcript.value) return;

  try {
    // Add to pending (local only)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    pendingAnnotations.value.push({
      tempId,
      type: data.type,
      startOffset: selectedRange.value.start,
      endOffset: selectedRange.value.end,
      attributes: data.attributes
    });

    successMessage.value = 'Annotation added (not saved yet)';
    setTimeout(() => { successMessage.value = ''; }, 3000);

    // Reset form
    showForm.value = false;
    selectedRange.value = null;
    selectedText.value = '';
  } catch (error) {
    console.error('Error creating annotation:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to create annotation';
  }
}

async function deleteAnnotation(id: string) {
  // Check if it's a pending annotation (starts with temp_)
  if (id.startsWith('temp_')) {
    pendingAnnotations.value = pendingAnnotations.value.filter(a => a.tempId !== id);
  } else {
    // Mark saved annotation as deleted
    deletedAnnotationIds.value.add(id);
  }
  successMessage.value = 'Annotation deleted (not saved yet)';
  setTimeout(() => { successMessage.value = ''; }, 3000);
}

async function saveTranscript() {
  if (!transcript.value) return;

  try {
    isSaving.value = true;
    errorMessage.value = '';

    const response = await fetch(`/api/transcript/${props.transcriptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correctedText: transcript.value.correctedText,
      }),
    });

    if (!response.ok) throw new Error('Failed to save transcript');

    successMessage.value = 'Transcript saved!';
    isEditingTranscript.value = false;

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

async function saveAllAnnotations() {
  if (!hasPendingChanges.value) {
    errorMessage.value = 'No changes to save';
    return;
  }

  try {
    isSaving.value = true;
    errorMessage.value = '';

    // Create new annotations
    for (const pending of pendingAnnotations.value) {
      const response = await fetch('/api/annotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptId: props.transcriptId,
          type: pending.type,
          startOffset: pending.startOffset,
          endOffset: pending.endOffset,
          attributes: pending.attributes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create annotation: ${error.error || response.statusText}`);
      }
    }

    // Delete removed annotations
    for (const deletedId of deletedAnnotationIds.value) {
      const response = await fetch(`/api/annotation/${deletedId}`, {
        method: 'DELETE'
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete annotation: ${response.statusText}`);
      }
    }

    // Clear pending changes and reload
    pendingAnnotations.value = [];
    deletedAnnotationIds.value.clear();
    await loadAnnotations();

    successMessage.value = 'All changes saved!';
    setTimeout(() => { successMessage.value = ''; }, 3000);
  } catch (error) {
    console.error('Error saving annotations:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to save annotations';
  } finally {
    isSaving.value = false;
  }
}

function discardChanges() {
  pendingAnnotations.value = [];
  deletedAnnotationIds.value.clear();
  successMessage.value = 'Changes discarded';
  setTimeout(() => { successMessage.value = ''; }, 3000);
}

function handleTextSelection(start: number, end: number, text: string) {
  selectedRange.value = { start, end };
  selectedText.value = text;
  showForm.value = true;
}

function handleAnnotationClick(annotation: Annotation) {
  // Could expand to edit mode in the future
  console.log('Clicked annotation:', annotation);
}

function closeForm() {
  showForm.value = false;
  selectedRange.value = null;
  selectedText.value = '';
}

onMounted(() => {
  loadTranscript();
  loadAnnotations();
});
</script>

<template>
  <div class="annotation-editor">
    <!-- Alerts -->
    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading">
      Loading transcript and annotations...
    </div>

    <!-- Main Content -->
    <div v-if="!isLoading && transcript" class="editor-content">
      <!-- Header -->
      <div class="editor-header">
        <h2>Annotation Editor</h2>
        <div class="stats">
          <span class="stat-badge">{{ annotationsCount }} annotations</span>
        </div>
      </div>

      <!-- Original Transcript (Read-only) -->
      <div class="original-section">
        <h3>Original Transcript (Immutable)</h3>
        <div class="transcript-display">
          {{ transcript.originalText }}
        </div>
      </div>

      <!-- Corrected Transcript (Editable) -->
      <div class="corrected-section">
        <div class="corrected-header">
          <h3>Corrected Transcript (Edit below)</h3>
          <button
            v-if="!isEditingTranscript"
            @click="isEditingTranscript = true"
            class="btn btn-secondary"
          >
            ✏️ Edit
          </button>
          <div v-else class="edit-actions">
            <button
              @click="saveTranscript"
              :disabled="isSaving"
              class="btn btn-primary"
            >
              {{ isSaving ? 'Saving...' : '💾 Save' }}
            </button>
            <button
              @click="isEditingTranscript = false"
              :disabled="isSaving"
              class="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>

        <textarea
          v-if="isEditingTranscript"
          v-model="transcript.correctedText"
          class="corrected-textarea"
          placeholder="Edit the corrected transcript here..."
        />
        <div v-else class="corrected-display">
          {{ transcript.correctedText }}
        </div>
      </div>

      <!-- Annotation Renderer (main work area) -->
      <div class="renderer-section">
        <h3>Annotations (Click text to add annotations)</h3>
        <AnnotationRenderer
          :text="transcript.correctedText"
          :annotations="annotations"
          @select="handleTextSelection"
          @click-annotation="handleAnnotationClick"
        />
      </div>

      <!-- Annotation Form (shown when text is selected) -->
      <div v-if="showForm && selectedText" class="form-section">
        <h3>Create New Annotation</h3>
        <AnnotationForm
          :selectedText="selectedText"
          @create="createAnnotation"
          @close="closeForm"
        />
      </div>

      <!-- Pending Annotations (local) -->
      <div class="list-section">
        <div class="list-header">
          <h3>Annotations ({{ displayAnnotations.length }})</h3>
          <div v-if="hasPendingChanges" class="pending-indicator">
            💾 {{ pendingAnnotations.length }} new, {{ deletedAnnotationIds.size }} deleted
          </div>
        </div>

        <div v-if="displayAnnotations.length === 0" class="empty-state">
          No annotations yet. Select text to create one!
        </div>

        <div v-else class="annotations-container">
          <div v-for="annotation in displayAnnotations" :key="annotation.id" class="annotation-item" :class="{ 'pending': annotation.id.startsWith('temp_') }">
            <div class="annotation-header">
              <span class="type-badge" :style="{ backgroundColor: getTypeColor(annotation.type) }">
                {{ annotation.type }}
              </span>
              <span class="offset-info">{{ annotation.startOffset }}-{{ annotation.endOffset }}</span>
              <span v-if="annotation.id.startsWith('temp_')" class="status-badge">pending</span>
            </div>
            <div class="annotation-details">
              {{ formatAttributes(annotation.type, annotation.attributes) }}
            </div>
            <div class="annotation-actions">
              <button @click="deleteAnnotation(annotation.id)" class="btn-small btn-delete">
                Delete
              </button>
            </div>
          </div>
        </div>

        <div v-if="hasPendingChanges" class="save-actions">
          <button
            @click="saveAllAnnotations"
            :disabled="isSaving"
            class="btn btn-primary"
          >
            {{ isSaving ? 'Saving...' : '💾 Save All Changes' }}
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
  </div>
</template>

<style scoped lang="css">
.annotation-editor {
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

.editor-content {
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

.stats {
  display: flex;
  gap: 8px;
}

.stat-badge {
  display: inline-block;
  padding: 6px 12px;
  background: #0066cc;
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.original-section {
  background: white;
  padding: 12px;
  border-radius: 4px;
}

.original-section h3 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
}

.transcript-display {
  padding: 12px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-left: 4px solid #ddd;
  border-radius: 4px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  color: #888;
}

.renderer-section {
  background: white;
  padding: 12px;
  border-radius: 4px;
}

.renderer-section h3 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #333;
  font-weight: 600;
  text-transform: uppercase;
}

.form-section {
  background: white;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #28a745;
}

.form-section h3 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #333;
  font-weight: 600;
  text-transform: uppercase;
}

.list-section {
  background: white;
  padding: 12px;
  border-radius: 4px;
}

.corrected-section {
  background: white;
  padding: 12px;
  border-radius: 4px;
}

.corrected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.corrected-header h3 {
  margin: 0;
  font-size: 13px;
  color: #333;
  font-weight: 600;
  text-transform: uppercase;
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
  font-size: 13px;
  font-weight: 600;
}

.btn-primary {
  background: #0066cc;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0052a3;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.corrected-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
}

.corrected-display {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #ddd;
  border-left: 4px solid #0066cc;
  border-radius: 4px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.list-section h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pending-indicator {
  font-size: 12px;
  color: #ff9800;
  font-weight: 500;
  background: #fff3e0;
  padding: 4px 8px;
  border-radius: 4px;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #999;
  font-style: italic;
}

.annotations-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 12px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.annotation-item {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-left: 4px solid #0066cc;
  border-radius: 4px;
}

.annotation-item.pending {
  background: #fffbf0;
  border-left-color: #ff9800;
}

.annotation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.type-badge {
  display: inline-block;
  padding: 4px 8px;
  color: white;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
}

.offset-info {
  font-size: 11px;
  color: #999;
  font-family: monospace;
}

.status-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #ff9800;
  color: white;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  margin-left: auto;
}

.annotation-details {
  font-size: 12px;
  color: #555;
  margin-bottom: 8px;
  padding: 6px;
  background: white;
  border-radius: 3px;
}

.annotation-actions {
  display: flex;
  gap: 6px;
}

.btn-small {
  padding: 4px 8px;
  font-size: 11px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-weight: 600;
}

.btn-delete {
  background: #ff6b6b;
  color: white;
}

.btn-delete:hover {
  background: #ee5a52;
}

.save-actions {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #fff8f0;
  border: 1px solid #ff9800;
  border-radius: 4px;
  margin-top: 12px;
}

.save-actions .btn {
  flex: 1;
}
</style>
