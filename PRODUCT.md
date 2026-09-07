# Product Document

## 1. The Problem

German university hospitals dictate surgical operation reports to improve efficiency and reduce documentation time. A clinical speech-to-text model produces a first-pass transcript automatically—but the model is not perfect. Errors accumulate across hundreds of recordings.

To measure model quality and fine-tune it, clinical teams need a **gold standard**: transcripts that are:
- **Corrected**: Transcription errors fixed
- **Enriched**: Spans tagged with semantic types (medical terms, measurements, formatting commands, etc.)
- **Audited**: Every annotation decision recorded

**Manual annotation is slow and repetitive.** An annotator may listen to 100 recordings in one sitting, each requiring 10–30 seconds of focused listening, correction, and tagging. The annotation tool decides whether this work takes 2 hours or 6 hours—and whether the result is usable.

---

## 2. The Proposal

We are building **a clinical audio annotation workbench** designed for speed and precision:

### Core Capabilities

1. **Upload & Ingest**
   - Load audio files (.wav, .mp3, .m4a) with automatic duration detection
   - Load AI transcript JSON, or paste one item directly
   - Auto-match audio to transcripts by filename; resolve mismatches manually
   - Automatically reject audio < 15 seconds (not worth human time)

2. **Work Queue**
   - Filterable, sortable list of items: filename, duration, status, annotator
   - Quick status overview (pending / in progress / completed)

3. **Audio Playback**
   - Play/pause, seek, variable speed (0.75x–2x)
   - Keyboard shortcuts for power users (one-handed operation)
   - Click a word → audio jumps to that timestamp

4. **Transcript Editing**
   - Original transcript is immutable (for error measurement)
   - Corrected version is editable and stored separately
   - Side-by-side view (original vs. corrected) optional

5. **Annotation (6 Types)**
   - **CRUD**: Correct, add, or delete tokens
   - **NUMBER**: Spoken numbers (e.g., "zwoelf" → 12, rendered as digits or words)
   - **FORMATTING_COMMAND**: Layout instructions (newline, paragraph, period, dash, etc.)
   - **SPELLED_OUT**: Letter-by-letter or spelling-alphabet words (e.g., "C wie Caesar" → Cefuroxim)
   - **NAMED_ENTITY**: People, organizations, places, dates
   - **MEDICAL_TERM**: Anatomy, procedure, diagnosis, drug, or device with category
   - **MEASUREMENT**: Quantity + unit, with normalization to base unit (mg → g, ml → l)

   Overlapping spans are **allowed** (e.g., a measurement inside a medical term).

6. **Recording Conditions**
   - Display audio metadata (sample rate, channels, bit depth, BEXT info)
   - Prefill derived metrics (speech rate in WPM, distance estimate)
   - Allow annotator to override with their judgment

7. **Export**
   - Export corrected dataset as JSONL (one item per line)
   - Each line includes: audio ref, original + corrected transcript, all annotations, recording conditions
   - Ready for model fine-tuning pipeline

---

## 3. Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Runtime** | Node.js 22 LTS | Stable, widely deployed in hospitals; long support window |
| **Backend** | Express + TypeScript | Type safety for medical data; mature, well-supported |
| **ORM** | Prisma | Expressive schema, migrations, type generation |
| **Database** | PostgreSQL 15+ | ACID compliance required for annotation data; JSON support for flexible attributes |
| **Frontend** | Vue 3 + Composition API | Reactive, lightweight; script setup reduces boilerplate |
| **Package Mgr** | Yarn or Bun | Deterministic lock files; faster installs |
| **Container** | Docker Compose | Single-command database setup; reproducible dev environment |
| **Audio** | ffmpeg-static | Extract metadata without external binaries; support multiple formats |
| **Storage** | Filesystem (→ S3 later) | MVP simplicity; path stored in DB, bytes on disk |

**Deviations Justified:**
- No GraphQL, gRPC, or exotic patterns—simple REST is appropriate for this workload
- Vue 3 Composition API chosen for consistency with modern ecosystem (Nuxt 3, Pinia trends)
- Prisma ORM chosen over raw SQL for type safety; migrations important for annotation schema evolution

---

## 4. Development Workflow (Agent Pipeline)

