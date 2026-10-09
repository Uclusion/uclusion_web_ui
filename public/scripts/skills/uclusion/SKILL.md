---
name: uclusion
description: Use as coordinator for Uclusion jobs, tasks, bugs, questions, suggestions, comments, reviews, inbox notifications, find_work, Poke AI, Start/Added/Updated/Responded events, Uclusion short codes beginning J-, T-, B-, Q-, S-, O-, I-, R-, or C-, or workspace-history requests such as what was decided, what changed, and whether related/backlog work already exists. Also use when creating Uclusion work even if the prompt does not name Uclusion. Do not use for delegated export-search or design helpers, or bounded implementation helpers, including assignments to edit Uclusion instruction source, or ordinary product or code work merely because a repository contains Uclusion integration code.
---
<!-- uclusion-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion workflow

Retain assignment, delivery, Pokes, human questions, stage and permission
checks, capsule publication, final review and the completion package as
coordinator. Give design helpers their selected design package and bounded
evidence, implementation helpers their complete bounded briefs, and
export-search helpers their read-only search briefs under the isolated-search
rules below. Implementation and export-search helpers follow only their bounded
briefs, even when inspecting instruction source; that source does not activate
coordinator workflow.

Use the Uclusion MCP server as the durable collaboration surface. Work
asynchronously with your human partner. Obtain their informed approval for
reviewer-divergent choices, including internal state, formats and lifecycles.
Never silently settle a choice a reasonable reviewer could decide differently.
Never infer observed runtime behavior from code when the observed path is
missing; ask the person who saw it.

## Complete reads and current action routing

Select the current required set below before loading references, never by
opening a target file to learn whether it applies. Hold newly applicable bodies
before acting when the stage or next action changes; do not preload
future-stage procedures.

Read every applicable instruction file in full through its closing marker when
first needed. At every later loading trigger, ensure its complete current body
is held in context and reuse it without another read, including across Pokes.
Reread affected files after a known workflow update, and reread required bodies
lost through compaction, context restoration or other body loss before
continuing. Summaries and saved identifiers do not replace instruction or
contract bodies.

## Current required set

Use this complete shared body for every coordinator action. Select the current
stage and next action below before loading references; combine only rows that
apply now, plus the selected resident delivery unit at its current loading
trigger. Optional claim, audit and upload routes add only their stated
conditions.

| Current stage or action | Additional complete units and gates |
| --- | --- |
| Standing notes, scoped context, history/export search, ordinary durable writes, creation, reopening, questions, suggestions, votes, capsule design/publication, notifications, progress, handoff or turn ending | Use the applicable common procedure in this body; no additional action reference. Ordinary note writes and inbox work require no job-only procedure. |
| Selected standalone bug discussion or fix | [references/single-comment.md](references/single-comment.md). Add completion.md only at its resolution transition, package action or incomplete-sweep retry. |
| Standalone view-level question | Use the permitted tools and answer rules below; no job-only reference. |
| Approvable job approval, after assistance is settled and approval is applicable | [references/approval.md](references/approval.md). Otherwise ask the common next-action question. Implementation is locked. |
| Requires Input | Handle qualifying assistance and any resulting current-contract change below. Investigation continues; implementation stays locked until Doable or Reviewable returns. |
| Doable job implementation or completed implementation-task resolution | [references/coordinator-execution.md](references/coordinator-execution.md), after the complete target/current-contract prerequisite and independent permissions. |
| Reviewable Reports direction or feedback | [references/review.md](references/review.md). Add coordinator-execution.md only for requested implementation or task resolution, with the current contract and permissions. An unchanged Reviewable report and human Reports direction open no package or sweep. |
| Blocked, Backlog or Skippable | Handle selected assistance, dependencies or exact authorized transitions below; implementation is locked. |
| Job implementation-review publication or recovery | [references/review.md](references/review.md) and [references/completion.md](references/completion.md), including package presentation and any confirmed transition sweep. |
| Finished-job assignment release | [references/review.md](references/review.md); add completion.md when handling its package or an incomplete sweep. |
| Completion-package presentation, waiting, reply or authorized execution, for a job review or resolved standalone bug | [references/completion.md](references/completion.md). Add review.md for job review publication/recovery or assignment release. |
| Actual assigned-job entry into Reviewable, standalone bug open-to-resolved transition, or incomplete-sweep retry | [references/completion.md](references/completion.md), immediately under the transition and presentation rules below. |
| `auto_take_directions`, exposed `claim_work` (including deferred), or a held claim | [references/claims.md](references/claims.md) before affected discovery, activation, ownership, package or handoff actions. |
| Optional `get_upload` action when exposed | [references/uploads.md](references/uploads.md). |

