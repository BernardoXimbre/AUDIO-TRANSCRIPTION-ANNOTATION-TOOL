# Phase 5: Frontend Refactor (5 hours)

## 📋 Phase Overview

Refactor frontend to match professional template.html design: single-page workbench with 3-panel layout (Work Queue, Audio Player + Transcripts, Span Inspector).

**Dependencies**: Phase 4 complete (all tests passing)  
**Blocks**: None  
**Status**: ⏳ Ready  

---

## ✅ Phase 5 Checklist

| Task | File | Duration | Status |
|------|------|----------|--------|
| 5.1 | Setup & Layout Base | 1h | ⏳ |
| 5.2 | Work Queue (Left Panel) | 1h | ⏳ |
| 5.3 | Audio Player (Center Top) | 1h | ⏳ |
| 5.4 | Dual Transcript (Center Bottom) | 1h | ⏳ |
| 5.5 | Span Inspector (Right Panel) | 1h | ⏳ |

**Total**: 5 hours | **Tests**: All 5 tests still passing

---

## 🎯 Execution Order

1. **[5.1-setup-layout.md](./5.1-setup-layout.md)** → Pinia store + 3-panel layout + TopAppBar + Footer
2. **[5.2-work-queue.md](./5.2-work-queue.md)** → Refactor queue to left panel (260px) with filter tabs
3. **[5.3-audio-player.md](./5.3-audio-player.md)** → Improve player controls + hotkeys (no waveform canvas)
4. **[5.4-dual-transcript.md](./5.4-dual-transcript.md)** → Side-by-side original (R/O) + corrected (editable)
5. **[5.5-span-inspector.md](./5.5-span-inspector.md)** → Right panel with type selector + attributes

---

## 🎬 Success Criteria

✅ **MVP Complete when:**
- All 5 tests passing (from Phase 0-4)
- Single-page workbench fully functional
- 3-panel layout working (Queue, Player+Transcripts, Inspector)
- No TypeScript errors
- No console errors

---

## ⚠️ What's NOT in This Phase

- ❌ Waveform canvas visualization (keep player controls simple)
- ❌ Advanced testing (tests remain unchanged)
- ❌ Keyboard accessibility audit
- ❌ Dark mode
- ❌ Mobile responsive (desktop-first)

---

## 📝 Notes

**Single-Page Architecture:**
- Remove router pages (Home/Queue/Upload/Export)
- Single route: `/editor/:transcriptId`
- State managed via Pinia store
- Modals for Ingest (inside 3-panel layout)

**Key Components:**
```
<Main3PanelLayout>
  <TopAppBar />
  <div class="3-panel-flex">
    <LeftPanel>WorkQueue</LeftPanel>
    <CenterPanel>
      <AudioPlayer />
      <DualTranscript />
    </CenterPanel>
    <RightPanel>
      <SpanInspector />
    </RightPanel>
  </div>
  <KeyboardShortcutsFooter />
</Main3PanelLayout>
```

---

## 🔒 Critical Rules (Must Enforce)

1. **15-Second Auto-Rejection**: Show visual indicator for items < 15s
2. **Immutable Original Transcript**: Lock with read-only styling
3. **Overlapping Spans**: Support multiple annotations on same text
4. **Annotation Types (6)**: Each with specific colors + attributes
5. **Keyboard Shortcuts**: Hotkeys documented in footer legend

---

**Ready?** Open [5.1-setup-layout.md](./5.1-setup-layout.md)
