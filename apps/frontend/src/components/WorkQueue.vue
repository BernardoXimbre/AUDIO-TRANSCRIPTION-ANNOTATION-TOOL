<template>
  <div class="flex flex-col h-full">
    <!-- HEADER -->
    <div class="p-2.5 border-b border-slate-200 bg-slate-50 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 font-bold text-xs">
          🎵 Work Queue
        </div>
        <span class="text-xs font-mono text-slate-500">{{ items.length }} items</span>
      </div>

      <!-- Filter Tabs -->
      <div class="grid grid-cols-3 gap-1 bg-white p-0.5 rounded border border-slate-200 text-xs font-medium">
        <button
          @click="activeFilter = 'all'"
          :class="[
            'py-1 px-1 rounded text-center transition-colors',
            activeFilter === 'all'
              ? 'bg-sky-50 text-sky-700 border border-sky-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          ]"
        >
          All ({{ items.length }})
        </button>
        <button
          @click="activeFilter = 'open'"
          :class="[
            'py-1 px-1 rounded text-center transition-colors',
            activeFilter === 'open'
              ? 'bg-sky-50 text-sky-700 border border-sky-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          ]"
        >
          Open ({{ openCount }})
        </button>
        <button
          @click="activeFilter = 'done'"
          :class="[
            'py-1 px-1 rounded text-center transition-colors',
            activeFilter === 'done'
              ? 'bg-sky-50 text-sky-700 border border-sky-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          ]"
        >
          Done ({{ doneCount }})
        </button>
      </div>
    </div>

    <!-- QUEUE LIST -->
    <div class="flex-1 overflow-y-auto divide-y divide-slate-200">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        @click="selectItem(item)"
        :class="[
          'p-2.5 cursor-pointer transition-colors flex flex-col gap-1',
          isAutoRejected(item)
            ? 'bg-rose-50 border-l-[3px] border-rose-400 opacity-60'
            : item.id === store.currentTranscriptId
              ? 'bg-sky-50 border-l-[3px] border-sky-500'
              : 'hover:bg-slate-50'
        ]"
      >
        <!-- Filename + Duration -->
        <div class="flex items-center justify-between">
          <span
            :class="[
              'font-mono text-xs font-bold truncate',
              isAutoRejected(item) ? 'line-through text-slate-400' : 'text-slate-900'
            ]"
          >
            {{ item.audioFile.filename }}
          </span>
          <span
            :class="[
              'font-mono text-xs',
              isAutoRejected(item) ? 'text-rose-600' : 'text-sky-600'
            ]"
          >
            {{ formatDuration(item.audioFile.duration) }}
          </span>
        </div>

        <!-- Status + Pairing -->
        <div class="flex items-center justify-between text-xs">
          <!-- Status Badge -->
          <span
            :class="{
              'inline-flex items-center gap-1 font-medium': true,
              'text-amber-700': item.status === 'in_progress',
              'text-emerald-700': item.status === 'completed',
              'text-slate-500': item.status === 'pending',
              'text-rose-700': isAutoRejected(item)
            }"
          >
            <span
              v-if="item.status === 'in_progress'"
              class="w-1.5 h-1.5 rounded-full bg-amber-500"
            ></span>
            <span v-else-if="item.status === 'completed'" class="text-xs">✓</span>
            <span v-else-if="isAutoRejected(item)" class="text-xs">⚠️</span>
            {{ formatStatus(item.status) }}
          </span>

          <!-- Pairing Badge -->
          <span
            :class="[
              'font-mono text-xs px-1 rounded border font-semibold',
              item.audioFile.id
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            ]"
          >
            {{ item.audioFile.id ? 'Paired' : 'Unpaired' }}
          </span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredItems.length === 0" class="p-4 text-center text-xs text-slate-500">
        No items in this filter
      </div>
    </div>

    <!-- FOOTER: Ingest Rules -->
    <div class="p-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
      <span class="flex items-center gap-1 font-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Ingest Rules: Active
      </span>
      <span class="font-mono text-xs text-slate-400">Min. > 15.0s</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAnnotationStore, Transcript } from '@/store/annotationStore';

const store = useAnnotationStore();
const activeFilter = ref<'all' | 'open' | 'done'>('all');

const items = computed(() => store.transcripts);

const filteredItems = computed(() => {
  if (activeFilter.value === 'all') return items.value;
  if (activeFilter.value === 'open') return items.value.filter(i => i.status === 'pending');
  if (activeFilter.value === 'done') return items.value.filter(i => i.status === 'completed');
  return items.value;
});

const openCount = computed(() => items.value.filter(i => i.status === 'pending').length);
const doneCount = computed(() => items.value.filter(i => i.status === 'completed').length);

const isAutoRejected = (item: Transcript) => item.audioFile.duration <= 15;

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

const selectItem = (item: Transcript) => {
  if (!isAutoRejected(item)) {
    store.selectTranscript(item.id);
  }
};
</script>
