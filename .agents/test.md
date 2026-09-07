# Test Agent

**Role**: Define and validate regression tests for critical paths.

## Regression Tests (Must Pass)

### Test 1: 15-Second Auto-Rejection Rule

**Scenario**: Ingest an audio file with duration < 15 seconds.

```typescript
test("Audio < 15s is auto-rejected", async () => {
  const audioFile = await uploadAudio("short_clip.wav", { duration: 14.9 });
  const result = await ingest({
    audio: [audioFile.id],
    transcripts: [{ path: "short_clip.wav", label: "Test transcript" }]
  });
  
  expect(result.transcripts[0].isAutoRejected).toBe(true);
  const queueItems = await getWorkQueue();
  expect(queueItems).not.toContainEqual(expect.objectContaining({
    transcriptId: result.transcripts[0].id
  }));
});
```

**Acceptance**: Transcripts for audio < 15s have `isAutoRejected = true` and do not appear in the work queue.

---

### Test 2: Pairing Logic (Auto-match + Manual Override)

**Scenario**: Upload 3 audio files and 2 transcripts; manually pair/unpair as needed.

```typescript
test("Pairing: auto-match, manual override, detection of unmatched", async () => {
  const audios = await uploadAudioFiles(["a.wav", "b.mp3", "c.wav"]);
  const transcripts = [
    { path: "a.wav", label: "Transcript A" },
    { path: "d.wav", label: "Transcript D (orphan)" }
  ];
  
  const pairingState = await autoPair(audios, transcripts);
  expect(pairingState.matched).toEqual([
    { audio: "a.wav", transcript: "a.wav" }
  ]);
  expect(pairingState.unmatchedAudio).toContain("b.wav", "c.wav");
  expect(pairingState.unmatchedTranscript).toContain("d.wav");
  
  // Manual override: pair c.wav with d.wav
  const finalPairing = await pairManual("c.wav", "d.wav");
  expect(finalPairing.matched).toContainEqual({
    audio: "c.wav", transcript: "d.wav"
  });
  
  // Ingest and verify DB
  await ingest(finalPairing);
  const ingested = await getAudioFiles();
  expect(ingested).toHaveLength(3);
  expect(ingested[2].transcripts).toHaveLength(1);
  expect(ingested[2].transcripts[0].originalText).toBe("Transcript D (orphan)");
});
```

**Acceptance**: Auto-pairing by filename works; manual override + unpair operations persist correctly; unmatched items are reported but not silently dropped.

---

### Test 3: Annotation Span Persistence

**Scenario**: Create, edit, delete annotations; verify round-trip data integrity.

```typescript
test("Annotation spans persist and survive round-trip", async () => {
  const transcript = await getTranscript(transcriptId);
  const originalText = transcript.correctedText;
  
  // Create a MEDICAL_TERM span
  const annotation1 = await createAnnotation(transcriptId, {
    type: "MEDICAL_TERM",
    startOffset: 10,
    endOffset: 20,
    attributes: { category: "procedure", note: "Important procedure" }
  });
  
  // Retrieve and verify
  let fetched = await getAnnotation(annotation1.id);
  expect(fetched.attributes.category).toBe("procedure");
  expect(fetched.attributes.note).toBe("Important procedure");
  
  // Edit annotation
  await updateAnnotation(annotation1.id, {
    attributes: { category: "diagnosis", note: "Changed to diagnosis" }
  });
  
  fetched = await getAnnotation(annotation1.id);
  expect(fetched.attributes.category).toBe("diagnosis");
  
  // Delete and verify
  await deleteAnnotation(annotation1.id);
  const remaining = await listAnnotations(transcriptId);
  expect(remaining).not.toContainEqual(expect.objectContaining({
    id: annotation1.id
  }));
});
```

**Acceptance**: Annotations are stored with all attributes intact; edit and delete operations persist correctly.

---

### Test 4: Unit Normalization (NUMBER & MEASUREMENT)

**Scenario**: Verify that units are normalized correctly to base units.

```typescript
test("Unit normalization for MEASUREMENT type", async () => {
  const testCases = [
    { input: { value: 1500, unit: "mg" }, expected: { value: 1.5, unit: "g" } },
    { input: { value: 2, unit: "l" }, expected: { value: 2000, unit: "ml" } },
    { input: { value: 10, unit: "mm" }, expected: { value: 1, unit: "cm" } }
  ];
  
  for (const { input, expected } of testCases) {
    const normalized = normalizeUnit(input.value, input.unit);
    expect(normalized).toEqual(expected);
  }
});

test("NUMBER type rendering", async () => {
  const numberAnnotation = await createAnnotation(transcriptId, {
    type: "NUMBER",
    startOffset: 0,
    endOffset: 5,
    attributes: {
      rendering: "words",
      value: 12
    }
  });
  
  expect(numberAnnotation.attributes.value).toBe(12);
  expect(numberAnnotation.attributes.rendering).toBe("words");
});
```

**Acceptance**: All unit conversions (mg→g, ml→l, mm→cm, etc.) are accurate; NUMBER rendering attribute is preserved.

---

### Test 5: Export JSONL Schema Validity

**Scenario**: Export a completed dataset and verify the JSONL schema.

```typescript
test("Export JSONL has correct schema and valid JSON", async () => {
  const exportedData = await exportJSONL();
  const lines = exportedData.split("\n").filter(l => l.trim());
  
  for (const line of lines) {
    const obj = JSON.parse(line); // Must be valid JSON
    
    // Schema validation
    expect(obj).toHaveProperty("audioPath");
    expect(obj).toHaveProperty("duration");
    expect(obj).toHaveProperty("recordingConditions");
    expect(obj).toHaveProperty("transcript");
    expect(obj).toHaveProperty("annotations");
    
    // Type checks
    expect(typeof obj.audioPath).toBe("string");
    expect(typeof obj.duration).toBe("number");
    expect(Array.isArray(obj.annotations)).toBe(true);
    
    // Recording conditions
    expect(obj.recordingConditions).toHaveProperty("sampleRate");
    expect(obj.recordingConditions).toHaveProperty("speechRate");
    expect(obj.recordingConditions).toHaveProperty("distanceEstimate");
    
    // Transcript
    expect(obj.transcript).toHaveProperty("original");
    expect(obj.transcript).toHaveProperty("corrected");
  }
});
```

**Acceptance**: Export produces valid JSONL (one JSON object per line); each object has all required fields; no malformed JSON.

---

## Test Coverage Strategy

**Unit Tests:**
- Unit normalization functions (isolated, fast)
- Pairing algorithm (match by filename, detect unmatched)
- Span offset validation (no overlap with invalid offsets)

**Integration Tests:**
- Ingest workflow (upload → validate → pair → persist)
- Annotation CRUD (create, read, update, delete)
- Export schema + data

**Manual/E2E (if time allows):**
- Frontend: Play audio, edit transcript, create annotations
- Queue filtering and sorting

## Notes

- Tests use actual PostgreSQL (not mocks) to ensure Prisma behavior is correct
- Audio duration can be mocked in tests (no need for real audio files)
- Each test is independent; database is rolled back after each test (transaction-based or cleanup)

## Code Quality in Tests

**Lint Must Pass for Test Code Too:**
- All test files must pass `yarn lint`
- Test code follows same linting rules as production code (DESIGN.md Section 7)
- No `// eslint-disable` comments unless absolutely necessary (document why)
- Test files must be linted before PR review

Run before committing tests:
```bash
yarn lint:fix    # Auto-fix linting issues
yarn lint        # Verify no errors
```
