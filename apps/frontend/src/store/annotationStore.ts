import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface AudioFile {
  id: string;
  filename: string;
  duration: number;
  url?: string;
  filepath?: string;
  sampleRate?: number | null;
  channels?: number | null;
  bitDepth?: number | null;
}

export interface Annotation {
  id: string;
  transcriptId: string;
  type: string;
  startOffset: number;
  endOffset: number;
  text?: string;
  attributes?: Record<string, unknown>;
  createdAt?: string;
}

export interface Transcript {
  id: string;
  audioFileId?: string;
  audioFile: AudioFile;
  originalText?: string;
  correctedText?: string;
  status: 'pending' | 'in_progress' | 'completed';
  annotator?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const useAnnotationStore = defineStore('annotation', () => {
  // State
  const currentTranscriptId = ref<string | null>(null);
  const transcripts = ref<Transcript[]>([]);
  const annotations = ref<Annotation[]>([]);
  const selectedAnnotation = ref<Annotation | null>(null);
  const inspectorTab = ref<'span' | 'recording'>('span');
  const ingestModalOpen = ref(false);
  const playbackTime = ref(0);
  const isPlaying = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Actions
  const selectTranscript = (id: string) => {
    currentTranscriptId.value = id;
  };

  const selectAnnotation = (annotation: Annotation) => {
    selectedAnnotation.value = annotation;
  };

  const clearSelectedAnnotation = () => {
    selectedAnnotation.value = null;
  };

  const setIngestModalOpen = (open: boolean) => {
    ingestModalOpen.value = open;
  };

  const setInspectorTab = (tab: 'span' | 'recording') => {
    inspectorTab.value = tab;
  };

  const setPlaybackTime = (time: number) => {
    playbackTime.value = time;
  };

  const setIsPlaying = (playing: boolean) => {
    isPlaying.value = playing;
  };

  const loadTranscripts = (items: Transcript[]) => {
    transcripts.value = items;
  };

  const addAnnotation = (annotation: Annotation) => {
    annotations.value.push(annotation);
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    const idx = annotations.value.findIndex(a => a.id === id);
    if (idx >= 0) {
      annotations.value[idx] = { ...annotations.value[idx], ...updates };
    }
  };

  const deleteAnnotation = (id: string) => {
    annotations.value = annotations.value.filter(a => a.id !== id);
  };

  // Fetch transcripts from backend
  const fetchTranscripts = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('/api/queue');
      if (!response.ok) throw new Error('Failed to fetch queue');
      const data = await response.json();
      // API returns { success, count, items }
      loadTranscripts(data.items || []);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to load transcripts:', error.value);
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    currentTranscriptId,
    transcripts,
    annotations,
    selectedAnnotation,
    inspectorTab,
    ingestModalOpen,
    playbackTime,
    isPlaying,
    loading,
    error,
    // Actions
    selectTranscript,
    selectAnnotation,
    clearSelectedAnnotation,
    setIngestModalOpen,
    setInspectorTab,
    setPlaybackTime,
    setIsPlaying,
    loadTranscripts,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    fetchTranscripts
  };
});
