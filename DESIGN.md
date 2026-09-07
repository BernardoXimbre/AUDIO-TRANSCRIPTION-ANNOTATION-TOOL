# Design Document

## 1. Data Model

### Core Entities (Prisma)

```
AudioFile
├─ id (UUID)
├─ filename (String, unique)
├─ path (String) - filesystem reference
├─ duration (Float) - seconds, read server-side from header
├─ sampleRate (Int)
├─ channels (Int)
├─ bitDepth (Int)
├─ fileSize (Long)
├─ bextMetadata (Json, nullable)
├─ listInfoMetadata (Json, nullable)
├─ createdAt (DateTime)
├─ recordings (Recording[])
└─ transcripts (Transcript[])

Transcript
├─ id (UUID)
├─ audioFileId (UUID, FK)
├─ originalText (String) - immutable
├─ correctedText (String) - editable
├─ isAutoRejected (Boolean) - true if audio < 15 seconds
├─ status (enum: pending, in_progress, completed)
├─ createdAt (DateTime)
├─ updatedAt (DateTime)
├─ annotations (Annotation[])
└─ audioFile (AudioFile)

Annotation
├─ id (UUID)
├─ transcriptId (UUID, FK)
├─ type (enum: CRUD, NUMBER, FORMATTING_COMMAND, SPELLED_OUT, NAMED_ENTITY, MEDICAL_TERM, MEASUREMENT)
├─ startOffset (Int) - char position
├─ endOffset (Int) - char position
├─ attributes (Json) - type-specific attributes
├─ createdAt (DateTime)
├─ updatedAt (DateTime)
└─ transcript (Transcript)

Recording
├─ id (UUID)
├─ audioFileId (UUID, FK)
├─ speechRate (Float, nullable) - words per minute (editable)
├─ distanceEstimate (String, nullable) - close/medium/far (editable)
├─ distanceMethod (String) - description of estimation method
├─ rmsLevel (Float, nullable) - for distance calculation
├─ peakLevel (Float, nullable)
├─ noiseFloor (Float, nullable)
├─ updatedAt (DateTime)
└─ audioFile (AudioFile)
```

---

## 2. Architecture

### Request Flow (High Level)

```
Frontend (Vue 3)
    ↓ HTTP
Backend (Express + TypeScript)
    ├─ Controller Layer (route handlers)
    ├─ Service Layer (business logic, validation)
    └─ Repository Layer (Prisma queries)
    ↓
PostgreSQL Database
    + Filesystem (audio files in /data/uploads)
```

### Key Modules

**Backend Structure:**
- `controllers/ingestController.ts`: POST /api/ingest (audio + JSON upload, validation, pairing)
- `controllers/queueController.ts`: GET /api/queue (filterable transcript list)
- `controllers/transcriptController.ts`: GET/PATCH transcript (original, corrected text)
- `controllers/annotationController.ts`: CRUD annotation spans
- `controllers/recordingController.ts`: GET/PATCH recording conditions (speech rate, distance)
- `controllers/exportController.ts`: POST /api/export (JSONL dataset)
- `services/pairingService.ts`: Filename matching, conflict detection
- `services/annotationService.ts`: Span validation, attribute schema enforcement
- `repositories/annotationRepository.ts`: Prisma Annotation CRUD
- `repositories/transcriptRepository.ts`: Prisma Transcript CRUD
- `utils/audioMetadata.ts`: ffmpeg-static wrapper (duration, sample rate, channels, bit depth, BEXT metadata)
- `utils/unitNormalization.ts`: Convert units (mg→g, ml→l, mm→cm)
- `utils/speechRate.ts`: Calculate words per minute
- `utils/distanceEstimate.ts`: Estimate speaker distance from RMS/peak level
- `middleware/uploadValidator.ts`: File type check (magic bytes), size limits, sanitization
- `middleware/errorHandler.ts`: Structured error responses (400, 409, 422)

**Frontend Components:**
- `components/Upload.vue`: Audio + transcript upload, pairing UI (auto-match + manual drag-drop)
- `components/WorkQueue.vue`: Filterable list (status, duration); sort and click-to-edit
- `components/Player.vue`: HTML5 audio player with play/pause, seek, speed control (0.75x–2x), keyboard shortcuts
- `components/Editor.vue`: Side-by-side transcript editor (original read-only, corrected editable)
- `components/Annotator.vue`: Span creation UI, 6 annotation types, attribute forms per type, overlap support
- `components/RecordingConditions.vue`: Display metadata (sample rate, channels, BEXT), editable overrides (speech rate, distance)
- `stores/annotationStore.ts`: Pinia state management (current transcript, annotations, player state)

---

## 3. Design Decisions & Tradeoffs

### Decision 1: Overlapping Spans – **ALLOWED**

**Why:** Medical transcripts often require overlapping annotations (e.g., a MEASUREMENT inside a MEDICAL_TERM). Disallowing overlap creates frustration.

**Trade-off:** Slightly more complex rendering (spans must layer). Frontend uses z-index stacking and visual contrast.

### Decision 2: Audio Storage – **Filesystem (not S3/MinIO)**

**Why:** Task is localhost, single annotator. Filesystem is simpler, no external dependencies.

