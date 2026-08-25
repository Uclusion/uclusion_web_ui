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
- For notifications, exports, creating artifacts, uploads, dependencies,
  view notes, commits, or context-clear boundaries, read
  [references/operations.md](references/operations.md).
- Before every lane handoff, read `pokes.md` and perform its immediate work
  discovery rules. Also read `operations.md` when resolving a bug/job, opening
  review, or receiving sign-off and committing. On full completion, apply its
  dependency and context-boundary rules too.

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
- Put every question, suggestion, approval, vote, progress note, resolution,
  and review request in Uclusion through its MCP tools. Chat may mirror the
  artifact but never replace it. Questions about the job—including redo
  direction—use `ask_question`, not a local question tool.
- Run the ordered workflow: read, ask questions, address suggestions, approve
  when applicable, execute only in an executable stage, then request review.
- The job stage controls permission, not workflow position. Doable and
  Reviewable permit execution, but neither proves questions or suggestions
  were handled. Requires Input locks execution until qualifying assistance is
  resolved and the job returns to Doable or Reviewable. That lock covers
  implementation edits to this job and nothing more, so investigation,
  reproduction, and measurement continue while it holds.
- Recheck assistance and stage immediately before editing. New assistance can
  arrive at any time.
- Never silently make a judgment call a reasonable reviewer could choose
  differently. Ask one Uclusion question per decision.
- An executable stage alone never authorizes edits. Before the first affected
  source or test edit, load the selected executable target's current
  intent/design capsule. Create it with `set_design_capsule` when absent, and
  full-replace it before further affected edits whenever a known material
  intent or design change occurs. The capsule must stand alone and preserve the
  actor-visible outcome, not merely list decisions or components.
- A capsule is a contract, not permission. Stage, testing and build, security,
  deployment, commit, and push gates remain independent.
- Use the exact short code returned by Uclusion in tool calls, chat, commit
  messages, and durable notes.

## Token usage audit when available

If `start_job_audit`, `set_job_audit_phase`, and `end_job_audit` are exposed:

1. A lookup used only to classify a Poke starts no audit. Audits attach only
   to jobs: a standalone view-level comment lane (a single-comment result with
   no Job header) has no J- job, so never call `start_job_audit` for it — the
   call fails. If that comment later converts into a Bugs job, audit the
   returned job. Once a lookup makes a job the active lane, call
   `start_job_audit` before substantive planning or execution and retain the
   run identifier. The initial bucket is `planning`.
2. Before the kind of work changes, call `set_job_audit_phase`. Include the
   active job, run identifier, a `marker_sequence` starting at 1 and increasing
   strictly, and a concise bucket label. A replay reuses its original sequence.
   Ordinary labels are `planning`, `implementation`,
   `testing`, and `other`; use a custom label only when it is materially more
   informative. Switch to `testing` before tests or builds. A marker applies to
   the next model request and cannot relabel earlier tokens.
3. Call `end_job_audit` when the lane hands off for human input, review, or
   completion. Collection finishes asynchronously; do not poll for it.

Keep at most 32 labels, each 1–80 safe characters. Re-entering a bucket adds to
its total; do not create separate standard/custom dimensions or a new run when
the task or turn changes. Every request belongs to one bucket. Audit errors or
partial telemetry never block the work.

## Plan mode

Plan-mode restrictions govern machine and repository changes, not Uclusion
artifacts. File job questions and suggestions immediately. Before leaving plan
mode, persist the plan with `add_info` and show its returned link; a plan that
exists only in chat or a local file is unfinished.

## 1. Read

Call `get_job` with the named short code. It loads the enclosing job and its
tasks, grouped tasks, assistance, blockers, and reports. Use
`include_all_resolved` when full resolved content and notes are needed. Treat
rendered View Notes as standing instructions.

On event-driven reloads, use `sections` or `thread_only` when the relevant
scope is already known. Scoping prevents duplicate loading: the first read of
a job this session takes the whole job, while a later event for an item
inside it reloads just that item instead of the full job again. If the result
has no Job header and contains one top-level comment, use the single-comment
workflow below.

## 2. Ask and resolve questions

