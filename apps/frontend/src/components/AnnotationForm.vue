<script setup lang="ts">
import { ref, computed } from 'vue';

export type AnnotationType = 'CRUD' | 'NUMBER' | 'FORMATTING_COMMAND' | 'SPELLED_OUT' | 'NAMED_ENTITY' | 'MEDICAL_TERM' | 'MEASUREMENT';

interface AnnotationFormData {
  type: AnnotationType | '';
  attributes: Record<string, unknown>;
}

const props = defineProps<{
  selectedText: string;
}>();

const emit = defineEmits<{
  'create': [data: { type: AnnotationType; attributes: Record<string, unknown> }];
  'close': [];
}>();

// State
const form = ref<AnnotationFormData>({
  type: '',
  attributes: {}
});

const isSubmitting = ref(false);
const errorMessage = ref('');

// Computed
const annotationTypes: Array<{ label: string; value: AnnotationType }> = [
  { label: 'CRUD (Correct/Add/Delete)', value: 'CRUD' },
  { label: 'NUMBER (Spoken number)', value: 'NUMBER' },
  { label: 'FORMATTING_COMMAND (Layout)', value: 'FORMATTING_COMMAND' },
  { label: 'SPELLED_OUT (Letter-by-letter)', value: 'SPELLED_OUT' },
  { label: 'NAMED_ENTITY (Person/Org/Place/Date)', value: 'NAMED_ENTITY' },
  { label: 'MEDICAL_TERM (Anatomy/Procedure/Drug)', value: 'MEDICAL_TERM' },
  { label: 'MEASUREMENT (Quantity + unit)', value: 'MEASUREMENT' }
];

const requiresAttributes = computed(() => {
  const typesWithAttrs: AnnotationType[] = ['NUMBER', 'FORMATTING_COMMAND', 'SPELLED_OUT', 'NAMED_ENTITY', 'MEDICAL_TERM', 'MEASUREMENT'];
  return typesWithAttrs.includes(form.value.type as AnnotationType);
});

// Methods
function initializeAttributes() {
  form.value.attributes = {};
  errorMessage.value = '';

  switch (form.value.type) {
  case 'NUMBER':
    form.value.attributes = { rendering: 'digits', value: 0 };
    break;
  case 'FORMATTING_COMMAND':
    form.value.attributes = { command: 'newline', isLiteral: false };
    break;
  case 'SPELLED_OUT':
    form.value.attributes = { resolved: '' };
    break;
  case 'NAMED_ENTITY':
    form.value.attributes = { category: 'person' };
    break;
  case 'MEDICAL_TERM':
    form.value.attributes = { category: 'anatomy', note: '' };
    break;
  case 'MEASUREMENT':
    form.value.attributes = { value: 0, unit: 'mg', normalized: 0 };
    break;
  default:
    form.value.attributes = {};
  }
}

