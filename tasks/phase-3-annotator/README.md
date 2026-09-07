# Phase 3: Annotator (2 hours)

## 📋 Phase Overview

Allow annotators to edit transcripts; create annotations with 6 types; support overlapping spans; display results with color coding.

**Dependencies**: Phase 2 complete  
**Blocks**: Phase 4  
**Status**: ⏳ Ready

---

## ✅ Phase 3 Checklist

| Task | File | Duration | Status |
|------|------|----------|--------|
| 3.1 | Annotation Endpoint | 30 min | ⏳ |
| 3.2 | Attribute Validation | 30 min | ⏳ |
| 3.3 | Editor Component | 30 min | ⏳ |
| 3.4 | Type Selector | 30 min | ⏳ |
| 3.5 | Type-Specific Forms | 30 min | ⏳ |
| 3.6 | Span Rendering | 30 min | ⏳ |
| 3.7 | Full CRUD | 30 min | ⏳ |

**Total**: 2 hours | **Tests**: Test 3 (span persistence)

---

## 🎯 Execution Order

1. **[3.1-annotation-endpoint.md](./3.1-annotation-endpoint.md)** → POST /api/annotation
2. **[3.2-attribute-validation.md](./3.2-attribute-validation.md)** → Validate type-specific attrs
3. **[3.3-editor-component.md](./3.3-editor-component.md)** → Transcript editor
4. **[3.4-type-selector.md](./3.4-type-selector.md)** → Dropdown for 6 types
5. **[3.5-type-forms.md](./3.5-type-forms.md)** → Type-specific attribute forms
6. **[3.6-span-rendering.md](./3.6-span-rendering.md)** → Colored highlights
7. **[3.7-full-crud.md](./3.7-full-crud.md)** → Create, edit, delete operations

---

## 🔗 References

- **DESIGN.md** (Section 2): Annotator architecture
- **README.md** (Annotation Types): 6 types & attributes

---

**Ready?** Open [3.1-annotation-endpoint.md](./3.1-annotation-endpoint.md)
