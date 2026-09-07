# Phase 0: Setup (1.5 hours)

## 📋 Phase Overview

Prepare project scaffolding. All 4 tasks are **foundational** — subsequent phases depend on them.

**Dependencies**: None  
**Blocks**: All other phases  
**Status**: ⏳ Ready to Start

---

## ✅ Phase 0 Checklist

| Task | File | Duration | Status | Notes |
|------|------|----------|--------|-------|
| 0.1 | Prisma Schema | 30 min | ⏳ | Database foundation |
| 0.2 | Express Server | 30 min | ⏳ | Backend API stub |
| 0.3 | Vue App | 30 min | ⏳ | Frontend scaffold |
| 0.4 | Docker Verify | 15 min | ⏳ | Environment validation |

**Total**: 1.5 hours | **Go/No-Go**: All tasks must pass

---

## 🎯 Execution Order

**Execute in this order** (each depends on previous):

1. **[0.1-prisma-schema.md](./0.1-prisma-schema.md)** → Creates schema
2. **[0.2-express-server.md](./0.2-express-server.md)** → Creates server (uses schema)
3. **[0.3-vue-app.md](./0.3-vue-app.md)** → Creates frontend (independent)
4. **[0.4-docker-verification.md](./0.4-docker-verification.md)** → Validates all (uses server + DB)

---

## ⚠️ Critical Rules for This Phase

- ✅ Node 22 LTS required
- ✅ PostgreSQL 15+ via Docker Compose
- ✅ Prisma must validate without errors
- ✅ TypeScript strict mode from start
- ✅ No data in DB yet (just schema + server)

---

## 🚀 Quick Start

```bash
# Terminal 1: Start database
cd AUDIO-TRANSCRIPTION-ANNOTATION-TOOL
docker compose up -d

# Terminal 2: Setup backend
cd apps/backend
yarn install
yarn prisma migrate dev

# Terminal 3: Setup frontend
cd apps/frontend
yarn install
```

---

## ✅ Success Criteria for Phase 0

✅ **All 4 tasks complete when:**

- [ ] `yarn prisma validate` passes (schema valid)
- [ ] `yarn dev:backend` starts on port 5000
- [ ] `yarn dev:frontend` starts on port 3000
- [ ] PostgreSQL running in Docker
- [ ] Zero TypeScript errors in both apps
- [ ] Can access `http://localhost:3000` (blank page expected)

---

## 📊 Task Details

### Task 0.1: Prisma Schema
**File**: [0.1-prisma-schema.md](./0.1-prisma-schema.md)

Creates 4-entity schema:
- AudioFile (metadata, filepath)
- Transcript (original + corrected text)
- Annotation (spans with attributes)
- Recording (derived values)

**Review**: `yarn prisma validate` passes

---

### Task 0.2: Express Server
**File**: [0.2-express-server.md](./0.2-express-server.md)

Creates Express server structure:
- Controllers folder (stub endpoints)
- Services folder (business logic)
- Middleware (error handling)
- Health check endpoint (GET /health)

**Review**: `yarn dev:backend` starts, `/health` returns 200

---

### Task 0.3: Vue App
**File**: [0.3-vue-app.md](./0.3-vue-app.md)

Creates Vue 3 + Composition API scaffold:
- Vite config
- Pinia store setup
- Router scaffold
- Main.vue (placeholder)

**Review**: `yarn dev:frontend` starts, browser shows page

---

### Task 0.4: Docker Verification
**File**: [0.4-docker-verification.md](./0.4-docker-verification.md)

Validates entire environment:
- PostgreSQL running
- Backend connects to DB
- Schema created
- Frontend loads

**Review**: All 4 items work end-to-end

---

## 🔗 References

- **DESIGN.md** (Section 1): Data model
- **PRODUCT.md** (Section 3): Tech stack rationale
- **README.md**: Installation details
- **.agents/architect.md**: Schema validation

---

## 📝 Notes

- **Don't skip tasks**: Each is 30 minutes, sequential
- **Stick to timebox**: If task takes > 30 min, note why in task file
- **Before moving to Phase 1**: All 4 acceptance criteria must pass
- **No demo data yet**: Just infrastructure

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Prisma validation fails | Check schema syntax (copy from 0.1 task exactly) |
| Express won't start | Check NODE_ENV, PORT, DATABASE_URL env vars |
| Vue dev server slow | Ensure Node 22, restart terminal |
| Docker fails | Ensure Docker Desktop running, ports 5432 available |

---

## 🎬 Next Phase

Once Phase 0 complete:
→ **[Phase 1: Ingest](../phase-1-ingest/README.md)**

**Dependencies**: None on other phases (can start Phase 1 & 2 in parallel)

---

**Ready to start?** Open [0.1-prisma-schema.md](./0.1-prisma-schema.md)
