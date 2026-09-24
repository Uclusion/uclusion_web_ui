<!-- uclusion-skill-reference:v1 -->
# Reading jobs and their context

Apply the Poke assignment gate before any lookup. These rules do not activate
unassigned or unrelated work.

Call `get_job` with the selected short code. A first job read supplies its name,
description, tasks, assistance and reports. For subsequent reads, use `sections`
or `thread_only` to request what changed. Scoped job reads retain the job header,
description, stage and votes; job-child thread reads retain the job and current
stage. Scoping never permits acting from a remembered stage.

## Capsule references and explicit bodies

Ordinary reads advertise current capsule R-codes and versions, or explicit
absence, without embedding their bodies. Job reads show the job capsule and
capsules for displayed open top-level tasks. A selected task uses its own
capsule; a grouped task uses its top-level parent. A reference does not satisfy
the implementation capsule gate, and task contracts never inherit from a job.

Fetch the advertised capsule with
`get_job({short_code_id: "R-code", thread_only: true})` before implementing its
target. Check the returned identity, target and actual version, and use the
complete body. This returns the named capsule's current stored version, not an
immutable historical version. A superseded capsule is not the target's current
contract; follow the current reference instead. Reading a reply to a capsule
loads discussion without repeating the capsule body.

After a capsule create or replacement, the R-code and version that
`set_design_capsule` returns confirm the stored capsule: its body is the one you
just sent, so do not fetch it again before edits. On an assigned capsule's
`Updated` event, use the explicit R-code thread read and reload Reports, then
perform the core workflow's obsolete-review cleanup before continuing.

## After a write

A write's result is the reload for what it produced. `ask_question` returns the
question and option codes, the initial vote and the job's resulting stage;
`update_option` names what it updated; `set_design_capsule` returns the stored
R-code and version. Do not call `get_job` after them to see their output.
`resolve` reports only what it resolved, so read the job when you need its
stage. Rechecks before editing still apply, because others can change the job.

## Standing instructions by view

Job reads, including job-child threads, identify the workspace and view by
stable IDs and list current standing-note R-codes and versions, or explicitly
say the inventory is empty. Treat the listed notes as standing instructions.
Before work in that view, fetch each listed version whose complete body is not
in the current context with an explicit R-code thread read. It returns the
note body and its actual version.

Track the inventory by workspace/view identity in the current context. Reuse
complete current notes across jobs in the same view. On a different view or
changed inventory, fetch missing or changed notes and stop applying removed
entries. If a fetch returns a newer version, use the complete returned version.
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
replies and resolved status do not make notes appear by default. Current pinned
capsules stay outside ordinary Notes; archived capsule bodies follow ordinary
note rules. Full workspace exports retain their bodies for decision searches.
<!-- /uclusion-skill-reference:v1 -->
