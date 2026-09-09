<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-white p-3 border-t border-slate-300">
    <!-- DUAL VIEW: 2 COLUMNS -->
    <div class="flex-1 flex flex-col gap-3 overflow-hidden">
      <!-- LEFT: Original (Immutable) -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <h4 class="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
          🔒 Original (AI Generated)
        </h4>
        <div
          class="flex-1 overflow-y-auto p-2 bg-slate-50 border border-slate-300 rounded text-xs leading-relaxed font-mono text-slate-600 select-text"
        >
          {{ currentTranscript?.originalText || '(Loading...)' }}
        </div>
      </div>

      <!-- RIGHT: Corrected (Edit vs. Read Mode) -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex justify-between items-center py-2">
          <h4 class="text-xs font-semibold text-slate-700 mb-1">
            {{ isEditMode ? '📝 Editing...' : '✏️ Corrected (Gold Standard)' }}
          </h4>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500">{{ annotations.length }} annotations</span>
            <button
              v-if="!isEditMode"
              @click="isEditMode = true"
              class="text-xs px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
            >
              ✏️ Edit Text
            </button>
          </div>
        </div>

        <!-- MODE: EDIT TEXT -->
        <div v-if="isEditMode" class="flex-1 flex flex-col overflow-hidden">
          <textarea
            ref="textareaRef"
            v-model="editableCorrectedText"
            @input="autoGrowTextarea"
            class="flex-1 p-2 bg-white border border-amber-300 rounded text-xs leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none overflow-hidden"
            placeholder="(No corrected text yet)"
            style="min-height: 200px"
          />
          <div class="flex gap-2 mt-2">
            <button
              @click="saveCorrectedText"
              class="flex-1 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded hover:bg-amber-600 transition-colors"
            >
              ✅ Save Text
            </button>
            <button
              @click="cancelEdit"
              class="flex-1 px-3 py-1 bg-slate-400 text-white text-xs font-semibold rounded hover:bg-slate-500 transition-colors"
            >
              ❌ Cancel
            </button>
          </div>
        </div>

        <!-- MODE: READ TEXT WITH ANNOTATIONS -->
        <div
          v-else
          class="flex-1 overflow-y-auto p-2 bg-white border border-slate-300 rounded cursor-text"
        >
          <div class="text-xs leading-relaxed" data-transcript-text>
            <!-- Render text with annotation spans -->
            <TranscriptTokenRenderer
              :text="currentTranscript?.correctedText || ''"
              :annotations="annotations"
              @select-span="selectSpan"
              @jump-to-time="jumpToTime"
            />

            <!-- Selection Hint -->
            <p
              v-if="selectedText"
              class="text-xs text-blue-600 font-semibold mt-3 p-2 bg-blue-50 rounded"
            >
              📌 Selected: "{{ selectedText }}"
              <button
                @click="createAnnotationFromSelection"
                class="ml-2 px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
              >
                Create Annotation
              </button>
            </p>

            <!-- Empty state -->
            <p v-if="annotations.length === 0 && !selectedText" class="text-slate-400 italic mt-2">
              💡 Select text to create annotations →
            </p>
          </div>
        </div>
      </div>

      <!-- HEADER -->
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-bold">Transcript Editor</h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useAnnotationStore } from '@/store/annotationStore';
import TranscriptTokenRenderer from './TranscriptTokenRenderer.vue';

const store = useAnnotationStore();

const isEditMode = ref(false);
const editableCorrectedText = ref('');
const selectedText = ref('');
const selectionStart = ref(0);
const selectionEnd = ref(0);
const textareaRef = ref<HTMLTextAreaElement>();

const currentTranscript = computed(() =>
  store.transcripts.find(t => t.id === store.currentTranscriptId)
);

const annotations = computed(() => {
  if (!currentTranscript.value) return [];
  return store.annotations.filter(a => a.transcriptId === currentTranscript.value?.id);
});

// Load full transcript when selection changes
watch(
  () => store.currentTranscriptId,
  async newId => {
    if (newId) {
      store.clearAnnotations(); // Clear previous annotations
      await store.fetchTranscriptFull(newId);
      // Initialize editable text
      const transcript = store.transcripts.find(t => t.id === newId);
      editableCorrectedText.value = transcript?.correctedText || '';
    }
    // Reset modes
    isEditMode.value = false;
    selectedText.value = '';
  },
  { immediate: true }
);

// Update editableCorrectedText when correctedText changes
watch(
  () => currentTranscript.value?.correctedText,
  newText => {
    if (newText && !isEditMode.value) {
      editableCorrectedText.value = newText;
    }
  },
  { deep: true }
);

// Auto-grow textarea
const autoGrowTextarea = () => {
  if (!textareaRef.value) return;
  textareaRef.value.style.height = 'auto';
  textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
};

const saveCorrectedText = () => {
  if (!currentTranscript.value) return;

  // Update in store
  store.updateTranscriptText(currentTranscript.value.id, editableCorrectedText.value);
  isEditMode.value = false;
  selectedText.value = '';
};

const cancelEdit = () => {
  // Reset to last saved version
  const transcript = store.transcripts.find(t => t.id === currentTranscript.value?.id);
  editableCorrectedText.value = transcript?.correctedText || '';
  isEditMode.value = false;
};

