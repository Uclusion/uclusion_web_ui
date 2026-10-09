<!-- uclusion-skill-reference:v1 -->
# Job entry, current contract and action routing

Only the coordinator loads this unit for a selected result with a Job header,
including a standalone bug converted into a Bugs job. Apply the core's
assignment gate before lookup. Implementation helpers receive only a bounded
brief, without workflow units, ownership or operational authority.

## Enter or refresh selected job work

1. Consume the initial lookup already held; do not repeat it because this unit
   was loaded. If the work no longer has a Job header and has one top-level
   comment, load [single-comment.md](single-comment.md) instead.
2. Obtain only missing scoped context for the next action, including the complete
   current description when needed and the tasks, assistance or Reports it uses.
   Load [reading.md](reading.md) for the listed standing instructions and retain
   their complete current bodies under that unit's version/reload rules.
3. Apply the stage and assigned-update checks below to held lookup, event and
   write outcomes. Do not replace newer stage information with an older event.
4. Select the next action from the single table below and load its complete
   applicable units under the core's read/reload rules before acting.

## Scoped job context

An initial whole-scope job read supplies its name, description, tasks, assistance
and reports. For subsequent reads, use `sections` or `thread_only` for what
changed. Scoped job reads retain votes.
Explicit `sections` reads omit the description unless `description` is selected.
Use `get_job({short_code_id: "J-…", sections: ["description"]})` to read the
current description when needed. Combine `description` with other sections
when both are needed; `sections: []` omits the description and comment sections.
An unscoped read retains the description.
After context restoration, fetch the description through this narrow read if
its complete body is missing before relying on it; a summary is not its body.

An `Updated J-… description change` Poke requires this description refresh for
the assigned job. For a generic job update, request only the needed sections,
including `description` when its freshness is uncertain. Stage-named events
follow the assigned-update rules below; load only missing context for the next
action.

## Select the target and hold its current contract

Before dispatching or resuming implementation, satisfy this complete prerequisite.
An executable stage is not a substitute for its current target contract.

Select exactly one executable target for the implementation pass:

- A job-level pass for one cohesive outcome uses the job capsule.
- Unrelated top-level tasks execute as separate task passes, each with its own
  complete task capsule and its own implementation subagent, even when the
  human starts them together as one job.
- Work this pass's own verification produced stays in this pass, even once it
  is a task of its own: no capsule, and the review reports it as a
  scope-expansion delta naming that task. A task capsule is for work queued
  independently of the running pass.
- An independently executing top-level task uses its task capsule. A grouped
  task uses its top-level parent's capsule and implementation agent.
- A task capsule is complete and solely authoritative for that task pass.
  Never merge it with, inherit from, or fall back to the job capsule.

Ordinary reads advertise explicit capsule absence. Job reads show the job capsule
and capsules for displayed open top-level tasks.
A reference or summary does not satisfy the current-contract prerequisite.

Reuse a complete held body matching the current target reference and version.
When it is missing, changed or lost, fetch the advertised capsule with
`get_job({short_code_id: "R-code", thread_only: true})` before affected source or
test edits. Check its returned identity, target and actual version, and use the
complete body. A superseded capsule is not the target's current contract; follow
the current reference instead.

After a capsule create or replacement, use `set_design_capsule`'s receipt:
its body is the one you just sent, so do not fetch it again before edits. On an
assigned current capsule's `Updated` event, use the explicit R-code thread read and reload
Reports, then load [capsules.md](capsules.md) for
obsolete-review cleanup and reconciliation before further affected edits.

If the selected target's current capsule is absent, load [capsules.md](capsules.md)
for design dispatch and publication; do not load execution rules merely to plan
or publish while implementation permission is unsettled. Historical work needing
no more implementation may finish its existing review without backfill; its next
resumed or changed implementation pass needs the current contract before edits.
A held current contract routes permitted dispatch directly to
[coordinator-execution.md](coordinator-execution.md), without loading publication.

## Select the next action

Use the stored stage and next action together. Blocked and Requires Input remain
distinct stored stages even when the UI labels both Debatable. Doable and
Reviewable do not prove assistance was handled. Requires Input locks only this
job's implementation edits; investigation, reproduction and measurement may
continue within their independent permissions.

| Stage or next action | Applicable complete units and gates |
| --- | --- |
| Current questions, suggestions, options, votes or resolutions, in any stage | [assistance.md](assistance.md); factual questions remain available before job approval. |
| Approvable | Settle assistance, then load [approval.md](approval.md) only for applicable approval; otherwise use the next-action question below. Implementation is locked. |
| Requires Input | Resolve qualifying assistance under assistance.md; load [capsules.md](capsules.md) only for an answer establishing a new contract. Investigation continues; implementation stays locked until Doable or Reviewable returns. |
| Doable implementation | Satisfy this unit's target/current-contract prerequisite, then load [coordinator-execution.md](coordinator-execution.md) for independent permissions and bounded dispatch. |
| Reviewable direction or feedback | [review.md](review.md) for the latest Reports-author direction. An actual entry triggers [completion.md](completion.md) under the assigned-job transition rule below; an unchanged Reviewable report does not. Requested implementation uses coordinator-execution.md with the current contract and permissions. Human Reports direction alone opens no completion package. |
| Blocked | Inspect dependencies and handle only selected assistance or exact authorized transitions; load assistance.md or [writes.md](writes.md) for that action. Implementation is locked. |
| Backlog or Skippable | Handle only selected assistance or authorized transitions, loading assistance.md or writes.md as applicable. Implementation is locked. |
| Absent-capsule planning/publication, permitted new-human-contract replacement or obsolete-review cleanup | [capsules.md](capsules.md); publication grants no execution permission. |
| Completed implementation-task resolution | [coordinator-execution.md](coordinator-execution.md), with writes.md for the resolution. |
| Durable writes or receipt reconciliation | [writes.md](writes.md), with the action's governing unit. Ordinary note writes need no assistance or capsule unit. |
| Review publication/recovery or finished-job assignment release | [review.md](review.md); package opening separately loads [operations.md](operations.md). |
| Completion package, notification/inbox action or context boundary | [operations.md](operations.md), only for those actions; inbox work requires no review unit. |
| Actual completion transition or incomplete sweep retry | [completion.md](completion.md) for its scan/result procedure. |
| Standing-note context or history/export search | [reading.md](reading.md); references and summaries never load their bodies. |
| Progress checkpoint while work continues, lane handoff or turn ending | [handoffs.md](handoffs.md); its operations route applies only at an actual handoff/turn ending or operations action. |
| Auto-take directions, exposed claim_work (including deferred), or a held claim | [claims.md](claims.md) before affected discovery, activation or ownership actions. |
| Optional get_upload action when exposed | [uploads.md](uploads.md). |

