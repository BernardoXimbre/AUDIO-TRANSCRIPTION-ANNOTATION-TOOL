<template>
  <div class="h-screen w-screen flex flex-col bg-slate-50">
    <Main3PanelLayout>
      <!-- LEFT PANEL: Work Queue -->
      <template #left>
        <WorkQueue />
      </template>

      <!-- CENTER TOP: Audio Player (Task 5.3) -->
      <template #center-top>
        <AudioPlayer />
      </template>

      <!-- CENTER: Transcripts (Task 5.4) -->
      <template #center>
        <DualTranscriptView />
      </template>

      <!-- RIGHT PANEL: Span Inspector (placeholder - Task 5.5) -->
      <template #right>
        <div class="flex items-center justify-center h-full text-slate-400">
          <p class="text-sm">Span Inspector (Task 5.5)</p>
        </div>
      </template>
    </Main3PanelLayout>

    <!-- Ingest Modal -->
    <IngestModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAnnotationStore } from '@/store/annotationStore';
import Main3PanelLayout from '@/components/Main3PanelLayout.vue';
import WorkQueue from '@/components/WorkQueue.vue';
import AudioPlayer from '@/components/AudioPlayer.vue';
import DualTranscriptView from '@/components/DualTranscriptView.vue';
import IngestModal from '@/components/IngestModal.vue';

const store = useAnnotationStore();

onMounted(async () => {
  // Load transcripts from backend
  await store.fetchTranscripts();
});
</script>
