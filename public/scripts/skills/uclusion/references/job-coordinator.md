<!-- uclusion-skill-reference:v1 -->
# Job coordinator

## Current stage and action set

Use the held lookup and shared body. Select only the units required by the
stored stage and current action below before acting; keep common gates and
complete-read/reuse rules. Do not open another unit to discover its
applicability or preload future stages.

| Current job stage or action | Additional complete units and gates |
| --- | --- |
| Scoped entry/context/updates, questions/suggestions/options/votes/resolutions, capsule design/publication, or exact authorized transition | Use this body's procedure and the held common tools/write/permission rules. |
| Approvable approval, after assistance is settled and approval is applicable | [approval.md](approval.md). Otherwise ask the next-action question below. Implementation is locked. |
| Requires Input | Handle qualifying assistance and any resulting current-contract change below. Investigation continues; implementation stays locked until Doable or Reviewable returns. |
| Doable implementation or completed implementation-task resolution | [coordinator-execution.md](coordinator-execution.md), after the complete target/current-contract prerequisite and independent permissions. |
| Reviewable Reports direction or feedback | [review.md](review.md). Add coordinator-execution.md only for requested implementation or task resolution, with the current contract and permissions. An unchanged Reviewable report and human Reports direction open no package or sweep. |
| Blocked, Backlog or Skippable | Handle selected assistance, dependencies or exact authorized transitions below; implementation is locked. |
| Implementation-review publication/recovery | [review.md](review.md) and [completion.md](completion.md), with job-prepared completion inputs and package scope; apply immediate confirmed-publication presentation before follow-on work. |
| Finished-job assignment release | [review.md](review.md). Add completion.md only for its package action or incomplete sweep. |
| Actual assigned-job entry into Reviewable or incomplete-sweep retry | [completion.md](completion.md), after preparing the completed-code set and authoritative outcome record below. |
| Current implementation-review completion package | [completion.md](completion.md). Add review.md only for current publication/recovery or assignment release. |
| Held claim | Apply the common claims route before affected ownership, package or handoff actions. |

<!-- uclusion-audit:v1 -->
For the assigned job, when `start_job_audit` is exposed (including deferred) or
an audit is active, load [audit.md](audit.md) in full before
substantive work or affected phase, publication or handoff actions.
<!-- /uclusion-audit:v1 -->

## Job entry and current contract

### Enter or refresh selected job work

1. Consume the initial lookup already held; do not repeat it because this
   workflow was loaded. If the work no longer has a Job header and has one top-level
   comment, return to the common standalone bug or question route instead.
2. Obtain only missing scoped context for the next action, including the complete
   current description when needed and the tasks, assistance or Reports it uses.
   Apply the held common standing-note rules and retain complete current bodies.
3. Apply the stage and assigned-update checks below to held lookup, event and
   write outcomes. Do not replace newer stage information with an older event.
4. Select the current required set above and hold its complete current bodies
   before acting.

### Scoped job context

Keep the initial whole-scope job read made with `initial_read: true`. Scope
subsequent reads to what changed, explicitly including the current description
when needed. After context restoration, fetch the description if its complete
body is missing before relying on it; a summary is not its body.

An `Updated <job-code> description change` Poke requires this description
refresh for the assigned job. For a generic job update, request only the needed
sections, including `description` when its freshness is uncertain. Stage-named
events follow the assigned-update rules below; load only missing context for
the next action.

### Select the target and hold its current contract

Before dispatching or resuming implementation, satisfy this complete
prerequisite. An executable stage is not a substitute for its current target
contract.

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

Ordinary reads advertise explicit capsule absence and the current references
for the job and displayed open top-level tasks. An initial read also returns
only the selected target's complete current capsule body, or explicit absence;
every other capsule remains a reference. A reference or summary does not
satisfy the current-contract prerequisite.

Reuse a complete held body, including one returned by `initial_read`, when its
target, exact R-code and actual version match the current reference. Only when
that body is missing, changed or lost, read the advertised capsule's exact R-code
thread before affected source or test edits. Check its returned identity,
target and actual version, and use the complete body. A superseded capsule is
not the target's current contract; follow the current reference instead.

After a capsule create or replacement, use `set_design_capsule`'s receipt: its
body is the one you just sent, so do not fetch it again before edits. On an
assigned current capsule's `Updated` event, use the explicit R-code thread read
and reload Reports, then apply the capsule rules below for obsolete-review
cleanup and reconciliation before further affected edits.

