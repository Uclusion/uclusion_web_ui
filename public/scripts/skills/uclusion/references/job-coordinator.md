<!-- uclusion-skill-reference:v1 -->
# Job coordinator

## Current stage and action set

Use the held lookup and shared body. Select only the units required by the
stored stage and current action below before acting; keep common gates and
complete-read/reuse rules. Do not open another unit to discover its
applicability or preload future stages.

| Current job stage or action | Additional complete units and gates |
| --- | --- |
| Scoped entry/context/updates, questions/suggestions/options/votes/resolutions, capsule delegation/receipts, or exact authorized transition | Use this body's procedure and the held common tools/write/permission rules. |
| Approvable approval, after assistance is settled and approval is applicable | [approval.md](approval.md). Otherwise ask the next-action question below. Implementation is locked. |
| Requires Input | Handle qualifying assistance and any resulting current-contract change below. Investigation continues; implementation stays locked until Doable or Reviewable returns. |
| Doable implementation or completed implementation-task resolution | [coordinator-execution.md](coordinator-execution.md), after the complete target/current-contract prerequisite and independent permissions. |
| Reviewable Reports direction or feedback | [review.md](review.md). Add coordinator-execution.md only for requested implementation or task resolution, with the current contract and permissions. An unchanged Reviewable report and human Reports direction open no package. |
| Blocked, Backlog or Skippable | Handle selected assistance, dependencies or exact authorized transitions below; implementation is locked. |
| Implementation-review publication/recovery | [review.md](review.md) and [completion.md](completion.md), with the review-prepared package thread and scope; apply immediate confirmed-publication presentation before follow-on work. |
| Finished-job assignment release | [review.md](review.md). Add completion.md only for its package action. |
| Current implementation-review completion package | [completion.md](completion.md). Add review.md only for current publication/recovery or assignment release. |
| Held claim | Apply the common claims route before affected ownership, package or handoff actions. |

<!-- uclusion-audit:v1 -->
For the assigned job, when `start_job_audit` is exposed (including deferred) or
an audit is active, load [audit.md](audit.md) in full before
substantive work or affected phase, publication or handoff actions.
<!-- /uclusion-audit:v1 -->

## Job entry and current contract

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

Default whole-job reads, including `initial_read`, omit token-usage audit
records; explicit audit-thread and notes-section reads can retrieve them.

Reuse a complete held body, including one returned by `initial_read`, when its
target, exact R-code and actual version match the current reference. Only when
that body is missing, changed or lost, read the advertised capsule's exact R-code
thread before affected source or test edits. Check its returned identity,
target and actual version, and use the complete body. A superseded capsule is
not the target's current contract; follow the current reference instead.
Capsule comments remain context and discussion, not the implementation
contract. Load their current contents on a whole-scope or exact capsule-thread
refresh even when the capsule body's version is unchanged; never cache their
contents solely by that version.

After helper publication, apply this prerequisite to its canonical receipt. On
an assigned current capsule's `Updated` event, read its R-code thread and reload
Reports; for a human edit, reconcile below before affected edits.

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
with options move to Doable and do an approval. Vote for move to Doable.

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

An `Updated <job-code> stage is now <stage-name>` reports the stored
transition. Apply assignment routing first; record it without get_job or
stage_only merely to discover or confirm that stage. It does not establish
unchanged content, resolve assistance, replace a necessary effective-stage
check or assign work. Load only missing prerequisites for the next action. A
move to Doable resumes only this session's assignment after every execution
gate is met.

An `Updated <item-code> of <job-code> converted to <type>` reports only that
item's new type. Record it from the event when the item's complete body is
held; otherwise read just that item with `thread_only`. It does not report the
job's stage, and a conversion can move the job between stages without its own
stage event, so keep the effective-stage check before stage-gated actions.

Reviewable is a handoff signal, not proof the job is final or its remaining
deployment/other-environment verification ran.

### Plan mode and handoffs

Plan-mode restrictions govern machine and repository changes, not Uclusion
artifacts. File job questions and suggestions immediately. Before leaving plan
mode, ensure the plan is durable in the applicable artifact and show its link;
use add_info only for information still missing. A chat-only or local-file plan
is unfinished.

## Job questions and suggestions

Apply the held common durable-write rules to the corresponding write.

### Ask and resolve questions

Except for the routed completion package, call `ask_question` for ambiguity and
judgment calls under the held shared question-tool rules.

File every currently known distinct question in the same turn, each with its
options and your vote, so the job enters Requires Input once and the human
answers the whole set in one sitting. Questions, suggestions, and votes are
work output rather than a delay, so never withhold one to keep moving.

#### What answers an AI-authored question

For a question on a job, an Approvable option's For vote answers only when it
is non-AI and not rendered advisory; a clear reply answers only when its author
is non-AI and the reply is not rendered advisory. Treat the rendered advisory
marker as authoritative; do not infer authority from other metadata. Advisory
input can change the AI's reasoning or vote and sends a Responded Poke, but
cannot make the question answerable or unlock execution.

A human may instead Resolve a question directly; that delegates the choice to
the AI. A resolved question marked pending AI handling still needs that choice
handled. Keep its rendered question version with the evidence. Do not reopen or
write inside a resolved question.

