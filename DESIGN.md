# Architecture & Design

## Data Model

### Core Tables

**AudioFile**
- `id` - UUID, primary key
- `filename` - Original filename
- `filepath` - Storage path (disk or S3)
- `url` - URL to access file
- `duration` - Duration in seconds
- `sampleRate` - Sample rate in Hz (e.g., 16000)
- `channels` - Number of channels (1=mono, 2=stereo)
- `bitDepth` - Bits per sample (16, 24, 32)
- `bextMetadata` - Optional BEXT metadata from WAV header

**Transcript**
- `id` - UUID
- `audioFileId` - FK to AudioFile
- `originalText` - AI-generated transcript (immutable)
- `correctedText` - Human-corrected version
- `status` - pending, in_progress, completed
- `annotator` - Annotator name (optional)

**Annotation**
- `id` - UUID
- `transcriptId` - FK to Transcript
- `type` - CRUD, NUMBER, FORMATTING_COMMAND, SPELLED_OUT, NAMED_ENTITY, MEDICAL_TERM, MEASUREMENT
- `startOffset` - Character position in correctedText
- `endOffset` - End position
- `attributes` - JSON (type-specific attributes)

**Recording**
- `id` - UUID
- `audioFileId` - FK to AudioFile (unique)
- `speechRate` - Calculated words per minute
- `distanceEstimate` - Microphone distance (close, medium, far)
- `speechRateOverride` - User override for speechRate
- `distanceOverride` - User override for distanceEstimate

## Architecture

```
Frontend (Vue 3)
    |
    v
Backend (Express)
    |
    v
PostgreSQL
```

### Backend Services

- **Audio Service**: Upload, validate, duration extraction
- **Transcript Service**: Upload, parse, pair with audio
- **Item Service**: CRUD operations, filtering
- **Annotation Service**: Create, update, delete annotations
- **Export Service**: Generate JSON exports

### Frontend Pages

- **Upload**: Audio + transcript ingestion
- **Work Queue**: List with filter/sort
- **Editor**: Play audio + edit transcript + annotate
- **Export**: Download corrected data

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| TypeScript | Type safety, catches errors early |
| Prisma ORM | Simple, type-safe queries, migrations |
| Vue 3 Composition API | Modern, reactive, easy to test |
| Tailwind CSS | Rapid UI development |
| JSON annotations | Flexible, human-readable, version control friendly |
| Local audio storage | Simple file-based, no S3 complexity |
| PostgreSQL | Reliable, proven, ACID compliance |

## API Endpoints

### Health
- `GET /health` - Health check

### Upload & Queue
- `POST /api/ingest` - Upload audio + transcript (multipart)
- `GET /api/queue` - Get work queue items with filtering

### Transcript Management
- `GET /api/transcript/:id` - Get full transcript with corrected text and annotations
- `PATCH /api/transcript/:id` - Save corrected transcript text

### Annotations
- `GET /api/annotation?transcriptId=...` - List annotations for transcript
- `POST /api/annotation` - Create annotation
- `DELETE /api/annotation/:id` - Delete annotation

### Recording Conditions
- `GET /api/recording/:audioFileId` - Get recording metadata (speechRate, distanceEstimate, overrides)
- `PATCH /api/recording/:audioFileId` - Update recording overrides (speechRateOverride, distanceOverride)

### Export
- `POST /api/export` - Export all completed items as JSON

## Regression Tests

- Audio upload validation (type, size)
- Transcript parsing and pairing
- Duration extraction from audio files
- Annotation creation with all types
- Filtering and sorting work queue
- Export format validation
- Offset calculations for playback sync

## Out of Scope

- User authentication/authorization
- Batch operations
- Real-time collaboration
- Advanced analytics
- Integration with external services
