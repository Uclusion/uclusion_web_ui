---
name: uclusion
description: Use for Uclusion jobs, tasks, bugs, questions, suggestions, comments, reviews, inbox notifications, find_work, Poke AI, Start/Added/Updated/Responded events, Uclusion short codes beginning J-, T-, B-, Q-, S-, O-, I-, R-, or C-, or workspace-history requests such as what was decided, what changed, and whether related/backlog work already exists. Also use when creating Uclusion work even if the prompt does not name Uclusion. Do not use for ordinary product or code work merely because a repository contains Uclusion integration code.
---
<!-- uclusion-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion workflow

Use the Uclusion MCP server as the durable collaboration surface for work
referenced by this skill. The resident client stub owns delivery setup; this
skill owns event handling and the job workflow.

## Load the relevant reference

- For Pokes, idle work discovery, auto-take, delivery behavior, lookup routing,
  or update notices, read [references/pokes.md](references/pokes.md).
- For notifications, exports, creating artifacts and visual options,
  recording dependencies, view notes, commits, or context-clear
  boundaries, read [references/operations.md](references/operations.md).
- When a standalone bug is resolved or an assigned job enters Reviewable,
  read [references/completion.md](references/completion.md).
- Read a tool's rules only when the session exposes that tool: `start_job_audit`
  routes to [references/audit.md](references/audit.md) before substantive
  planning, `claim_work` to [references/claims.md](references/claims.md), and
  `get_upload` to [references/uploads.md](references/uploads.md).
- Before every lane handoff, apply `pokes.md`'s assignment-aware discovery
  rules; a retained assignment does not trigger a work list. Read
  `operations.md` when resolving a bug/job, opening review, or receiving sign-off
  and committing. On standalone bug resolution, also read `completion.md` and
  apply its sweep before the remaining completion actions. Job transitions into
  Reviewable are routed by `pokes.md` or handled immediately after a successful
  in-session stage change. Opening an implementation review and waiting on its
  completion menu is expressly not a lane handoff; retain its assignment and
  any work claim through the package attempt. Apply `pokes.md`'s completion
  boundary after success; a terminal failure still retains the assignment.

## Non-negotiable invariants

- You are operating asynchronously collaboratively: not full-on pair
  programming, but less autonomously than a solo coder. Your work is judged
  not solely by completion but also by whether your human partner understands
  and approves of what you do. A choice that feels internal, where state
  lives, data keying, formats, or lifecycles, still needs that understanding;
  internal does not mean settled. The current intent/design capsule and your
  filed questions are how that understanding is built, so neither is optional.
- Keep one active job or bug lane at a time. Incorporate in-lane events and
  defer unrelated ones unless the human explicitly switches work.
- In the default workflow, one agent owns a job or bug assignment at a time.
  Assignment comes from a session-local human selection, a valid live `Start`,
  or a successful auto-take claim. Reading or receiving `Added`, `Updated`, or
  `Responded` never grants ownership; this includes an update that moves a job
  into Doable. Explicit human-configured multi-agent roles are exempt. Apply
  the complete assignment and delivery rules in `references/pokes.md`.
- Record each question, suggestion, approval, vote, resolution and review
  through its Uclusion tool. Record new findings once; the existing artifact
  is sufficient without an added recap note. The narrow completion
  menu defined in `operations.md` is appended to each qualifying AI
  implementation review and mirrored in chat, selected by whether the pass
  finishes the job rather than by stage. Neither copy calls `ask_question` or
  creates assistance. Chat may otherwise mirror an artifact but never replace
  it. Other questions about the job, including redo direction, use
  `ask_question`, not a local question tool.
- Run the ordered workflow: read, ask questions, address suggestions, approve
  when applicable, execute only in an executable stage, then request review.
- The job stage controls permission, not workflow position. Doable and
  Reviewable permit execution, but neither proves questions or suggestions
  were handled. Requires Input locks execution until qualifying assistance is
  resolved and the job returns to Doable or Reviewable. That lock covers
  implementation edits to this job and nothing more, so investigation,
  reproduction, and measurement continue while it holds.
