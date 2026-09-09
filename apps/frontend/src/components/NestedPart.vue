<template>
  <template v-for="part in parts" :key="part.id">
    <!-- Text part -->
    <span v-if="part.type === 'text'">{{ part.content }}</span>

    <!-- Annotation part - render recursively if has nested -->
    <div
      v-else
      @click.stop="$emit('select-span', part.annotationId)"
      :class="[
        'inline-block px-1 py-0.5 rounded cursor-pointer transition-all font-semibold',
        getSpanClass(part.annotationType)
      ]"
      :title="`${part.annotationType}\nClick to edit`"
    >
      <NestedPart
        v-if="part.hasNested"
        :segment="part"
        :text="text"
        :nested-annotations="part.nestedAnnotations"
        @select-span="$emit('select-span', $event)"
      />
      <template v-else>
        {{ part.content }}
      </template>
    </div>
  </template>
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

interface Segment {
  content: string;
  primaryAnnotationStart?: number;
  primaryAnnotationEnd?: number;
  nestedAnnotations?: Annotation[];
}

interface SegmentPart {
  type: 'text' | 'annotation';
  content?: string;
  annotationId?: string;
  annotationType?: string;
  hasNested?: boolean;
  nestedAnnotations?: Annotation[];
  id: string;
}

const props = defineProps<{
  segment: Segment;
  text: string;
  nestedAnnotations?: Annotation[];
}>();

defineEmits<{
  'select-span': [annotationId: string];
}>();

const parts = computed(() => {
  if (!props.nestedAnnotations || props.nestedAnnotations.length === 0) {
    return [
      {
        type: 'text',
        content: props.segment.content,
        id: 'text'
      }
    ] as SegmentPart[];
  }

  const segs: SegmentPart[] = [];
  const segStart = props.segment.primaryAnnotationStart || 0;
  let lastEnd = 0;

  // Sort nested by start offset
  const sorted = [...props.nestedAnnotations].sort((a, b) => a.startOffset - b.startOffset);

  for (const ann of sorted) {
    // Relative positions within segment
    const annStart = ann.startOffset - segStart;
    const annEnd = ann.endOffset - segStart;

    // Add text before annotation
    if (lastEnd < annStart) {
      segs.push({
        type: 'text',
        content: props.segment.content.substring(lastEnd, annStart),
        id: `text_${lastEnd}`
      });
    }

    // Add annotation
    const nestedByThis = sorted.filter(
      other =>
        other.id !== ann.id &&
        other.startOffset >= ann.startOffset &&
        other.endOffset <= ann.endOffset
    );

    segs.push({
      type: 'annotation',
      annotationId: ann.id,
      annotationType: ann.type,
      content: props.segment.content.substring(annStart, annEnd),
      hasNested: nestedByThis.length > 0,
      nestedAnnotations: nestedByThis,
      id: ann.id
    });

    lastEnd = annEnd;
  }

  // Add remaining text
  if (lastEnd < props.segment.content.length) {
    segs.push({
      type: 'text',
      content: props.segment.content.substring(lastEnd),
      id: 'text_end'
    });
  }

  return segs;
});

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