If the selected target's current capsule is absent, use design dispatch and
publication below; do not load execution rules merely to plan or publish while
implementation permission is unsettled. Historical work needing no more
implementation may finish its existing review without backfill; its next
resumed or changed implementation pass needs the current contract before edits.
A held current contract routes permitted dispatch to the execution unit.

Stored stage and next action both govern work. Blocked and Requires Input
remain distinct stored stages even when the UI labels both Debatable. Doable
and Reviewable do not prove assistance was handled. Requires Input locks only
this job's implementation edits; investigation, reproduction and measurement
may continue within their independent permissions.

### Stage and transition gates

For a job, when you need its stage after `resolve`, call `get_job` with
`stage_only: true`; the resolve receipt reports only what it resolved.

Run the ordered workflow: read, ask questions, address suggestions, approve
when applicable, execute only in an executable stage, then request review.
Before editing, apply the execution unit's assistance, task and Poke checks.

The final implementation review's Doable-to-Reviewable transition, including
recovery after confirmed publication, follows [review.md](review.md)'s existing
review-opening exception. Every other stage change requires a non-advisory
human to directly instruct a transition naming the exact job and destination
stage, or answer or delegate a question for that exact transition. A Start and
general work language such as “analyze this,” “take this up,” “proceed,” “go,”
or “fix it” never authorize a stage change. Planning outcomes, replies or
resolutions on other questions, unrelated approvals or votes, recommendations
and capsule changes do not authorize one. Leave the stage unchanged and ask
about the exact job and destination when authorization is missing.

If initial work is ready but the job is not executable, leave its stage
unchanged and ask one question “What action should I take on this job next?”
with options move to Doable and do an approval. Vote for move to Doable. Only
exact transition authorization permits change_job_stage; approval itself does
not. Use the stage-change receipt without rereading merely to confirm it, under
the held common write-receipt rules.

When no delivery is armed, reread assistance and effective stage before
editing, before a completion package, after its reply, and before and after a
stage change. Delivered Pokes and held write outcomes otherwise supply changes
under the common workflow. Never replace newer held stage information with an
older reported transition. Stage, capsule, testing/build, security, deployment,
commit and push gates stay independent.

### Assigned-job updates

An Added item that changes derived readiness is emitted after its workflow
transaction commits. Its one reload includes the item and new stage; do not
wait for a second stage Poke or act from cached stage.

For assigned description changes and generic updates, apply the scoped-context
reads above before work depending on that context. Soft-deleted work and work
that no longer has a Job header follow the common lookup rules and standalone
routes.

An `Updated <job-code> stage is now <stage-name>` reports the stored
transition. Apply assignment routing first; record it without get_job or
stage_only merely to discover or confirm that stage. It does not establish
unchanged content, resolve assistance, replace a necessary effective-stage
check or assign work. Load only missing prerequisites for the next action. A
move to Doable resumes only this session's assignment after every execution
gate is met.

For the assigned lane, compare a supplied transition (or an ordinary update's
reloaded stage) with the last observed stage. An actual change into Reviewable,
including a confirmed in-session change or ask_for_review transition, requires
preparing the completion inputs below and invoking
[completion.md](completion.md)'s sweep immediately, before review, handoff or
other work, subject only to the completion unit's confirmed-package
presentation order. Reviewable is a handoff signal, not proof the job is final
or its remaining deployment/other-environment verification ran. Loading an
already Reviewable job or an update while it stays there does not retrigger it.
A failed sweep remains incomplete work: retry it with its prepared lane inputs,
without new package permission before switching lanes.

### Reopened task stage

A task an assignee reopens on a Reviewable job returns it to Doable; one
reopened by anyone else, the AI included, sends it to Approvable and the usual
next-action question. A reopened task leaves the job unfinished until the task
resolves again.

### Plan mode and handoffs

Plan-mode restrictions govern machine and repository changes, not Uclusion
artifacts. File job questions and suggestions immediately. Before leaving plan
mode, ensure the plan is durable in the applicable artifact and show its link;
use add_info only for information still missing. A chat-only or local-file plan
is unfinished.

Apply the held common progress and turn-ending rules. A progress checkpoint or
ordinary turn is not a lane handoff. Retain assignment through required input,
package waits, incomplete authorized actions and sweeps. Finished-job release
follows [review.md](review.md); apply assignment-aware discovery only when the
assignment actually ends.

A fully complete job follows the common notification and context-boundary rules
and the review unit's commit identities. Individual task completion, requesting
review without a stage transition, Resolve, signoff, shipped confirmation or a
completed code in a commit never independently rerun its completion sweep.
Leaving and later returning to Reviewable creates a new transition and sweep.