Call `ask_question` for ambiguity and judgment calls. Give options only for a
real discrete choice. When facts, reproduction steps, observed behavior, or
meaning are unknown, ask an open-ended question with no options. Never infer
runtime behavior from code when the observed path is missing; ask the person
who saw it. Use one `ask_question` call per distinct question; never bundle
separate unknowns.

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
licence to halt each time. End the turn when nothing can proceed without the
human, not because questions were filed. Say plainly what is blocked, what you
are doing meanwhile, and what you need.

For a view-level bug:

- Ask for missing facts with `add_info`, keeping the single-comment workflow.
- For a discrete options question, call `ask_question` with the bug short code
  and a nonempty options list. It creates a human-owned Bugs job in the same
  view, moves the original bug thread into that job as a task, creates the
  question, and returns both links. Complete the conversion as one atomic
  workflow turn: `ask_question` → reload the returned Bugs job → cast exactly
  one explained preferred-option vote with `approve_job_or_option`, all before
  ending the turn. Never convert a bug merely to ask an open-ended question.

When offering options, vote for the preferred option with
`approve_job_or_option` and explain why. Hold that position through mere
restatement or pressure; change it only for new evidence or a changed
requirement, and name what changed.

### What answers an AI-authored question

For a question on a job, an Approvable option's For vote answers only when it is
non-AI and not rendered advisory; a clear reply answers only when its author is
non-AI and the reply is not rendered advisory. Treat the rendered advisory
marker as authoritative; do not infer authority from other metadata. Advisory
input can change the AI's reasoning or vote and sends a Responded Poke, but
cannot make the question answerable or unlock execution.

An open AI-authored question created from Doable or Reviewable moves the job to
Requires Input. A primary, non-advisory reply or vote makes it answerable, but
the job stays locked until the AI calls `resolve`. A human may instead Resolve
the question directly; that delegates the choice to the AI, does not silently
select an option, and restores the prior executable stage. Use the recorded
evidence, document a non-obvious delegated decision with `add_info` on the
enclosing job or task—never inside the resolved question—and do not reopen it.

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

### Visual options

Visuals only depict canonical Uclusion options. Create every choice with
`ask_question` or `add_options`, and label each panel with its stable Uclusion
option code/name—never a parallel A/B/C scheme. Keep the artifact and options
in sync in the same turn. A changed meaning requires a new option or question;
never silently reuse an existing label.

## 3. Address suggestions

Use `make_suggestion` before mentioning any better approach or follow-up in
chat, then include the returned link when mentioning it. Omit `job_id` for a
view-level idea. A human-authored suggestion is addressed to the AI: reply with
a definitive accept or reject and the action you will take. When voting is
enabled, also call `vote_on_suggestion`; never vote on your own suggestion.

An open qualifying human suggestion keeps the job in Requires Input. Record an
accepted plan change, act on it, then resolve the suggestion. A human Resolve
on an AI-authored suggestion without reply or vote declines the mitigation and
accepts the described risk; do not recreate it.

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
assistance is settled. Otherwise ask whether the human wants AI approval.

## 5. Execute and document

Execute only in Doable or Reviewable. On Reviewable, the latest Reports comment
still controls review direction; stage alone is not an instruction to change
or re-review work.

### Current intent/design capsule

Execution also requires the capsule gate from the invariants. Select exactly
one executable target for the implementation pass:

- A job-level pass uses the job capsule.
- An independently executing top-level task uses its task capsule. A grouped
  task normalizes to its top-level parent.
- A task capsule is complete and solely authoritative for that task pass.
  Never merge it with, inherit from, or fall back to the job capsule.

Load the selected target with `get_job` before affected edits. If its capsule
is absent, continue read-only investigation, settle every reviewer-divergent
choice, then call `set_design_capsule` in create mode with `job_or_task_id` and
the complete capsule. Existing work is not backfilled. Historical work that
needs no more implementation may finish its existing review, but the next
resumed or changed implementation pass needs a capsule before affected edits.

Capsule Markdown is freeform and sized to the work. It must be a concise,
stand-alone system story rather than a question or component ledger. Cover the
relevant actor scenarios and terminal outcome, responsibilities and handoffs,
state and lifecycle, formats and interfaces, failure and concurrency behavior,
implementation map, exclusions, and approved testing or security work. State a
genuinely inapplicable subject as such. Every material claim cites the human
job or task text, a qualifying resolved answer, an approved test or security
plan, a prior authoritative artifact, or a hard source constraint. A claim
without such a premise becomes a typed question before the affected edit.

