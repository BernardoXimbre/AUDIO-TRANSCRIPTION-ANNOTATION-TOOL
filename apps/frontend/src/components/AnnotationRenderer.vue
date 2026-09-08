<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars, no-undef */
import { ref, computed } from 'vue';

interface Annotation {
  id: string;
  type: string;
  startOffset: number;
  endOffset: number;
  attributes: Record<string, unknown>;
}

const props = defineProps<{
  text: string;
  annotations: Annotation[];
}>();

const emit = defineEmits<{
  'select': [startOffset: number, endOffset: number, selectedText: string];
  'click-annotation': [annotation: Annotation];
}>();

// State
const selectedRange = ref<{ start: number; end: number } | null>(null);

// Methods
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

function getAnnotationsAtPosition(offset: number): Annotation[] {
  return props.annotations.filter(a => offset >= a.startOffset && offset < a.endOffset);
}

function getAnnotationForSpan(startOffset: number, endOffset: number): Annotation | undefined {
  return props.annotations.find(a => a.startOffset === startOffset && a.endOffset === endOffset);
}

function handleTextSelection(event: MouseEvent) {
  const selection = window.getSelection();

  if (!selection || selection.toString().length === 0) {
    selectedRange.value = null;
    return;
  }

  // Get the text container
  const container = (event.currentTarget as HTMLElement);
  const range = selection.getRangeAt(0);

  // Calculate offsets relative to the container
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(container);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  const start = preCaretRange.toString().length - selection.toString().length;
  const end = start + selection.toString().length;

  selectedRange.value = { start, end };

  // Emit selection event
  emit('select', start, end, selection.toString());

  // Clear selection
  selection.removeAllRanges();
}

// Computed: Build spans array for rendering
const spans = computed(() => {
  const spans: Array<{
    type: 'text' | 'annotation';
    start: number;
    end: number;
    content: string;
    annotation?: Annotation;
  }> = [];

  let lastEnd = 0;

  // Sort annotations by start offset
  const sortedAnnotations = [...props.annotations].sort((a, b) => a.startOffset - b.startOffset);

  for (const annotation of sortedAnnotations) {
    // Add text before annotation
    if (lastEnd < annotation.startOffset) {
      spans.push({
        type: 'text',
        start: lastEnd,
        end: annotation.startOffset,
        content: props.text.slice(lastEnd, annotation.startOffset)
      });
    }

    // Add annotation
    spans.push({
      type: 'annotation',
      start: annotation.startOffset,
      end: annotation.endOffset,
      content: props.text.slice(annotation.startOffset, annotation.endOffset),
      annotation
    });

    lastEnd = annotation.endOffset;
  }

  // Add remaining text
  if (lastEnd < props.text.length) {
    spans.push({
      type: 'text',
      start: lastEnd,
      end: props.text.length,
      content: props.text.slice(lastEnd)
    });
  }

  return spans;
});
</script>

<template>
  <div class="annotation-renderer">
    <div class="text-display" @mouseup="handleTextSelection">
      <template v-for="(span, idx) in spans" :key="idx">
        <!-- Regular text -->
        <span v-if="span.type === 'text'" class="text-span">{{ span.content }}</span>

        <!-- Annotation highlight -->
        <span
          v-else
          class="annotation-span"
          :style="{ backgroundColor: getTypeColor(span.annotation!.type) }"
          :title="`${span.annotation!.type}: click to edit`"
          @click="() => emit('click-annotation', span.annotation!)"
          role="button"
          tabindex="0"
          @keydown.enter="() => emit('click-annotation', span.annotation!)"
        >
          {{ span.content }}
        </span>
      </template>
    </div>

    <!-- Selection indicator -->
    <div v-if="selectedRange" class="selection-info">
      <p class="info-text">
        Selected text ({{ selectedRange.start }}-{{ selectedRange.end }}):
        <span class="selected-text">{{ text.slice(selectedRange.start, selectedRange.end) }}</span>
      </p>
    </div>

    <!-- Legend -->
    <div class="legend">
      <div class="legend-title">Annotation Types:</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-color" :style="{ backgroundColor: getTypeColor('CRUD') }" />
          <span>CRUD</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" :style="{ backgroundColor: getTypeColor('NUMBER') }" />
          <span>NUMBER</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" :style="{ backgroundColor: getTypeColor('FORMATTING_COMMAND') }" />
          <span>FORMAT</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" :style="{ backgroundColor: getTypeColor('SPELLED_OUT') }" />
          <span>SPELLED</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" :style="{ backgroundColor: getTypeColor('NAMED_ENTITY') }" />
          <span>ENTITY</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" :style="{ backgroundColor: getTypeColor('MEDICAL_TERM') }" />
          <span>MEDICAL</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" :style="{ backgroundColor: getTypeColor('MEASUREMENT') }" />
          <span>MEASURE</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.annotation-renderer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.text-display {
  padding: 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
  user-select: text;
  cursor: text;
}

.text-span {
  color: #333;
}

.annotation-span {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  color: white;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-block;
}

.annotation-span:hover {
  opacity: 0.8;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}

.annotation-span:focus {
  outline: 2px solid #0066cc;
  outline-offset: 1px;
}

.selection-info {
  padding: 10px;
  background: #fffacd;
  border: 1px solid #ffb700;
  border-radius: 4px;
  font-size: 12px;
}

.info-text {
  margin: 0;
  color: #997700;
}

.selected-text {
  display: inline-block;
  margin-left: 4px;
  padding: 2px 6px;
  background: white;
  border: 1px dashed #ffb700;
  border-radius: 2px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #333;
}

.legend {
  padding: 10px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 11px;
}

.legend-title {
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
</style>
