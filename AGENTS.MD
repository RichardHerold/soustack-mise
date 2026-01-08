Soustack Mise is a hosted workbench where rough recipe prose becomes an **always-valid Soustack recipe artifact**.

This repository is **product-first and adoption-first**:
we optimize for trust, clarity, and progressive structure—not schema purity.

---

## North Star

**Capture is free. Structure is earned. The recipe is always valid.**

Users should never feel like they are “adopting a standard.”
Soustack is emitted as a *side-effect* of finishing a recipe.

---

## Locked decisions (do not “just tweak”)

### 1. Source of truth (immutable)

* Canonical state is a **Soustack recipe object** stored at:

  ```
  WorkbenchDoc.recipe
  ```

* This object must be **always valid** at all times.

* Raw prose is a **snapshot/reference**, never authoritative after conversion.

There is no dual-write system.
There is no reconciliation step.
There is no silent inference.

---

### 2. One-way conversion (explicit)

* Raw Draft → Structured is **explicit** (button / user action).
* No silent merging.
* No background reconciliation.
* No round-tripping from structured → raw.

If the user wants to keep prose, they must opt in.

---

### 3. Prose preservation (opt-in, non-executable)

* Preserving original prose is **opt-in**, default **off**.
* Stored only as metadata:

  * under `recipe["x-mise"]`
  * or `WorkbenchDoc.extensions`
* Prose **never** drives:

  * validation
  * computation
  * scaling
  * scheduling

If prose exists, it is archival—not authoritative.

---

## Core invariants (must never be violated)

### Always-valid invariant

At **any moment**, the system must be able to emit a valid Soustack `lite` recipe.

* Missing fields → fill with safe placeholders
* Invalid user input → preserve, do not throw
* Parsing errors → fall back, do not block

**The UI must never strand the user in an invalid state.**

---

### No dual sources of truth

* `WorkbenchDoc.recipe` is canonical
* `draft.rawText` is a snapshot only
* Structured editor mutates canonical recipe directly

If two representations disagree, the recipe wins.

---

## Stack & capability model (CRITICAL)

### Canonical rule (locked)

> **In the editor state, stack declarations are unversioned capability keys.**

✅ Correct:

```json
"stacks": {
  "prep": 1,
  "storage": 1,
  "timed": 1,
  "scaling": 1
}
```

🚫 Forbidden:

```json
"stacks": {
  "prep@1": {},
  "storage@1": {}
}
```

---

### What stacks do (and do NOT do)

**Stacks are capability declarations only.**

They:

* unlock UI sections
* enable affordances
* define what *could* be supported

They **do not**:

* create payload content
* delete payload content
* auto-convert user prose
* enforce strict requirements

All structure remains **user-authored**.

---

## Guidance model (replaces “Draft vs Mise” as a mental model)

### Key principle

> **Guidance is optional, advisory, and never blocking.**

Editing is continuous.
Capabilities may be enabled at any time.

Guidance answers:

> “If I care about this capability, what does it require?”

---

### Guidance OFF (default authoring state)

* Users may enable stacks freely
* UI sections unlock and are editable
* No global checklist
* No warning panels

**Allowed:** calm, inline helper text near affected sections
**Forbidden:** red/yellow warnings, blocking states, modal nags

Inline hints must be:

* contextual
* dismissible by action
* phrased as guidance, not requirements

---

### Guidance ON (Mise guidance overlay)

* Aggregated advisory view
* Shows:

  * preparation progress (high-level)
  * what’s missing *relative to enabled capabilities*
* No blocking
* No auto-fixes
* No errors

Severity levels (internal only):

* `info`
* `warning`

Never:

* block save
* prevent publishing
* mutate content automatically

---

## Section → data ownership

Each editor section owns **one and only one** data area.

| UI Section     | Canonical Field       |
| -------------- | --------------------- |
| Mise en Place  | `recipe.miseEnPlace`  |
| Ingredients    | `recipe.ingredients`  |
| Instructions   | `recipe.instructions` |
| After Cooking  | `recipe.storage`      |
| Prose metadata | `recipe["x-mise"]`    |

⚠️ **No section may store data inside `recipe.stacks`.**
`stacks` is declaration-only.

---

## Validation philosophy

* Guidance is **advisory**
* Never:

  * throw
  * block
  * auto-mutate
* Schema enforcement belongs to:

  * `soustack-core`
  * CI
  * downstream consumers

Not the editor.

---

## Extension lanes

All non-normative data must live in one of:

* `recipe["x-mise"]`
* `WorkbenchDoc.extensions`

Never add app-specific fields at top level without an `x-` prefix.

---

## Code review guardrails (for humans and agents)

Reject changes that:

* Introduce versioned stack keys in editor state
* Store payload data inside `recipe.stacks`
* Add silent auto-conversions
* Block editing based on “missing” requirements
* Add a second source of truth
* Turn guidance into enforcement

Prefer changes that:

* Preserve user intent
* Make structure opt-in
* Fail softly
* Are boring and predictable

---

## Mental model to keep in mind

Soustack Mise is **not**:

* a validator
* a compiler UI
* a standards compliance tool

Soustack Mise **is**:

* a thinking surface for cooking
* a progressive capability authoring tool
* a trust-preserving editor

If you’re unsure which path to take:

**Choose the one that lets the user keep cooking.**