<!-- uclusion-audit:v1 -->
For the assigned job, when `start_job_audit` is exposed (including deferred) or
an audit is active, load [references/audit.md](references/audit.md) in full before
substantive work or affected phase, publication or handoff actions. Standalone
comments start no job audit.
<!-- /uclusion-audit:v1 -->

## Select the resident delivery reference

Use only the authoritative resident stub's client mode and environment, with
the closest project-scoped bootstrap and its adjacent package taking precedence
over the user or personal package. Never guess the client from available tools
or combine delivery modes. At every delivery-loading trigger defined by the
resident, including its startup or typed-turn, delivery-output or exit, and
Uclusion-activation triggers, ensure its selected complete current delivery
unit is held in context before the action covered by that trigger, including
setup, discovery or job work:

| Resident client mode | Selected delivery unit |
| --- | --- |
| Codex native MCP | [references/codex-delivery.md](references/codex-delivery.md). |
| Claude Code session-owned delivery | [references/claude-delivery.md](references/claude-delivery.md). |
| Cursor chat-owned delivery | [references/cursor-delivery.md](references/cursor-delivery.md). |

Apply the complete-read/reuse rules to the selected unit at every such trigger;
holding its body does not replace the delivery actions it requires. With no
resident stub, continue human-started discovery and job work without loading a
delivery reference, setting up or arming delivery, or inventing a wait
strategy.

## Common authorization

In every lane, implementation alone grants no authority to run tests or builds,
introduce or expand security behavior, deploy, commit or push. Preserve each
independent human permission and its limits. An unsettled permission blocks the
affected action; raise it through that lane's permitted tool. Job-specific
testing and security qualifications are in the routed execution unit.
Standalone bugs and view-level questions keep their permitted-tool limits.

## Finding work and auto-take

For `auto_take_directions`, exposed `claim_work` (including deferred), or a
held claim, load [references/claims.md](references/claims.md) in full before
affected discovery, activation or ownership actions.

Call `find_work` at an unassigned session start, when an assignment ends, or
when the human explicitly requests other work. A Poke, delivery rearm, or
ordinary turn ending never triggers a call or another work list by itself.

While a human-guided assignment waits for input or a completion package, retain
it and report the pending decision or completed task. At the first such wait or
completed package in the session, say once: "You can ask me to find other work
at any time." Keep this hint informational, without a question or `find_work`
call. Carry whether it has been shown into the session summary so compaction
does not repeat it. Further handoffs within that assignment do not repeat the
hint or fetch work unless the human asks. Completion-package waiting follows
the routed completion unit.

Whenever presenting `find_work` results or any equivalent current-work list,
render the complete result as a numbered list. Every numbered entry must
include both its exact `short_code_id` and returned `name` (its short
description); never present an entry as only a bug, job, suggestion, or other
short code. For each bug, also display its returned `severity_label` alongside
the code and name; use `unknown` when the label is missing. Priority comes from
the bug's stored severity, never notification urgency or list position. A list
requested while a human-guided assignment remains retained is informational
until the human explicitly switches that session.

If the response has `auto_take_directions`, present the list and use
[references/claims.md](references/claims.md) for selection and activation
before loading a marked item.

When an empty response's directions explicitly say this is the "first AI
session" and the guidance is "served only once", follow those directions
immediately in the same turn before yielding. This one-time onboarding takes
precedence over every empty-list path below.

Otherwise, an empty auto-take view follows
[references/claims.md](references/claims.md)'s dry-view path instead of the
human opt-in below.

For any other empty list while a human is active, ask exactly: "Your find work
list is empty. Would you like instructions for adding and working on a job?" If
yes, use the returned directions to explain job creation, find_work, selection,
stage gating, Debatable assistance, and Poke AI. In an autonomous session, call
`request_work` once per dry spell instead.