**Implementation:** 
- `$CWD/data/uploads/{year}/{month}/` directory
- Path stored in DB, bytes not stored
- Size limit enforced at upload: 100 MB per file, 500 MB per batch

**Future:** Replace with S3-compatible bucket if needed.

### Decision 3: Auto-Rejection Routing – **Set at Ingest**

**Why:** Simple, deterministic. Audio < 15s → Transcript.isAutoRejected = true immediately.

**Implementation:** Server reads duration from audio header using `ffmpeg-static`, compares with 15s limit.

**Not implemented:** Re-queuing logic (out of scope). Rejected items are marked but stay in DB for audit.

### Decision 4: Derived Values – **Prefilled, Editable**

**Why:** Speech rate and distance estimates are suggestions only. Annotator may override based on domain knowledge.

**Implementation:**
- **Speech Rate**: tokens (whitespace-split) ÷ duration → words per minute
- **Distance Estimate**: 
  - RMS level from ffmpeg-normalized audio analysis
  - Close (< −6 dB), Medium (−6 to −12 dB), Far (< −12 dB)
  - Documented as "estimate from RMS level, not a measurement"
- Both are nullable; DB tracks original + user override

### Decision 5: Export Schema (JSONL) – **Flat, Complete**

**Why:** One line per item. All context in each line (no joins needed for consumers).

```json
{
  "audioPath": "880_NTX.wav",
  "duration": 45.2,
  "recordingConditions": {
    "sampleRate": 16000,
    "channels": 1,
    "bitDepth": 16,
    "bextMetadata": { ... },
    "speechRate": 125,
    "distanceEstimate": "close"
  },
  "transcript": {
    "original": "Kontrollierte Rueckenlagerung...",
    "corrected": "Kontrollierte Rückenlagerung..."
  },
  "annotations": [
    {
      "type": "MEDICAL_TERM",
      "startOffset": 0,
      "endOffset": 24,
      "attributes": { "category": "procedure" }
    }
  ]
}
```

### Decision 6: Pairing UI – **Manual Override After Auto-Match**

**Why:** Auto-match by filename works 80% of the time. Manual pairing handles edge cases (renamed files, multiple transcripts per audio).

**Implementation:**
- Auto-match on filename (with/without extension)
- Show unmatched on left (audio) and right (transcripts)
- Drag-drop or click-to-pair UI
- User can unpair and re-pair as needed
- "Accept & Ingest" button triggers validation and DB insert

---

## 4. What We're Cutting for Time

### Not Implemented (Scope Exclusions)

- **Authentication / User Management**: Assume localhost, single annotator
- **Inter-Annotator Agreement**: No multi-user workflows
- **Automatic Pre-Annotation**: No NER, medical lookup, etc.
- **CI/CD, Deployment**: Local dev only
- **Audio Model Training**: No speech model involved

### Partially Implemented (Time Trade-offs)

- **Annotation Types**: All 6 types supported, but minimal auto-suggest
- **Keyboard Shortcuts**: Core actions only (play/pause, skip 1s, speed ±0.25x)
- **Accessibility**: Basic WCAG (labels, alt text); not comprehensive
- **Metadata Extraction**: ffmpeg-static handles basics; no advanced forensics

---

## 5. Regression Tests (Critical Path)

**Must Test:**
1. **15-second routing**: Audio < 15s → isAutoRejected = true
2. **Pairing logic**: Filename match, manual override, unmatched detection
3. **Span persistence**: Create, edit, delete annotations; data survives round-trip
4. **Unit normalization**: 
   - NUMBER: 1500 mg → 1.5 g
   - MEASUREMENT: value + unit conversion
5. **Export schema**: JSONL output has all required fields, valid JSON per line

---

## 7. Code Quality & Linting

### Lint Configuration

All backend code must pass linting. Configuration:

- **Tool**: ESLint v8 + Prettier
- **Config Files**: `.eslintrc.json` (backend), `.prettierrc.json` (backend)
- **Rules Enforced**:
  - Semicolons required
  - Single quotes for strings
  - 2-space indentation
  - No unused variables (prefixed `_` allowed)
  - Proper type annotations (@typescript-eslint/no-explicit-any warned)

### Commands

```bash
# Check for lint errors
yarn lint

# Auto-fix lint errors
yarn lint:fix

# Format code with Prettier
yarn format
```

### Workflow

Before committing code:
1. `yarn lint:fix` (auto-fixes most issues)
2. `yarn format` (applies prettier rules)
3. Commit only if `yarn lint` returns 0 errors (warnings acceptable)

Linting is **mandatory** for code quality consistency. Agents reviewing PRs must ensure lint passes.

---

## 8. Next Steps (Roadmap)

**Phase 2 (After MVP):**
- Batch export with S3/MinIO support
- Speech rate & distance confidence scores
- Keyboard shortcut customization
- Audio zoom/waveform visualization
- Annotation templates & presets
- Search/filter by annotation type across items

**Phase 3 (Long-term):**
- Multi-annotator workflows
- Inter-annotator agreement metrics
- Automatic pre-annotation (NER, medical term lookup)
- Integration with actual speech model training pipeline
