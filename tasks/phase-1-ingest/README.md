# Phase 1: Ingest (2 hours)

## 📋 Phase Overview

Upload audio files and transcripts; auto-match by filename; validate file types and sizes; store in database.

**Dependencies**: Phase 0 complete  
**Blocks**: Phase 2  
**Status**: ⏳ Ready

---

## ✅ Phase 1 Checklist

| Task | File | Duration | Status |
|------|------|----------|--------|
| 1.1 | Ingest Endpoint | 30 min | ⏳ |
| 1.2 | File Validation | 30 min | ⏳ |
| 1.3 | Audio Metadata | 30 min | ⏳ |
| 1.4 | Pairing Logic | 30 min | ⏳ |
| 1.5 | Upload UI | 30 min | ⏳ |
| 1.6 | Pairing UI | 30 min | ⏳ |
| 1.7 | Full Flow Test | 30 min | ⏳ |

**Total**: 2 hours | **Tests**: Test 1, Test 2

---

## 🎯 Execution Order

1. **[1.1-ingest-endpoint.md](./1.1-ingest-endpoint.md)** → POST /api/ingest stub
2. **[1.2-file-validation.md](./1.2-file-validation.md)** → Middleware for .wav/.mp3/.m4a
3. **[1.3-audio-metadata.md](./1.3-audio-metadata.md)** → Extract duration via ffmpeg-static
4. **[1.4-pairing-logic.md](./1.4-pairing-logic.md)** → Match transcripts to audio
5. **[1.5-upload-ui.md](./1.5-upload-ui.md)** → Drag-drop component
6. **[1.6-pairing-ui.md](./1.6-pairing-ui.md)** → UI to show matches + manual pairing
7. **[1.7-full-flow.md](./1.7-full-flow.md)** → Test end-to-end + run tests

---

## 🔗 References

- **DESIGN.md** (Section 2): Ingest architecture
- **README.md** (API Endpoints): /api/ingest spec
- **.agents/security.md**: File validation checklist

---

**Ready?** Open [1.1-ingest-endpoint.md](./1.1-ingest-endpoint.md)