const handleTextSelection = () => {
  if (isEditMode.value) return;

  const selection = window.getSelection();
  if (!selection || selection.toString().length === 0) {
    selectedText.value = '';
    return;
  }

  selectedText.value = selection.toString();

  if (!currentTranscript.value?.correctedText) return;

  try {
    const range = selection.getRangeAt(0);
    const plainText = currentTranscript.value.correctedText;

    // Get the text container
    const containerEl = document.querySelector('[data-transcript-text]') as HTMLElement;
    if (!containerEl) {
      selectedText.value = '';
      return;
    }

    // Find the text content div (it's now a div instead of p)
    const textContentDiv = containerEl.querySelector('.text-xs.leading-relaxed.space-y-2') as HTMLElement;
    if (!textContentDiv) {
      selectedText.value = '';
      return;
    }

    // Check if selection is within the text content div
    if (!textContentDiv.contains(range.startContainer) || !textContentDiv.contains(range.endContainer)) {
      selectedText.value = '';
      return;
    }

    // Strategy: Clone the range, collapse to start, then extend to document start
    // to measure the distance to the beginning
    let offsetStart = -1;
    let offsetEnd = -1;

    // Create a range from document start to our selection start
    const startRange = range.cloneRange();
    startRange.collapse(true); // Collapse to start of selection
    
    // Create a range spanning from div start to selection start
    const measureRange = document.createRange();
    measureRange.setStart(textContentDiv, 0);
    measureRange.setEnd(startRange.startContainer, startRange.startOffset);

    // Extract text and measure
    const beforeSelection = measureRange.toString();
    offsetStart = beforeSelection.length;
    offsetEnd = offsetStart + selectedText.value.length;

    // Sanity check: extract and compare
    const extractedText = plainText.substring(offsetStart, offsetEnd);
    if (extractedText !== selectedText.value) {
      // The range measurement failed, try indexOf as last resort
      const fallbackStart = plainText.indexOf(selectedText.value);
      if (fallbackStart !== -1) {
        offsetStart = fallbackStart;
        offsetEnd = fallbackStart + selectedText.value.length;
      } else {
        selectedText.value = '';
        return;
      }
    }

    selectionStart.value = offsetStart;
    selectionEnd.value = offsetEnd;

  } catch {
    selectedText.value = '';
  }
};

const createAnnotationFromSelection = () => {
  if (!selectedText.value || !currentTranscript.value) return;

  // Create temporary annotation with temp ID
  const tempId = `ann_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newAnnotation = {
    id: tempId,
    transcriptId: currentTranscript.value.id,
    type: 'CRUD',
    startOffset: selectionStart.value,
    endOffset: selectionEnd.value,
    text: selectedText.value,
    attributes: {}
  };

  store.addAnnotation(newAnnotation);
  store.setSelectedAnnotation(tempId);
  selectedText.value = '';
};

const selectSpan = (annotationId: string) => {
  store.setSelectedAnnotation(annotationId);
};

const jumpToTime = (time: number) => {
  store.playbackTime = time;
  if (typeof window !== 'undefined') {
    // Trigger audio element to seek
    const audio = document.querySelector('audio') as HTMLAudioElement;
    if (audio) {
      audio.currentTime = time;
      audio.play();
    }
  }
};

// Lifecycle: Add global mouseup listener to handle selections properly
onMounted(() => {
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keydown', handleAnnotationKeydown);
});

onUnmounted(() => {
  document.removeEventListener('mouseup', handleTextSelection);
  document.removeEventListener('keydown', handleAnnotationKeydown);
});

// Handle 1, 2, 3, 4, 5, 6, 7 keys to create annotations with pre-selected type
const handleAnnotationKeydown = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement;
  // Only work in corrected text area, not in textareas
  if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;
  
  // If no text selected, ignore
  if (!selectedText.value) return;

  const typeMap: { [key: string]: string } = {
    '1': 'CRUD',
    '2': 'NUMBER',
    '3': 'FORMATTING_COMMAND',
    '4': 'SPELLED_OUT',
    '5': 'NAMED_ENTITY',
    '6': 'MEDICAL_TERM',
    '7': 'MEASUREMENT'
  };

  if (typeMap[e.key]) {
    e.preventDefault();
    createAnnotationWithType(typeMap[e.key]);
  }
};

const createAnnotationWithType = (type: string) => {
  if (!selectedText.value || !currentTranscript.value) return;

  // Set default attributes based on type
  const getDefaultAttributes = () => {
    switch (type) {
      case 'NUMBER':
        return { rendering: 'digits', value: 0 };
      case 'FORMATTING_COMMAND':
        return { command: 'newline', isLiteral: false };
      case 'SPELLED_OUT':
        return { resolved: '' };
      case 'NAMED_ENTITY':
        return { category: 'person' };
      case 'MEDICAL_TERM':
        return { medicalCategory: 'anatomy', note: '' };
      case 'MEASUREMENT':
        return { measurementValue: 0, unit: 'mg', normalized: 0 };
      default:
        return {};
    }
  };

  const tempId = `ann_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newAnnotation = {
    id: tempId,
    transcriptId: currentTranscript.value.id,
    type,
    startOffset: selectionStart.value,
    endOffset: selectionEnd.value,
    text: selectedText.value,
    attributes: getDefaultAttributes()
  };

  store.addAnnotation(newAnnotation);
  store.setSelectedAnnotation(tempId);
  selectedText.value = '';
};
</script>