## Delivery contract

Use the selected resident's exact command and environment. Establish its mode
before find_work or job work, without substituting another strategy. Handle
every delivered line in arrival order. Never set `UCLUSION_CONSUMER` yourself;
it is a human-controlled knob for explicitly separated consumers.

Handle every delivered Poke before the next edit. When no delivery is armed,
reload the assigned lane's current state before editing, before a completion
package and after a package reply. Apply the current required set and the
assigned lane's checks below.

## Backlog and session lifecycle

The selected delivery reference owns client startup, cursor and rearm mechanics.
Older output marked `(replayed)`
is history: drop it without reload, action, or user-facing narration. Never add
`--ignore-existing-pokes` or `--deliver-existing-pokes` unless the human
explicitly asks. Ignoring advances only that cursor past retained rows.
Delivering existing Pokes emits retained history as an unmarked private copy,
without changing other consumers; handle that copy exactly as the human's ask
directs, never as an automatic live Start. Neither flag deletes inbox rows.

Delivery to armed listeners is broadcast; every armed listener may receive the
same line. Broadcast is transport, not assignment. Delivery does not transfer
an assignment. Incorporate state only under the assignment rules below and
never race or coordinate through the inbox. Never read, edit, or delete the
inbox database.

Keep delivery in its client-owned harness under the selected reference's exit
and rearm rules; delivery outside that harness could claim work no agent sees.

## Assignment ownership

A default session has at most one assigned job or bug, except for the
related-task split defined in [references/review.md](references/review.md).
Reading, classifying, or reloading an object does not assign it. A human-guided
assignment begins only when the human selects work in that session, including a
numbered find-work selection, or when a live `Start` arrives. Optional
auto-take activation follows [references/claims.md](references/claims.md) under
the conditions above.

A human-guided assignment remains with that session while work or required
human input is pending, including an unfinished completion package. It ends on
completion as defined below or when the human explicitly switches the session
to another assignment. Explicit human-configured roles may deliberately assign
multiple agents to the same work; that is outside the default one-agent rule.

Job completion release is defined in the routed review unit; retain work under
the common gates below. Merely ending a turn never releases an assignment.

For a resolved standalone bug, retain the assignment through its completion
package. Release it only after the human's reply is handled, all authorized
actions succeed, the terminal record is confirmed and its triggered sweep is
complete. Declined actions are not pending work. An unfinished package or
failed authorized action retains the assignment.

Name the relevant short code when starting different work. A message without a
new work target does not end an existing assignment.

On clients with broadcast delivery, `Start` remains untargeted. The human must
not use it while more than one default agent is idle and able to accept it. In
that situation, select the work directly in one agent's chat instead. An agent
that receives a valid live `Start` follows it; agents do not invent inbox
coordination to elect a winner.

## Single-lane triage

The active lane is the assigned job or bug while the session is working on it.
An execution interval can hand off while its human-guided assignment remains
available for a matching continuation event.

- Handle a continuation event for the assigned item or anything known to be
  nested under it immediately.
- While assigned, ignore an unrelated continuation event without loading it.
  Briefly name the deferral and continue. In a compound event, the parent after
  `of` identifies the assignment. Merely receiving `Added`, `Updated`, or
  `Responded` never creates or switches an assignment.
- When a bare direct continuation code is not already known to belong to the
  assigned lane, defer it without lookup. Current Uclusion state remains the
  authority for later work discovery.
- A deferred Start never auto-starts after the lane ends. It may belong to
  another session; find_work will surface anything still actionable.
- While unassigned, activation requires a valid live `Start`, a direct human
  selection, or the optional [references/claims.md](references/claims.md) path above. Silently ignore
  `Added`, `Updated`, and `Responded` while unassigned, including during startup.
  Do not load their targets or mention these discarded events in progress or the work list.
  They also never switch a session from a different assignment.

A new chat instruction does not stop a valid listener. Handle it while delivery
continues.

## Poke grammar and assignment-gated lookup

