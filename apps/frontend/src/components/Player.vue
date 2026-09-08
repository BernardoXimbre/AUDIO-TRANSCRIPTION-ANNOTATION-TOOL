<template>
  <div class="player bg-gray-100 p-4 rounded-lg">
    <audio
      ref="audioElement"
      :src="audioUrl"
      @timeupdate="updateTime"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
    ></audio>

    <!-- Time Display & Seek Slider -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        <span class="text-xs text-gray-500">{{ audioUrl ? '🎵' : '❌ No audio' }}</span>
      </div>

      <!-- Seek Slider -->
      <input
        type="range"
        v-model.number="currentTime"
        :max="duration || 0"
        @input="seek"
        class="w-full cursor-pointer"
      />
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-center gap-4">
      <button
        @click="togglePlayPause"
        class="px-6 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
      >
        {{ isPlaying ? '⏸ Pause' : '▶ Play' }}
      </button>

      <button
        @click="rewind"
        class="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        title="Rewind 1s"
      >
        ← -1s
      </button>

      <button
        @click="forward"
        class="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        title="Forward 1s"
      >
        +1s →
      </button>
    </div>

    <!-- Audio Info -->
    <div v-if="audioInfo" class="mt-4 p-2 bg-white rounded text-xs text-gray-600">
      <div>Sample Rate: {{ audioInfo.sampleRate }} Hz</div>
      <div>Channels: {{ audioInfo.channels }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* global HTMLAudioElement */
import { ref, onMounted } from 'vue';

interface AudioInfo {
  sampleRate?: number;
  channels?: number;
}

defineProps<{
  audioUrl: string;
  audioInfo?: AudioInfo;
}>();

const audioElement = ref<HTMLAudioElement>();
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function togglePlayPause() {
  if (!audioElement.value) return;

  if (isPlaying.value) {
    audioElement.value.pause();
  } else {
    audioElement.value.play().catch(err => console.error('Play failed:', err));
  }
  isPlaying.value = !isPlaying.value;
}

function seek() {
  if (audioElement.value) {
    audioElement.value.currentTime = currentTime.value;
  }
}

function rewind() {
  if (audioElement.value) {
    audioElement.value.currentTime = Math.max(0, audioElement.value.currentTime - 1);
    currentTime.value = audioElement.value.currentTime;
  }
}

function forward() {
  if (audioElement.value) {
    audioElement.value.currentTime = Math.min(duration.value, audioElement.value.currentTime + 1);
    currentTime.value = audioElement.value.currentTime;
  }
}

function updateTime() {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime;
  }
}

function onLoadedMetadata() {
  if (audioElement.value) {
    duration.value = audioElement.value.duration;
  }
}

function onEnded() {
  isPlaying.value = false;
}

onMounted(() => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration || 0;
  }
});
</script>

<style scoped>
.player {
  min-width: 300px;
}

input[type="range"] {
  accent-color: #3b82f6;
}
</style>
