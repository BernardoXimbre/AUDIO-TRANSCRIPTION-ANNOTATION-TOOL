<template>
  <div class="p-3 border-b border-slate-300 bg-white flex flex-col gap-2">
    <!-- Playback Time + Seek Slider -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between text-xs font-mono">
        <span class="font-bold">{{ formatTime(currentTime) }}</span>
        <span class="text-slate-500">/</span>
        <span>{{ formatTime(duration) }}</span>
      </div>

      <!-- Simple Range Slider (no canvas) -->
      <input
        v-model="currentTime"
        type="range"
        :min="0"
        :max="duration"
        step="0.01"
        class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        @change="onSeek"
      />
    </div>

    <!-- CONTROLS: -2s / Play / +2s / Loop -->
    <div class="flex items-center justify-center gap-2">
      <!-- -1s [J] -->
      <button
        @click="rewind"
        class="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1 text-xs"
        title="Jump -1s (J)"
      >
        ⏪ -1s <kbd class="text-xs bg-slate-100 px-1 rounded">J</kbd>
      </button>

      <!-- Play/Pause [P] -->
      <button
        @click="togglePlayPause"
        :class="[
          'px-4 py-1 rounded font-semibold text-white transition-colors',
          isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        ]"
        title="Play/Pause (P)"
      >
        {{ isPlaying ? '⏸ Pause' : '▶ Play' }}
        <kbd class="text-xs bg-white/20 px-1 rounded ml-1">P</kbd>
      </button>

      <!-- +1s [L] -->
      <button
        @click="forward"
        class="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-1 text-xs"
        title="Jump +1s (L)"
      >
        +1s ⏩ <kbd class="text-xs bg-slate-100 px-1 rounded">L</kbd>
      </button>

      <!-- Loop Span [R] -->
      <button
        @click="toggleLoopSpan"
        :class="[
          'px-2 py-1 rounded flex items-center gap-1 text-xs transition-colors',
          loopActive
            ? 'bg-blue-500 text-white'
            : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
        ]"
        title="Loop active span (R)"
      >
        🔁 Loop <kbd class="text-xs bg-slate-100 px-1 rounded">R</kbd>
      </button>
    </div>

    <!-- SPEED TOGGLES -->
    <div class="flex items-center justify-center gap-2">
      <span class="text-xs font-medium text-slate-600">Speed:</span>
      <div class="flex items-center bg-slate-100 rounded border border-slate-300">
        <button
          v-for="speed in [0.75, 1, 1.25, 1.5, 2]"
          :key="speed"
          @click="playbackSpeed = speed"
          :class="[
            'px-2 py-1 text-xs transition-colors border-r border-slate-300 last:border-r-0',
            playbackSpeed === speed
              ? 'bg-white text-blue-500 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          {{ speed }}x
        </button>
      </div>
    </div>

    <!-- Hidden Audio Element -->
    <audio
      ref="audioElement"
      @timeupdate="onTimeUpdate"
      @ended="onAudioEnded"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @loadedmetadata="onLoadedMetadata"
    ></audio>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { ref, watch } from 'vue';
import { useAnnotationStore } from '@/store/annotationStore';

const store = useAnnotationStore();
const audioElement = ref<HTMLAudioElement | null>(null);

const currentTime = ref(0);
const duration = ref(0);
const isPlaying = ref(false);
const playbackSpeed = ref(1);
const loopActive = ref(false);
const loopStart = ref(0);
const loopEnd = ref(0);

// Load audio from current transcript
watch(
  () => store.currentTranscriptId,
  async (transcriptId) => {
    if (!transcriptId || !audioElement.value) return;

    const transcript = store.transcripts.find(t => t.id === transcriptId);
    if (transcript && transcript.audioFile) {
      // Point directly to backend (not through proxy)
      const audioSrc = `http://localhost:5000/uploads/audio/permanent/${transcript.audioFile.filename}`;

      audioElement.value.src = audioSrc;
      audioElement.value.load();
    }
  },
  { immediate: true }
);

// Sync playback speed
watch(playbackSpeed, (speed) => {
  if (audioElement.value) {
    audioElement.value.playbackRate = speed;
  }
});

// Sync current time to store
watch(currentTime, (time) => {
  store.playbackTime = time;
});

const formatTime = (seconds: number) => {
  if (!isFinite(seconds)) return '0:00,00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(2, '0')}`;
};

const togglePlayPause = () => {
  if (!audioElement.value) return;

  if (isPlaying.value) {
    audioElement.value.pause();
  } else {
    audioElement.value.play();
  }
};

const rewind = () => {
  if (audioElement.value) {
    audioElement.value.currentTime = Math.max(0, audioElement.value.currentTime - 1);
  }
};

const forward = () => {
  if (audioElement.value) {
    audioElement.value.currentTime = Math.min(duration.value, audioElement.value.currentTime + 1);
  }
};

const toggleLoopSpan = () => {
  loopActive.value = !loopActive.value;
  if (loopActive.value) {
    loopStart.value = currentTime.value;
    loopEnd.value = currentTime.value + 5; // Default: 5 seconds
  }
};

const onSeek = () => {
  if (audioElement.value) {
    audioElement.value.currentTime = currentTime.value;
  }
};

const onTimeUpdate = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime;

    // Handle loop
    if (loopActive.value && currentTime.value >= loopEnd.value) {
      audioElement.value.currentTime = loopStart.value;
    }
  }
};

const onLoadedMetadata = () => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration;
  }
};

const onAudioEnded = () => {
  if (audioElement.value) {
    audioElement.value.currentTime = 0;
  }
};

// GLOBAL HOTKEY LISTENER
const handleKeyDown = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement;
  const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

  if (e.key === 'j' || e.key === 'J') {
    if (!isTextInput) {
      e.preventDefault();
      rewind();
    }
  } else if (e.key === 'l' || e.key === 'L') {
    if (!isTextInput) {
      e.preventDefault();
      forward();
    }
  } else if (e.key === 'r' || e.key === 'R') {
    if (!isTextInput) {
      e.preventDefault();
      toggleLoopSpan();
    }
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeyDown);
}
</script>