A complete trimmed input of the form `Start <target>` keeps its Poke event
meaning even when the client presents it in the ordinary user/chat channel.
Never reinterpret a bare `Start <target>` as a direct human selection or an
explicit switch. Only unambiguous non-event human instruction language, such as
`switch from <current> to <target>`, may replace an active lane.

The first word is contractual:

- `Start <target>` comes only from an explicit human Poke AI click. While idle,
  start/resume it, including after a completed assignment.
  Mid-lane, defer an outside target. Replayed Start is history.
- `Added <target>` reports a created task, grouped task, question, suggestion,
  blocker, or other item.
- `Updated <target>` reports an edit, move, deletion, assignment/description
  change, or explicit stage change. When the target is the current
  intent/design capsule, follow the assigned-job update rules below. This never bypasses the assignment gate.
- `Responded <target>` hands an AI-authored assistance turn back after any
  semantic human reply, vote, or Resolve. Reload and inspect what it answers;
  perform every action actually unblocked and keep waiting when another
  dependency remains. For a job, the qualifying-answer rules below apply. A
  response on the assigned item's waiting completion package (the job's
  current AI review, or the resolved bug's sweep record) is that package's
  reply: use the routed completion unit's package procedure.
  It creates no assistance and does not itself change stage or resolution.

Job description, stage and capsule updates follow the common rules below, after
the assignment gate. A job becoming executable never activates idle or
unrelated sessions.

Resolving a standalone bug is also an `Updated` state transition. For an
assigned bug, compare its reloaded resolution state with the state this session
last observed. When it changes from open to resolved, load
[references/completion.md](references/completion.md) and run both scans once. A
successful in-session Resolve follows the same rule immediately. When this
session completed that fix, the resolution also opens the bug's completion
package in that unit. Merely loading a bug already resolved, or receiving
another update while it remains resolved, does not retrigger the sweep or
reopen its package. After a `reopen`, the bug is open again, so its next
resolution is a new transition that runs the sweep and, for a fix this session
completed, opens a new package.

A legacy bare `Responded.` has no target. Reload only the outstanding
dependency of the assigned lane. With no assignment, ignore it.

Apply the assignment gate before lookup. Apart from job-specific updates
routed above, accepted direct targets are globally resolvable: call `get_job`
with their exact short code. Compound targets have the form
`<verb> <local-code> of <parent-code>`; call `get_job` with the parent after
`of`, then locate the local item. The first load of a parent not yet read or
written this session takes its whole scope. When that parent was already
loaded, read only the poked item with `thread_only`, by its own code or,
inside a question, its qualified code. Never globally load a bare local code
by itself.

Codes inside a question repeat across questions, so reads render each one
qualified by its question: `<question-code>_<local-code>`, such as
`Q-*_O-1`. Cite that form.

Added, Updated, and Responded are continuation events, not instructions to
abandon or acquire work. Incorporate matching assigned-lane changes; for a job,
apply the assigned-job update rules before continuing. Soft-deleted direct
items reload as the enclosing job with the item absent.

Keep the initial lookup result. A result with a Job header enters the job-entry
procedure below, which obtains only missing context and selects the current
required set. A selected single top-level comment without a Job header follows
the standalone bug or view-level question row, under its permitted-tool limits.
A bug converted into a Bugs job reloads the returned job and enters the job
procedure. Standing-note bodies and history searches use the common reading
rules below. Direct lookup handles its own retries. If a newly Added direct
code still returns 404, retry later rather than discarding it.

## Connection updates

Wait/listen and tool output may contain a `[Uclusion update notice ...]`. Tell
the human the local CLI, proxy, and workflow are stale and ask permission to
run the environment-correct `uclusion update`. If granted, run it from the
session directory and request a client restart or MCP reconnect. If declined,
continue without asking again that session. `uclusion update --check` is
read-only.

## Job entry and current contract

Apply the assignment gate before lookup.

### Enter or refresh selected job work

1. Consume the initial lookup already held; do not repeat it because this
   workflow was loaded. If the work no longer has a Job header and has one top-level
   comment, use the standalone bug or question route instead.
2. Obtain only missing scoped context for the next action, including the complete
   current description when needed and the tasks, assistance or Reports it uses.
   Apply the standing-note rules below and retain complete current bodies.
