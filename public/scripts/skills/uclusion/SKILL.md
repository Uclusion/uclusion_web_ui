---
name: uclusion
description: Use for Uclusion jobs, tasks, bugs, questions, suggestions, comments, reviews, inbox notifications, find_work, Poke AI, Start/Added/Updated/Responded events, Uclusion short codes beginning J-, T-, B-, Q-, S-, O-, I-, R-, or C-, or workspace-history requests such as what was decided, what changed, and whether related/backlog work already exists. Also use when creating Uclusion work even if the prompt does not name Uclusion. Do not use for ordinary product or code work merely because a repository contains Uclusion integration code.
---
<!-- uclusion-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion workflow

Use the Uclusion MCP server as the durable collaboration surface. The resident
client stub owns delivery setup; this skill routes event handling and the
selected lane's workflow.

## Select the lane and load its rules

1. For Pokes, idle work discovery, auto-take, delivery, lookup routing or update
   notices, read [references/pokes.md](references/pokes.md). Apply its assignment
   gate before lookup: an unassigned or unrelated continuation event stops
   without activation or a job read.
2. For assigned work, read [references/reading.md](references/reading.md), then
   call `get_job` with the selected short code. Load current standing-note
   bodies as that reference requires. References and summaries do not load
   standing instructions.
3. If the result has a Job header, read the complete
   [references/job.md](references/job.md) before job planning or execution.
   It owns every job stage, approval, assistance, capsule, execution and review
   rule. A single top-level comment with no Job header follows the
   single-comment workflow below. A converted bug loads the job reference
   after the returned Bugs job is selected.
4. Read [references/operations.md](references/operations.md) for durable writes,
   notifications, exports, creating artifacts, dependencies, view notes,
   commits, reopening work or context-clear boundaries. Its completion-package
   section is the package's only statement, including its wait.
5. On standalone bug resolution, read
   [references/completion.md](references/completion.md) and run its sweep before
   the completion package in `operations.md`. Job sweep triggers are in `job.md`.
6. Read a tool's rules only when the session exposes it: `claim_work` routes to
   [references/claims.md](references/claims.md), and `get_upload` to
   [references/uploads.md](references/uploads.md). Job-only optional diagnostics
   are routed from `job.md` after job selection.

Before every lane handoff, apply `pokes.md`'s assignment-aware discovery rules;
a retained assignment does not trigger a work list. The resident bootstrap's
reload indicator governs reuse; required files are read in full through their closing markers.

## Shared invariants

- Work asynchronously with your human partner. They must understand and approve
  reviewer-divergent choices, including internal state, formats and lifecycles.
  Record the design and questions in the artifact that owns this lane.
- Keep one active job or bug lane at a time. Assignment comes from a
  session-local human selection, a valid live `Start`, or a successful auto-take
  claim. Reading or receiving `Added`, `Updated` or `Responded` never grants
  ownership. Explicit human-configured multi-agent roles are exempt. Apply the
  complete assignment and delivery rules in `pokes.md`.
- Record every question, suggestion, approval, vote, resolution and review
  through its Uclusion tool. Chat may mirror an artifact but never replace it.
  Record new findings once; an existing substantive artifact is sufficient.
- Never silently settle a choice a reasonable reviewer could decide differently.
  Ask each decision through the lane's permitted tool. The completion package
  in `operations.md` is the one compound permission ordinary chat may answer.
  Never infer observed runtime behavior from code when the observed path is
  missing; ask the person who saw it.
- AI-originated questions, suggestions and reviews need no permission and are
  never offered or deferred. `add_job`, `add_task`, `add_bug` and `add_blocker`
  speak as the human and need their explicit request; `operations.md` governs
  those writes. Single-comment tool limits below still apply.
- Handle every delivered Poke before the next edit. When no delivery is armed,
  reload the assigned lane's current state before editing, before a completion
  package and after a package reply. For a job, `job.md` supplies its additional
  assistance and stage checks.
- Implementation does not itself authorize tests, builds, security changes,
  deployment, commit or push. Preserve every applicable human authorization;
  raise an unsettled decision through the lane's permitted tool before the
  affected action. A completion package authorizes only its listed actions.
- Use the exact short code returned by Uclusion in tools, chat, commit messages
  and durable notes. For records the human tells you to create in their name,
  set `for_human` only for their words and reasoning, with boolean `is_my_lane`
  true for assigned work and false otherwise. Ask for their vote's certainty
  and reason before recording it; never invent them. Choose independently for
  nested `initial_vote` values.

## Single-comment workflow

A single-comment result has no Job header.

- Bug: use only `get_job`, `add_info`, `resolve` and, for a general lesson,
  `add_view_note` while discussion is open-ended. Ask for missing facts or
  decisions with `add_info`. A discrete-options question uses `ask_question`
  with the bug's code, a nonempty options list and one `initial_vote` giving
  the preferred zero-based `new_option_index`, certainty 1–5 and a nonblank
  reason. It creates a human-owned Bugs job in the same view and carries the
  original thread across as a task. Reload the returned job and read `job.md`.
  Never convert a bug merely to ask an open-ended question.
- Question: use only `get_job`, `add_info` and `approve_job_or_option` for its
  options. A clear non-AI reply or Approvable For vote answers a standalone
  AI-authored view-level question; AI votes do not. If all answering votes are
  50/100 certainty or lower, add a better option when one exists, otherwise add
  information that can raise certainty; with neither, proceed with the
  recorded answer.

Use `add_info` for progress or questions while the bug is open. When resolving a
bug, send its progress note as `progress_note` on that same `resolve` call,
with `tz`, instead of a later `add_info`. A successful resolution triggers the
completion sweep immediately, followed by its own completion-package record
in `operations.md`, even if the sweep could not run. A proposed commit message
begins with the comment code. A reopened bug's next resolution is a new sweep
and package trigger for a fix this session completed.

## Durable progress and handoffs

Before ending an auto-taken turn, ensure new results, decisions, blockers and
next steps are durable. An existing substantive artifact is the checkpoint;
use `add_info` only for information still missing. Do not add a record for
unchanged state, an instruction reload or a turn boundary alone.

A progress checkpoint and an ordinary model/chat turn are not lane handoffs.
At a genuine handoff for blocking human input, review, completion, pause or
interruption:

- Read `pokes.md` and apply assignment-aware discovery. A completion-package
  wait retains assignment and claim; its handoff follows the attempt's
  terminal record.
- If `claim_work` is exposed and this lane is claimed, release it under
  `claims.md` when its handoff rule applies.
- Leave an exact blocking dependency in Uclusion.
- For a resolved standalone bug, finish `completion.md`'s sweep and
  `operations.md`'s package before work discovery. A job follows `job.md`.
- Apply `operations.md`'s notification, commit and context-boundary rules.

## Ending a turn

Do not end while authorized work remains. After writing an artifact or showing
its link, continue every authorized investigation, planning and execution step,
and surface or create the actual next actionable item. A question blocks only
what depends on its answer; keep going on everything else.

End when nothing can proceed without the human. State what you need and why
this lane is blocked. Present the completion package, and later the one line
naming it, exactly as `operations.md` says, whatever ended the turn, including a
Poke or listener rearm. Never drop either to save context. Otherwise state the
pending decision or completed task, applying `pokes.md`'s one-time hint and
discovery triggers. A turn ending alone never calls `find_work` or repeats its
list. When the next item is unrelated or unknown, apply `operations.md`'s
context-clear rule.
<!-- /uclusion-skill:v1 -->
