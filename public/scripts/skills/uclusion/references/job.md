<!-- uclusion-skill-reference:v1 -->
# Complete job workflow

Load this reference only for selected job work, including a standalone comment
that has converted into a Bugs job. The common core and references still govern
assignment, delivery, durable records, completion-package mechanics and sweeps.
For a requested new job, this reference governs its creation before its first
lookup. Preserve the one-assignment gate before any job lookup.

## Job invariants

- Run the ordered workflow: read, ask questions, address suggestions, approve
  when applicable, execute only in an executable stage, then request review.
- The job stage controls permission, not workflow position. Doable and
  Reviewable permit execution, but neither proves questions or suggestions
  were handled. Requires Input locks execution until qualifying assistance is
  resolved and the job returns to Doable or Reviewable. That lock covers
  implementation edits to this job and nothing more, so investigation,
  reproduction, and measurement continue while it holds.
- The final implementation review's Doable-to-Reviewable transition, including
  recovery after a confirmed review publication, is authorized by the review
  review-opening workflow below. Every other stage change requires a
  non-advisory human to authorize it by directly instructing a transition
  that names the exact job and destination stage, by answering or delegating a
  question for the exact job and destination transition. A `Start`
  event and general work language such as "analyze this," "take this up,"
  "proceed," "go," or "fix it" never authorize a stage change. Planning outcomes, replies or resolutions on other
  questions, approvals or votes unrelated to that exact transition,
  recommendations, and capsule changes do not authorize one. Never infer stage
  authorization from surrounding work language. If a needed transition lacks
  exact authorization, leave the stage unchanged and ask the human about that
  exact job and destination transition.
- An executable stage alone never authorizes edits. Before the first affected
  source or test edit, load the selected executable target's current
  intent/design capsule. Complete drafting and cold review before creating it
  with `set_design_capsule` when absent. Once sent, keep its body stable unless
  human input that arrives after it establishes a new contract. Finding older
  human input you had not read is not that; raise it as a question instead.
  When a new contract is established, update the capsule to say it. Do that
  before any further affected edits, and before the lane ends even when there
  are no edits at all, so a decision you have settled is never left sitting
  beside a capsule that still states what it replaced. The capsule must stand
  alone and preserve the actor-visible outcome, not merely list decisions or
  components.
- A capsule is a contract, not permission. Stage, testing and build, security,
  deployment, commit, and push gates remain independent. The required review
  is opened before its completion package asks for commit, push and clear
  together; entering Reviewable never grants a test, build, security,
  deployment, or unlisted action.
- When no delivery is armed, reread assistance and stage before editing,
  before a completion package, after a package reply, and before and after a
  stage change. Delivered Pokes and held write outcomes otherwise supply
  changes under the common workflow.

## Plan mode

Plan-mode restrictions govern machine and repository changes, not Uclusion
artifacts. File job questions and suggestions immediately. Before leaving plan
mode, ensure the plan is durable in the applicable artifact and show its link;
use `add_info` only for information still missing. A plan that exists only in
chat or a local file is unfinished.

## 1. Read

For a Poke, apply the assignment gate in `pokes.md` before this
section. An unassigned or cross-lane `Added`, `Updated`, or `Responded` event
stops there without `get_job` or activation. A job becoming
Doable does not bypass that gate.

The common workflow's initial lookup establishes whether this lane is a job;
do not repeat that lookup merely because this reference was loaded. Read
[reading.md](reading.md) for standing-note bodies and refresh after compaction,
and apply this reference's scoped reads and explicit capsule-body rules below.
References alone do not load a contract or standing instructions. If work no
longer has a Job header and contains one top-level comment, use the core
skill's single-comment workflow.

<!-- uclusion-audit:v1 -->
When the session lists `start_job_audit`, including as a deferred tool, read
[audit.md](audit.md) and start the audit for the assigned
job before substantive planning.
<!-- /uclusion-audit:v1 -->

## 2. Ask and resolve questions

Except for the completion package defined in `operations.md`, call
`ask_question` for ambiguity and judgment calls. Give options only for a real
discrete choice. When facts, reproduction steps, observed behavior, or meaning
are unknown, ask an open-ended question with no options. Never infer runtime
behavior from code when the observed path is missing; ask the person who saw
it. Use one `ask_question` call per distinct question; never bundle separate
unknowns.

