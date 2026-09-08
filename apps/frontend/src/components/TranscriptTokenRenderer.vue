<template>
  <div class="space-y-2">
    <!-- LEGEND -->
    <div class="grid grid-cols-7 gap-2 mb-3 p-2 bg-slate-50 rounded border border-slate-300 text-xs">
      <div class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-red-300"></span>
        <span class="font-mono">CRUD</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-orange-300"></span>
        <span class="font-mono">NUMBER</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-purple-300"></span>
        <span class="font-mono">FORMAT</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-yellow-300"></span>
        <span class="font-mono">SPELLED</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-blue-300"></span>
        <span class="font-mono">ENTITY</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-cyan-300"></span>
        <span class="font-mono">MEDICAL</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-green-300"></span>
        <span class="font-mono">MEASURE</span>
      </div>
    </div>

    <!-- TEXT WITH SPANS -->
    <p class="text-xs leading-relaxed">
      <template v-for="(segment, idx) in segments" :key="idx">
        <!-- Non-annotated text -->
        <span v-if="segment.type === 'text'" class="text-slate-800">
          {{ segment.content }}
        </span>

        <!-- Annotated span -->
        <span
          v-else
          @click="$emit('select-span', segment.annotationId)"
          :class="[
            'px-1 py-0.5 rounded cursor-pointer transition-all font-semibold',
            getSpanClass(segment.annotationType)
          ]"
          :title="`${segment.annotationType}\nClick to edit`"
        >
          {{ segment.content }}
          <!-- Show normalization if MEASUREMENT -->
          <span v-if="segment.annotationType === 'MEASUREMENT'" class="text-xs opacity-75">
            → {{ segment.normalized }}
          </span>
        </span>
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Annotation {
  id: string;
  type: string;
  startOffset: number;
  endOffset: number;
  attributes?: Record<string, unknown>;
}

interface Props {
  text: string;
  annotations: Annotation[];
}

interface Segment {
  type: 'text' | 'span';
  content: string;
  annotationId?: string;
  annotationType?: string;
  normalized?: string;
}

defineEmits<{
  'select-span': [annotationId: string];
  'jump-to-time': [time: number];
}>();

const props = defineProps<Props>();

const segments = computed(() => {
  const segs: Segment[] = [];
  let lastEnd = 0;

  // Sort annotations by start position
  const sorted = [...props.annotations].sort((a, b) => a.startOffset - b.startOffset);

  sorted.forEach(ann => {
    // Add text before annotation
    if (lastEnd < ann.startOffset) {
      segs.push({
        type: 'text',
        content: props.text.substring(lastEnd, ann.startOffset)
      });
    }

    // Add annotated span
    const content = props.text.substring(ann.startOffset, ann.endOffset);
    segs.push({
      type: 'span',
      content,
      annotationId: ann.id,
      annotationType: ann.type,
      normalized: (ann.attributes?.normalizedValue as string) || undefined
    });

    lastEnd = ann.endOffset;
  });

  // Add remaining text
  if (lastEnd < props.text.length) {
    segs.push({
      type: 'text',
      content: props.text.substring(lastEnd)
    });
  }

  return segs;
});

const getSpanClass = (type: string) => {
  const classes: Record<string, string> = {
    'CRUD': 'bg-red-200 text-red-900',
    'NUMBER': 'bg-orange-200 text-orange-900',
    'FORMATTING_COMMAND': 'bg-purple-200 text-purple-900',
    'SPELLED_OUT': 'bg-yellow-200 text-yellow-900',
    'NAMED_ENTITY': 'bg-blue-200 text-blue-900',
    'MEDICAL_TERM': 'bg-cyan-200 text-cyan-900',
    'MEASUREMENT': 'bg-green-200 text-green-900'
  };
  return classes[type] || 'bg-slate-200 text-slate-900';
};
</script>
