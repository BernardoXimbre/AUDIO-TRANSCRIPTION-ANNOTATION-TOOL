<template>
  <div class="work-queue max-w-5xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-2">Work Queue</h1>
    <p class="text-gray-600 mb-6">Click any item to start annotating</p>

    <!-- Filters -->
    <div class="flex gap-4 mb-6">
      <div class="flex gap-2 items-center">
        <label class="font-semibold">Status:</label>
        <select v-model="filters.status" @change="loadQueue" class="border rounded px-2 py-1">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-4 bg-blue-50 border border-blue-300 rounded text-blue-700">
      ⏳ Loading queue...
    </div>

    <!-- Error State -->
    <div v-if="error" class="p-4 bg-red-50 border border-red-300 rounded text-red-700 mb-4">
      ❌ Error: {{ error }}
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && items.length === 0"
      class="p-8 bg-gray-50 border border-gray-300 rounded text-center text-gray-500"
    >
      No items in queue. Upload audio files to get started.
    </div>

    <!-- Queue Table -->
    <div v-if="!loading && items.length > 0" class="overflow-x-auto mb-6">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="bg-gray-200 border-b-2 border-gray-400">
            <th class="px-4 py-2 text-left">Filename</th>
            <th class="px-4 py-2 text-center">Duration (s)</th>
            <th class="px-4 py-2 text-center">Status</th>
            <th class="px-4 py-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 font-mono text-blue-600">{{ item.audioFile.filename }}</td>
            <td class="px-4 py-2 text-center">{{ item.audioFile.duration.toFixed(2) }}</td>
            <td class="px-4 py-2 text-center">
              <span :class="statusBadgeClass(item.status)">{{ item.status }}</span>
            </td>
            <td class="px-4 py-2">
              <button
                @click="selectItem(item)"
                class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Open →
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Stats Footer -->
    <div v-if="!loading && items.length > 0" class="text-sm text-gray-600 mt-4">
      Showing {{ items.length }} of {{ total }} items
    </div>
  </div>
</template>

<script setup lang="ts">
/* global URLSearchParams */
import { ref, onMounted } from 'vue';

interface AudioFile {
  id: string;
  filename: string;
  duration: number;
  filepath: string;
  sampleRate: number;
  channels: number;
}

interface QueueItem {
  id: string;
  status: string;
  annotator: string | null;
  audioFile: AudioFile;
}

const items = ref<QueueItem[]>([]);
const loading = ref(false);
const error = ref('');
const total = ref(0);

const filters = ref({
  status: ''
});

async function loadQueue() {
  loading.value = true;
  error.value = '';

  try {
    const params = new URLSearchParams();
    if (filters.value.status) {
      params.append('status', filters.value.status);
    }

    const response = await fetch(`/api/queue?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to load queue: ${response.statusText}`);
    }

    const data = await response.json();
    items.value = data.items || [];
    total.value = data.count || 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
}

function statusBadgeClass(status: string): string {
  const baseClass = 'px-2 py-1 rounded text-xs font-semibold';
  switch (status) {
  case 'pending':
    return `${baseClass} bg-yellow-100 text-yellow-700`;
  case 'in_progress':
    return `${baseClass} bg-blue-100 text-blue-700`;
  case 'completed':
    return `${baseClass} bg-green-100 text-green-700`;
  default:
    return `${baseClass} bg-gray-100 text-gray-700`;
  }
}

function selectItem(item: QueueItem) {
  console.log('Selected item:', item);
  // TODO: Navigate to annotator view
  // router.push({ name: 'annotator', params: { id: item.id } });
}

onMounted(() => {
  loadQueue();
});
</script>

<style scoped>
.work-queue {
  background: white;
}
</style>