```
                       REQUIREMENTS
                            │
                            ▼
                     ┌─────────────┐
                     │  ARCHITECT  │
                     │  Validates  │
                     │  Data Model │
                     │  & Routes   │
                     └──────┬──────┘
                            │
              Architecture decisions documented
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
        ┌──────────┐               ┌──────────┐
        │ SECURITY │               │   TEST   │
        │ ────────  │               │ ────────  │
        │ Auth (if  │               │ Coverage  │
        │ needed),  │               │ for:      │
        │ Upload    │               │ • 15s     │
        │ validation│               │   rule    │
        │ Size      │               │ • Pairing │
        │ limits    │               │ • Span    │
        │           │               │   persist │
        └────┬──────┘               └────┬─────┘
             │                          │
             └──────────┬───────────────┘
                        ▼
                 ┌──────────────────┐
                 │ IMPLEMENTATION   │
                 │ ──────────────   │
                 │ Code features:   │
                 │ • Upload ingest  │
                 │ • Queue display  │
                 │ • Player + hotks │
                 │ • Annotations    │
                 │ • Export JSONL   │
                 └───────┬──────────┘
                         │
                         ▼
                    FINAL REVIEW
                  (Demo + Testing)
```

**Key Points:**
- **ARCHITECT** validates data model, Prisma schema, API contracts
- **SECURITY** enforces upload limits, filename validation, path sanitization
- **TEST** covers regression paths: 15s routing, pairing logic, unit normalization, span persistence
- **IMPLEMENTATION** builds the working tool (UI + API)
- **FINAL REVIEW** demos the completed work

---

## 5. Regression Tests (Critical Path)

Tests that must pass before marking the feature complete:

### Test 1: 15-Second Auto-Rejection
```
Given: Audio file with duration = 14.9 seconds
When: File is ingested via POST /api/ingest
Then: Response includes Transcript.isAutoRejected = true
  AND transcript does not appear in work queue
```

### Test 2: Pairing Logic
```
Given: 3 audio files (a.wav, b.mp3, c.wav) and 2 transcripts (a.json path="a.wav", x.json path="d.wav")
When: User calls POST /api/pair with pairings = [a↔a, b↔none, c↔none], x→delete
Then: DB has 3 AudioFile records and 1 Transcript (a paired, b unmatched, c unmatched, x rejected)
```

### Test 3: Span Persistence
```
Given: Transcript "Hello world" with annotation: MEDICAL_TERM [0, 5] {category: "procedure"}
When: User POSTs annotation, then GETs transcript
Then: Annotation data survives round-trip, attributes preserved
```

### Test 4: Unit Normalization
```
Given: MEASUREMENT annotation {value: 1500, unit: "mg"}
When: normalizeUnit(1500, "mg") is called
Then: Returns {value: 1.5, unit: "g"}
```

### Test 5: Export JSONL Schema
```
Given: 1 completed transcript with 2 annotations
When: User POSTs /api/export
Then: Response is valid JSONL (one JSON object per line)
  AND each line has: audioPath, duration, recordingConditions, transcript, annotations
  AND JSON is valid (can parse each line independently)
```

---

## 6. Success Criteria

✅ **MVP Complete When:**
1. User can upload audio + transcripts, resolve pairing mismatches
2. Audio < 15s is auto-rejected
3. Annotator can play audio with shortcuts, edit transcript, create 6 annotation types
4. Annotations persist and export to JSONL
5. Work queue displays all items with filter/sort
6. README + DESIGN.md explain the tool and decisions
7. Demo includes 2–3 sample audio files + transcripts for immediate testing
8. Regression tests pass

✅ **Quality Bar:**
- Clean code organization (Controller → Service → Repository)
- Comprehensive error handling (malformed JSON, missing files, oversized uploads)
- Type safety (TypeScript, Prisma, Vue types)
- All 6 annotation types functional (not necessarily polished)

---

## 7. Out of Scope (Why)

- **Authentication**: Localhost, single annotator only
- **Multi-user workflows, inter-annotator agreement**: Would double complexity; assume manual review
- **Automatic pre-annotation (NER, medical lookup)**: Would require trained models; out of 8–12 hour budget
- **Deployment, CI/CD**: Not needed for local demo
- **Speech model training**: Tool outputs data *for* training, does not train

---

## 8. Timeline Estimate (8–12 hours)

| Phase | Hours | Deliverable |
|-------|-------|-------------|
| Architecture + Schema | 1 | DESIGN.md, Prisma schema |
| Backend Setup | 2 | Express, Prisma, DB, file upload handlers |
| Ingest & Pairing | 2 | Audio/transcript upload, matching, auto-rejection |
| Frontend: Queue & Player | 2 | Work queue, audio player, basic hotkeys |
| Frontend: Annotator | 2 | 6 annotation types, span UI |
| Export + Tests | 1 | JSONL export, regression tests |
| Demo + Polish | 1 | Sample data, README, final review |
| **Total** | **~11** | Working tool, ready for demo |

---

## 9. Next Phase (Not in MVP)

- S3/MinIO for audio storage (scalability)
- Waveform visualization (UX speed)
- Annotation templates & keyboard macros (annotator productivity)
- Export statistics (annotation coverage, error rates)
- Multi-user workflows (if task scope expands)