- Treat every `change_job_stage` call as an explicit authorization boundary. A
  non-advisory human authorizes it only by directly instructing a transition
  that names the exact job and destination stage, by answering or delegating a
  question for the exact job and destination transition, or by a valid
  `all` or numbered selection containing action 4 in the code-complete menu
  defined in `operations.md`. That menu may carry this authorization
  alongside its other expressly named permissions only when it names the exact
  job and the Reviewable destination. A `Start` event and general work language
  such as "analyze this," "take this up," "proceed," "go," or "fix it" never
  authorize a stage change. Planning outcomes, replies or resolutions on other
  questions, approvals or votes unrelated to that exact transition,
  recommendations, and capsule changes do not authorize one. Never infer stage
  authorization from surrounding work language. If a needed transition lacks
  exact authorization, leave the stage unchanged and ask the human about that
  exact job and destination transition. A completed post-review selection that
  omitted action 4 or selected `none` is final, so leave the stage unchanged
  without asking again.
- New assistance can arrive at any time, and arrives as a Poke. Handle every
  delivered Poke before the next edit instead of rereading the job for it. A
  client without Poke delivery, such as Cursor, cannot learn of changes that
  way, so it rereads assistance and stage before editing, before a completion
  menu, after a menu reply, and before and after a stage change.
- Never silently make a judgment call a reasonable reviewer could choose
  differently. Ask one Uclusion question per decision. The standard
  completion package is one deliberately compound operational decision and
  the sole normal-client-chat permission exception; do not split its expressly
  listed permissions into separate prompts.
- Recording an AI-originated idea, question, or review needs no permission and
  is never offered or deferred. `make_suggestion`, `ask_question` and
  `ask_for_review` post as the AI; `add_job`, `add_task`, `add_bug` and
  `add_blocker` post as the human and need their explicit request. Chat never
  replaces the record; an unrecorded finding ends with the session.
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
  is opened before permission is requested. Only a standard completion
  package may request commit, push, exact-item notification-clear, and
  Reviewable as its fourth permission together; it never grants a test, build,
  security, deployment, or omitted action.
- Use the exact short code returned by Uclusion in tool calls, chat, commit
  messages, and durable notes.

## Plan mode

Plan-mode restrictions govern machine and repository changes, not Uclusion
artifacts. File job questions and suggestions immediately. Before leaving plan
mode, ensure the plan is durable in the applicable artifact and show its link;
use `add_info` only for information still missing. A plan that exists only in
chat or a local file is unfinished.

## 1. Read

For a Poke, apply the assignment gate in `references/pokes.md` before this
section. An unassigned or cross-lane `Added`, `Updated`, or `Responded` event
stops there without `get_job`, audit startup, or activation. A job becoming
Doable does not bypass that gate.

For assigned work, read [references/reading.md](references/reading.md) before
`get_job`. It governs scoped reads, explicit capsule bodies, standing-note
versions and refresh after compaction. References alone do not load a contract
or standing instructions. If the result has no Job header and contains one
top-level comment, use the single-comment workflow below.

## 2. Ask and resolve questions

Except for the completion-permission menu defined in `operations.md`, call
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
licence to halt each time. Filing a question never ends a turn; see Ending a
turn below.

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

`add_info`, `approve_job_or_option`, `make_suggestion`, `ask_question` and
`add_options` take `for_human`, as does any `initial_vote` they carry. Set it only
when the person told you to record something of theirs; the record is then theirs
and its vote counts. Never put your own reasoning under their name: a vote is
theirs only if its certainty and reason are theirs too, so ask for both first.

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
the AI calls `resolve`. A human may instead Resolve the question directly; that
delegates the choice to the AI, does not silently select an option, and restores
the prior stage. Record a new non-obvious delegated choice in the applicable
capsule when writing it, or use `add_info` on the job/task only if missing from
the durable thread. Do not reopen or write inside the resolved question.

Standalone AI-authored view-level questions have no advisory gate: any clear
non-AI reply or Approvable For vote answers. AI votes never answer an
AI-authored question. If every answering vote is 50/100 certainty or lower,
add a better option when one exists, otherwise add information that can raise
certainty; with neither, proceed with the recorded answer.

