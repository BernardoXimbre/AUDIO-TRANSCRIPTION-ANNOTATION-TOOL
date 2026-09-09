# Product Requirements

## Problem

German university hospitals use AI speech-to-text for clinical operations. The AI model produces a first-pass transcript that needs human correction to create a gold-standard dataset for model fine-tuning.

Annotation is repetitive work. A tool that's slow or clunky means annotators take 6 hours instead of 2 for 100 recordings. Bad tooling also creates low-quality data.

## Solution

A web tool that lets annotators:
1. Upload audio files and AI transcripts
2. See a work queue with duration filtering
3. Play audio + edit transcript + mark spans with annotation types
4. Export corrected data

Recordings under 15 seconds are auto-rejected (not worth human time).

## Tech Stack

- **Backend**: Node.js 22 + TypeScript + Express + Prisma + PostgreSQL
- **Frontend**: Vue 3 + Composition API + Tailwind CSS
- **Database**: PostgreSQL 16 (Docker)

## Workflow

1. **Ingest**: Upload audio + AI transcript JSON → Pair by filename
2. **Queue**: View items → Filter by status/duration → Sort
3. **Edit**: Play audio → Correct transcript → Add annotations
4. **Export**: Download JSON with corrections and annotations

## Annotation Types

- **CRUD**: Correction, addition, or deletion
- **NUMBER**: Spoken number with rendering (digits/words)
- **FORMATTING_COMMAND**: Spoken layout (newline, paragraph, etc)
- **MEDICAL_TERM**: Domain-specific term with attributes
- **SPEAKER**: Mark who is speaking
- **UNCERTAIN**: Mark low-confidence regions

## Critical Features

✅ Audio upload (WAV, MP3, M4A)
✅ Transcript pairing and validation
✅ Recording conditions panel (duration, sample rate, channels, bit depth)
✅ Derived speech rate and microphone distance estimates
✅ Playback with speed control & keyboard shortcuts
✅ Click word → jump to timestamp
✅ Span annotation with custom types
✅ Export valid JSON
✅ Filter/sort work queue
✅ Immutable original transcript
✅ Keyboard shortcuts for fast annotation (1-7 keys)

## Success Criteria

- Tool loads in < 2 seconds
- Audio plays seamlessly with keyboard control
- Annotators can correct 50 items per hour
- Export data is valid JSON, human-readable
- No data loss during upload or editing

## Next Phase

- User authentication & role-based access
- Batch operations (delete, reassign multiple items)
- Real-time collaboration (multiple annotators on same item)
- Analytics dashboard (annotator performance, error rates)
- Integration with model re-training pipeline
