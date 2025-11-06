# MLZero-Style Memory for Codex Agents

“Use MLZero-style memory” means we are borrowing the two-layer memory architecture from *MLZero: Self-Improving Multi-Agent AutoML with Memory* and applying it to every Codex agent (docs-steward, pharo-code-emitter, falsifier, etc.).

## 1. Episodic Memory (per session)
- Chronological log of everything that just happened: commands, errors, fixes, transcripts.
- Lives next to the repo (e.g., `codex/.codex/sessions/...`) or in Lepiter “timeline” pages.
- Supports undo/redo, debugging, and answering “what just happened?”

## 2. Semantic Memory (cross-session)
- Summaries, design decisions, best practices, verified patches.
- Stored in durable docs (SPECs, README/WORKLOG/RESEARCH, Lepiter pages, shared-context files).
- Indexed by tags such as repo (`codex`, `falsifier`), agent role, artifact type.
- Pull these notes whenever a task is “similar” so the agent can reuse the distilled guidance instantly.

## Workflow Expectations
1. **Write paths explicitly.** Episodic logs live with the repo; semantic notes go into shared docs like this one.
2. **Promote on success.** After solving a problem, extract the general lesson (“run Repair in Iceberg after CLI commits”) and record it semantically so every agent benefits.
3. **Expose queries.** Provide helper snippets/commands so agents can ask “what was the last falsifier run on SPEC.md?” or “show me memories tagged `mlzero`.”
4. **Keep it lightweight.** MLZero relies on pragmatic storage (text files, key-value stores). We don’t need a heavy database right now.

## Why This Matters
- Agents stop re-learning the same workflows (Freedombox push quirks, GT Repair, etc.).
- Coordination improves because each role checks the semantic memory before starting.
- We retain a breadcrumb trail (episodic) while semantic memory stays clean and actionable—exactly MLZero’s blend of rapid experimentation plus institutional knowledge.

Use this note whenever you refer to “MLZero-style memory” in specs, Lepiter entries, or society-of-agents profiles.
