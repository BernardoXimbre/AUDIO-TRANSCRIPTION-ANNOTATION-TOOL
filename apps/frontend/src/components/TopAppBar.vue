<template>
  <header class="h-11 border-b border-slate-200 bg-white px-3 flex items-center justify-between shrink-0 z-20">
    <!-- LEFT: Title + Badge -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="text-lg">🎙️</span>
        <span class="font-bold text-sm text-slate-900">Clinical Audio Annotation</span>
        <span class="text-xs font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
          Localhost MVP
        </span>
      </div>
      <div class="h-4 w-px bg-slate-200"></div>

      <!-- Active File Info -->
      <div v-if="currentTranscript" class="flex items-center gap-2 font-mono text-xs">
        <span class="font-bold text-slate-900">{{ currentTranscript.audioFile.filename }}</span>
        <span class="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-medium">
          {{ formatDuration(currentTranscript.audioFile.duration) }}
        </span>
        <span
          :class="[
            'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
            statusBadgeClass
          ]"
        >
          <span :class="['w-1.5 h-1.5 rounded-full', statusDotClass]"></span>
          {{ formatStatus(currentTranscript.status) }}
        </span>
      </div>
      <div v-else class="text-xs text-slate-500">No file selected</div>
    </div>

    <!-- RIGHT: Action Buttons -->
    <div class="flex items-center gap-2">
      <!-- Save Changes -->
      <button
        @click="saveChanges"
        class="flex items-center gap-1.5 px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold rounded transition-colors shadow-sm hover:shadow"
        :disabled="!currentTranscript"
      >
        <span class="text-base">💾</span>
        <span>Save</span>
        <kbd class="font-mono text-xs bg-white/20 text-white px-1.5 py-0.5 rounded font-normal">Ctrl+S</kbd>
      </button>

      <!-- Ingest / Upload -->
      <button
        @click="triggerUpload"
        class="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded border border-slate-200 transition-colors font-medium shadow-sm hover:shadow"
        title="Ingest & Pair audio with transcript"
      >
        <span class="text-base">📤</span>
        <span>Ingest / Upload</span>
      </button>

      <!-- Export JSONL -->
      <button
        @click="exportJSONL"
        class="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded border border-slate-200 transition-colors font-medium shadow-sm hover:shadow"
        title="Export gold standard schema"
      >
        <span class="text-base">⬇️</span>
        <span>Export JSONL</span>
        <kbd class="font-mono text-xs text-slate-500 bg-slate-100 px-1 rounded border border-slate-200">Ctrl+E</kbd>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { computed } from 'vue';
import { useAnnotationStore } from '@/store/annotationStore';

const store = useAnnotationStore();

const currentTranscript = computed(() =>
  store.transcripts.find(t => t.id === store.currentTranscriptId)
);

const statusBadgeClass = computed(() => {
  const status = currentTranscript.value?.status;
  switch (status) {
  case 'in_progress':
    return 'bg-amber-50 text-amber-800 border-amber-200';
  case 'completed':
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  default:
    return 'bg-slate-50 text-slate-800 border-slate-200';
  }
});

const statusDotClass = computed(() => {
  const status = currentTranscript.value?.status;
  switch (status) {
  case 'in_progress':
    return 'bg-amber-500';
  case 'completed':
    return 'bg-emerald-600';
  default:
    return 'bg-slate-400';
  }
});

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, '0')}`;
};

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    pending: 'Open',
    in_progress: 'In Progress',
    completed: 'Completed'
  };
  return map[status] || status;
};

const triggerUpload = () => {
  store.setIngestModalOpen(true);
};

const saveChanges = async () => {
  if (!currentTranscript.value) return;

  try {
    await store.saveAllChanges(currentTranscript.value.id);
  } catch {
    console.error('❌ Save failed');
  }
};

const exportJSONL = async () => {
  try {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    if (typeof window !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'annotations-export.json';
      link.click();
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Export error:', error);
  }
};
</script>