Resolve an answered question immediately when no further operation inside it
is needed. Do not resolve and then reply or vote inside it. Clarify ambiguous
replies. Only Approvable options count or accept votes. If later work would say
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
next?" as section 5 specifies. Do not ask about approval separately.

## 5. Execute and document

Execute only in Doable or Reviewable. On Reviewable, the latest Reports comment
still controls review direction; stage alone is not an instruction to change
or re-review work.

### Current intent/design capsule

Execution also requires the capsule gate from the invariants. Select exactly
one executable target for the implementation pass:

- A job-level pass for one cohesive outcome uses the job capsule.
- Unrelated top-level tasks execute as separate task passes, each with its own
  complete task capsule, even when the human starts them together as one job.
- Work this pass's own verification produced stays in this pass, even once it
  is a task of its own: no capsule, and the review reports it as a
  scope-expansion delta naming that task. A task capsule is for work queued
  independently of the running pass.
- An independently executing top-level task uses its task capsule. A grouped
  task normalizes to its top-level parent.
- A task capsule is complete and solely authoritative for that task pass.
  Never merge it with, inherit from, or fall back to the job capsule.

Load the selected target's reference, then explicitly fetch its current capsule
body as `references/reading.md` requires before affected edits. If absent,
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

Delegate capsule composition, revision, and cold review to the sibling
`$uclusion-design` skill. Before its first use, read
`../uclusion-design/SKILL.md` completely and read every reference it routes for
the current task. If either the sibling or a required reference is absent or
unreadable, report a broken Uclusion install, suggest an environment-correct
`uclusion update`, and require a client restart or MCP reconnect after a
successful update. Do not improvise or fall back to an embedded writing
workflow.

Give `$uclusion-design` the selected target, its current capsule when present,
and all relevant evidence, identifying any new human input since publication.
It returns a complete draft or the unsupported reviewer-divergent choices as
typed questions. This core skill alone files and resolves those questions and
calls `set_design_capsule`. Have `$uclusion-design` cold-review and finish the
draft before publication. After each create or permitted replacement, follow
`references/reading.md` to confirm the selected target's current capsule before edits.
Do not use a later cold review to polish or rewrite a sent capsule.

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
separate gates and hold none of that; extra-environment verification is a new
task. Use `add_info` on the relevant job/task for decisions, trade-offs,
follow-ups, and anything a reviewer cannot reconstruct from the durable thread.

## 6. Request or perform review

Before review, turn unfinished or deferred actionable work into suggestions and
reference those suggestions in the report. While any suggestion in the job is
open, its review carries no menu; `operations.md` says how the human converts
or resolves each first. A job gets one review, once every task you were asked
to do in that assigned job, in an executable stage, is written and tested, not
after each pass. A finished task not related enough to the rest of its job
first moves into a job of its own for its own review, as `operations.md` says.
Read `operations.md`, call `ask_for_review` with the completion menu appended
to its concise capsule-delta report, then mirror the menu in normal client chat
at the end of that turn, as `Ending a turn` says.
The menu is selected by finish-state, not by stage; `operations.md` defines
finished and the menus, and only the
job-finished four-action menu carries Reviewable. The review is required and is
never a selectable package action. This menu wait does not release a work claim
or start lane-handoff discovery. For other testable review work, call
`ask_for_review` with a concise capsule-delta report. Only one AI review may be
open per job.

In Reviewable, inspect the author of the latest Reports comment:

- From AI user: humans are reviewing AI work. Do not review it again; act only
  on explicit feedback or a stage change.
- From a human: review the human's work and reply through Uclusion.

Before interpreting the report for a job that just transitioned into
Reviewable, apply the transition rule in `pokes.md` and finish its completion
sweep. If this session moved the job into Reviewable, run the sweep immediately
instead of waiting for its `Updated` Poke.

Handle a Poke through `pokes.md`, including its stage-bearing update rule; it
does not otherwise change review direction. The exceptions are the resolved-bug
and Reviewable-transition sweeps, and a current capsule's `Updated` event,
which requires the obsolete-review cleanup in the capsule section above.

