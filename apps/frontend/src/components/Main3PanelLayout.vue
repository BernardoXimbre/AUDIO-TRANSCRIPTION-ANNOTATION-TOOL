<template>
  <div class="h-screen flex flex-col bg-slate-50 overflow-hidden">
    <!-- TOP APP BAR -->
    <TopAppBar />

    <!-- 3-PANEL WORKBENCH -->
    <div class="flex-1 flex overflow-hidden">
      <!-- LEFT PANEL: Work Queue (260px) -->
      <aside class="w-[260px] border-r border-slate-200 bg-white flex flex-col shrink-0">
        <slot name="left" />
      </aside>

      <!-- CENTER PANEL: Player + Transcripts -->
      <main class="flex-1 flex flex-col overflow-hidden bg-white">
        <!-- Center Top: Audio Player -->
        <div class="shrink-0">
          <slot name="center-top" />
        </div>

        <!-- Center Content: Transcripts (flex-1 takes remaining space) -->
        <div class="flex-1 overflow-auto">
          <slot name="center" />
        </div>
      </main>

      <!-- RIGHT PANEL: Span Inspector (320px) -->
      <aside class="w-[320px] border-l border-slate-200 bg-white flex flex-col shrink-0">
        <slot name="right" />
      </aside>
    </div>

    <!-- FOOTER: Keyboard Shortcuts -->
    <KeyboardShortcutsFooter />
  </div>
</template>

<script setup lang="ts">
import TopAppBar from './TopAppBar.vue';
import KeyboardShortcutsFooter from './KeyboardShortcutsFooter.vue';
</script>

<style scoped>
/* Ensure proper layout on all screen sizes */
:deep(*) {
  box-sizing: border-box;
}
</style>
