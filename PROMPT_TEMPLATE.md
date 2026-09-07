# TASK: IMPLEMENT / FIX

## 1. CONTEXT

You are working on the **Clinical Audio Transcription Annotation Tool** for German university hospitals.

This is a specialized tool for annotating surgical operation report transcripts. Annotators correct AI-generated speech-to-text and add semantic annotations (medical terms, measurements, formatting commands) to create gold standard datasets for speech model fine-tuning.

Before making any changes, inspect the repository and understand the existing architecture, implementation, tests, and documentation.

### Authoritative Project References (MUST READ)

* `PRODUCT.md` - product requirements, clinical context, and expected behavior
* `DESIGN.md` - architecture, data model, technical decisions, design tradeoffs, and clinical-specific rules
* `README.md` - setup, execution, and project conventions
* `.agents/` directory - agent-specific responsibilities and checklists
* `package.json` - dependencies and available scripts
* `docker-compose.yml` - infrastructure and local development
* Relevant source files and existing tests

Do not assume that the current implementation is correct simply because it exists.

### Critical Project Rules

These rules are **non-negotiable** and must be enforced in all changes:

1. **15-Second Auto-Rejection Rule**: Audio < 15 seconds must be auto-rejected at ingest time (set `Transcript.isAutoRejected = true`)
2. **Immutable Original Transcript**: Original transcript is read-only; corrections stored separately
3. **Overlapping Spans Allowed**: Multiple annotations can overlap on the same text
4. **Audio File Limits**: Max 100 MB per file, 500 MB per batch; accept only .wav, .mp3, .m4a
5. **Unit Normalization**: Measurements must normalize to base units (mg→g, ml→l, mm→cm, etc.)
6. **Filename Sanitization**: Prevent path traversal; validate audio filenames before storing
7. **Pairing Logic**: Auto-match by filename; manual override for edge cases; report unmatched items
8. **Annotation Types**: 6 types with specific attributes (CRUD, NUMBER, FORMATTING_COMMAND, SPELLED_OUT, NAMED_ENTITY, MEDICAL_TERM, MEASUREMENT)

---

## 2. AGENT RESPONSIBILITIES

Use the following agent roles during the task. Reference the `.agents/` directory for detailed checklists.

### Architect (.agents/architect.md)

Review the requested change against:

* existing architecture (Controller → Service → Repository layers)
* domain model (AudioFile, Transcript, Annotation, Recording entities)
* API contracts (endpoints, request/response schemas)
* database model (Prisma schema)
* existing design decisions (immutability, pairing, spanning)
* project scope (what is / is not in MVP)
* clinical-specific rules (15-second rule, annotation types)

Identify architectural consequences before implementation. Ensure changes comply with critical project rules.

### Security (.agents/security.md)

Review the change for:

* **File Handling**: Audio type validation (magic bytes, not just extension), size limits (100 MB/file, 500 MB/batch)
* **Input Validation**: JSON schema validation, malformed input handling, missing fields detection
* **Path Traversal**: Filename sanitization (remove `../`, `..\\`, null bytes)
* **Injection/XSS Risks**: Proper escaping of transcript text in frontend, Prisma parameterization in backend
* **Attribute Schema**: Enforce annotation type-specific attributes (NUMBER, FORMATTING_COMMAND, etc.)
* **Resource Exhaustion**: No unbounded uploads or processing
* **Data Exposure**: Inappropriate logging of sensitive transcript/audio data (HIPAA compliance mindset)

Do not introduce security-sensitive behavior without validation.

### Test / QA (.agents/test.md)

Identify the behavior that must be tested.

At minimum:

* existing behavior must continue working (regression tests)
* the requested behavior must be covered
* edge cases must be considered
* critical project rules must be validated:
  - 15-second auto-rejection works
  - Pairing logic correctly matches/reports unmatched items
  - Annotation spans persist with correct attributes
  - Unit normalization is accurate
  - Export JSONL schema is valid

### Implementation

Implement the change following conclusions from Architect, Security, and Test reviews.

Keep the implementation consistent with:
* existing project structure (Controller/Service/Repository)
* required technology stack (Node 22, Express, TypeScript, Prisma, PostgreSQL, Vue 3)
* naming conventions (snake_case in DB, camelCase in code)
* error handling (structured 400/409/422 responses with detail messages)

---

