<!-- uclusion-skill-reference:v1 -->
# Reading assigned work and its context

Only the coordinator loads this unit for assigned lookup, full view-note reads
and their tracking, or decision searches. Apply the Poke assignment gate before
any lookup. These rules do not activate unassigned or unrelated work.

Call `get_job` with the selected short code. If the result has a Job header,
load [job.md](job.md) and its stage/action prerequisites before acting.
A single-comment result loads [single-comment.md](single-comment.md), without
job-only instructions.

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

Retain full current note bodies and their source identities and versions yourself.
Select only requirements and permission limits applicable to the implementation
brief. Implementation helpers receive those constraints without tracking
identities, full view-note bodies or a broad digest; they do no note fetching,
refresh or version tracking. Keep source traceability in your context. Refresh
changed applicable prerequisites and supply the resulting brief changes before
further affected implementation-helper work.

## Ordinary notes and exports

Ordinary note bodies require `sections: ["notes"]`,
`include_all_resolved: true`, or an explicit note thread read. Visibility,
replies and resolved status do not make notes appear by default. Full workspace
exports retain note and capsule bodies for decision searches.

## Workspace export and decision search

When workspace data can answer a request and is not already loaded, run the
environment-correct `uclusion export` and delegate search of the reported Markdown
as below. The coordinator keeps only the reported path from the export command.
Run it without `-o` or `--output` so the CLI uses the configured
`uclusionMDFolderPath`. Never
redirect an ordinary workflow export to `/tmp` or another destination; override
the configured path only when the human explicitly requests a different one.
Exports include jobs, comments, options, votes, reasons, and UTC update dates.
Use those dates for recency.

Every export search, including past decisions, duplicate/related work and both
completion-sweep scans, must run in a fresh isolated subagent without inherited
coordinator history (`fork_turns: "none"` in Codex). Never read or search export
content in the coordinator. If an isolated helper is unavailable, report that
the search could not run rather than falling back to a coordinator search.

Dispatch a bounded read-only brief containing the successful export's exact path,
the search question, relevant requirements or current outcome evidence, and the
applicable matching, status and authority rules. Export-search helpers follow
only that brief and load no Uclusion workflow units. They do not obtain another
export, acquire work, make human decisions or perform durable writes; these role
limits change no tool availability or configuration.

Keep raw export content, large match lists and intermediate research in the
helper. Return only concise findings with exact Uclusion codes and names, short
supporting evidence or source locations, and proposed actions when required by
the calling workflow. Preserve every qualifying finding; report an explicit
no-match result only after the required search is complete, and distinguish an
incomplete search or unsettled evidence. Do not return raw search output or
transcripts. The coordinator retains ownership, required full context/contract
reads, human decisions, permission checks and durable writes. Any further export
investigation uses another fresh bounded helper.

Search it before delegating a design, before relying on a design you did not
write yourself, and before answering something in case it was already decided,
and cite what you find. The first two stop a design re-deciding something
settled or resting on something that has gone stale; the third finds what
settled it. A design is whatever records the agreed approach, which is the
current intent/design capsule where one exists and otherwise the design written
into the item's own thread, as a standalone bug carries one. Present enough
inline detail for relevance and its short code; offer to drill in without
requiring the human to open Uclusion.
<!-- /uclusion-skill-reference:v1 -->