## Job questions and suggestions

Apply the held common durable-write rules to the corresponding write.

### Ask and resolve questions

Except for the routed completion package, call `ask_question` for ambiguity and
judgment calls under the held shared question-tool rules.

File every currently known distinct question in the same turn, each with its
options and your vote, so the job enters Requires Input once and the human
answers the whole set in one sitting. Questions, suggestions, and votes are
work output rather than a delay, so never withhold one to keep moving.

Filing them is not itself a reason to stop. A question blocks only the work
that depends on its answer. Requires Input bars implementation edits to the
job, and bars nothing else: keep investigating, reproducing, measuring, reading
source, and gathering the evidence the answers will need, and carry on with any
other lane the human has authorised. Ask newly discovered questions as they
arise. Filing a question never ends a turn; apply the held common turn-ending
rules.

#### What answers an AI-authored question

For a question on a job, an Approvable option's For vote answers only when it
is non-AI and not rendered advisory; a clear reply answers only when its author
is non-AI and the reply is not rendered advisory. Treat the rendered advisory
marker as authoritative; do not infer authority from other metadata. Advisory
input can change the AI's reasoning or vote and sends a Responded Poke, but
cannot make the question answerable or unlock execution.

An open AI-authored question moves a job in Approvable, Doable or Reviewable to
Requires Input, whichever stage the question was opened in. A primary,
non-advisory reply or vote makes it answerable, but the job stays locked until
the AI resolves the question. A human may instead Resolve the question
directly; that delegates the choice to the AI, does not silently select an
option, and restores the prior stage. Record a new non-obvious delegated choice
in the applicable capsule when writing it, or use `add_info` on the job/task
only if missing from the durable thread. Do not reopen or write inside the
resolved question.

Finish any reply or vote before resolving a question. When its answer
establishes a capsule change, apply the capsule procedure below and delegate
composition and cold review while the question stays open, then pass its code
in `set_design_capsule`'s `resolve_question_short_code_ids`. Use `resolve` when
no capsule change is needed; omit questions the human already resolved. Resolve
an open-ended question promptly once its answer is settled or the question is
no longer needed, after any required reply and capsule update. Without option
votes, an open thread gives no reliable completion signal. Option-bearing
questions may await completed vote review or the existing execution gate; do
not resolve merely to acknowledge each vote. The qualifying human-answer and
execution-lock rules above still apply. Clarify ambiguous replies. Only
Approvable options count or accept votes. If later work would say "flag if you
prefer" or "verify this choice," stop: that was an unasked step-two question.

### Address suggestions

Use `make_suggestion` before mentioning any better approach or follow-up in
chat, then include the returned link when mentioning it. For human suggestions,
reply with a definitive decision and action unless accepting an option amendment below. When voting is enabled, call
`vote_on_suggestion` before resolving; never vote on your own suggestion.

An open qualifying human suggestion keeps the job in Requires Input. For an
accepted option amendment, record any required vote, then call `update_option`
with `resolve_suggestion_short_code_id` naming that suggestion. For other
accepted changes, record the plan, act, then resolve. A human Resolve on an
AI-authored suggestion without reply or vote declines the mitigation and
accepts the risk; do not recreate it. A human's conversion of an AI-authored
suggestion into a task accepts its proposal as written. Do not re-ask a choice
the suggestion already made, unless new evidence found after the conversion
bears on it; then name that evidence in the question.

Do not offer execution or approve the job while an unanswered question remains.
You may ask whether to begin completely independent tasks first.

## Coordinator capsule design and publication

Before publication or review cleanup, apply the held common durable-write rules
and satisfy the target/current-body prerequisite above, using a sent-body
receipt when available.

### Capsule authority

Once sent, keep the capsule body stable unless human input that arrives after
it establishes a new contract. Finding older human input you had not read is
not that; raise it as a question instead. When a new contract is established,
update the capsule to say it before further affected edits and before the lane
ends, even when there are no edits. A settled decision must not sit beside a
capsule that still states what it replaced. The capsule stands alone and
preserves the actor-visible outcome, not merely decisions or components.

### Absent-capsule design dispatch and publication

When the selected target has no current capsule, continue read-only
investigation and settle every reviewer-divergent choice. Complete drafting and
cold review below before calling `set_design_capsule` in target mode. Uclusion
strongly validates that the task still belongs to the stated job and refuses a
missing or stale job/task pairing. Reload the task and use its current job
before retrying.

