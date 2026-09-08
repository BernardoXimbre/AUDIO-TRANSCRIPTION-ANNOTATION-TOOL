<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Annotation {
  id: string;
  type: string;
  startOffset: number;
  endOffset: number;
  attributes: Record<string, unknown>;
  createdAt: string;
}

const props = defineProps<{
  transcriptId: string;
}>();

const emit = defineEmits<{
  'edit': [annotation: Annotation];
  'delete': [id: string];
}>();

// State
const annotations = ref<Annotation[]>([]);
const loading = ref(false);
const errorMessage = ref('');

// Methods
async function loadAnnotations() {
  try {
    loading.value = true;
    errorMessage.value = '';

    const response = await fetch(`/api/annotation?transcriptId=${props.transcriptId}`);

    if (!response.ok) {
      throw new Error(`Failed to load annotations: ${response.statusText}`);
    }

    const data = await response.json();
    annotations.value = data || [];
  } catch (error) {
    console.error('Error loading annotations:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load annotations';
  } finally {
    loading.value = false;
  }
}

async function deleteAnnotation(id: string) {
  try {
    const response = await fetch(`/api/annotation/${id}`, {
      method: 'DELETE'
    });

    // 404 means it doesn't exist on backend (never saved), which is fine
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete annotation: ${response.statusText}`);
    }

    // Remove from local list regardless
    annotations.value = annotations.value.filter(a => a.id !== id);
    emit('delete', id);
  } catch (error) {
    console.error('Error deleting annotation:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to delete annotation';
  }
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    CRUD: '#FF6B6B',
    NUMBER: '#4ECDC4',
    FORMATTING_COMMAND: '#45B7D1',
    SPELLED_OUT: '#FFA07A',
    NAMED_ENTITY: '#98D8C8',
    MEDICAL_TERM: '#F7DC6F',
    MEASUREMENT: '#BB8FCE'
  };
  return colors[type] || '#999';
}

function formatAttributes(type: string, attributes: Record<string, unknown>): string {
  switch (type) {
  case 'NUMBER':
    return `${attributes.value} (${attributes.rendering})`;
  case 'FORMATTING_COMMAND':
    return `${attributes.command}${attributes.isLiteral ? ' (literal)' : ''}`;
  case 'SPELLED_OUT':
    return `→ ${attributes.resolved}`;
  case 'NAMED_ENTITY':
    return `(${attributes.category})`;
  case 'MEDICAL_TERM':
    return `${attributes.category}${attributes.note ? `: ${attributes.note}` : ''}`;
  case 'MEASUREMENT':
    return `${attributes.value} ${attributes.unit} (= ${attributes.normalized})`;
  default:
    return '';
  }
}

onMounted(() => {
  loadAnnotations();
});

defineExpose({
  loadAnnotations
});
</script>

<template>
  <div class="annotations-list">
    <div class="list-header">
      <h3>Annotations</h3>
      <button @click="loadAnnotations" class="btn-refresh" title="Refresh annotations">
        🔄
      </button>
    </div>

    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <div v-if="loading" class="loading">
      Loading annotations...
    </div>

    <div v-if="!loading && annotations.length === 0" class="empty-state">
      No annotations yet. Select text and create one!
    </div>

    <div v-if="!loading && annotations.length > 0" class="annotations-container">
      <div v-for="annotation in annotations" :key="annotation.id" class="annotation-item">
        <div class="annotation-header">
          <span
            class="type-badge"
            :style="{ backgroundColor: getTypeColor(annotation.type) }"
          >
            {{ annotation.type }}
          </span>
          <span class="offset-info">
            {{ annotation.startOffset }}-{{ annotation.endOffset }}
          </span>
        </div>

        <div class="annotation-details">
          {{ formatAttributes(annotation.type, annotation.attributes) }}
        </div>

        <div class="annotation-actions">
          <button @click="() => emit('edit', annotation)" class="btn-small btn-edit">
            Edit
          </button>
          <button @click="deleteAnnotation(annotation.id)" class="btn-small btn-delete">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.annotations-list {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.list-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  color: #333;
}

.btn-refresh {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  transition: transform 0.2s;
}

.btn-refresh:hover {
  transform: rotate(180deg);
}

.alert {
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  margin-bottom: 12px;
}

.alert-error {
  background: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

.loading {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 13px;
  font-style: italic;
}

.annotations-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.annotation-item {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 10px;
  background: #fafafa;
  transition: background-color 0.2s;
}

.annotation-item:hover {
  background: #f0f0f0;
}

.annotation-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.type-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 3px;
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  min-width: 80px;
  text-align: center;
}

.offset-info {
  font-size: 11px;
  color: #999;
  font-family: 'Courier New', monospace;
}

.annotation-details {
  font-size: 12px;
  color: #555;
  margin-bottom: 8px;
  word-wrap: break-word;
}

.annotation-actions {
  display: flex;
  gap: 6px;
}

.btn-small {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  background: white;
  transition: background-color 0.2s;
}

.btn-edit {
  color: #0066cc;
  border-color: #0066cc;
}

.btn-edit:hover {
  background: #e6f2ff;
}

.btn-delete {
  color: #dc3545;
  border-color: #dc3545;
}

.btn-delete:hover {
  background: #ffe6e6;
}
</style>
