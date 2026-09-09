<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-white p-3 border-l border-slate-300">
    <!-- HEADER -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-bold">Span Inspector</h3>
      <span v-if="isUnsaved" class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
        📝 Unsaved
      </span>
    </div>

    <!-- NO SELECTION -->
    <div v-if="!selectedAnnotation" class="flex-1 flex items-center justify-center">
      <p class="text-xs text-slate-400 text-center">👈 Click a span to edit</p>
    </div>

    <!-- ANNOTATION EDITOR -->
    <div v-else class="flex-1 flex flex-col justify-between overflow-auto space-y-3">
      <!-- LIST (if multiple) -->
      <div v-if="currentTranscriptAnnotations.length > 0" class="space-y-1">
        <label class="block text-xs font-semibold text-slate-700">Annotations</label>
        <div class="max-h-40 overflow-y-auto space-y-0.5">
          <div
            v-for="(ann, idx) in currentTranscriptAnnotations"
            :key="ann.id"
            class="flex items-center gap-2 p-1.5 text-xs bg-slate-50 rounded hover:bg-slate-100 cursor-pointer group"
            @click="selectAnnotation(ann.id)"
          >
            <span class="text-slate-500 font-mono w-5">{{ idx + 1 }}.</span>
            <span class="flex-1 truncate text-slate-700">"{{ getAnnotationText(ann) }}"</span>
            <button
              @click.stop="deleteAnnotationFromList(ann.id)"
              class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div class="p-4 bg-gray-100">
        <!-- TYPE SELECTOR -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Type</label>
          <select
            v-model="formData.type"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          >
            <option value="CRUD">CRUD</option>
            <option value="NUMBER">NUMBER</option>
            <option value="FORMATTING_COMMAND">FORMATTING_COMMAND</option>
            <option value="SPELLED_OUT">SPELLED_OUT</option>
            <option value="NAMED_ENTITY">NAMED_ENTITY</option>
            <option value="MEDICAL_TERM">MEDICAL_TERM</option>
            <option value="MEASUREMENT">MEASUREMENT</option>
          </select>
        </div>

        <!-- NUMBER: rendering + value -->
        <div v-if="formData.type === 'NUMBER'" class="space-y-2">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Rendering</label>
            <div class="flex gap-3">
              <label class="flex items-center gap-1 text-xs cursor-pointer">
                <input v-model="formData.rendering" type="radio" value="digits" class="w-3 h-3" />
                Digits
              </label>
              <label class="flex items-center gap-1 text-xs cursor-pointer">
                <input v-model="formData.rendering" type="radio" value="words" class="w-3 h-3" />
                Words
              </label>
            </div>
          </div>
          <input
            v-model.number="formData.value"
            type="number"
            placeholder="Integer value"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          />
        </div>

        <!-- FORMATTING_COMMAND: command + isLiteral -->
        <div v-if="formData.type === 'FORMATTING_COMMAND'" class="space-y-2">
          <select
            v-model="formData.command"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          >
            <option value="newline">newline</option>
            <option value="paragraph">paragraph</option>
            <option value="period">period</option>
            <option value="comma">comma</option>
            <option value="colon">colon</option>
            <option value="dash">dash</option>
            <option value="bracket_open">bracket_open</option>
            <option value="bracket_close">bracket_close</option>
          </select>
          <label class="flex items-center gap-2 text-xs cursor-pointer">
            <input v-model="formData.isLiteral" type="checkbox" class="w-3 h-3" />
            Literal word (not a command)
          </label>
        </div>

        <!-- SPELLED_OUT: resolved -->
        <div v-if="formData.type === 'SPELLED_OUT'" class="space-y-2">
          <input
            v-model="formData.resolved"
            type="text"
            placeholder="Resolved word"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          />
        </div>

        <!-- NAMED_ENTITY: category -->
        <div v-if="formData.type === 'NAMED_ENTITY'" class="space-y-2">
          <select
            v-model="formData.category"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          >
            <option value="person">Person</option>
            <option value="organization">Organization</option>
            <option value="place">Place</option>
            <option value="date">Date</option>
          </select>
        </div>

        <!-- MEDICAL_TERM: category + note -->
        <div v-if="formData.type === 'MEDICAL_TERM'" class="space-y-2">
          <select
            v-model="formData.medicalCategory"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          >
            <option value="anatomy">Anatomy</option>
            <option value="procedure">Procedure</option>
            <option value="diagnosis">Diagnosis</option>
            <option value="drug">Drug</option>
            <option value="device">Device</option>
          </select>
          <input
            v-model="formData.note"
            type="text"
            placeholder="Note (optional)"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          />
        </div>

        <!-- MEASUREMENT: value + unit + normalized -->
        <div v-if="formData.type === 'MEASUREMENT'" class="space-y-2">
          <input
            v-model.number="formData.measurementValue"
            type="number"
            placeholder="Value"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          />
          <select
            v-model="formData.unit"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          >
            <option value="g">g</option>
            <option value="mg">mg</option>
            <option value="ug">ug</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="l">l</option>
            <option value="mmHg">mmHg</option>
            <option value="IE">IE</option>
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="Ch">Ch</option>
          </select>
          <input
            v-model.number="formData.normalized"
            type="number"
            placeholder="Normalized (base unit)"
            class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          />
        </div>

        <!-- SPAN INFO -->
        <div class="mt-auto pt-2 text-xs text-slate-500 border-t border-slate-200 space-y-1">
          <div class="flex justify-between">
            <span>Text:</span>
            <span class="font-mono truncate">"{{ spanText }}"</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAnnotationStore, type Annotation } from '@/store/annotationStore';