3. Apply the stage and assigned-update checks below to held lookup, event and
   write outcomes. Do not replace newer stage information with an older event.
4. Select the current required set above and hold its complete current bodies
   before acting.

### Scoped job context

Keep the initial whole-scope job read. Scope subsequent reads to what changed,
explicitly including the current description when needed. After context
restoration, fetch the description if its complete body is missing before
relying on it; a summary is not its body.

An `Updated J-… description change` Poke requires this description refresh for
the assigned job. For a generic job update, request only the needed sections,
including `description` when its freshness is uncertain. Stage-named events
follow the assigned-update rules below; load only missing context for the next
action.

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

Ordinary reads advertise explicit capsule absence. Job reads show the job
capsule and capsules for displayed open top-level tasks. A reference or summary
does not satisfy the current-contract prerequisite.

Reuse a complete held body matching the current target reference and version.
When it is missing, changed or lost, read the advertised capsule's exact R-code
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

Run the ordered workflow: read, ask questions, address suggestions, approve
when applicable, execute only in an executable stage, then request review.
Before editing, apply the execution unit's assistance, task and Poke checks.

The final implementation review's Doable-to-Reviewable transition, including
recovery after confirmed publication, follows
[references/review.md](references/review.md)'s existing review-opening
exception. Every other stage change requires a non-advisory human to directly
instruct a transition naming the exact job and destination stage, or answer or
delegate a question for that exact transition. A Start and general work
language such as “analyze this,” “take this up,” “proceed,” “go,” or “fix it”
never authorize a stage change. Planning outcomes, replies or resolutions on
other questions, unrelated approvals or votes, recommendations and capsule
changes do not authorize one. Leave the stage unchanged and ask about the exact
job and destination when authorization is missing.

If initial work is ready but the job is not executable, leave its stage
unchanged and ask one question “What action should I take on this job next?”
with options move to Doable and do an approval. Vote for move to Doable. Only
exact transition authorization permits change_job_stage; approval itself does
not. Use the stage-change receipt without rereading merely to confirm it, under
the write-receipt rules below.

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
[references/completion.md](references/completion.md)'s sweep immediately,
before review, handoff or other work, subject only to the completion unit's
confirmed-package presentation order. Reviewable is a handoff signal, not proof
the job is final or its remaining deployment/other-environment verification
ran. Loading an already Reviewable job or an update while it stays there does
not retrigger it. A failed sweep remains incomplete work: retry it without new
package permission before switching lanes.

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

Apply the common progress and turn-ending rules below. A progress checkpoint or
ordinary turn is not a lane handoff. Retain assignment through required input,
package waits, incomplete authorized actions and sweeps. Finished-job release
follows [references/review.md](references/review.md); apply assignment-aware
discovery only when the assignment actually ends.

A fully complete job follows the common notification and context-boundary rules
and the review unit's commit identities. Individual task completion, requesting
review without a stage transition, Resolve, signoff, shipped confirmation or a
completed code in a commit never independently rerun its completion sweep.
Leaving and later returning to Reviewable creates a new transition and sweep.

## Job questions and suggestions

Apply the common durable-write rules to the corresponding write.

### Ask and resolve questions

Except for the routed completion package, call
`ask_question` for ambiguity and judgment calls. Give options only for a real
discrete choice. When facts, reproduction steps, observed behavior, or meaning
are unknown, ask an open-ended question with no options. Apply the observed-behavior rule above.

File every currently known distinct question in the same turn, each with its
options and your vote, so the job enters Requires Input once and the human
answers the whole set in one sitting. Questions, suggestions, and votes are
work output rather than a delay, so never withhold one to keep moving.

Filing them is not itself a reason to stop. A question blocks only the work
that depends on its answer. Requires Input bars implementation edits to the
job, and bars nothing else: keep investigating, reproducing, measuring, reading
source, and gathering the evidence the answers will need, and carry on with any
other lane the human has authorised. Ask newly discovered questions as they
arise. Filing a question never ends a turn; apply the turn-ending rules below.
Standalone bugs and view-level questions keep their own tool and answer rules.

Every option-bearing `ask_question` and every `add_options` call must include
one `initial_vote` with certainty 1–5 and a nonblank reason. With
`add_options`, make clear whether the added alternatives change your
preference. Supply exactly one selector.