Finish any reply or vote before resolving a question. When its answer
establishes a capsule change, apply the capsule procedure below and delegate
composition, cold review and publication while the question stays open,
explicitly granting its named resolution to the design helper. Include pending
human-resolved questions. When no capsule change is needed, settle immediately
with `resolve`, passing `expected_question_version` from the handled evidence
and `included_in_capsule: false` for pending handling. Without option
votes, an open thread gives no reliable completion signal. The qualifying human-answer and
execution-lock rules above still apply. Clarify ambiguous replies. Only
Approvable options count or accept votes. If later work would say "flag if you
prefer" or "verify this choice," stop: that was an unasked step-two question.

### Address suggestions

Use `make_suggestion` before mentioning any better approach or follow-up in
chat, then include the returned link when mentioning it. For human suggestions,
reply with a definitive decision and action unless accepting an option amendment below. When voting is enabled, call
`vote_on_suggestion` before resolving; never vote on your own suggestion.

For an accepted option amendment, record any required vote, then call `update_option`
with `resolve_suggestion_short_code_id` naming that suggestion. For other
accepted changes, record the plan, act, then resolve. A human Resolve on an
AI-authored suggestion without reply or vote declines the mitigation and
accepts the risk; do not recreate it. A human's conversion of an AI-authored
suggestion into a task accepts its proposal as written. Do not re-ask a choice
the suggestion already made, unless new evidence found after the conversion
bears on it; then name that evidence in the question.

Do not offer execution or approve the job while your unanswered question or open suggestion remains.
You may ask whether to begin completely independent tasks first.

## Coordinator capsule design and publication

Before granting publication or handling a human capsule edit, apply the held
common durable-write rules and satisfy the target/current-body prerequisite
above.

### Capsule authority

Record new job/task context with `add_info` on the selected current capsule's
exact R-code, or on the job/task as an ordinary associated note when no capsule
exists. Use an independent task's own capsule without job fallback and a
grouped task's top-level parent's capsule.

Once sent, keep the capsule body stable unless human input that arrives after
it establishes a new contract. Finding older human input you had not read is
not that; raise it as a question instead. When a new contract is established,
update the capsule to say it before further affected edits and before the lane
ends, even when there are no edits. A settled decision must not sit beside a
capsule that still states what it replaced. The capsule stands alone and
preserves the actor-visible outcome, not merely decisions or components.

### Bounded design dispatch and publication

When the selected target has no current capsule, run any read-only
investigation in fresh investigation helpers under
[helper-dispatch.md](helper-dispatch.md) and settle every reviewer-divergent
choice. Incorporate relevant existing ordinary-note information into the
first capsule's design evidence.

Delegate planning, composition, revision, cold review and MCP publication to a fresh
design helper without inherited conversation history (`fork_turns: "none"` in Codex).
Supply the selected job/task, bounded evidence and settled requirements, new
human requirements since publication, either confirmed capsule absence or the
complete current body/R-code/actual version, and
`../uclusion-design/SKILL.md` resolved from the selected `uclusion` package root.
Do not send shared coordinator or coordinator-reference bodies.

For every referenced question, supply its canonical URL, relevant
question and option text, the selected option's qualified code/name, the settled
answer or outcome, and its rendered question version and pending state. Name
every capsule target required by that answer.

Select and grant only exact creation or permitted replacement, explicitly named
capsule-changing answered-question resolutions with settled canonical outcomes,
and obsolete-AI-review cleanup from replacement. Qualify human answers and
finish required replies/votes yourself under the assistance rules above. Keep
human-resolved questions pending AI handling in that grant. Acknowledge
incorporation only after every required target is confirmed, including an
unchanged-body publication. Earlier targets publish without question
acknowledgement; grant it with the final target only when all others are
confirmed, or as unfinished resolution after all publications are confirmed.
Resolutions requiring no capsule change stay with you. The helper uses this supplied authority without repeating your
qualification or a full-thread approval pass; missing or stale scope/evidence
and unsettled choices return as typed unresolved questions before publication.

Impose no numeric cap; do not read helper-only instructions before delegation.

Accept only a compact canonical receipt identifying target, link/R-code/actual
version, publication status, individual question-resolution and obsolete-review
outcomes with question version and both handling flags, and unfinished recovery,
or typed unresolved questions. A resolved flag alone does not confirm handling:
incorporation requires delegated false and included_in_capsule true. Pending
publisher operations remain not ready; return only unfinished work to that role.
File questions, check stages and permissions, and coordinate execution yourself.
Delegation grants no implementation permission. If the helper cannot load its
skill or a required reference, report a broken Uclusion install, suggest an
environment-correct `uclusion update`, and require a client
restart or MCP reconnect after success; do not improvise a writing workflow.
After publication, apply the current-contract prerequisite above. When the next
action needs the effective stage, fetch `stage_only` after the publisher's last
operation, preserving any newer held stage. A later cold review does not
authorize polishing or rewriting a sent capsule.

Delegation creates no separate ownership claim and grants no unlisted action.

For publication target/version conflicts or missing authority, reapply the
current-contract prerequisite and renew only the settled exact grant.

For a human capsule edit, refresh its current R-code body and Reports, resolve
your open review naming that capsule first, then reconcile in-progress work
with the new authoritative body. Publisher cleanup never replaces this route.
<!-- /uclusion-skill-reference:v1 -->
