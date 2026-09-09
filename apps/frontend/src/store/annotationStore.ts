import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

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
  const local = ref<Annotation[]>([]);              // Temporárias, não salvas
  const persisted = ref<Annotation[]>([]);          // Do backend
  const selectedAnnotation = ref<Annotation | null>(null);
  const inspectorTab = ref<'span' | 'recording'>('span');
  const ingestModalOpen = ref(false);
  const playbackTime = ref(0);
  const isPlaying = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const deletedAnnotationIds = ref<string[]>([]); // Track deletions for backend cleanup

  // Computed: todos as annotations (local + persisted)
  const annotations = computed(() => [...local.value, ...persisted.value]);

  // Actions
  const selectTranscript = (id: string) => {
    currentTranscriptId.value = id;
  };

  const selectAnnotation = (annotation: Annotation) => {
    selectedAnnotation.value = annotation;
  };

  const setSelectedAnnotation = (id: string) => {
    const ann = annotations.value.find(a => a.id === id);
    if (ann) {
      selectedAnnotation.value = ann;
    }
  };

  const getTranscriptAnnotations = (transcriptId: string) => {
    return annotations.value.filter(a => a.transcriptId === transcriptId);
  };

  const clearSelectedAnnotation = () => {
    selectedAnnotation.value = null;
  };

  const clearAnnotations = () => {
    local.value = [];
    persisted.value = [];
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
    local.value.push(annotation);
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    let idx = local.value.findIndex(a => a.id === id);
    if (idx >= 0) {
      const updated = { ...local.value[idx], ...updates };
      local.value[idx] = updated;
      
      // Update selectedAnnotation if it's the one being modified
      if (selectedAnnotation.value?.id === id) {
        selectedAnnotation.value = updated;
      }
      return;
    }

    idx = persisted.value.findIndex(a => a.id === id);
    if (idx >= 0) {
      const updated = { ...persisted.value[idx], ...updates };
      persisted.value[idx] = updated;
      
      // Update selectedAnnotation if it's the one being modified
      if (selectedAnnotation.value?.id === id) {
        selectedAnnotation.value = updated;
      }
    }
  };

  const deleteAnnotation = (id: string) => {
    const persistedIdx = persisted.value.findIndex(a => a.id === id);
    if (persistedIdx >= 0) {
      deletedAnnotationIds.value.push(id);
      persisted.value.splice(persistedIdx, 1);
    } else {
      local.value = local.value.filter(a => a.id !== id);
    }
  
    if (selectedAnnotation.value?.id === id) {
      selectedAnnotation.value = null;
    }
  };

  // Update correctedText for a transcript
  const updateTranscriptText = (id: string, correctedText: string) => {
    const idx = transcripts.value.findIndex(t => t.id === id);
    if (idx >= 0) {
      transcripts.value[idx] = {
        ...transcripts.value[idx],
        correctedText
      };
    }
  };

  // Fetch transcripts from backend (queue list)
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

  // Fetch full transcript by ID (originalText + correctedText)
  const fetchTranscriptFull = async (id: string) => {
    try {
      const response = await fetch(`/api/transcript/${id}`);
      if (!response.ok) throw new Error('Failed to fetch transcript');
      const data = await response.json();

      // Update transcript in store with full content
      const idx = transcripts.value.findIndex(t => t.id === id);
      if (idx >= 0) {
        transcripts.value[idx] = {
          ...transcripts.value[idx],
          originalText: data.originalText,
          correctedText: data.correctedText
        };
      }

      // Fetch annotations for this transcript
      await fetchTranscriptAnnotations(id);
    } catch (err) {
      console.error(`❌ Failed to load transcript ${id}:`, err);
    }
  };

  // Fetch annotations for a transcript
  const fetchTranscriptAnnotations = async (transcriptId: string) => {
    try {
      const response = await fetch(`/api/annotation?transcriptId=${transcriptId}`);
      if (!response.ok) throw new Error('Failed to fetch annotations');
      const data = await response.json();
      
      // Load annotations into persisted array
      const annotations = Array.isArray(data) ? data : (data.items || []);
      persisted.value = annotations;

    } catch (err) {
      console.error(`❌ Failed to load annotations for ${transcriptId}:`, err);
    }
  };

  // Save annotation to backend
  const saveAnnotationToBackend = async (annotationId: string) => {
    const annotation = local.value.find(a => a.id === annotationId);
    if (!annotation) return; // Only save from local

    try {
      // POST to backend
      const response = await fetch('/api/annotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptId: annotation.transcriptId,
          type: annotation.type,
          startOffset: annotation.startOffset,
          endOffset: annotation.endOffset,
          attributes: annotation.attributes || {}
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save annotation');
      }

      const savedAnnotation = await response.json();

      // Move from local to persisted
      const idx = local.value.findIndex(a => a.id === annotationId);
      if (idx >= 0) {
        local.value.splice(idx, 1);
        persisted.value.push(savedAnnotation);
        
        // Update selected annotation if it was the one we just saved
        if (selectedAnnotation.value?.id === annotationId) {
          selectedAnnotation.value = savedAnnotation;
        }
      }
      return savedAnnotation;
    } catch (err) {
      console.error(`❌ Failed to save annotation ${annotationId}:`, err);
      throw err;
    }
  };

  // Batch save all changes (new annotations, edits, deletions)
  const saveAllChanges = async (transcriptId: string) => {
    if (!transcriptId) return;

    try {
      const results = {
        added: 0,
        updated: 0,
        deleted: 0,
        errors: 0
      };

      // 1. Save new annotations from local
      const localAnnotations = local.value.filter(
        a => a.transcriptId === transcriptId
      );

      for (const ann of localAnnotations) {
        try {
          await saveAnnotationToBackend(ann.id);
          results.added++;
        } catch {
          results.errors++;
        }
      }

      // 2. Delete annotations marked for deletion
      for (const deletedId of deletedAnnotationIds.value) {
        try {
          const response = await fetch(`/api/annotation/${deletedId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            results.deleted++;
          }
        } catch (err) {
          console.error(`Failed to delete annotation ${deletedId}:`, err);
          results.errors++;
        }
      }
      deletedAnnotationIds.value = [];

      // 3. Save corrected transcript text
      const transcript = transcripts.value.find(t => t.id === transcriptId);
      if (transcript?.correctedText) {
        try {
          const response = await fetch(`/api/transcript/${transcriptId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correctedText: transcript.correctedText })
          });
          if (response.ok) {
            results.updated++;
          }
        } catch (err) {
          console.error('Failed to save transcript text:', err);
          results.errors++;
        }
      }

      return results;
    } catch (err) {
      console.error('❌ Batch save failed:', err);
      throw err;
    }
  };

  return {
    // State
    currentTranscriptId,
    transcripts,
    local,
    persisted,
    annotations, // Computed: local + persisted
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
    setSelectedAnnotation,
    getTranscriptAnnotations,
    clearSelectedAnnotation,
    clearAnnotations,
    setIngestModalOpen,
    setInspectorTab,
    setPlaybackTime,
    setIsPlaying,
    loadTranscripts,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    updateTranscriptText,
    fetchTranscripts,
    fetchTranscriptFull,
    fetchTranscriptAnnotations,
    saveAnnotationToBackend,
    saveAllChanges
  };
});