Delegate planning, capsule composition, revision and cold review to a fresh
design helper without inherited conversation history (`fork_turns: "none"` in Codex).
Give the design helper the selected target, bounded relevant evidence, the
current capsule when present, new human requirements since publication, and
`../uclusion-design/SKILL.md` resolved from the selected `uclusion` package root.
Do not send shared coordinator or coordinator-reference bodies.

Request the shortest complete contract, directing the design helper to delete
sentences whose removal loses no necessary behavior, constraint, navigation,
evidence or permission limit; impose no numeric cap. Keep research,
alternatives, planning rationale and transcripts with that helper. Do not read
those helper-only instructions or examples before delegation.

Accept only the complete cold-reviewed capsule with claim-local evidence links
or typed unresolved questions. Keep raw research and planning with the design
helper. File and resolve questions, check stages and permissions, publish with
`set_design_capsule`, and coordinate execution yourself. Delegation grants no
implementation permission. If the design helper cannot load its skill or a
required reference, report a broken Uclusion install, suggest an
environment-correct `uclusion update`, and require a client
restart or MCP reconnect after success; do not improvise a writing workflow.
After each create or permitted replacement, apply the current-contract
prerequisite, using the held publication receipt. A later cold review does
not authorize polishing or rewriting a sent capsule.

When permitted implementation is the next action after publication, use the
routed execution unit for its independent gates and fresh independent-task
dispatch, against the held current contract. Keep the full capsule and its
tracking evidence yourself; compile the complete implementation brief under
that unit rather than sending workflow context. Delegation creates no separate
ownership claim and grants no unlisted action.

Replace a sent capsule only when new human input establishes a new contract. AI
discoveries and implementation differences do not authorize a replacement;
report those differences once in the review. Unsettled choices still require
questions under the job-assistance rules above. For a permitted replacement,
finish drafting and cold review, then call `set_design_capsule` in update mode
with the current R-code and version held under the current-contract rules and
the complete replacement body. Never patch fragments or blindly retry a version
conflict; reload the capsule on one. Replies remain discussion until new human
input establishes a new contract and is folded into the body. Its former body
appears asynchronously as an ordinary unpinned note. Do not wait for that
archive or treat it as current implementation context.

Publish only human-facing contracts.

After an AI replacement, resolve each review its result lists in
`open_ai_reviews_naming_capsule` before further affected edits. After the
current-body and Reports refresh for a human capsule edit,
resolve your open review naming that capsule first, then reconcile in-progress
work with the new authoritative body.

### Publication receipts and partial success

Use the current-contract receipt confirmation and the held common write
reconciliation.

When `set_design_capsule` also resolves selected questions, inspect the capsule
receipt and each resolution outcome. A failed or uncertain publication resolves
no questions; a later resolution failure leaves the published capsule in place
and stops the remaining resolutions. Resume resolutions only after confirming
the intended capsule was published; otherwise reconcile and publish that
contract first. Once publication is confirmed, resolve only unfinished
questions rather than replaying a stale capsule write. If the review-inventory
lookup failed, load Reports for the existing obsolete-review cleanup. After the
last operation, use `stage_only` before acting on the stage.

## Prepare job completion inputs

Before invoking a sweep at an actual Reviewable transition or its incomplete
retry, retain the trigger's exact job identity and obtain only missing scoped
job/task context needed for the complete outcome record. Supply this prepared
record, completed-code set and any current package scope to the completion
unit. A package-only action uses its held review thread and scope; it does not
create a sweep trigger.

The completed-code set starts with the Reviewable job's exact short code.
Also include every contained item rendered as a `Task` or
`Grouped task`, including resolved forms and retained non-`T-` prefixes.
Membership comes from its rendered role and containment, not its prefix;
ordinary assistance and replies do not qualify merely because they are in the
job.

For outcome impact, use the record available at the trigger: the Reviewable job
and all its task bodies, plus the current intent/design capsule, human-backed
decisions, and current completion/review report when each is present. Rejected,
unresolved, and speculative proposals are not evidence. If those sources
conflict and the current record does not settle that conflict, do not classify
a candidate. A later qualifying transition uses the then-current record and can
supersede the earlier result.

Reuse the prepared trigger inputs for an incomplete retry while they remain
current and sufficient; reconcile changed authoritative evidence before relying
on it. Prepare each later qualifying transition from its then-current record.
<!-- /uclusion-skill-reference:v1 -->
