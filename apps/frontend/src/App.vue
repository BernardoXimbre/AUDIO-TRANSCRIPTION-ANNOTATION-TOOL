<template>
  <div class="h-screen w-screen flex flex-col bg-slate-50">
    <Main3PanelLayout>
      <!-- LEFT PANEL: Work Queue (placeholder - Task 5.2) -->
      <template #left>
        <div class="flex items-center justify-center h-full text-slate-400">
          <p class="text-sm">Work Queue (Task 5.2)</p>
        </div>
      </template>

      <!-- CENTER PANEL: Player + Transcripts (placeholders - Task 5.3 & 5.4) -->
      <template #center>
        <div class="flex items-center justify-center h-full text-slate-400">
          <p class="text-sm">Audio Player & Transcripts (Tasks 5.3 & 5.4)</p>
        </div>
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
import Main3PanelLayout from '@/components/Main3PanelLayout.vue';
import IngestModal from '@/components/IngestModal.vue';
</script>