async function submitForm() {
  try {
    isSubmitting.value = true;
    errorMessage.value = '';

    // Validate type is selected
    if (!form.value.type) {
      errorMessage.value = 'Please select an annotation type';
      return;
    }

    // Emit the annotation data
    emit('create', {
      type: form.value.type,
      attributes: form.value.attributes
    });

    // Reset form
    form.value = { type: '', attributes: {} };
  } catch (error) {
    console.error('Error submitting annotation:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to create annotation';
  } finally {
    isSubmitting.value = false;
  }
}

function handleTypeChange() {
  if (form.value.type) {
    initializeAttributes();
  }
}
</script>

<template>
  <div class="annotation-form">
    <!-- Selected Text Display -->
    <div class="selected-text">
      <p class="label">Selected Text:</p>
      <div class="text-box">{{ props.selectedText }}</div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <!-- Type Selector -->
    <div class="form-group">
      <label for="annotation-type" class="label">Annotation Type *</label>
      <select
        id="annotation-type"
        v-model="form.type"
        @change="handleTypeChange"
        class="select"
      >
        <option value="">-- Select Type --</option>
        <option v-for="type in annotationTypes" :key="type.value" :value="type.value">
          {{ type.label }}
        </option>
      </select>
    </div>

    <!-- Attributes based on type -->
    <div v-if="requiresAttributes && form.type" class="attributes-section">
      <h4 class="attributes-title">Type-Specific Attributes</h4>

      <!-- NUMBER attributes -->
      <div v-if="form.type === 'NUMBER'" class="attribute-group">
        <div class="form-group">
          <label for="rendering" class="label">Rendering</label>
          <select id="rendering" v-model="form.attributes.rendering" class="select">
            <option value="digits">digits (e.g., 12)</option>
            <option value="words">words (e.g., twelve)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="value" class="label">Numerical Value</label>
          <input
            id="value"
            v-model.number="form.attributes.value"
            type="number"
            class="input"
            placeholder="e.g., 12"
          />
        </div>
      </div>

      <!-- FORMATTING_COMMAND attributes -->
      <div v-if="form.type === 'FORMATTING_COMMAND'" class="attribute-group">
        <div class="form-group">
          <label for="command" class="label">Command</label>
          <select id="command" v-model="form.attributes.command" class="select">
            <option value="newline">newline</option>
            <option value="paragraph">paragraph</option>
            <option value="period">period</option>
            <option value="comma">comma</option>
            <option value="colon">colon</option>
            <option value="dash">dash</option>
            <option value="bracket_open">bracket_open</option>
            <option value="bracket_close">bracket_close</option>
          </select>
        </div>
        <div class="form-group checkbox">
          <input
            id="isLiteral"
            v-model="form.attributes.isLiteral"
            type="checkbox"
            class="checkbox-input"
          />
          <label for="isLiteral" class="checkbox-label">Is literal word (not a command)</label>
        </div>
      </div>

      <!-- SPELLED_OUT attributes -->
      <div v-if="form.type === 'SPELLED_OUT'" class="attribute-group">
        <div class="form-group">
          <label for="resolved" class="label">Resolved Word</label>
          <input
            id="resolved"
            v-model="form.attributes.resolved"
            type="text"
            class="input"
            placeholder="e.g., Cefuroxim"
          />
        </div>
      </div>

      <!-- NAMED_ENTITY attributes -->
      <div v-if="form.type === 'NAMED_ENTITY'" class="attribute-group">
        <div class="form-group">
          <label for="ne-category" class="label">Category</label>
          <select id="ne-category" v-model="form.attributes.category" class="select">
            <option value="person">Person</option>
            <option value="organization">Organization</option>
            <option value="place">Place</option>
            <option value="date">Date</option>
          </select>
        </div>
      </div>

      <!-- MEDICAL_TERM attributes -->
      <div v-if="form.type === 'MEDICAL_TERM'" class="attribute-group">
        <div class="form-group">
          <label for="mt-category" class="label">Category *</label>
          <select id="mt-category" v-model="form.attributes.category" class="select">
            <option value="anatomy">Anatomy</option>
            <option value="procedure">Procedure</option>
            <option value="diagnosis">Diagnosis</option>
            <option value="drug">Drug</option>
            <option value="device">Device</option>
          </select>
        </div>
        <div class="form-group">
          <label for="note" class="label">Note (optional)</label>
          <input
            id="note"
            v-model="form.attributes.note"
            type="text"
            class="input"
            placeholder="Additional details..."
          />
        </div>
      </div>

      <!-- MEASUREMENT attributes -->
      <div v-if="form.type === 'MEASUREMENT'" class="attribute-group">
        <div class="form-group">
          <label for="m-value" class="label">Value</label>
          <input
            id="m-value"
            v-model.number="form.attributes.value"
            type="number"
            class="input"
            placeholder="e.g., 1500"
            step="0.01"
          />
        </div>
        <div class="form-group">
          <label for="unit" class="label">Unit</label>
          <select id="unit" v-model="form.attributes.unit" class="select">
            <option value="g">g (gram)</option>
            <option value="mg">mg (milligram)</option>
            <option value="ug">ug (microgram)</option>
            <option value="kg">kg (kilogram)</option>
            <option value="ml">ml (milliliter)</option>
            <option value="l">l (liter)</option>
            <option value="mmHg">mmHg (mercury)</option>
            <option value="IE">IE (international units)</option>
            <option value="mm">mm (millimeter)</option>
            <option value="cm">cm (centimeter)</option>
            <option value="Ch">Ch (Charrière)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="normalized" class="label">Normalized Value (base unit)</label>
          <input
            id="normalized"
            v-model.number="form.attributes.normalized"
            type="number"
            class="input"
            placeholder="e.g., 1.5 (for 1500 mg = 1.5 g)"
            step="0.001"
          />
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="form-actions">
      <button
        @click="submitForm"
        :disabled="!form.type || isSubmitting"
        class="btn btn-primary"
      >
        {{ isSubmitting ? 'Creating...' : 'Create Annotation' }}
      </button>
      <button
        @click="() => emit('close')"
        :disabled="isSubmitting"
        class="btn btn-secondary"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<style scoped lang="css">
.annotation-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: 600px;
  overflow-y: auto;
}

.selected-text {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #0066cc;
}

.selected-text .label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #666;
  margin: 0 0 4px 0;
}

.text-box {
  padding: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;
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

.label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.select,
.input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  background: white;
  color: #333;
}

.select:focus,
.input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.checkbox {
  flex-direction: row;
  gap: 8px;
  align-items: center;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label {
  margin: 0;
  font-size: 13px;
  cursor: pointer;
}

.attributes-section {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #28a745;
}

.attributes-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  color: #666;
}

.attribute-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attribute-group .form-group {
  gap: 4px;
}

.form-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}
</style>
