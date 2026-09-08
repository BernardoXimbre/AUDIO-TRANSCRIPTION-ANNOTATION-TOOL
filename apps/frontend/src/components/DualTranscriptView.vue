<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-white p-3 border-t border-slate-300">
    <!-- HEADER -->
    <div class="mb-2 flex items-center justify-between">
      <h3 class="text-sm font-bold">Transcript Editor</h3>
      <span class="text-xs text-slate-500">{{ annotations.length }} annotations</span>
    </div>

    <!-- DUAL VIEW: 2 COLUMNS -->
    <div class="flex-1 flex gap-3 overflow-hidden">
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

      <!-- RIGHT: Corrected (Editable with Spans) -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <h4 class="text-xs font-semibold text-slate-700 mb-1">✏️ Corrected (Gold Standard)</h4>
        <div class="flex-1 overflow-y-auto p-2 bg-white border border-slate-300 rounded">
          <div class="text-xs leading-relaxed">
            <!-- Render text with annotation spans -->
            <TranscriptTokenRenderer
              :text="currentTranscript?.correctedText || ''"
              :annotations="annotations"
              @select-span="selectSpan"
              @jump-to-time="jumpToTime"
            />

            <!-- Hint -->
            <p v-if="annotations.length === 0" class="text-slate-400 italic mt-2">
              Select text and create annotations using the inspector panel on the right →
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { computed, watch } from 'vue';
import { useAnnotationStore } from '@/store/annotationStore';
import TranscriptTokenRenderer from './TranscriptTokenRenderer.vue';

const store = useAnnotationStore();

const currentTranscript = computed(() =>
  store.transcripts.find(t => t.id === store.currentTranscriptId)
);

const annotations = computed(() => {
  if (!currentTranscript.value) return [];
  return store.annotations.filter(a => a.transcriptId === currentTranscript.value?.id);
});

// Load full transcript when selection changes
watch(() => store.currentTranscriptId, async (newId) => {
  if (newId) {
    await store.fetchTranscriptFull(newId);
  }
}, { immediate: true });

const selectSpan = (annotationId: string) => {
  const annotation = annotations.value.find(a => a.id === annotationId);
  if (annotation) {
    store.selectAnnotation(annotation);
  }
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
</script>
