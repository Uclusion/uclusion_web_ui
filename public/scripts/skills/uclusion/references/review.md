<!-- uclusion-skill-reference:v1 -->
# Coordinator job review and completion handoff

The coordinator loads this unit for Reviewable direction, review publication,
recovery, or assignment completion. Implementation helpers receive the applicable
implementation requirements you derive from direction under
[coordinator-execution.md](coordinator-execution.md). Load [writes.md](writes.md) before
review writes, [operations.md](operations.md) before opening a completion package,
and [completion.md](completion.md) on an actual transition into Reviewable.
For a held claim or active assigned-job audit, load [claims.md](claims.md) or
[audit.md](audit.md), respectively, before affected publication or handoff actions.

## Request or perform review

Before review, turn unfinished or deferred implementation work into suggestions
and reference those suggestions in the report. Record the remaining Review
work described in [coordinator-execution.md](coordinator-execution.md) directly in
the report. Review opening and package holds are defined below; the package
itself is in `operations.md`'s completion-package
section. Read it before `ask_for_review`. For other testable
review work, call `ask_for_review` with a concise capsule-delta report. Only
one AI review may be open per job.

In Reviewable, inspect the author of the latest Reports comment:

- From AI user: humans are reviewing AI work. Do not review it again; act only
  on explicit feedback, a stage change, or already-authorized Review work
  recorded in the report.
- From a human: review the human's work and reply through Uclusion.

Before interpreting the report for a job that just transitioned into
Reviewable, apply [job.md](job.md)'s assigned-job transition rule and finish its
completion sweep. If this session moved the job into Reviewable, run the sweep immediately
instead of waiting for its `Updated` Poke.

Handle a Poke through the core and [job.md](job.md)'s assigned-job update rules; it
does not otherwise change review direction. The exceptions are the resolved-bug
and Reviewable-transition sweeps, and a current capsule's `Updated` event,
which requires the obsolete-review cleanup in [capsules.md](capsules.md).

The report names the exact current capsule R-code. A final job completion
report covering separate task passes names each task and its exact current
capsule R-code, with deltas attributed to that capsule. It keeps those
contracts separate and retains the limit of one open AI review per job.
It does not restate unchanged capsule content. Under `Deltas`, say
`No implementation deltas` or give one concise bullet for each actual omission,
changed behavior, addition, scope expansion, or newly introduced decision. Name
its observable effect and verification or approval status. Report
implementation differences once here; only new human input establishing a new
contract calls for a capsule replacement. Never hide a remaining choice in
review prose; ask it as a question. End the report narrative with the AI
product, exact model/version, and, when you can see it, the effort level. For
an implementation review, append the completion package after that provenance
so the package is the review's final content.

## Job review opening and recovery

### The review and when it opens

A job gets one review, opened without asking once every task you were asked to
do in that assigned job, in an executable stage, is written and tested; never
after each pass. Another open task, such as the human's own, only leaves the
job unfinished. The review is the capsule-delta report this unit
describes, naming each task and its current capsule. Opening it is required
documentation and brings the work to the human. When implementation of the
whole job is complete, pass `implementation_complete: true` to `ask_for_review`
to publish the review and conditionally move Doable to Reviewable together.
For a partial review, omit that flag. No separate stage permission is needed
for this final implementation handoff.

A finished task not related enough to the rest of its job gets its own review
instead; say why in that task's review. Once it is written and tested, call
`add_job` with its code in `task_short_code_ids`, `view_short_code_id` naming
its job, a name taken from the task, and a description naming the job it came
from. This is the human's standing request, so it needs no other permission.
The task keeps its code, thread and capsule. The new job starts in its job's
stage; if the result says it started in the initial stage, ask about its next
stage as [job.md](job.md) says. It joins your assignment beside the job it
came from, so waiting on its package does not stop the tasks remaining there.

A job's implementation is finished when its agreed implementation is built,
its initial verification is complete, and no open task remains; an empty task
list alone never shows that. State in the review which you concluded and why.
Commits, pushes, deployments and agreed verification in other environments
belong to Review. List what remains and its approval status in the report,
before the completion package; those actions retain their permission gates.
Resolve completed implementation tasks first. Do not close unfinished work
merely to make the transition eligible.

The operation saves the review first, then checks current tasks, issues,
questions and suggestions. Any open item prevents the requested move; other
stages are preserved, and already Reviewable is a no-op. This is an inventory
snapshot and a conditional stage write, not an atomic lock against concurrent
work. Continue handling Pokes. Reviewable retains its existing asynchronous
comment and notification cleanup.

`ask_for_review` returns the saved review receipt and the job's open questions
and suggestions, plus the conditional Reviewable transition when implementation
is declared complete. Inspect the separate review, inventory and transition outcomes.
Apply writes.md's receipt reconciliation. For an unconfirmed review, inspect
Reports or the exact review on an update before retrying publication. Reconcile
an uncertain stage write under writes.md before retrying; never create a
duplicate review to recover a later step. Once the review is confirmed and the job is still ready
in Doable, retry only the transition with `change_job_stage`, `from_stage`
Doable and destination Reviewable. A different stage or new open work stops
that retry. Run the completion sweep immediately upon a confirmed transition,
including one first confirmed during reconciliation. An already-Reviewable
no-op alone is not another trigger. A failed sweep remains unfinished work
and is retried without new permission before any lane switch.

Each open suggestion on the job is unfinished or deferred work that moving the
job to Reviewable would resolve and lose. Check the ones you hold and the
`open_suggestions` that `ask_for_review` returns. While any is open, end the
review, and the chat copy that ends the turn, by naming each one, including
those this pass created, and asking the human to convert it to a task or
resolve it; offer no package. End each later turn by naming the review and the
suggestions still open. When Pokes show none open, rewrite the review with
`update_review_short_code_id` to append the package, since a converted
suggestion is an open task. Include `implementation_complete: true` only if
the whole job now qualifies. A standalone bug holds no suggestions.

## Job assignment completion

A finished job in Reviewable releases its session assignment after its
implementation review's completion package succeeds: the human's reply has been
handled, every authorized action (including any clear) has succeeded, the
terminal record is confirmed, and any triggered completion sweep is complete.
Use the review-opening definition of a finished job above. Waiting for human
review or later signoff after this boundary does not retain the assignment.
When no other assigned work remains, the session is idle and accepts a new
live `Start` without an explicit switch. Apply the assignment-ended discovery
rule in the core. Preserve the released state across compaction; a still-open AI
review does not restore the assignment.

Reviewable alone is not enough: retain the assignment while requested work,
an unanswered package, a failed or unfinished authorized action, or a
triggered completion sweep remains. A terminal failure record does not release
it. For a finished job already in Reviewable, a reply declining some or all
actions can complete the package; declined actions are not pending work.
Releasing the
session assignment does not resolve the job or change its human assignees.

## Job commit identities

After review opens, a proposed commit message begins with the completed
task/comment code. A job code at the start means the whole job is done, so use
it only when no tasks remain.
<!-- /uclusion-skill-reference:v1 -->
