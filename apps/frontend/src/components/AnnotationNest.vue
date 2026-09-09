<template>
  <div
    @click="$emit('select-span', segment.primaryAnnotationId)"
    :class="[
      'inline-block px-1 py-0.5 rounded cursor-pointer transition-all font-semibold',
      getSpanClass(segment.primaryAnnotationType)
    ]"
    :title="`${segment.primaryAnnotationType}${segment.nestedAnnotations?.length ? ' + ' + segment.nestedAnnotations.length + ' more' : ''}\nClick to edit`"
  >
    <!-- Render text and nested annotations -->
    <template v-if="!segment.nestedAnnotations || segment.nestedAnnotations.length === 0">
      <!-- No nested - just text -->
      {{ segment.content }}
      <span v-if="segment.primaryAnnotationType === 'MEASUREMENT'" class="text-xs opacity-75">
        → {{ segment.normalized }}
      </span>
    </template>
    <template v-else>
      <!-- Has nested annotations - render them recursively -->
      <NestedPart
        :segment="segment"
        :text="text"
        :nested-annotations="segment.nestedAnnotations"
        @select-span="$emit('select-span', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import NestedPart from './NestedPart.vue';

interface Annotation {
  id: string;
  type: string;
  startOffset: number;
  endOffset: number;
  attributes?: Record<string, unknown>;
}

interface Segment {
  type?: 'text' | 'span';
  content: string;
  primaryAnnotationId?: string;
  primaryAnnotationType?: string;
  primaryAnnotationStart?: number;
  primaryAnnotationEnd?: number;
  nestedAnnotations?: Annotation[];
  normalized?: string;
}

defineProps<{
  segment: Segment;
  text: string;
}>();

defineEmits<{
  'select-span': [annotationId: string];
}>();

const getSpanClass = (type?: string) => {
  const classes: Record<string, string> = {
    CRUD: 'bg-red-200 text-red-900',
    NUMBER: 'bg-orange-200 text-orange-900',
    FORMATTING_COMMAND: 'bg-purple-200 text-purple-900',
    SPELLED_OUT: 'bg-yellow-200 text-yellow-900',
    NAMED_ENTITY: 'bg-blue-200 text-blue-900',
    MEDICAL_TERM: 'bg-cyan-200 text-cyan-900',
    MEASUREMENT: 'bg-green-200 text-green-900'
  };
  return classes[type || ''] || 'bg-slate-200 text-slate-900';
};
</script>