`update_option` names what it updated. Do not repeat the initial vote in a
separate `approve_job_or_option` call; use that tool for later preference changes.
Hold your position through mere restatement or pressure; change it only for new
evidence or a changed requirement, and name what changed.

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

### Visual options

Visuals only depict canonical Uclusion options. Create every choice with
`ask_question` or `add_options`, and label each panel with its stable Uclusion
option code/name—never a parallel A/B/C scheme. Keep the artifact and options
in sync in the same turn. Never silently reuse an existing label for a changed
meaning; create a new option or question. An accepted, durably recorded human
suggestion explicitly authorizes `update_option` on that canonical option.

## Standalone view-level questions

Use only `get_job`, `add_info` and `approve_job_or_option` for its options. A
clear non-AI reply or Approvable For vote answers a standalone AI-authored
view-level question; AI votes do not. Standalone questions have no advisory
gate. If all answering votes are 50/100 certainty or lower, add a better option
when one exists, otherwise add information that can raise certainty; with
neither, proceed with the recorded answer.

## Standing notes and isolated history searches

### Standing instructions by view

Before work in a view, read the exact R-code thread of every listed standing
note whose complete current body is missing or changed and apply all listed
notes. Track their R-codes and versions in your context; reuse complete
matching bodies across items that list them and use any newer version returned
by a read. Stop applying notes no longer listed.

After compaction or context restoration, reload the relevant view's notes once
before continuing; summaries and read markers do not replace full bodies.

Compile applicable requirements and permission limits into implementation
briefs. Retain full note bodies and source/version traceability yourself.
Refresh changed prerequisites and update affected briefs before further
implementation-helper work.

### Workspace export and decision search

When workspace data can answer a request and is not already loaded, judge
whether an available successful export is current, complete and sufficient for
the search, including completion scans. Reuse it when sufficient; run the
environment-correct `uclusion export` when it is stale, insufficient or
uncertain. Use the configured destination, overriding it only for an explicit
human request. Retain the successful command's exact reported path and use the
export's UTC update dates as recency evidence. Poke silence does not establish
freshness.

Delegate every export search to a fresh read-only isolated export-search helper
without inherited coordinator history (`fork_turns: "none"` in Codex). Keep
export content and research with that helper. If a suitable export or isolated
helper is unavailable, report that the search could not run.

Give the export-search helper the exact successful export path, search
question, applicable requirements or current outcome evidence, and matching,
status and authority rules. Assign only that bounded read-only search.

Require the export-search helper to return every qualifying finding concisely,
with exact Uclusion codes and names, supporting evidence or source locations,
and proposed actions required by the calling workflow. Require an explicit
no-match result only after a completed search, distinguishing incomplete
searches or unsettled evidence. Retain ownership, required full context and
current-contract reads, human decisions, permission checks and durable writes
yourself.

Search history before relying on a design you did not write, delegating a
design, or answering something that may already be decided; cite the findings.
Use the current intent/design capsule or, if absent, the agreed design in the
item's thread.

Reuse a completed check for the same question, including reliance on and
delegation of the same design, while its export path and findings remain
current and sufficient. A fully read fresh authoritative update can settle
changed governing context without another history search.

Refresh when a change in scope, relevant history or evidence, or governing
context makes the findings insufficient or stale, or when freshness or
completeness is uncertain.

Explain each cited finding's relevance inline with its short code, and offer
more detail without requiring the human to open Uclusion.

## Durable writes and their outcomes

Apply the action's writing, authorship and permission limits and current
required set.

### Authorship and permitted records

Record every question, suggestion, approval, vote, resolution and review
through its Uclusion tool. Record designs, questions and new findings in the
artifact that owns the lane; chat may mirror a durable record but never replace
it. Ask each unsettled decision through the lane's permitted tool.
AI-originated questions, suggestions and reviews need no permission and are
never offered or deferred. The completion package is the one compound
permission ordinary chat may answer. Standalone bug and view-level question
tool limits still apply.

