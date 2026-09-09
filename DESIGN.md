# Architecture & Design

## Data Model

### Core Tables

**AudioItem**
- `id` - UUID, primary key
- `filename` - Original filename
- `path` - Storage path
- `duration` - Audio length in seconds
- `status` - PENDING, IN_PROGRESS, COMPLETED, REJECTED
- `originalTranscript` - AI-generated transcript (immutable)
- `correctedTranscript` - Human-corrected version
- `annotations` - JSON array of annotations
- `annotatedBy` - User who completed annotation
- `createdAt`, `updatedAt` - Timestamps

**Annotation**
- `id` - UUID
- `itemId` - FK to AudioItem
- `type` - CRUD, NUMBER, FORMATTING, MEDICAL_TERM, OTHER
- `startOffset` - Character position in transcript
- `endOffset` - End position
- `value` - Corrected text or attribute value
- `attributes` - JSON (e.g., {"rendering": "digits", "value": 12})

**Speaker**
- `id` - UUID
- `name` - Speaker identifier
- `role` - DOCTOR, ASSISTANT, etc

**Utterance**
- `id` - UUID
- `itemId` - FK to AudioItem
- `speakerId` - FK to Speaker
- `startTime` - Seconds in audio
- `endTime` - End time
- `text` - Spoken text

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

### Upload
- `POST /api/upload/audio` - Upload audio files
- `POST /api/upload/transcript` - Upload transcript JSON

### Work Queue
- `GET /api/items` - List with pagination, filter, sort
- `GET /api/items/:id` - Get single item with details

### Editing
- `PUT /api/items/:id` - Update transcript & status
- `POST /api/items/:id/annotations` - Create annotation
- `PUT /api/items/:id/annotations/:annotationId` - Update annotation
- `DELETE /api/items/:id/annotations/:annotationId` - Delete annotation

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