const store = useAnnotationStore();

const selectedAnnotation = computed(() => store.selectedAnnotation);

const isUnsaved = computed(() => {
  if (!selectedAnnotation.value) return false;
  return store.local.some(a => a.id === selectedAnnotation.value?.id);
});

const currentTranscriptAnnotations = computed(() => {
  if (!store.currentTranscriptId) return [];
  return store.getTranscriptAnnotations(store.currentTranscriptId);
});

const spanText = computed(() => {
  if (!selectedAnnotation.value || !store.currentTranscriptId) return '';
  const transcript = store.transcripts.find(t => t.id === store.currentTranscriptId);
  if (!transcript?.correctedText) return '';
  const { startOffset, endOffset } = selectedAnnotation.value;
  return transcript.correctedText.substring(startOffset, endOffset);
});

// Form data - exactly matching backend schema
const formData = ref({
  type: 'CRUD',
  // NUMBER
  rendering: 'digits' as 'digits' | 'words',
  value: 0,
  // FORMATTING_COMMAND
  command: 'newline',
  isLiteral: false,
  // SPELLED_OUT
  resolved: '',
  // NAMED_ENTITY
  category: 'person' as 'person' | 'organization' | 'place' | 'date',
  // MEDICAL_TERM
  medicalCategory: 'anatomy' as 'anatomy' | 'procedure' | 'diagnosis' | 'drug' | 'device',
  note: '',
  // MEASUREMENT
  measurementValue: 0,
  unit: 'mg' as 'g' | 'mg' | 'ug' | 'kg' | 'ml' | 'l' | 'mmHg' | 'IE' | 'mm' | 'cm' | 'Ch',
  normalized: 0
});

// Load form from annotation
const loadFormData = () => {
  if (!selectedAnnotation.value) return;
  const ann = selectedAnnotation.value;
  const attrs = ann.attributes || {};

  formData.value.type = ann.type;
  formData.value.rendering = (attrs.rendering as 'digits' | 'words') || 'digits';
  formData.value.value = (attrs.value as number) || 0;
  formData.value.command = (attrs.command as string) || 'newline';
  formData.value.isLiteral = (attrs.isLiteral as boolean) ?? false;
  formData.value.resolved = (attrs.resolved as string) || '';
  formData.value.category =
    (attrs.category as 'person' | 'organization' | 'place' | 'date') || 'person';
  formData.value.medicalCategory =
    (attrs.category as 'anatomy' | 'procedure' | 'diagnosis' | 'drug' | 'device') || 'anatomy';
  formData.value.note = (attrs.note as string) || '';
  formData.value.measurementValue = (attrs.value as number) || 0;
  formData.value.unit =
    (attrs.unit as 'g' | 'mg' | 'ug' | 'kg' | 'ml' | 'l' | 'mmHg' | 'IE' | 'mm' | 'cm' | 'Ch') ||
    'mg';
  formData.value.normalized = (attrs.normalized as number) || 0;
};