For records the human tells you to create in their name, set `for_human` only
for their words and reasoning, with required boolean
`is_my_lane` true for
assigned work to avoid an echo Poke, and false otherwise so agents receive it
and can potentially take up the work.
Ask for their vote's certainty and reason before recording it; never invent
them. Choose independently for nested `initial_vote` values.
Use the exact short code returned by Uclusion in tools, chat, commit messages
and durable notes.

### Durable threading and commit identities

Record substantive information once with the tool and artifact that own it. Use
`add_info` only for findings, decisions, blockers or next steps missing from
the durable thread. Do not add notes that merely recap a question and answer,
capsule, state transition or completed instruction reload. A decision belongs
in the current design when its workflow permits that write; avoiding a
duplicate note does not authorize rewriting a sent contract. Required reviews
and completion-package records remain mandatory without an extra recap note.
Reply on the exact comment being answered, not its thread root; flat root
replies separate answers from their questions and cannot be re-threaded.

To correct an existing ordinary note, reply or option Info, use `add_info`'s
update form with the complete replacement body, omitting the creation target.
Supply the version returned with the body you actually read. Keep
`parent_question_short_code_id` for a record inside a question. On conflict,
reload and reconcile the current body; never retry with an unseen version.
Replacement preserves identity and threading without adding a history note.
Omitted attachment metadata keeps existing files.
Human-authored records, capsules, reviews, standing view notes and machine
audit records cannot use this form; retain their dedicated tools and
protections. `for_human` applies only to creation.

Use canonical short codes verbatim. A source-code comment that cites a question
uses the question's full returned link when available. A proposed bug commit
message begins with the completed comment code. Job commit identities are
defined in [references/review.md](references/review.md).

### Write receipts and reconciliation

A write's result is the reload for what it produced. Inspect each outcome
separately: a later failure does not erase an earlier successful write.
Reconcile unconfirmed writes with scoped reads and retry only unfinished steps.
Do not call `get_job` to see a write you made and still have in context; call
it to see a write you did not make or no longer hold. `resolve` reports only
what it resolved. Others' changes arrive as Pokes, so handle those instead of
rereading the item. For a job, when you need the stage after `resolve`, call
`get_job` with `stage_only: true`.

### Reopening resolved work

On your own, reopen only a bug or task whose fix is shown to still fail, by a
human's report or a failed verification, and say why in a reply on it. Reopen a
question, suggestion or blocker only on a human's instruction, and never a
question they resolved to delegate; ask a new question instead.

A human's report that a fix still fails is their request to reopen it, so pass
`for_human: true` with `is_my_lane` as the authorship rule above describes.
A failure your own verification finds is yours, so omit `for_human`. Reopening a task follows the job-stage outcomes above.

A reopened item is open work again. A reopened standalone bug's next resolution
is a new open-to-resolved transition, so its completion sweep runs again and,
for a fix you completed, a new completion package opens. What an earlier
package did stands; nothing is rolled back.

### Creating jobs and human-authored artifacts

For a requested new job, use the duplicate search and creation outcomes below
before creating it.

Use `add_job`, `add_task`, `add_bug`, and `add_blocker` only for the human's
explicit request. AI-originated ideas use `make_suggestion`. The one exception
is decomposing a newly requested job into its initial task list.

For `add_bug`, use the human-indicated severity. For a dependency the AI
discovers, suggest it; create a blocker only when the human explicitly says the
job is blocked. View-level creation should target the implied existing job/bug
view when one is named.

### Saving general lessons as view notes

Machine-, environment-, or user-specific facts may stay private. General
guidance belongs in an AI-authored view note through `add_view_note`.

Fold in the lesson, prune superseded material, and keep a tight topical digest.
Create a second note only for a genuinely separate topic. Never edit a
human-authored note; reply or suggest a revision.

Save qualifying lessons autonomously. The first time this rule applies, sweep
existing private memory: migrate general lessons to view notes and delete those
private copies. Treat later human edits to the note as authoritative.

### Requested job creation

Before `add_job`, assign an export-search helper the duplicate/related-work
search under the isolated-search rules above. Surface an existing match instead
of duplicating it. Cite related-but-distinct short codes in the new
description. Pass initial `tasks` when parts could be reviewed, committed, or
documented separately.