File every currently known distinct question in the same turn, each with its
options and your vote, so the job enters Requires Input once and the human
answers the whole set in one sitting. Questions, suggestions, and votes are
work output rather than a delay, so never withhold one to keep moving.

Filing them is not itself a reason to stop. A question blocks only the work
that depends on its answer. Requires Input bars implementation edits to the
job, and bars nothing else: keep investigating, reproducing, measuring,
reading source, and gathering the evidence the answers will need, and carry on
with any other lane the human has authorised. On a hard job the answers
usually reveal the next unknown rather than clearing the field, so a batch
cannot be assembled up front and asking recurs; that is normal and is not a
licence to halt each time. Filing a question never ends a turn; see the core
skill's Ending a turn rules.

For a view-level bug:

- Ask for missing facts with `add_info`, keeping the single-comment workflow.
- For a discrete options question, call `ask_question` with the bug short code
  and a nonempty options list, including the required `initial_vote`. That
  call creates a human-owned Bugs job in the same view, moves the original bug
  thread into it as a task, creates the question and records the preferred
  vote. Reload the returned Bugs job. Never convert a bug merely to ask an
  open-ended question.

Every option-bearing `ask_question` and every `add_options` call must include
one `initial_vote` with certainty 1–5 and a nonblank reason. Select a new option
by its zero-based `new_option_index`. With `add_options`, use either that index
or `existing_option_id` for an Approvable option in the same question, making
clear whether the added alternatives change your preference. Supply exactly
one selector. An open-ended question has no vote input.

The creation call records the vote; do not repeat it in a separate initial
`approve_job_or_option` call. Use that tool for later preference changes. Hold
your position through mere restatement or pressure; change it only for new
evidence or a changed requirement, and name what changed.

### Recording the human's own records

`add_info`, `approve_job_or_option`, `make_suggestion`, `ask_question`, `add_options`,
`move_suggestion_to_task` and `reopen` take `for_human`, as does any `initial_vote` they carry.
Set it only for what the person told you to record; the record is theirs and its vote counts. Never put your reasoning under their name: ask for their certainty and reason first.
With `for_human: true`, require boolean `is_my_lane`: true when working on or assigned that work, to avoid an echo Poke; false otherwise, so agents can receive it and potentially take up the work.
Choose independently for each nested `initial_vote`.

### What answers an AI-authored question

For a question on a job, an Approvable option's For vote answers only when it is
non-AI and not rendered advisory; a clear reply answers only when its author is
non-AI and the reply is not rendered advisory. Treat the rendered advisory
marker as authoritative; do not infer authority from other metadata. Advisory
input can change the AI's reasoning or vote and sends a Responded Poke, but
cannot make the question answerable or unlock execution.

An open AI-authored question moves a job in Approvable, Doable or Reviewable to
Requires Input, whichever stage the question was opened in. A primary,
non-advisory reply or vote makes it answerable, but the job stays locked until
the AI resolves the question. A human may instead Resolve the question directly; that
delegates the choice to the AI, does not silently select an option, and restores
the prior stage. Record a new non-obvious delegated choice in the applicable
capsule when writing it, or use `add_info` on the job/task only if missing from
the durable thread. Do not reopen or write inside the resolved question.

Standalone AI-authored view-level questions have no advisory gate: any clear
non-AI reply or Approvable For vote answers. AI votes never answer an
AI-authored question. If every answering vote is 50/100 certainty or lower,
add a better option when one exists, otherwise add information that can raise
certainty; with neither, proceed with the recorded answer.

Finish any reply or vote before resolving a question. When its answer establishes
a capsule change, compose and cold-review that contract while the question stays
open, then pass its code in `set_design_capsule`'s `resolve_question_short_code_ids`.
Use `resolve` when no capsule change is needed; omit questions the human already
resolved. Resolve an open-ended question promptly once its answer is settled or
the question is no longer needed, after any required reply and capsule update.
Without option votes, an open thread gives no reliable completion signal.
Option-bearing questions may await completed vote review or the existing
execution gate; do not resolve merely to acknowledge each vote. The qualifying
human-answer and execution-lock rules above still apply.
Clarify ambiguous replies. Only Approvable options count or accept votes. If later work would say
"flag if you prefer" or "verify this choice," stop: that was an unasked
step-two question.

