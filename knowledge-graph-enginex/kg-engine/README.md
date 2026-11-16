# Knowledge Graph Engine

A pipeline that turns educational material (PDF, PPTX, DOCX, text, HTML, URLs; Arabic and English) into
**provenance-tracked topic graphs** with prerequisite edges. Every node and edge traces back to the exact source
segment it came from. Uncertain items are routed to human review instead of being committed silently.

> **Status:** working prototype, exported from our Retool build. The pipeline logic in `backend/` is plain
> TypeScript. Retool's database client (`retoolDb`) and LLM client (`openai`) are injected globals, so running it
> elsewhere needs a small adapter (see [Running outside Retool](#running-outside-retool)).

## Pipeline

```
 Bundle (manifest + files)
        │
        ▼
 1. INGEST ──────► segments (≤1200 chars, page-aware, OCR-needed pages flagged, never guessed)
        │
        ▼
 2. EXTRACT ─────► candidate topics, two independent LLM passes (different models/temperatures);
        │          pass agreement becomes a confidence signal
        ▼
 3. NORMALIZE ───► merge near-duplicates (local hashed embeddings + union-find), flag over-broad topics (e.g. "Chapter 3")
        │
        ▼
 4. LINK ────────► prerequisite edges from 4 signals: LLM judgment w/ required justification,
        │          cue phrases (EN/AR), source order, definition similarity; cycle prevention + out-degree cap
        ▼
 5. VALIDATE ────► hard/soft checks, global cycle re-check, orphan detection, gold-set precision,
        │          churn vs. live version → assigns each item a tier
        ▼
   ┌────┴─────────────┬──────────────┐
 auto_commit        queue           block
   │            (human review)   (never committed)
   ▼                  │
 6. COMMIT ◄──────────┘ approved items
   │   immutable graph version, carries forward previous snapshot, audit-logged
   ▼
 7. CROSS-LINK ──► edges between course graphs and background-resource graphs (provenance on both sides)
```

### Confidence policy (`backend/shared/policy.ts`)

| Condition | Tier |
|---|---|
| No source segments, failed hard check, or unreliable extraction | `block` |
| The two extraction passes disagree (agreement < 0.5) | `queue` |
| confidence < `block_threshold` (0.5) | `block` |
| confidence ≥ `auto_commit_threshold` (0.8) | `auto_commit` |
| otherwise | `queue` |

**Self-demotion:** validation measures precision on a held-out gold set. If it falls below `precision_threshold`
(0.9), auto-commit autonomy is withdrawn and the items go to review. Thresholds live in the `engine_config` table.

## Where things are

| Stage | File |
|---|---|
| Bundle creation / ingest | `backend/bundles/createBundle.ts`, `ingestBundle.ts` |
| Extract (2-pass) | `backend/extract/extractCandidates.ts` |
| Normalize | `backend/normalize/normalizeCandidates.ts` |
| Link (edges) | `backend/link/draftEdges.ts` |
| Validate + review queue | `backend/validate/validateGraph.ts` |
| Human decisions | `backend/queue/decideQueueItem.ts` |
| Commit versions | `backend/commit/commitVersion.ts` |
| Cross-graph linking | `backend/crosslink/linkCrossGraph.ts` |
| Gold set management | `backend/gold/manageGold.ts` |
| Read endpoints (graph, versions, audit, run report) | `backend/read/*` |
| Shared: stable IDs, local embeddings, Arabic handling, LLM wrapper, audit log, run tracking | `backend/shared/*` |
| UI (Dashboard, Bundle detail, Graph, Review queue, Quality, Versions & audit) | `frontend/pages/*` |

## Design decisions worth noting

- **Stable, content-derived IDs** (`shared/ids.ts`): re-running a stage reuses IDs and IDs are never reused for
  different content.
- **Two independent extraction passes** with different models; their agreement is a measured signal, not a vibe.
- **Local embeddings** (`shared/embedding.ts`): hashed character-trigram vectors, deterministic and free of
  external calls, used for clustering and as a weak linking signal.
- **Provenance everywhere:** each node and edge stores stage, model, run id and supporting segments. Every engine
  action and human decision is written to `audit_log`.
- **Nothing is guessed:** image-only pages are flagged for OCR rather than hallucinated over.
- **Bilingual:** Arabic normalization and Arabic cue phrases (`shared/arabic.ts`, `draftEdges.ts`).

## Running outside Retool

The export does not include the database schema or Retool's generated frontend hooks. To run elsewhere:

1. Create Postgres tables: `bundles`, `bundle_files`, `segments`, `candidates`, `nodes`, `edges`,
   `graph_versions`, `review_queue`, `runs`, `gold_topics`, `audit_log`, `engine_config`.
2. Provide a `retoolDb` shim (`query`, `insert`, `bulkInsert`, `updateBy`) over `pg`, and an `openai` shim over the
   OpenAI SDK (used only in `backend/shared/llm.ts`).
3. Expose each `backend/**` function as an HTTP route and recreate the `hooks/backend/*` calls in the frontend.

## Stack

Backend: TypeScript serverless functions, Postgres, OpenAI (`gpt-4.1-mini`, `gpt-4o-mini`).
Frontend: React 19, Vite, Tailwind, shadcn/Radix, react-router, Recharts.
