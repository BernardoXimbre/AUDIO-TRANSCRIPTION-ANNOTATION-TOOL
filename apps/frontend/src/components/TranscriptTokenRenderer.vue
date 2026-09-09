<template>
  <div class="space-y-2">
    <!-- LEGEND -->
    <div
      class="grid grid-cols-7 gap-2 mb-3 p-2 bg-slate-50 rounded border border-slate-300 text-xs"
    >
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

    <!-- TEXT WITH SEGMENTS -->
    <div class="text-xs leading-relaxed space-y-2">
      <template v-for="(segment, idx) in segments" :key="idx">
        <!-- Non-annotated text -->
        <div v-if="segment.type === 'text'" class="text-slate-800 inline">
          {{ segment.content }}
        </div>

        <!-- Annotated segment - nested divs -->
        <AnnotationNest
          v-else
          :segment="segment"
          :text="props.text"
          @select-span="$emit('select-span', $event)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AnnotationNest from './AnnotationNest.vue';

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
  primaryAnnotationId?: string;
  primaryAnnotationType?: string;
  primaryAnnotationStart?: number;
  primaryAnnotationEnd?: number;
  nestedAnnotations?: Annotation[];
  normalized?: string;
}

const props = defineProps<Props>();

const segments = computed(() => {
  const segs: Segment[] = [];
  let lastEnd = 0;

  // Sort annotations by start position
  const sorted = [...props.annotations].sort((a, b) => a.startOffset - b.startOffset);

  // Group overlapping annotations together
  const groups: Annotation[][] = [];
  for (const ann of sorted) {
    let added = false;
    for (const group of groups) {
      const overlapsWithAny = group.some(
        other => !(ann.endOffset <= other.startOffset || ann.startOffset >= other.endOffset)
      );
      if (overlapsWithAny) {
        group.push(ann);
        added = true;
        break;
      }
    }
    if (!added) {
      groups.push([ann]);
    }
  }

  // Render segments for each group
  for (const group of groups) {
    const minStart = Math.min(...group.map(a => a.startOffset));
    const maxEnd = Math.max(...group.map(a => a.endOffset));

    // Add text before this group
    if (lastEnd < minStart) {
      segs.push({
        type: 'text',
        content: props.text.substring(lastEnd, minStart)
      });
    }

    // Sort annotations by size (largest first for outer div)
    const sortedBySize = group.sort((a, b) => {
      const sizeA = a.endOffset - a.startOffset;
      const sizeB = b.endOffset - b.startOffset;
      return sizeB - sizeA;
    });

    // Primary is the largest
    const primaryAnn = sortedBySize[0];
    
    // Content should only be from primary annotation, not the entire group span
    const content = props.text.substring(primaryAnn.startOffset, primaryAnn.endOffset);

    segs.push({
      type: 'span',
      content,
      primaryAnnotationId: primaryAnn.id,
      primaryAnnotationType: primaryAnn.type,
      primaryAnnotationStart: primaryAnn.startOffset,
      primaryAnnotationEnd: primaryAnn.endOffset,
      nestedAnnotations: sortedBySize.slice(1),
      normalized: (primaryAnn.attributes?.normalizedValue as string) || undefined
    });

    // Update lastEnd to primary annotation's end
    lastEnd = primaryAnn.endOffset;

    // If there are other annotations that extend beyond primary, add them separately
    const extending = sortedBySize.slice(1).filter(a => a.endOffset > primaryAnn.endOffset);
    if (extending.length > 0) {
      // There are annotations that extend beyond primary - this shouldn't happen in our grouping
      // but just in case, update lastEnd to maxEnd
      lastEnd = maxEnd;
    }
  }

  // Add remaining text
  if (lastEnd < props.text.length) {
    segs.push({
      type: 'text',
      content: props.text.substring(lastEnd)
    });
  }

  return segs;
});
</script>
