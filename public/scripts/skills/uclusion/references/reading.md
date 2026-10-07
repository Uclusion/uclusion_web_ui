<!-- uclusion-skill-reference:v1 -->
# Reading assigned work and its context

Apply the Poke assignment gate before any lookup. These rules do not activate
unassigned or unrelated work.

Call `get_job` with the selected short code. If the result has a Job header,
load [job.md](job.md) before job planning or execution. A single-comment
result follows the core skill's single-comment workflow.

## After a write

A write's result is the reload for what it produced. Inspect each outcome
separately: a later failure does not erase an earlier successful write.
Reconcile unconfirmed writes with scoped reads and retry only unfinished
steps. Do not call `get_job` to see a write you made and still have in context;
call it to see a write you did not make or no longer hold. `resolve` reports
only what it resolved. Others' changes arrive as Pokes, so handle those
instead of rereading the item. Job-specific write outcomes are in [job.md](job.md).

## Standing instructions by view

Reads list the view's current standing-note R-codes and versions, or explicitly
say the inventory is empty. Treat the listed notes as standing instructions.
Before work in that view, fetch each listed version whose complete body is not
in the current context with an explicit R-code thread read. It returns the
note body and its actual version.

Track the notes by R-code and version in the current context. Reuse a note
whose listed version you hold in full, on any item that lists it. Fetch a listed
note you lack or hold only at an older version, and stop applying a note no
longer listed. If a fetch returns a newer version, use the complete returned version.
Note edits do not wake the agent themselves; the next relevant read advertises
them. There is no backend session cache.

After compaction or context restoration, treat the relevant view's notes as
unread and reload them before continuing, even if a summary preserves their
codes, versions or an “already read” marker. Do not infer which paragraphs
survived. Refresh once for that view after restoration, then reuse complete
current bodies normally.

## Ordinary notes and exports

Ordinary note bodies require `sections: ["notes"]`,
`include_all_resolved: true`, or an explicit note thread read. Visibility,
replies and resolved status do not make notes appear by default. Full workspace
exports retain note and capsule bodies for decision searches.
Job capsule references and explicit body reads are in [job.md](job.md).
<!-- /uclusion-skill-reference:v1 -->
