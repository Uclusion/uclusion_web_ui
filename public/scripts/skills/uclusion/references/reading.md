<!-- uclusion-skill-reference:v1 -->
# Reading jobs and their context

Apply the Poke assignment gate before any lookup. These rules do not activate
unassigned or unrelated work.

Call `get_job` with the selected short code. A first job read supplies its name,
description, tasks, assistance and reports. For subsequent reads, use `sections`
or `thread_only` to request what changed. Scoped job reads retain the job header,
stage and votes; job-child thread reads retain the job and current stage.
Explicit `sections` reads omit the description unless `description` is selected.
Use `get_job({short_code_id: "J-…", sections: ["description"]})` to read the
current description with compact job context and no comment-thread bodies.
Combine `description` with other sections when both are needed; `sections: []`
omits the description and comment sections. An unscoped read retains the description.
After context restoration, fetch the description through this narrow read if
its complete body is missing before relying on it; a summary is not its body.

An `Updated J-… description change` Poke requires this description refresh for
the assigned job. For a generic job update, request only the needed sections,
including `description` when its freshness is uncertain. An `Updated` event
that names a stage supplies the stored transition
described in `pokes.md`; it does not replace newer stage information already
held. Do not reread merely to confirm that transition. Still load missing
context required for the next action and resolve any known assistance before
execution.

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
R-code and version and, for a replacement, the open reviews that name it;
`ask_for_review` returns the saved review receipt, the job's open questions
and suggestions, and its notification snapshot. When implementation is
declared complete it also reports the conditional Reviewable transition.
Inspect each outcome separately: a failed inventory, transition or notification
check does not erase a successful review. Reconcile unconfirmed writes and
retry only unfinished steps as `operations.md` describes;
`change_job_stage` states the stage afterwards. Do not call `get_job` to see a
write you made and still have in context. Call `get_job` to see a write you did
not make or no longer hold. `resolve` reports only what it resolved; when you
need the stage afterwards, call `get_job` with `stage_only: true`. Others'
changes arrive as Pokes, so handle those instead of rereading the job.

When `set_design_capsule` also resolves selected questions, inspect the capsule
receipt and each resolution outcome. A failed or uncertain publication resolves
no questions; a later resolution failure leaves the published capsule in place
and stops the remaining resolutions. Reconcile unconfirmed writes with scoped
reads. Resume resolutions only after confirming the intended capsule was
published; otherwise reconcile and publish that contract first. Once publication
is confirmed, resolve only unfinished questions rather than replaying a stale
capsule write. If the review-inventory lookup failed, load Reports for the
existing obsolete-review cleanup. After the last operation, use `stage_only`
before acting on the stage.

## Standing instructions by view

Job reads, including job-child threads, list the view's current standing-note
R-codes and versions, or explicitly say the inventory is empty. Treat the listed notes as standing instructions.
Before work in that view, fetch each listed version whose complete body is not
in the current context with an explicit R-code thread read. It returns the
note body and its actual version.

Track the notes by R-code and version in the current context. Reuse a note
whose listed version you hold in full, on any job that lists it. Fetch a listed
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
replies and resolved status do not make notes appear by default. Current pinned
capsules stay outside ordinary Notes; archived capsule bodies follow ordinary
note rules. Full workspace exports retain their bodies for decision searches.
<!-- /uclusion-skill-reference:v1 -->