When the human requests a new job containing existing bugs, pass their short
codes in `bug_short_code_ids` alongside any new `tasks`. Each distinct bug has a
`moved`, `failed`, or `unconfirmed` outcome. Report those outcomes with the returned
new job identity. Preserve that identity when checking an unconfirmed result with `get_job`: each `add_job`
call creates another job, so repeating the call is not a retry of that job.

## Coordinator capsule design and publication

Before publication or review cleanup, apply the durable-write rules and satisfy
the target/current-body prerequisite above, using a sent-body receipt when
available.

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
Copy the common complete-read and instruction-reuse/reload rules into the
dispatch, adapted to the selected design package and its required files, even
without a resident bootstrap; do not send core or coordinator reference bodies.

Request the shortest complete contract, directing the design helper to delete
sentences whose removal loses no necessary behavior, constraint, navigation,
evidence or permission limit; impose no numeric cap. Require full reads of its
selected skill and references and keep research, alternatives, planning
rationale and transcripts with that helper. Do not read those helper-only
instructions or examples before delegation.

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

Use the current-contract receipt confirmation and generic write reconciliation
above.

When `set_design_capsule` also resolves selected questions, inspect the capsule
receipt and each resolution outcome. A failed or uncertain publication resolves
no questions; a later resolution failure leaves the published capsule in place
and stops the remaining resolutions. Resume resolutions only after confirming
the intended capsule was published; otherwise reconcile and publish that
contract first. Once publication is confirmed, resolve only unfinished
questions rather than replaying a stale capsule write. If the review-inventory
lookup failed, load Reports for the existing obsolete-review cleanup. After the
last operation, use `stage_only` before acting on the stage.

## Notifications

`ask_for_review` does not read or return notifications. Call `get_notifications`
when the human asks for their inbox or a decision requires inbox contents.
Do not fetch them merely to resolve a bug or job, open a review, present its
completion package, receive sign-off, commit, or preview a fixed exact clear
scope.

The package is its item's only clear offer. Outside a package, ask before
clearing the exact scope of the item just worked. Read and list matches only
when that decision needs inbox contents, making no clear call when that read
finds nothing. Once that scope is fixed and its clear authorized, clear
directly and report the tool's actual outcome.

## Context-clear boundary

Offer a context clear only:

- after resolving a view-level bug/question when the next work is unrelated or
  unknown; or
- after a job is fully signed off and any applicable commit is made, with
  nothing queued.

Use the client's normal wording for starting a fresh conversation (for example,
Claude Code can say `/clear`). Never offer mid-job, between related items,
during review, or while waiting for a response. Do not repeat the offer for the
same boundary.

## Coordinator progress, handoffs and turn ending

Use the routed completion unit for a current package's presentation and
waiting.

### Durable progress and handoffs

Before ending an auto-taken turn, ensure new results, decisions, blockers and
next steps are durable. An existing substantive artifact is the checkpoint; use
`add_info` only for information still missing, under the durable-write rules
above. Do not add a record for unchanged state, an instruction reload or a turn
boundary alone.

A progress checkpoint and an ordinary model/chat turn are not lane handoffs. At
a genuine handoff for blocking human input, review, completion, pause or
interruption:

- Apply assignment-aware discovery, respecting the completion-package boundary.
- Apply the claim and audit rows to affected handoff actions.
- Leave an exact blocking dependency in Uclusion.
- For a resolved standalone bug, finish the completion unit's sweep and package before work discovery.
  A job follows its retained-work gates and the routed review-release procedure.
- Apply the notification and context-boundary rules and applicable commit gates.

### Ending a turn

Do not end while authorized work remains. After writing an artifact or showing
its link, continue every authorized investigation, planning and execution step,
and surface or create the actual next actionable item. A question blocks only
what depends on its answer; keep going on everything else.

End when nothing can proceed without the human. State what you need and why
this lane is blocked. Apply the completion unit's later-turn and reply rules
for an open package, whatever ended the turn, including a Poke or listener
rearm; its publication route owns package presentation. Never omit that
required presentation to save context. Otherwise state the pending decision or
completed task, applying the one-time hint and discovery triggers. A turn
ending alone never calls `find_work` or repeats its list. When the next item is
unrelated or unknown, apply the context-clear rule.

<!-- /uclusion-skill:v1 -->