## 3. Address suggestions

Use `make_suggestion` before mentioning any better approach or follow-up in
chat, then include the returned link when mentioning it. Omit `job_id` for a
view-level idea. For human suggestions, reply with a definitive decision and action
unless accepting an option amendment below. When voting is enabled, call
`vote_on_suggestion` before resolving; never vote on your own suggestion.

An open qualifying human suggestion keeps the job in Requires Input. For an
accepted option amendment, record any required vote, then call `update_option`
with `resolve_suggestion_short_code_id` naming that suggestion. This updates the
canonical option and resolves the suggestion in one call; omit a separate
acceptance reply. Never replace the option with `add_options`. For other accepted
changes, record the plan, act, then resolve. A human Resolve on an AI-authored
suggestion without reply or vote declines the mitigation and accepts the risk; do not recreate it.
A human's conversion of an AI-authored suggestion into a task accepts its proposal
as written. Do not re-ask a choice the suggestion already made, unless new evidence
found after the conversion bears on it; then name that evidence in the question.

Do not offer execution or approve the job while an unanswered question remains.
You may ask whether to begin completely independent tasks first.

## 4. Approve when applicable

Only approve a job in Approvable, with all questions answered and no existing
AI job-level approval. Name the unstated business/value premise and test it
against available evidence and related work; do not accept the author's premise
unexamined. A weak, untested, or contradicted premise warrants low or moderate
certainty. Ask about missing evidence, make suggestions first, then call
`approve_job_or_option` with a 1–5 certainty and reason.

If the job says the AI is a required approver, approval is mandatory once
assistance is settled. Otherwise ask "What action should I take on this job
next?" as section 5 specifies below. Do not ask about approval separately.

## 5. Execute and document

Execute only in Doable or Reviewable. On Reviewable, the latest Reports comment
still controls review direction; stage alone is not an instruction to change
or re-review work.

### Current intent/design capsule

Execution also requires the capsule gate from the invariants. Select exactly
one executable target for the implementation pass:

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

Load the selected target's reference, then explicitly fetch its current capsule
body as `job.md`'s scoped-read section requires before affected edits. If absent,
continue read-only investigation, settle every reviewer-divergent
choice, then call `set_design_capsule` in target mode. For a job, send `job_id`
and the complete `capsule`. For a top-level or grouped task, send its current
`job_id`, `task_id`, and the complete `capsule`; a grouped `task_id` normalizes
to its top-level parent. Uclusion strongly validates that the task still
belongs to the stated job and refuses a missing or stale job/task pairing.
Reload the task and use its current job before retrying. Existing work is not
backfilled. Historical work that needs no more implementation may finish its
existing review, but the next resumed or changed implementation pass needs a
capsule before affected edits.

Delegate planning, capsule composition, revision and cold review to a fresh
helper without inherited conversation history (`fork_turns: "none"` in Codex).
Give it the selected target, bounded relevant evidence, the current capsule
when present, new human requirements since publication, and
`../uclusion-design/SKILL.md` resolved from the selected `uclusion` package root.
The helper reads that skill and its required references in full and keeps
research and intermediate reasoning local. The main agent does not read those
helper-only instructions or examples before delegation.

Accept only the complete cold-reviewed capsule with claim-local evidence links
or typed unresolved questions. Do not import raw export searches, skill bodies
or the planning transcript. The main agent alone files and resolves questions,
checks stages and permissions, publishes with `set_design_capsule`, and
coordinates execution. Delegation grants no implementation permission. If the
helper cannot load its skill or a required reference, report a broken Uclusion
install, suggest an environment-correct `uclusion update`, and require a client
restart or MCP reconnect after success; do not improvise a writing workflow.
After each create or permitted replacement, apply this reference's scoped-read
rules to confirm the current capsule before edits. A later cold review does
not authorize polishing or rewriting a sent capsule.