The coordinator retains assignment, Pokes, questions, permissions, publication,
final review and the completion package. Design helpers load only their selected
sibling design package and bounded evidence. Fresh independent-task implementation
helpers receive the compiled brief; delegation grants no unlisted action.

## Stage and transition gates

Run the ordered workflow: read, ask questions, address suggestions, approve when
applicable, execute only in an executable stage, then request review. Before
editing, apply coordinator-execution.md's assistance, task and Poke checks.

The final implementation review's Doable-to-Reviewable transition, including
recovery after confirmed publication, follows [review.md](review.md)'s existing
review-opening exception. Every other stage change requires a non-advisory human
to directly instruct a transition naming the exact job and destination stage,
or answer or delegate a question for that exact transition. A Start and general
work language such as “analyze this,” “take this up,” “proceed,” “go,” or “fix it”
never authorize a stage change. Planning outcomes, replies or resolutions on
other questions, unrelated approvals or votes, recommendations and capsule
changes do not authorize one. Leave the stage unchanged and ask about the exact
job and destination when authorization is missing.

If initial work is ready but the job is not executable, leave its stage unchanged
and ask one question “What action should I take on this job next?” with options
move to Doable and do an approval. Vote for move to Doable. Only exact transition
authorization permits change_job_stage; approval itself does not.
Use the stage-change receipt without rereading merely to confirm it, as
[writes.md](writes.md) requires.

When no delivery is armed, reread assistance and effective stage before editing,
before a completion package, after its reply, and before and after a stage
change. Delivered Pokes and held write outcomes otherwise supply changes under
the common workflow. Never replace newer held stage information with an older
reported transition. Stage, capsule, testing/build, security, deployment, commit
and push gates stay independent.

## Assigned-job updates

An Added item that changes derived readiness is emitted after its workflow
transaction commits. Its one reload includes the item and new stage; do not wait
for a second stage Poke or act from cached stage.

For assigned description changes and generic updates, apply the scoped-context
reads above before work depending on that context.
Soft-deleted work and work that no longer has a Job header follow the common
lookup rules and [single-comment.md](single-comment.md).

An `Updated <job-code> stage is now <stage-name>` reports the stored transition.
Apply assignment routing first; record it without get_job or stage_only merely
to discover or confirm that stage. It does not establish unchanged content,
resolve assistance, replace a necessary effective-stage check or assign work.
Load only missing prerequisites for the next action. A move to Doable resumes
only this session's assignment after every execution gate is met.

For the assigned lane, compare a supplied transition (or an ordinary update's
reloaded stage) with the last observed stage. An actual change into Reviewable,
including a confirmed in-session change or ask_for_review transition, requires
[completion.md](completion.md)'s sweep immediately, before review, handoff or
other work, subject only to [operations.md](operations.md)'s confirmed-package
presentation order. Reviewable is a handoff signal, not proof the job is final
or its remaining deployment/other-environment verification ran. Loading an
already Reviewable job or an update while it stays there
does not retrigger it. A failed sweep remains incomplete work: retry it without
new package permission before switching lanes.

## Reopened task stage

A task an assignee reopens on a Reviewable job returns it to Doable; one reopened
by anyone else, the AI included, sends it to Approvable and the usual next-action question.
A reopened task leaves the job unfinished until the task resolves again.

## Plan mode and handoffs

Plan-mode restrictions govern machine and repository changes, not Uclusion
artifacts. File job questions and suggestions immediately. Before leaving plan
mode, ensure the plan is durable in the applicable artifact and show its link;
use add_info only for information still missing. A chat-only or local-file plan
is unfinished.

Apply handoffs.md for progress and turn-ending actions. A progress checkpoint
or ordinary turn is not a lane handoff. Retain assignment through required input,
package waits, incomplete authorized actions and sweeps.
Finished-job release follows [review.md](review.md); apply [the core](../SKILL.md)'s
assignment-aware discovery only when the assignment actually ends.

<!-- uclusion-audit:v1 -->
For the assigned job, when `start_job_audit` is exposed (including deferred) or
an audit is active, load [audit.md](audit.md) in full before proceeding.
<!-- /uclusion-audit:v1 -->

A fully complete job follows [operations.md](operations.md)'s notification,
commit and context-boundary rules. Individual task completion, requesting review
without a stage transition, Resolve, signoff, shipped confirmation or a completed
code in a commit never independently rerun its completion sweep. Leaving and
later returning to Reviewable creates a new transition and sweep.
<!-- /uclusion-skill-reference:v1 -->
