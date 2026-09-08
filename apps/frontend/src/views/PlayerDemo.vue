<template>
  <div class="player-demo max-w-2xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-4">Audio Player Demo</h1>

    <div v-if="selectedItem" class="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
      <h2 class="font-bold text-lg">{{ selectedItem.audioFile.filename }}</h2>
      <p class="text-sm text-gray-600">Duration: {{ selectedItem.audioFile.duration.toFixed(2) }}s</p>
      <p class="text-sm text-gray-600">Status: {{ selectedItem.status }}</p>
    </div>

    <div v-if="selectedItem?.audioFile.url" class="mb-6">
      <Player :audioUrl="getAudioUrl(selectedItem.audioFile.url)" :audioInfo="selectedItem?.audioFile" />
    </div>

    <div v-else class="p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-700">
      ⚠️ Select an item from the queue to play audio
    </div>

    <hr class="my-6" />

    <h2 class="text-2xl font-bold mb-4">Work Queue</h2>
    <WorkQueue @itemSelected="selectedItem = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Player from '../components/Player.vue';
import WorkQueue from '../components/WorkQueue.vue';

interface AudioFile {
  id: string;
  filename: string;
  url: string;
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

const selectedItem = ref<QueueItem | null>(null);

function getAudioUrl(relativeUrl: string): string {
  return `http://localhost:5000/uploads${relativeUrl}`;
}
</script>

<style scoped>
.player-demo {
  background: white;
}
</style>
