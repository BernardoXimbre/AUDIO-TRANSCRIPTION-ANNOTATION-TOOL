<template>
  <footer
    class="h-7 border-t border-slate-200 bg-slate-50 px-3 flex items-center justify-center text-xs text-slate-600 shrink-0"
  >
    <div class="flex gap-4 font-mono overflow-x-auto">
      <!-- Audio shortcuts -->
      <span v-for="shortcut in audioShortcuts" :key="shortcut.key" class="whitespace-nowrap">
        <kbd class="bg-white px-1 rounded border border-slate-200">{{ shortcut.key }}</kbd>
        {{ shortcut.label }}
      </span>
      <span class="h-4 w-px bg-slate-300"></span>

      <!-- Annotation shortcuts -->
      <span v-for="shortcut in annotationShortcuts" :key="shortcut.key" class="whitespace-nowrap">
        <kbd class="bg-white px-1 rounded border border-slate-200">{{ shortcut.key }}</kbd>
        {{ shortcut.label }}
      </span>
      <span class="h-4 w-px bg-slate-300"></span>
    </div>
  </footer>
</template>

<script setup lang="ts">
const audioShortcuts = [
  { key: 'P', label: 'Play/Pause' },
  { key: 'J', label: '-1s' },
  { key: 'L', label: '+1s' },
  { key: 'R', label: 'Loop' }
];

const annotationShortcuts = [
  { key: '1', label: 'CRUD' },
  { key: '2', label: 'NUMBER' },
  { key: '3', label: 'FORMAT' },
  { key: '4', label: 'SPELLED' },
  { key: '5', label: 'ENTITY' },
  { key: '6', label: 'MEDICAL' },
  { key: '7', label: 'MEASURE' }
];
</script>
