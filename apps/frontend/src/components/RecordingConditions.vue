<template>
  <div v-if="audioFile && recording" class="bg-slate-50 border border-slate-300 rounded p-3 mb-3">
    <h4 class="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
      📊 Recording Conditions
    </h4>

    <!-- Audio File Metadata (Read-only) -->
    <div class="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-slate-300">
      <div>
        <span class="text-xs text-slate-600 font-semibold">Duration</span>
        <p class="text-xs text-slate-800 font-mono">
          {{ formatDuration(audioFile.duration || 0) }}
        </p>
      </div>
      <div>
        <span class="text-xs text-slate-600 font-semibold">Sample Rate</span>
        <p class="text-xs text-slate-800 font-mono">{{ audioFile.sampleRate || '—' }} Hz</p>
      </div>
      <div>
        <span class="text-xs text-slate-600 font-semibold">Channels</span>
        <p class="text-xs text-slate-800 font-mono">{{ audioFile.channels || '—' }}</p>
      </div>
      <div>
        <span class="text-xs text-slate-600 font-semibold">Bit Depth</span>
        <p class="text-xs text-slate-800 font-mono">{{ audioFile.bitDepth || '—' }} bit</p>
      </div>
    </div>

    <!-- Derived Values (Editable Overrides) -->
    <div class="grid grid-cols-2 gap-3">
      <!-- Speech Rate (WPM) -->
      <div>
        <label class="text-xs text-slate-600 font-semibold block mb-1">
          Speech Rate (WPM)
          <span v-if="recording?.speechRate" class="text-slate-500 text-xs font-normal"></span>
        </label>
        <input
          v-model.number="localSpeechRateOverride"
          type="number"
          class="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          placeholder="Edit to override suggested value"
          @blur="saveSpeechRateOverride"
        />
      </div>

      <!-- Distance Estimate -->
      <div>
        <label class="text-xs text-slate-600 font-semibold block mb-1">
          Microphone Distance
          <span v-if="recording?.distanceEstimate" class="text-slate-500 text-xs font-normal"></span>
        </label>
        <select
          v-model="localDistanceOverride"
          class="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          @change="saveDistanceOverride"
        >
          <option value="">Use suggested</option>
          <option value="close">Close</option>
          <option value="medium">Medium</option>
          <option value="far">Far</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAnnotationStore } from '@/store/annotationStore';

const store = useAnnotationStore();

const currentTranscript = computed(() => {
  if (!store.currentTranscriptId) return null;
  return store.transcripts.find(t => t.id === store.currentTranscriptId);
});

const audioFile = computed(() => currentTranscript.value?.audioFile);
const recording = computed(() => {
  return store.currentRecording;
});

const localSpeechRateOverride = ref<number | null>(null);
const localDistanceOverride = ref<string>('');

// Watch recording to sync local state
watch(
  recording,
  newRecording => {
    if (newRecording) {
      // Pre-fill with override if exists, otherwise use suggested value
      const speechRateValue = newRecording.speechRateOverride ?? newRecording.speechRate;
      const distanceValue = newRecording.distanceOverride ?? newRecording.distanceEstimate;

      localSpeechRateOverride.value = speechRateValue;
      localDistanceOverride.value = distanceValue;
    }
  },
  { deep: true }
);

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const saveSpeechRateOverride = async () => {
  if (!audioFile.value?.id) return;
  try {
    await store.updateRecording(audioFile.value.id, {
      speechRateOverride: localSpeechRateOverride.value
    });
  } catch (error) {
    console.error('❌ Failed to save speech rate override:', error);
  }
};

const saveDistanceOverride = async () => {
  if (!audioFile.value?.id) return;
  try {
    await store.updateRecording(audioFile.value.id, {
      distanceOverride: localDistanceOverride.value || null
    });
  } catch (error) {
    console.error('❌ Failed to save distance override:', error);
  }
};
</script>
