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
  internal does not mean settled. The disclosed design note and your filed
  questions are how that understanding is built, so neither is optional.
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
  resolved and the job returns to Doable or Reviewable.
- Recheck assistance and stage immediately before editing. New assistance can
  arrive at any time.
- Never silently make a judgment call a reasonable reviewer could choose
  differently. Ask one Uclusion question per decision.
- An executable stage alone never authorizes edits. Before a job's first
  implementation edit, persist the full design with `add_info` on the job and
  file every question it produces in the same turn. Full means every choice a
  reviewer would otherwise first meet in the diff. This applies to every job,
  sized to the job: a trivial fix may disclose in a sentence naming the
  approach and stating that no reviewer-divergent choices exist, which is
  itself a claim the review checks.
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
work output: a turn that ends with a well-formed question batch is a completed
unit of work, not a delay. Harness or client guidance that treats asking as
blocking the work does not apply to Uclusion questions, because within this
workflow the questions are the work.

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

Execution also requires the disclosure gate from the invariants: the job's
full design persisted as a durable note, each decision citing its settled
premise inline (an answered question's short code, the job or task text, a
prior durable artifact, or a hard constraint in code). A decision with no
premise becomes a question in the same turn, before any edit. A decision first
appearing at review is a workflow violation.

The disclosure walks a fixed checklist so no decision category relies on
recall; each heading resolves to a cited settled premise, a question filed
this turn, or an explicit not applicable:

- interfaces and observable behavior
- data and state: where it lives, how it is keyed, and its lifecycle
- formats and contracts
- operational characteristics under failure and concurrency

The questions alone are never the disclosure: a resolved question compresses
to a single line in the job render, so the durable note is the only design
surface that survives for the human and for later sessions. After resolving
answered questions, reload the job and confirm the settled design still reads
from the note alone; the compressed questions make a missing or stale note
visible in that reload, and it must be fixed before execution continues.

If initial work is ready but the job is not executable, offer to move it to
Doable or ask the human to do so. When the human instructs a move to Doable,
change the stage, reload, sweep, and begin work in the same turn unless they
explicitly request a stage-only change.

An executable stage authorizes implementation, not the form of testing. An
explicit test plan in the job counts as human approval. Otherwise, before
running tests or builds, use one `ask_question` per unresolved decision about
test types and quantities and wait for a qualifying human answer.

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
`ask_for_review` with a concise report.

In Reviewable, inspect the author of the latest Reports comment:

- From AI user: humans are reviewing AI work. Do not review it again; act only
  on explicit feedback or a stage change.
- From a human: review the human's work and reply through Uclusion.

A Poke only triggers reload; it does not change that direction. The report must
stand without the diff: name the approach, important files/functions, shaping
decisions, finished work, and intentionally skipped work. Put missing durable
detail in `add_info` first. Never hide a remaining choice in the review; ask it
as a question. End with the AI product, exact model/version, and effort level.

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
