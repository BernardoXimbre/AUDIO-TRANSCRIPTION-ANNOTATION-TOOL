<template>
  <div class="pairing-container">
    <div class="content max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-2">Review & Pair Audio with Transcripts</h1>
      <p class="text-gray-600 mb-6">
        Auto-matched pairs shown below. Drag unmatched items to pair them manually.
      </p>

      <div class="grid grid-cols-2 gap-6 mb-6">
        <!-- Left Column: Audio Files -->
        <div class="border border-gray-300 rounded-lg p-4">
          <h2 class="text-lg font-semibold mb-4">📁 Audio Files</h2>

          <!-- Matched Audio -->
          <div v-if="matchedPairs.length > 0" class="mb-6">
            <h3 class="text-sm font-semibold text-green-700 mb-2">
              ✓ Matched ({{ matchedPairs.length }})
            </h3>
            <div class="space-y-2">
              <div
                v-for="pair in matchedPairs"
                :key="pair.audio"
                class="p-3 bg-green-100 border border-green-300 rounded text-sm cursor-move hover:bg-green-150 flex items-center justify-between"
                draggable="true"
                @dragstart="startDrag($event, pair.audio, 'audio')"
              >
                <span class="font-mono">
                  {{ pair.audio }} → {{ pair.transcript }}
                </span>
                <button
                  @click="unpairItem(pair.audio)"
                  class="ml-2 text-red-500 hover:text-red-700 text-xs whitespace-nowrap"
                >
                  Unpair
                </button>
              </div>
            </div>
          </div>

          <!-- Unmatched Audio -->
          <div v-if="unmatchedAudio.length > 0" class="mb-6">
            <h3 class="text-sm font-semibold text-orange-700 mb-2">
              ⚠ Unmatched Audio ({{ unmatchedAudio.length }})
            </h3>
            <div
              class="border-2 border-dashed border-orange-300 rounded p-3 min-h-20 bg-orange-50 space-y-1"
              @dragover.prevent="dragOverZone = 'audio'"
              @dragleave.prevent="dragOverZone = null"
              @drop.prevent="handleDropAudio"
              :class="{ 'bg-orange-100 border-orange-500': dragOverZone === 'audio' }"
            >
              <div
                v-for="audio in unmatchedAudio"
                :key="audio"
                class="p-2 bg-orange-100 border border-orange-300 rounded text-sm cursor-move hover:bg-orange-150 font-mono"
                draggable="true"
                @dragstart="startDrag($event, audio, 'audio')"
              >
                📄 {{ audio }}
              </div>
              <div
                v-if="unmatchedAudio.length === 0"
                class="text-gray-400 text-sm italic p-2"
              >
                Drop unmatched transcripts here
              </div>
            </div>
          </div>

          <div v-if="matchedPairs.length === 0 && unmatchedAudio.length === 0" class="text-gray-400 text-sm italic p-4">
            No audio files
          </div>
        </div>

        <!-- Right Column: Transcripts -->
        <div class="border border-gray-300 rounded-lg p-4">
          <h2 class="text-lg font-semibold mb-4">📝 Transcripts</h2>

          <!-- Matched Transcripts -->
          <div v-if="matchedTranscripts.length > 0" class="mb-6">
            <h3 class="text-sm font-semibold text-green-700 mb-2">
              ✓ Matched ({{ matchedTranscripts.length }})
            </h3>
            <div class="space-y-2">
              <div
                v-for="transcript in matchedTranscripts"
                :key="transcript"
                class="p-3 bg-green-100 border border-green-300 rounded text-sm truncate font-mono"
              >
                {{ transcript }}
              </div>
            </div>
          </div>

          <!-- Unmatched Transcripts -->
          <div v-if="unmatchedTranscript.length > 0" class="mb-6">
            <h3 class="text-sm font-semibold text-orange-700 mb-2">
              ⚠ Unmatched Transcripts ({{ unmatchedTranscript.length }})
            </h3>
            <div
              class="border-2 border-dashed border-orange-300 rounded p-3 min-h-20 bg-orange-50 space-y-1"
              @dragover.prevent="dragOverZone = 'transcript'"
              @dragleave.prevent="dragOverZone = null"
              @drop.prevent="handleDropTranscript"
              :class="{ 'bg-orange-100 border-orange-500': dragOverZone === 'transcript' }"
            >
              <div
                v-for="transcript in unmatchedTranscript"
                :key="transcript"
                class="p-2 bg-orange-100 border border-orange-300 rounded text-sm cursor-move hover:bg-orange-150 truncate font-mono"
                draggable="true"
                @dragstart="startDrag($event, transcript, 'transcript')"
              >
                📄 {{ transcript }}
              </div>
              <div
                v-if="unmatchedTranscript.length === 0"
                class="text-gray-400 text-sm italic p-2"
              >
                Drop unmatched audio files here
              </div>
            </div>
          </div>

          <div v-if="matchedTranscripts.length === 0 && unmatchedTranscript.length === 0" class="text-gray-400 text-sm italic p-4">
            No transcripts
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="p-4 bg-blue-50 border border-blue-300 rounded mb-6">
        <h3 class="font-semibold mb-2">Summary</h3>
        <ul class="text-sm space-y-1">
          <li>✓ Matched Pairs: {{ matchedPairs.length }}</li>
          <li>⚠ Unmatched Audio: {{ unmatchedAudio.length }}</li>
          <li>⚠ Unmatched Transcripts: {{ unmatchedTranscript.length }}</li>
          <li>📊 Total Audio Files: {{ matchedPairs.length + unmatchedAudio.length }}</li>
          <li>
            📊 Total Transcripts: {{ matchedPairs.length + unmatchedTranscript.length }}
          </li>
        </ul>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 justify-center">
        <button
          @click="goBack"
          class="px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-400"
        >
          ← Back to Upload
        </button>
        <button
          @click="acceptAndIngest"
          :disabled="unmatchedAudio.length > 0 || unmatchedTranscript.length > 0"
          class="px-6 py-3 bg-green-500 text-white font-semibold rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          ✓ Accept & Ingest
        </button>
      </div>

      <!-- Validation Warning -->
      <div
        v-if="unmatchedAudio.length > 0 || unmatchedTranscript.length > 0"
        class="mt-4 p-3 bg-orange-50 border border-orange-300 rounded text-orange-700 text-sm"
      >
        ⚠ All files must be paired before ingesting. Please pair all unmatched items.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface PairingResult {
  audio: string;
  transcript: string;
}

