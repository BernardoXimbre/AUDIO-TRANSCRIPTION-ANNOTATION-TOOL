# Architect Agent

**Role**: Validate data model, API routes, and system architecture against requirements.

## Responsibilities

1. **Data Model Review**
   - Prisma schema matches the 6 annotation types and all required fields
   - Foreign keys are correct; no missing indexes
   - Immutability of original transcript is enforced at schema level (if possible)
   - Recording conditions (speech rate, distance) are properly typed (nullable, editable)

2. **API Route Validation**
   - `/api/ingest` (POST): Accepts audio files, JSON transcripts, handles pairing
   - `/api/queue` (GET): Lists items with filter/sort by status and duration
   - `/api/transcript/:id` (GET/PATCH): Retrieve and edit corrected text
   - `/api/annotation` (POST/PATCH/DELETE): Manage annotation spans
   - `/api/recording/:id` (GET/PATCH): Display and edit recording conditions
   - `/api/export` (POST): Export JSONL dataset

3. **Error Handling Design**
   - Malformed JSON: Return 400 with detailed message per error
   - Missing fields: Report each missing field (do not silently drop)
   - Duplicate paths: Reject, do not auto-merge
   - Size limits: Reject files > 100 MB; batch > 500 MB
   - Type validation: Enforce annotation types and attribute schemas

4. **Database Design**
   - Schema supports overlap-allowed spans (no uniqueness constraint on (transcriptId, startOffset, endOffset))
   - Recording table tracks both calculated + user-overridden values
   - Transcript.isAutoRejected is immutable once set
   - All timestamps use UTC, createdAt is immutable

## Acceptance Criteria

- [ ] Prisma schema documented and reviewed
- [ ] All 6 annotation types can be represented in attributes (JSON)
- [ ] 15-second auto-rejection rule is part of the schema (flag or validation)
- [ ] API routes defined with request/response schemas
- [ ] Error handling strategy documented
- [ ] No breaking assumptions introduced that TEST or SECURITY cannot validate

## Notes

- Overlapping spans are allowed (design decision in DESIGN.md)
- Original transcript immutability can be enforced via soft-delete or separate "original" table
- Consider pagination for queue listing (offset/limit)