The report names the exact current capsule R-code. A final job completion
report covering separate task passes names each task and its exact current
capsule R-code, with deltas attributed to that capsule. It keeps those
contracts separate and retains the limit of one open AI review per job.
It does not restate unchanged capsule content. Under `Deltas`, say
`No implementation deltas` or
give one concise bullet for each actual omission, changed behavior, addition,
scope expansion, or newly introduced decision. Name its observable effect and
verification or approval status. Report implementation differences once here;
only new human input establishing a new contract calls for a capsule
replacement. Never hide a remaining choice in review prose; ask it as a
question. End the report narrative with the AI product, exact model/version,
and effort level. For an implementation review, append the completion menu
after that provenance so the menu is the review's final content.

## Durable progress checkpoints and material handoffs

Before ending an auto-taken turn, ensure new results, decisions, blockers and
next steps are durable. An existing substantive artifact is the checkpoint;
use `add_info` only for information still missing. Do not add an extra record
for unchanged state, an instruction reload, or a turn boundary alone.

A progress checkpoint is not a lane handoff, and neither is returning an
ordinary model/chat turn; neither ends the active audit.

At a genuine lane handoff for a blocking human dependency, review, completion,
pause, or interruption, apply the rules below. An implementation review and its
menu wait becomes a review handoff only after its valid selection's current
execution attempt reaches a terminal outcome and its post-attempt record is
confirmed; before then, do not apply this handoff checklist:

- Ending an audit alone does not clear a human-guided assignment. A completed
  Reviewable handoff releases it under `pokes.md`; pending work or package
  actions retain it for matching continuation events.
- First read `pokes.md` so the handoff includes assignment-aware work discovery.
- If `claim_work` is exposed and the lane's short code is claimed, release it
  per `claims.md`.
- If blocked on a human, leave the exact dependency in Uclusion.
- If testable, read `operations.md` and follow the review routing above. Once
  the tasks you were asked to do are finished, open the review and mirror the
  menu its completeness selects before handing off. Retain its lane while waiting, then finish every
  selected package action after a valid reply before work discovery.
- If a standalone bug was resolved, read `operations.md` and `completion.md`,
  ensure the completion sweep for that resolution transition has run once, then
  end that sweep record with the bug completion menu and mirror the menu in
  chat. Finish every selected package action after a valid reply, then apply
  the context-boundary rule.
- If a job is fully complete, read `operations.md` and apply its notification,
  commit, and context-boundary rules. Do not rerun the completion sweep for a
  later job Resolve, signoff, shipped confirmation, or commit.

## Ending a turn

Do not end a turn while authorized work remains. After writing or updating an
artifact or showing its link, continue every authorized investigation,
planning, and execution step, and surface or create the actual next actionable
item before final output. A question blocks only the work depending on its
answer, so keep going on everything else.

End when nothing can proceed without the human. Then say what you need from
them, and why the current lane is blocked if it is.

Present the completion package when work reaches it, as the last thing the
turn's final message says; a menu printed earlier in the turn is lost in the
chat that follows it. Until a valid selection arrives, end every later turn,
whatever ended it, including a Poke or a listener rearm, with one line naming
the review or bug that holds the waiting menu, not the whole menu again. Never
drop either to save context. Otherwise state the pending decision or completed
task, applying `pokes.md`'s one-time hint and discovery triggers. A turn ending
alone never calls `find_work` or repeats its list.

## Single-comment workflow

A single-comment result has no Job header.

- Bug: use only `get_job`, `add_info`, `resolve`, and, for a general lesson,
  `add_view_note` while discussion is open-ended. An options question converts
  it through `ask_question` as described above, after which the job workflow
  applies.
- Question: use only `get_job`, `add_info`, and
  `approve_job_or_option` for its options.

Use `add_info` for questions or progress. Resolving a bug triggers both its
completion sweep and its completion package: read `operations.md`, end the
sweep record with the bug completion menu, and mirror that menu in normal
client chat. A proposed commit message begins with the comment short code.
When the next item is unrelated or unknown, apply the context-clear rule in
operations.md.
<!-- /uclusion-skill:v1 -->