# 3. TASK

## >>> CHANGE ONLY THIS SECTION <<<

[DESCRIBE THE PROBLEM OR REQUEST HERE]

## <<< END OF CHANGE SECTION >>>

---

# 4. IMPLEMENTATION RULES

Before modifying code:

1. Inspect the relevant files.
2. Identify the current implementation.
3. Identify the root cause or correct extension point.
4. Check `PRODUCT.md` and `DESIGN.md` for conflicts with critical project rules.
5. Determine which files actually need to change.
6. Avoid unnecessary refactoring.

**Enforce These Project Rules:**

* Audio < 15 seconds must result in `Transcript.isAutoRejected = true`
* Original transcript must never be modified after creation
* Overlapping annotation spans must be supported (no uniqueness constraint)
* Audio file validation must check magic bytes (not just extension)
* Filename sanitization must prevent path traversal attacks
* Unit normalization must be correct for all units (see DESIGN.md Decision 4)
* Pairing logic must report unmatched audio and transcripts (never silently drop)
* Annotation attributes must match type schema (see DESIGN.md section 3)

Do NOT:

* rewrite unrelated code
* introduce unnecessary dependencies
* change the required technology stack
* remove existing functionality without justification
* silently change product behavior
* create duplicate implementations
* bypass existing validation or security controls
* weaken existing security controls
* modify tests just to make failing behavior pass
* ignore critical project rules (15s, immutability, overlapping spans, unit normalization)

Prefer the smallest clean change that correctly solves the problem.

---

# 5. DOCUMENTATION CONSISTENCY

If the implementation changes an architectural or product decision, update the appropriate documentation.

### Update `PRODUCT.md` when:

* expected user behavior changes
* a requirement is clarified
* annotation workflow changes
* acceptance criteria change
* clinical context changes

### Update `DESIGN.md` when:

* the data model changes (new fields, entities, relationships)
* an architectural decision changes
* an API design changes
* a significant trade-off is introduced
* a deliberate deviation from task specification is required
* critical rules (15s, immutability, spans, normalization) are affected

Do not modify documentation merely to hide an implementation problem.

---

# 6. VALIDATION

After implementation:

### Build

Run the relevant build/type-check commands.

### Tests

Run:

* existing tests (verify no regression)
* tests related to the changed functionality
* new regression tests where necessary
* **critical project rule tests**:
  - 15-second auto-rejection (from .agents/test.md)
  - Pairing logic (from .agents/test.md)
  - Span persistence (from .agents/test.md)
  - Unit normalization (from .agents/test.md)
  - Export JSONL schema (from .agents/test.md)

### Security

Perform a focused security review of the changed code:

* File upload validation (type, size, sanitization)
* Annotation attribute schema enforcement
* No path traversal vectors
* No XSS vectors in transcript rendering
* No unvalidated input to database

### Requirements

Verify that the implementation still satisfies:

* relevant requirements from `PRODUCT.md`
* critical project rules (15s, immutability, spans, normalization)
* clinical context (medical data integrity)

### Final review

Check for:

* TypeScript errors (strict mode, no `any`)
* broken imports
* broken API contracts
* Prisma/schema inconsistencies
* frontend/backend mismatches
* missing validation
* regressions
* unnecessary changes
* compliance with critical project rules

---

# 7. FINAL RESPONSE

At the end, report:

## Changed

List the files changed and what was changed.

## Why

Explain the root cause and the chosen solution briefly.

## Clinical Compliance

Verify:
* 15-second auto-rejection works correctly
* Original transcript remains immutable
* Annotation attributes are valid for their type
* Unit normalization is accurate (if applicable)

## Tests

List the tests executed and their results. Include critical project rule tests.

## Security

List relevant security considerations and mitigations (file validation, XSS prevention, path sanitization).

## Documentation

State whether `PRODUCT.md` or `DESIGN.md` required updates.

## Remaining Issues

List only genuine remaining issues or limitations. Do not claim something was tested if it was not actually tested.

---

## Quick Reference

* `.agents/architect.md` - Data model & API validation
* `.agents/security.md` - Upload & input validation
* `.agents/test.md` - 5 regression tests (critical paths)
* `.agents/implementation.md` - Build specs & components
* `PRODUCT.md` - Clinical context & requirements
* `DESIGN.md` - Technical decisions & architecture