For each independent task pass, start its own implementation subagent without
inherited conversation history (`fork_turns: "none"` in Codex). Supply the
selected target, its complete current task capsule, bounded implementation
evidence, specific authorizations, and applicable repository instructions.
A planning or capsule-writing helper alone does not satisfy this execution
rule. A cohesive job-level pass continues under the job capsule. The main agent
retains assignment and Poke handling, human questions, stage and permission
checks, capsule publication, final review, and the completion package.
Delegation creates no separate ownership claim and grants no unlisted action.

Replace a sent capsule only when new human input establishes a new contract.
AI discoveries and implementation differences do not authorize a replacement;
report those differences once in the review. Unsettled choices still require
questions under step two. For a permitted replacement, finish drafting and
cold review, then call `set_design_capsule` in update mode with the R-code and
version you hold as `update_capsule_short_code_id` and
`update_capsule_version`, and the complete replacement body. Never patch
fragments or blindly retry a version conflict; reload the capsule on one.
Replies remain discussion until new human input establishes a new contract
and is folded into the body. A real replacement keeps the capsule R-code; its
former body appears asynchronously as an ordinary unpinned note. Do not wait
for that archive or treat it as current implementation context.

Capsule writes are human-facing, not scratch storage. A create or replacement
puts an inbox item in front of the current human assignees without email or
Slack; explicit mentions keep their ordinary delivery behavior.

After an AI replacement, resolve each review its result lists in
`open_ai_reviews_naming_capsule` before further affected edits. A human body
edit arrives as `Updated <capsule R-code> of <job short code>`. Reload the
exact capsule with `thread_only: true`, resolve your open review that names it
first, then reconcile in-progress work with the new authoritative body. Review
cleanup is agent workflow, not backend review parsing or linkage.

If initial work is ready but the job is not executable, leave its stage
unchanged and ask one question "What action should I take on this job next?" with options move to Doable and do an approval. Vote for move to Doable. Only an authorization permits the `change_job_stage` call.

An executable stage authorizes implementation, not the form of testing. An
explicit test plan in the job counts as human approval. Otherwise, before
running tests or builds, use one `ask_question` per unresolved decision about
test types and quantities and wait for a qualifying human answer.

An executable stage alone does not authorize introducing or expanding security
behavior. An explicit security plan already recorded in the human-authored job
counts as approval. Otherwise, before implementation, use `ask_question` to
describe the proposed security work and wait for a qualifying human answer.
This gate applies when work changes or introduces authentication,
authorization, credentials or secrets, threat models, trust boundaries,
security-sensitive persistence or lifecycle behavior, or shared security
infrastructure. It also applies when an AI reviewer labels a finding as
security-related and the proposed correction would expand scope. Treat the
finding as evidence to assess, not approval to implement a broader security
model.

Before editing:

1. Resolve every open question already answered by either a non-AI,
   non-advisory Approvable For vote or a clear non-AI, non-advisory reply.
2. Resolve tasks already completed, duplicated, or no longer applicable.
3. Handle every delivered Poke first.

Implement active tasks and grouped tasks; do not redo resolved work. Resolve
each task when written and tested. Commit, push and deployment are
separate gates and hold none of that. Record remaining commits, pushes,
deployment and already-agreed verification in other environments as Review
work in the report; they do not keep completed implementation in Doable or
automatically need a new task. Failures requiring implementation follow the
normal new/reopened-work rules. Use `add_info` on the relevant job/task for decisions, trade-offs,
follow-ups, and anything a reviewer cannot reconstruct from the durable thread.

## 6. Request or perform review

Before review, turn unfinished or deferred implementation work into suggestions
and reference those suggestions in the report. Record the remaining Review
work described above directly in the report. Review opening and package holds
are defined below; the package itself is in `operations.md`'s completion-package
section. Read it before `ask_for_review`. For other testable
review work, call `ask_for_review` with a concise capsule-delta report. Only
one AI review may be open per job.

In Reviewable, inspect the author of the latest Reports comment:

- From AI user: humans are reviewing AI work. Do not review it again; act only
  on explicit feedback, a stage change, or already-authorized Review work
  recorded in the report.
- From a human: review the human's work and reply through Uclusion.

Before interpreting the report for a job that just transitioned into
Reviewable, apply the assigned-job transition rule below and finish its completion
sweep. If this session moved the job into Reviewable, run the sweep immediately
instead of waiting for its `Updated` Poke.

