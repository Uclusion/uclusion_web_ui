<!-- uclusion-skill-reference:v1 -->
# Scoped job reads and current capsule bodies

The coordinator loads this unit for scoped job context or an explicit current
capsule-body read. Coordinator standing-note and export rules remain in
[reading.md](reading.md); references and summaries never load their bodies.
The common initial lookup already establishes whether this lane is a job;
do not repeat it merely because this unit was loaded. If the selected work no
longer has a Job header and has one top-level comment, load
[single-comment.md](single-comment.md) instead of job-only instructions.

## Scoped job reads and capsule bodies

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
described in [job.md](job.md); it does not replace newer stage information already
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
perform [capsules.md](capsules.md)'s obsolete-review cleanup before continuing.
<!-- /uclusion-skill-reference:v1 -->