// Save form to store
const saveFormData = () => {
  if (!selectedAnnotation.value) return;

  const attributes: Record<string, unknown> = {};

  if (formData.value.type === 'CRUD') {
    // No attributes
  } else if (formData.value.type === 'NUMBER') {
    attributes.rendering = formData.value.rendering;
    attributes.value = formData.value.value;
  } else if (formData.value.type === 'FORMATTING_COMMAND') {
    attributes.command = formData.value.command;
    attributes.isLiteral = formData.value.isLiteral;
  } else if (formData.value.type === 'SPELLED_OUT') {
    attributes.resolved = formData.value.resolved;
  } else if (formData.value.type === 'NAMED_ENTITY') {
    attributes.category = formData.value.category;
  } else if (formData.value.type === 'MEDICAL_TERM') {
    attributes.category = formData.value.medicalCategory;
    attributes.note = formData.value.note;
  } else if (formData.value.type === 'MEASUREMENT') {
    attributes.value = formData.value.measurementValue;
    attributes.unit = formData.value.unit;
    attributes.normalized = formData.value.normalized;
  }

  store.updateAnnotation(selectedAnnotation.value.id, {
    type: formData.value.type,
    attributes
  });
};

// Watch for type changes and save
watch(
  () => formData.value.type,
  () => {
    saveFormData();
  }
);

// Watch for attribute changes and save
watch(
  () => ({
    rendering: formData.value.rendering,
    value: formData.value.value,
    command: formData.value.command,
    isLiteral: formData.value.isLiteral,
    resolved: formData.value.resolved,
    category: formData.value.category,
    medicalCategory: formData.value.medicalCategory,
    note: formData.value.note,
    measurementValue: formData.value.measurementValue,
    unit: formData.value.unit,
    normalized: formData.value.normalized
  }),
  () => {
    if (selectedAnnotation.value) {
      saveFormData();
    }
  },
  { deep: true }
);

// Watch for annotations loading and auto-select first one
watch(
  () => currentTranscriptAnnotations.value.length,
  length => {
    if (length > 0 && !selectedAnnotation.value) {
      // Automatically select first annotation when annotations are loaded
      store.setSelectedAnnotation(currentTranscriptAnnotations.value[0].id);
      loadFormData();
    }
  }
);

// Watch for transcript changes to clear previous data
watch(
  () => store.currentTranscriptId,
  () => {
    store.clearSelectedAnnotation();
    formData.value.type = 'CRUD';
  }
);

const selectAnnotation = (annotationId: string) => {
  saveFormData();
  store.setSelectedAnnotation(annotationId);
  loadFormData(); // Call directly without setTimeout
};

const getAnnotationText = (ann: Annotation | null | undefined): string => {
  if (!ann || !store.currentTranscriptId) return '';
  const transcript = store.transcripts.find(t => t.id === store.currentTranscriptId);
  if (!transcript?.correctedText) return '';
  const text = transcript.correctedText.substring(ann.startOffset, ann.endOffset);
  return text.length > 30 ? text.substring(0, 27) + '...' : text;
};

const deleteAnnotationFromList = (id: string) => {
  // Get current annotations BEFORE deletion
  const allAnnotations = [...currentTranscriptAnnotations.value];
  const remaining = allAnnotations.filter(a => a.id !== id);

  // Guard: save selected ID BEFORE deletion (store.deleteAnnotation clears it)
  const wasSelected = selectedAnnotation.value?.id === id;

  store.deleteAnnotation(id);

  // If deleted annotation was selected, select the next one
  if (wasSelected) {
    if (remaining.length > 0) {
      // Select the first remaining annotation
      store.setSelectedAnnotation(remaining[0].id);
      loadFormData(); // Call directly without setTimeout
    } else {
      // No more annotations, clear selection
      store.clearSelectedAnnotation();
    }
  }
};
</script>
