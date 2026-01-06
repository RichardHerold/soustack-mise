# AGENTS.MD — soustack-mise

Soustack Mise is a hosted workbench where rough recipe prose becomes an always-valid Soustack recipe artifact.

This repo is **product-first**: ship a simple, trustworthy workflow, then grow capabilities.

---

## North Star

**Capture is free. Structure is earned. The recipe is always valid.**

The user should never feel like they are “adopting a standard.” Soustack is emitted as a side-effect of finishing a recipe.

---

## Locked decisions (do not “just tweak”)

### Source of truth (Option A)
- Canonical state is a **Soustack recipe object** stored as `WorkbenchDoc.recipe`.
- It must be **always valid**.
- Raw prose is a *snapshot/reference*, never authoritative after conversion.

### One-way conversion
- Raw Draft → Structured is **explicit** (button).
- No silent merging or round-tripping.

### Prose preservation
- Preserving original prose is **opt-in**, default **off**.
- Stored as **non-executable metadata** (`x-` lane).
- Prose must never drive computation/validation.

---

## Tech stack (recommended)
- Next.js (App Router) + TypeScript
- Tailwind (optional) for styling
- Supabase (Auth + Postgres + Row Level Security)
- Hosted on Vercel

---

## Repo conventions

### Always-valid invariant
At any time, the system must be able to export a valid Soustack `lite` recipe.  
If fields are missing, fill with placeholders (never throw).

### Avoid dual sources of truth
- `WorkbenchDoc.recipe` is canonical.
- `draft.rawText` is a snapshot/reference only.
- Parsing compiles into canonical recipe; structured UI edits canonical recipe directly.

### Extension lanes
All non-normative data lives under `x-*` fields or a clear app namespace (e.g. `x-mise`).

---

## Data model (canonical in-app types)

### WorkbenchDoc (application state)
```ts
type WorkbenchDoc = {
  recipe: SoustackLiteRecipe; // always valid
  draft: {
    mode: "raw" | "structured";
    rawText?: string; // snapshot only
    lastImport?: { source: "paste" | "upload" | "manual"; confidence: number; at: string };
  };
  extensions?: {
    prose?: { text: string; format: "plain" | "markdown"; capturedAt: string };
  };
  meta: { revision: number; updatedAt: string };
};