Handle a Poke through `pokes.md` and the assigned-job update rules below; it
does not otherwise change review direction. The exceptions are the resolved-bug
and Reviewable-transition sweeps, and a current capsule's `Updated` event,
which requires the obsolete-review cleanup in the capsule section above.

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
described below; it does not replace newer stage information already
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

A write's result is the reload for what it produced. `ask_question` returns the
question and option codes, the initial vote and the job's resulting stage;
`update_option` names what it updated; `set_design_capsule` returns the stored
R-code and version and, for a replacement, the open reviews that name it;
`ask_for_review` returns the saved review receipt and the job's open questions
and suggestions. When implementation is declared complete it also reports the
conditional Reviewable transition. Inspect each outcome separately: a failed
inventory or transition does not erase a successful review. Reconcile unconfirmed writes and
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

## Assigned-job Poke updates

When creating an item also changes derived stage/readiness, Uclusion emits its
Added event only after the workflow transaction commits. That single reload
contains both item and new stage; never wait for a second stage Poke or act from
the cached stage.

Job description changes use `Updated <job-code> description change`. Apply the
assignment gate first. For the assigned job, fetch the current description with
`get_job({short_code_id: "<job-code>", sections: ["description"]})`; this retains
job context without loading comment threads. Use the returned description
before further work that depends on it. This event does not assign a job or
authorize a stage change. Other generic job updates can use scoped reads;
include `description` when its freshness is uncertain, including an ambiguous
update from an older producer. Do not load the whole job just to refresh it.

Job stage changes use `Updated <job-code> stage is now <stage-name>`, including
the complete stage name when it contains spaces. Async sends this after the
stored stage field changes; it reports that transition, even if another change
moves the job again. Apply assignment routing first. For the assigned job,
record the supplied transition without calling `get_job`, including
`stage_only`, merely to discover or confirm that stage. Use the context already
held and load only information the next action still needs, such as changed
assistance or Reports. The message does not establish that other job content is
unchanged, resolve known assistance, or replace a necessary effective-stage
check. An ordinary `Updated <job-code>` without the suffix still follows the
lookup rules in `pokes.md`.

A job moving into Doable is an `Updated` state transition, never a `Start`.
Resume it only when that job is already the session's assignment and its other
execution requirements are satisfied; load missing context when needed.
An idle session or a session assigned elsewhere does not activate because the
job became executable.

A job moving into Reviewable is also an `Updated` state transition. For the
assigned lane, compare the supplied stage, or the reloaded stage for an ordinary
update, with the stage this session last observed. When it changes from any
other stage into Reviewable, read
`completion.md` and run both completion scans once before handling review. A
successful in-session stage change to Reviewable follows the same rule,
including the transition returned by `ask_for_review`. Finish the sweep in that same
turn before lane handoff, work discovery, or starting another job. Merely
loading a job already in Reviewable, or receiving another update while it stays
there, does not retrigger the sweep. After the job leaves Reviewable, a later
transition back into it is a new trigger. A sweep that began on a real trigger
but failed is still incomplete work from that trigger, not a retrigger: retry it
directly without new package permission and do not switch lanes until it
succeeds.

## Current capsule Pokes

When an assigned current intent/design capsule is Updated, its body replaces
the cached contract. Reload it with `thread_only: true` and Reports, then
resolve your open review naming its R-code before further affected edits.
This never bypasses the assignment gate.

## Job review opening and recovery

### The review and when it opens

A job gets one review, opened without asking once every task you were asked to
do in that assigned job, in an executable stage, is written and tested; never
after each pass. Another open task, such as the human's own, only leaves the
job unfinished. The review is the capsule-delta report the core workflow
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
stage as the core workflow says. It joins your assignment beside the job it
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

Inspect the separate review, inventory and transition outcomes.
A review write reported as unconfirmed may have saved it: inspect Reports, or
the exact review on an update, before retrying publication. A later failure
does not undo a saved review. Reconcile an uncertain stage
write with a scoped read before retrying; never create a duplicate review to
recover a later step. Once the review is confirmed and the job is still ready
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
rule in `pokes.md`. Preserve the released state across compaction; a still-open AI
review does not restore the assignment.