const props = defineProps<{
  initialMatched: PairingResult[];
  initialUnmatchedAudio: string[];
  initialUnmatchedTranscript: string[];
}>();

const emit = defineEmits<{
  'ingest-complete': [
    pairingResult: {
      matched: PairingResult[];
      unmatchedAudio: string[];
      unmatchedTranscript: string[];
    }
  ];
  back: [];
}>();

const matchedPairs = ref<PairingResult[]>(props.initialMatched);
const unmatchedAudio = ref<string[]>(props.initialUnmatchedAudio);
const unmatchedTranscript = ref<string[]>(props.initialUnmatchedTranscript);

let draggedItem: { item: string; type: 'audio' | 'transcript' } | null = null;
const dragOverZone = ref<'audio' | 'transcript' | null>(null);

const matchedTranscripts = computed(() => {
  return matchedPairs.value.map((p) => p.transcript);
});

function startDrag(
  event: DragEvent,
  item: string,
  type: 'audio' | 'transcript'
): void {
  draggedItem = { item, type };
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item);
  }
}

function handleDropAudio(): void {
  if (!draggedItem || draggedItem.type !== 'transcript') {
    draggedItem = null;
    dragOverZone.value = null;
    return;
  }

  const transcriptIndex = unmatchedTranscript.value.indexOf(draggedItem.item);
  if (transcriptIndex >= 0 && unmatchedAudio.value.length > 0) {
    // Find an unmatched audio to pair with this transcript
    const audioIndex = unmatchedAudio.value.length - 1;
    const audio = unmatchedAudio.value[audioIndex];
    const transcript = unmatchedTranscript.value[transcriptIndex];

    // Create pair
    matchedPairs.value.push({ audio, transcript });

    // Remove from unmatched
    unmatchedAudio.value.splice(audioIndex, 1);
    unmatchedTranscript.value.splice(transcriptIndex, 1);
  }

  draggedItem = null;
  dragOverZone.value = null;
}

function handleDropTranscript(): void {
  if (!draggedItem || draggedItem.type !== 'audio') {
    draggedItem = null;
    dragOverZone.value = null;
    return;
  }

  const audioIndex = unmatchedAudio.value.indexOf(draggedItem.item);
  if (audioIndex >= 0 && unmatchedTranscript.value.length > 0) {
    // Find an unmatched transcript to pair with this audio
    const transcriptIndex = unmatchedTranscript.value.length - 1;
    const audio = unmatchedAudio.value[audioIndex];
    const transcript = unmatchedTranscript.value[transcriptIndex];

    // Create pair
    matchedPairs.value.push({ audio, transcript });

    // Remove from unmatched
    unmatchedAudio.value.splice(audioIndex, 1);
    unmatchedTranscript.value.splice(transcriptIndex, 1);
  }

  draggedItem = null;
  dragOverZone.value = null;
}

function unpairItem(audio: string): void {
  const pairIndex = matchedPairs.value.findIndex((p) => p.audio === audio);
  if (pairIndex >= 0) {
    const pair = matchedPairs.value[pairIndex];
    matchedPairs.value.splice(pairIndex, 1);
    unmatchedAudio.value.push(audio);
    unmatchedTranscript.value.push(pair.transcript);
  }
}

function goBack(): void {
  emit('back');
}

function acceptAndIngest(): void {
  if (unmatchedAudio.value.length > 0 || unmatchedTranscript.value.length > 0) {
    alert('All files must be paired before ingesting');
    return;
  }

  emit('ingest-complete', {
    matched: matchedPairs.value,
    unmatchedAudio: unmatchedAudio.value,
    unmatchedTranscript: unmatchedTranscript.value
  });
}
</script>

<style scoped>
.pairing-container {
  background: white;
  min-height: 100vh;
  padding: 40px 20px;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
