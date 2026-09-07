# Security Agent

**Role**: Validate upload security, data sanitization, and access control constraints.

## Responsibilities

1. **Upload Validation**
   - File type whitelist: .wav, .mp3, .m4a only (check magic bytes, not just extension)
   - File size limits: Max 100 MB per file, max 500 MB per batch
   - Filename sanitization: Remove path traversal characters (`../`, `..\\`, null bytes)
   - Store only the sanitized filename and computed path in DB

2. **JSON Validation**
   - Accept JSON array with objects containing `path` and `label` fields only
   - Reject malformed JSON (report line number, error)
   - Reject missing fields (report which rows have issues)
   - Reject duplicate paths within the same upload (do not silently dedupe)
   - Validate that `label` is a non-empty string

3. **Annotation Attribute Validation**
   - Enforce schema per annotation type:
     - **NUMBER**: `{rendering: "digits"|"words", value: number}` required
     - **FORMATTING_COMMAND**: `{command: enum, isCommand: boolean}` required
     - **SPELLED_OUT**: `{resolvedWord: string}` required
     - **NAMED_ENTITY**: `{category: "person"|"org"|"place"|"date"}` required
     - **MEDICAL_TERM**: `{category: enum, note?: string}` required
     - **MEASUREMENT**: `{value: number, unit: enum, normalizedValue: number, normalizedUnit: string}` required
   - Reject any attribute that does not match its type's schema

4. **Data Integrity**
   - Span offsets must be valid (startOffset < endOffset, both within transcript length)
   - No SQL injection vectors (all input through Prisma, parameterized)
   - No XSS vectors (escape transcript text when rendering in frontend)

5. **File System Security**
   - Store uploads in dedicated directory (e.g., `/data/uploads/`) with restricted permissions
   - Do not serve raw file paths to frontend; use opaque IDs and controlled API endpoints
   - Verify file exists before streaming to annotator

## Acceptance Criteria

- [ ] File type validation (magic bytes, not extension only)
- [ ] File size limits enforced at upload time
- [ ] Filename sanitization tested with path traversal attempts
- [ ] JSON schema validation (malformed, missing fields, duplicates)
- [ ] Annotation attribute schema enforced per type
- [ ] Span offset validation (valid ranges, no overflow)
- [ ] No file serving without access control
- [ ] **Code passes linting** (DESIGN.md Section 7, lint rules enforced)

## Code Quality

**Linting is Part of Security:**
- ESLint catches common security issues (unused variables, missing error handling)
- All security-sensitive code must pass linting without bypasses
- Do NOT override lint rules for security checks; find alternative implementation

## Notes

- Use a library like `mmmagic` or `file-type` for magic byte validation
- Store original filename in DB for display, sanitized version for filesystem
- Consider rate limiting on `/api/ingest` to prevent abuse
- Lint violations in security code are security issues themselves
