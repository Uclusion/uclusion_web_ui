<!-- uclusion-skill-reference:v1 -->
# Standing notes and isolated history searches

## Standing instructions by view

Before work in a view, read the exact R-code thread of every listed standing note
whose complete current body is missing or changed and apply all listed notes.
Track their R-codes and versions in your context; reuse complete matching bodies
across items that list them and use any newer version returned by a read. Stop
applying notes no longer listed.

After compaction or context restoration, reload the relevant view's notes once
before continuing; summaries and read markers do not replace full bodies.

Compile applicable requirements and permission limits into implementation
briefs. Retain full note bodies and source/version traceability yourself.
Refresh changed prerequisites and update affected briefs before further
implementation-helper work.

## Workspace export and decision search

When workspace data can answer a request and is not already loaded, judge
whether an available successful export is current, complete and sufficient for
the search, including completion scans. Reuse it when sufficient; run the
environment-correct `uclusion export` when it is stale, insufficient or uncertain.
Use the configured destination, overriding it only for an explicit human
request. Retain the successful command's exact reported path and use the export's
UTC update dates as recency evidence. Poke silence does not establish freshness.

Delegate every export search to a fresh read-only isolated export-search helper
without inherited coordinator history (`fork_turns: "none"` in Codex). Keep
export content and research with that helper. If a suitable export or isolated
helper is unavailable, report that the search could not run.

Give the export-search helper the exact successful export path, search question,
applicable requirements or current outcome evidence, and matching, status and
authority rules. Assign only that bounded read-only search.

Require the export-search helper to return every qualifying finding concisely,
with exact Uclusion codes and names, supporting evidence or source locations,
and proposed actions required by the calling workflow. Require an explicit
no-match result only after a completed search, distinguishing incomplete searches
or unsettled evidence. Retain ownership, required full context and current-contract
reads, human decisions, permission checks and durable writes yourself.

Search history before relying on a design you did not write, delegating a
design, or answering something that may already be decided; cite the findings.
Use the current intent/design capsule or, if absent, the agreed design in the
item's thread.

Reuse a completed check for the same question, including reliance on and
delegation of the same design, while its export path and findings remain
current and sufficient. A fully read fresh authoritative update can settle
changed governing context without another history search.

Refresh when a change in scope, relevant history or evidence, or governing
context makes the findings insufficient or stale, or when freshness or
completeness is uncertain.

Explain each cited finding's relevance inline with its short code, and offer
more detail without requiring the human to open Uclusion.
<!-- /uclusion-skill-reference:v1 -->