Reviewable alone is not enough: retain the assignment while requested work,
an unanswered package, a failed or unfinished authorized action, or a
triggered completion sweep remains. A terminal failure record does not release
it. For a finished job already in Reviewable, a reply declining some or all
actions can complete the package; declined actions are not pending work.
Releasing the
session assignment does not resolve the job or change its human assignees.

After a successful package for a finished job now in Reviewable, release the
assignment under `pokes.md`'s Assignment ownership rule, once any clear and
triggered sweep are complete and no requested Review work remains. An
unfinished package keeps it.

## Reopened task stage

Jobs change stage through `change_job_stage`, not `reopen`. For a reopened task,
the server moves the job as it would for whoever reopened: a task an assignee reopens on a Reviewable job
returns it to Doable, and one reopened by anyone else, the AI included, sends it
to Approvable, where the usual next-action question applies.

A reopened task leaves its job unfinished until the task resolves again.

## Job commit identities

After review opens, a proposed commit message begins with the completed
task/comment code. A job code at the start means the whole job is done, so use
it only when no tasks remain.

## Requested job creation

Before `add_job`, export and search for duplicates and related work. Surface an
existing match instead of duplicating it. Cite related-but-distinct short codes
in the new description. Pass initial `tasks` when parts could be reviewed,
committed, or documented separately.

When the human requests a new job containing existing bugs, pass their short
codes in `bug_short_code_ids` alongside any new `tasks`. Only standalone bugs
can move, and only into the job created by that call. Each distinct bug has a
`moved`, `failed`, or `unconfirmed` outcome; one failure does not stop the other
moves. Report those outcomes with the returned new job identity. Preserve that
identity when checking an unconfirmed result with `get_job`: each `add_job`
call creates another job, so repeating the call is not a retry of that job.

## Visual options

Visuals only depict canonical Uclusion options. Create every choice with
`ask_question` or `add_options`, and label each panel with its stable Uclusion
option code/name—never a parallel A/B/C scheme. Keep the artifact and options
in sync in the same turn. Never silently reuse an existing label for a changed
meaning; create a new option or question. An accepted, durably recorded human
suggestion explicitly authorizes `update_option` on that canonical option
while preserving its identity.

## Job completion-sweep triggers and outcome record

Run both scans whenever a job transitions
into Reviewable. Reviewable is a reliable handoff signal, not proof that the job
is final or that remaining deployment and other-environment verification has
run. A transition returned by `ask_for_review` is the same trigger. If the job
leaves Reviewable and later returns, that later transition
runs a new sweep. Merely loading a job that is already Reviewable, or receiving
another update while it remains there, is not a trigger.

Individual task completion, the act of requesting review, using a completed
code in a commit, resolving the job, later human signoff, and shipped or fixed
confirmation are not independent job triggers. A subsequent transition into
Reviewable remains a trigger.

The completed-code set starts with the Reviewable job's exact short code.
Also include every contained item rendered as a `Task` or
`Grouped task`, including resolved forms and retained non-`T-` prefixes.
Membership comes from its rendered role and containment, not its prefix;
ordinary assistance and replies do not qualify merely because they are in the
job.

For outcome impact, use the record available at the trigger: the Reviewable job
and all its task bodies, plus the current
intent/design capsule, human-backed decisions, and current completion/review
report when each is present. Rejected, unresolved, and speculative proposals
are not evidence. If those sources conflict and the current record does not
settle that conflict, do not classify a candidate. A later Reviewable
transition uses the then-current record and can supersede the earlier result.

Run the common export, scans and presentation from `completion.md` at each
trigger.

## Job handoffs

A progress checkpoint is not a lane handoff, and neither is an ordinary
model/chat turn.

<!-- uclusion-audit:v1 -->
Neither ends the active audit. At a genuine lane handoff for a blocking human
dependency, review, completion, pause or interruption, end an active job audit
under `audit.md`. Ending an audit alone does not clear a human-guided assignment.
<!-- /uclusion-audit:v1 -->

If a job is fully complete, apply `operations.md`'s notification, commit and
context-boundary rules. A later job Resolve, signoff, shipped confirmation or
commit does not rerun its completion sweep.

<!-- /uclusion-skill-reference:v1 -->