After creating or replacing the capsule, reload the selected target and review
that capsule as a cold handoff with no remembered questions or chat. If an
implementer could still miss an actor's terminal outcome, a responsibility
boundary, state transition, failure case, exclusion, or approved verification
limit, replace the capsule again before editing. A capsule that merely
summarizes the questions fails this gate even when every answer is accurate.

Known material changes belong in the capsule, not the review. Reload the
current R-code and version, then call `set_design_capsule` in update mode with
`update_capsule_short_code_id`, `update_capsule_version`, and the complete
replacement body. Never patch fragments or blindly retry a version conflict.
Replies remain discussion until a settled change is folded into the body. A
real replacement keeps the capsule R-code; its former body appears
asynchronously as an ordinary unpinned note. Do not wait for that archive or
treat it as current implementation context.

Capsule writes are human-facing, not scratch storage. A create or replacement
puts an inbox item in front of the current human assignees without email or
Slack; explicit mentions keep their ordinary delivery behavior.

After an AI replacement, reload Reports and resolve your still-open review
whose body names that capsule R-code before further affected edits. A human
body edit arrives as `Updated <capsule R-code> of <job short code>`. Reload the
exact capsule and Reports, resolve the matching review first, then reconcile
in-progress work with the new authoritative body. Review cleanup is agent
workflow, not backend review parsing or linkage.

If initial work is ready but the job is not executable, offer to move it to
Doable or ask the human to do so. When the human instructs a move to Doable,
change the stage, reload, sweep, and begin work in the same turn unless they
explicitly request a stage-only change.

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
3. Reload assistance/stage if either could have changed.

Implement active tasks and grouped tasks; do not redo resolved work. Resolve
each task when complete. Use `add_info` on the relevant job/task for decisions,
trade-offs, follow-ups, and anything a reviewer cannot reconstruct from the
durable thread.

## 6. Request or perform review

Before review, turn unfinished or deferred actionable work into suggestions and
reference those suggestions in the report. Once output is testable, call
`ask_for_review` with a concise capsule-delta report. Only one AI review may be
open per job, so job and task capsule reviews are sequential.

In Reviewable, inspect the author of the latest Reports comment:

- From AI user: humans are reviewing AI work. Do not review it again; act only
  on explicit feedback or a stage change.
- From a human: review the human's work and reply through Uclusion.

A Poke only triggers reload; it does not change that direction, except that a
current capsule's `Updated` event also requires the obsolete-review cleanup in
the capsule section above.

The report names the exact current capsule R-code. It does not restate
unchanged capsule content. Under `Deltas`, say `No implementation deltas` or
give one concise bullet for each actual omission, changed behavior, addition,
scope expansion, or newly introduced decision. Name its observable effect and
verification or approval status. A known change that can still guide work
belongs in an updated capsule instead. Never hide a remaining choice in review
prose; ask it as a question. End with the AI product, exact model/version, and
effort level.

## Material handoffs

An auto-taken lane always gets a durable handoff before a turn ends, recording
every substantive result, decision, blocker, and next step. Use the specialized
Uclusion tool when one applies, otherwise `add_info` on the active item. This
rule lasts for every turn in that lane, not only the first.

At any lane handoff:

- First read `pokes.md` so the handoff includes current work discovery.
- If `claim_work` is exposed and the lane's short code is claimed, release it
  per the work claim lock rules in `pokes.md`.
- If blocked on a human, leave the exact dependency in Uclusion.
- If testable, read `operations.md`, request review, then check fresh
  notifications.
- If complete, read `operations.md`, perform the dependency sweep, and apply
  any notification, commit, or context-boundary action.

## Single-comment workflow

A single-comment result has no Job header.

- Bug: use only `get_job`, `add_info`, `resolve`, and, for a general lesson,
  `add_view_note` while discussion is open-ended. An options question converts
  it through `ask_question` as described above, after which the job workflow
  applies.
- Question: use only `get_job`, `add_info`, and
  `approve_job_or_option` for its options.

Use `add_info` for questions or progress. After resolving, offer to commit with
the comment short code at the start of the commit message. When the next item
is unrelated or unknown, apply the context-clear rule in operations.md.
<!-- /uclusion-skill:v1 -->
