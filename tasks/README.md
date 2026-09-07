# 📋 Implementation Tasks

**Total Tasks**: 33  
**Timeline**: 10.5 hours (8-12 hour target)  
**Status**: Ready for Phase 0

---

## 🚀 Quick Start

1. **Read the Overview** below
2. **Pick your phase** from the table
3. **Open phase folder** → **README.md** (checklist)
4. **Work through tasks** in order (0.1 → 0.2 → 0.3 → 0.4)
5. **Mark complete** when acceptance criteria met

---

## 📊 Phases & Progress

| Phase | Tasks | Duration | Status | Start | Complete |
|-------|-------|----------|--------|-------|----------|
| **Phase 0: Setup** | 0.1-0.4 (4) | 1.5h | ⏳ Ready | - | - |
| **Phase 1: Ingest** | 1.1-1.7 (7) | 2h | ⏳ Ready | - | - |
| **Phase 2: Queue & Player** | 2.1-2.7 (7) | 2h | ⏳ Ready | - | - |
| **Phase 3: Annotator** | 3.1-3.7 (7) | 2h | ⏳ Ready | - | - |
| **Phase 4: Export & Tests** | 4.1-4.5 (5) | 2h | ⏳ Ready | - | - |
| **Phase 5: Demo & Polish** | 5.1-5.4 (4) | 1.5h | ⏳ Ready | - | - |
| **TOTAL** | **33** | **10.5h** | ⏳ | | |

---

## 📂 Folder Structure

```
tasks/
├── README.md                          ← You are here
├── EXAMPLE_TASK_FORMAT.md            ← See format (task 0.1)
│
├── phase-0-setup/
│   ├── README.md                      ← Phase checklist
│   ├── 0.1-prisma-schema.md
│   ├── 0.2-express-server.md
│   ├── 0.3-vue-app.md
│   └── 0.4-docker-verification.md
│
├── phase-1-ingest/
│   ├── README.md
│   ├── 1.1-ingest-endpoint.md
│   ├── 1.2-file-validation.md
│   ├── 1.3-audio-metadata.md
│   ├── 1.4-pairing-logic.md
│   ├── 1.5-upload-ui.md
│   ├── 1.6-pairing-ui.md
│   └── 1.7-full-flow.md
│
├── phase-2-queue-player/
│   ├── README.md
│   ├── 2.1-queue-endpoint.md
│   ├── 2.2-filtering-sorting.md
│   ├── 2.3-work-queue-component.md
│   ├── 2.4-basic-player.md
│   ├── 2.5-player-controls.md
│   ├── 2.6-keyboard-shortcuts.md
│   └── 2.7-recording-conditions.md
│
├── phase-3-annotator/
│   ├── README.md
│   ├── 3.1-annotation-endpoint.md
│   ├── 3.2-attribute-validation.md
│   ├── 3.3-editor-component.md
│   ├── 3.4-type-selector.md
│   ├── 3.5-type-forms.md
│   ├── 3.6-span-rendering.md
│   └── 3.7-full-crud.md
│
├── phase-4-export-tests/
│   ├── README.md
│   ├── 4.1-export-endpoint.md
│   ├── 4.2-test-1-15sec.md
│   ├── 4.3-test-2-pairing.md
│   ├── 4.4-test-4-units.md
│   └── 4.5-test-5-export.md
│
└── phase-5-demo-polish/
    ├── README.md
    ├── 5.1-demo-data.md
    ├── 5.2-seed-script.md
    ├── 5.3-readme-verification.md
    └── 5.4-typescript-polish.md
```

---

## 🎯 How to Use Each Task

Each task file has this structure:

```markdown
# Task X.Y: [Task Name]

## Quick Info
- Phase, Duration, Agent Role, Status

## 📋 Deliverable
- Exact file to create

## ⚡ Exactly
- Step-by-step code/instructions
- Checklist of exact requirements

## ✅ Review Checklist
- How to validate the work

## 🧪 Acceptance Criteria
- When task is complete

## 🔗 References
- Links to DESIGN.md, .agents/, docs

## 📝 Notes
- Context + next task

## 📊 Task Dependencies
- Blocking relationships
```

---

## ⚡ First Task

**Start with**: [phase-0-setup/0.1-prisma-schema.md](./phase-0-setup/0.1-prisma-schema.md)

This task creates the foundation schema. All other tasks depend on it.

---

## 🔗 Related Documents

- **[IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)**: Master reference (all tasks documented)
- **[DESIGN.md](../DESIGN.md)**: Architecture & data model
- **[PRODUCT.md](../PRODUCT.md)**: Product vision & requirements
- **[README.md](../README.md)**: Setup & running guide
- **[.agents/](../.agents/)**: Role-specific checklists

---

## 💡 Tips

1. **Read task carefully** before starting (5 min)
2. **Follow "Exactly" checklist** (not approximate)
3. **Use "Review Checklist" to validate** before marking done
4. **If stuck**, refer to References section
5. **Move to next task** only if acceptance criteria 100% met
6. **Go/No-Go checkpoints** between phases (don't skip)

---

## ✋ Blocker? Contact

If a task has a blocker:
1. Check task dependencies (section at bottom)
2. Review .agents/ files for role guidance
3. Update task with notes about blocker
4. Escalate to IMPLEMENTATION_PLAN.md "Risk Mitigation" section

---

## 📋 Quick Reference: All 33 Tasks

### Phase 0 (1.5h)
- [ ] 0.1 Prisma Schema
- [ ] 0.2 Express Server
- [ ] 0.3 Vue App
- [ ] 0.4 Docker Verification

### Phase 1 (2h)
- [ ] 1.1 Ingest Endpoint
- [ ] 1.2 File Validation
- [ ] 1.3 Audio Metadata
- [ ] 1.4 Pairing Logic
- [ ] 1.5 Upload UI
- [ ] 1.6 Pairing UI
- [ ] 1.7 Full Flow

### Phase 2 (2h)
- [ ] 2.1 Queue Endpoint
- [ ] 2.2 Filtering & Sorting
- [ ] 2.3 WorkQueue Component
- [ ] 2.4 Basic Player
- [ ] 2.5 Player Controls
- [ ] 2.6 Keyboard Shortcuts
- [ ] 2.7 Recording Conditions

### Phase 3 (2h)
- [ ] 3.1 Annotation Endpoint
- [ ] 3.2 Attribute Validation
- [ ] 3.3 Editor Component
- [ ] 3.4 Type Selector
- [ ] 3.5 Type-Specific Forms
- [ ] 3.6 Span Rendering
- [ ] 3.7 Full CRUD

### Phase 4 (2h)
- [ ] 4.1 Export Endpoint
- [ ] 4.2 Test: 15-Second Rule
- [ ] 4.3 Test: Pairing Logic
- [ ] 4.4 Test: Unit Normalization
- [ ] 4.5 Test: Export Schema

### Phase 5 (1.5h)
- [ ] 5.1 Demo Data
- [ ] 5.2 Seed Script
- [ ] 5.3 README Verification
- [ ] 5.4 TypeScript Polish

---

**Ready?** [Start Phase 0 →](./phase-0-setup/README.md)
