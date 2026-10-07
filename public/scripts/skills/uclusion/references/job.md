<!-- uclusion-skill-reference:v1 -->
# Job stage and action routing

The coordinator loads this dispatcher for selected job work, including a
standalone comment converted into a Bugs job. It supplies stage/action prerequisites rather
than loading every job procedure. Preserve the assignment gate in [pokes.md](pokes.md)
before coordinator lookup. Implementation helpers receive a bounded brief,
without workflow units, assignment ownership or operational authority.

## Load the applicable complete units

Use the stored stage and the next action together. Every
required unit must be present in full through its closing marker before acting.
Read newly applicable units when stage or action changes; do not continue
from the former stage's loaded set. After compaction, content change or body loss,
reload the applicable complete units under the resident bootstrap. A summary or
content identifier does not load an instruction body.

| Current stage | Coordinator path | Implementation |
| --- | --- | --- |
| Approvable | Handle current assistance under [assistance.md](assistance.md); load [approval.md](approval.md) for applicable approval, or ask the next-action question below. | Locked. |
| Requires Input | Resolve qualifying assistance under [assistance.md](assistance.md); load [capsules.md](capsules.md) when the answer changes the contract. Investigation continues. | Locked until resolution restores Doable or Reviewable. |
| Doable | Select and confirm the current target under [capsules.md](capsules.md) and [job-reading.md](job-reading.md); load [coordinator-execution.md](coordinator-execution.md) for permitted execution and dispatch. | Current complete target capsule and independent permissions required. |
| Reviewable | Load [review.md](review.md) for latest Reports-author direction, explicit feedback and authorized Review work. An actual entry triggers [completion.md](completion.md) before handling review. | Only requested work under [coordinator-execution.md](coordinator-execution.md), with current contract and permissions. |
| Blocked | Inspect dependencies, handle selected assistance and exact requested transitions. Load [assistance.md](assistance.md) or [writes.md](writes.md) for the chosen action. | Locked. |
| Backlog or Skippable | Handle only selected assistance or authorized transition actions, loading [assistance.md](assistance.md) when applicable. | Locked. |

Blocked and Requires Input remain distinct stored stages even when the UI labels
both Debatable. A stage controls permission, not workflow position: Doable and
Reviewable do not prove assistance was handled. Requires Input locks only this
job's implementation edits; investigation, reproduction and measurement may
continue within their independent permissions.

Action prerequisites are independent of stage:

- Coordinator lookup and full standing-note bodies: [reading.md](reading.md).
  Scoped job context, descriptions and explicit current capsule bodies:
  [job-reading.md](job-reading.md). References and summaries never load a
  standing instruction or a contract.
- Questions, suggestions, options, votes and resolutions: [assistance.md](assistance.md),
  available while implementation is locked.
- Capsule selection, fresh design-helper dispatch, publication or replacement:
  [capsules.md](capsules.md), coordinator only.
- Implementation checks, bounded dispatch and task resolution:
  [coordinator-execution.md](coordinator-execution.md). The coordinator reads
  [execution.md](execution.md) only to copy its generic rules into the complete
  implementation brief. Helpers load no workflow unit or stage context; design
  helpers load their selected design package and bounded evidence.
- Durable writes and outcome reconciliation: [writes.md](writes.md), plus the
  unit that governs the write. Completion packages, notifications and context
  boundaries: [operations.md](operations.md), only for those actions.
- Review direction/publication/recovery and assignment completion:
  [review.md](review.md). Completion sweeps: [completion.md](completion.md), only
  for the existing transition trigger or its incomplete retry.
- Poke handling and discovery: [pokes.md](pokes.md), coordinator only.
- Progress checkpoints, lane handoffs and turn ending:
  [handoffs.md](handoffs.md), coordinator only.

The coordinator retains assignment, Pokes, questions, permissions, capsule
publication, final review and the completion package. Fresh design help and
fresh independent-task implementation help retain their distinct roles; no
delegation grants an unlisted action.

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
`change_job_stage` states the resulting stage; use its receipt without rereading
merely to confirm it, as [writes.md](writes.md) requires.

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

For an assigned description-change Poke, load [job-reading.md](job-reading.md) and fetch
the current description before work depending on it. For a generic update, use
only the needed scoped reads, including description when freshness is uncertain.
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
other work. Loading an already Reviewable job or an update while it stays there
does not retrigger it. A failed sweep remains incomplete work: retry it without
new package permission before switching lanes.

An assigned current capsule's Updated event routes to [job-reading.md](job-reading.md)
for its explicit body and Reports, then [capsules.md](capsules.md) for obsolete
review cleanup and reconciliation before affected edits.

## Reopened task stage

Jobs change stage through change_job_stage, not reopen. A task an assignee
reopens on a Reviewable job returns it to Doable; one reopened by anyone else,
the AI included, sends it to Approvable and the usual next-action question.
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
Finished-job release follows [review.md](review.md); apply [pokes.md](pokes.md)'s
assignment-aware discovery only when the assignment actually ends.

<!-- uclusion-audit:v1 -->
When start_job_audit is exposed, including deferred, the coordinator loads
[audit.md](audit.md) and starts the assigned job audit before substantive planning.
End an active audit under that unit only at a genuine blocking-input, review,
completion, pause or interruption handoff; ending an audit alone never clears
a human-guided assignment.
<!-- /uclusion-audit:v1 -->

A fully complete job follows [operations.md](operations.md)'s notification,
commit and context-boundary rules. Later Resolve, signoff, shipped confirmation
or commit never independently rerun its completion sweep.
<!-- /uclusion-skill-reference:v1 -->
