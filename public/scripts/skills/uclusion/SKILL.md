---
name: uclusion
description: Use as coordinator for Uclusion jobs, tasks, bugs, questions, suggestions, comments, reviews, inbox notifications, find_work, Poke AI, Start/Added/Updated/Responded events, Uclusion short codes beginning J-, T-, B-, Q-, S-, O-, I-, R-, or C-, or workspace-history requests such as what was decided, what changed, and whether related/backlog work already exists. Also use when creating Uclusion work even if the prompt does not name Uclusion. Do not use for delegated export-search or design helpers, or bounded implementation helpers, including assignments to edit Uclusion instruction source, or ordinary product or code work merely because a repository contains Uclusion integration code.
---
<!-- uclusion-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion workflow

Retain assignment, delivery, Pokes, human questions, stage and permission checks,
capsule publication, final review and the completion package as coordinator.
Give design helpers their selected design package and bounded evidence,
implementation helpers their complete bounded briefs, and export-search helpers
their read-only search briefs under [references/reading.md](references/reading.md).

Use the Uclusion MCP server as the durable collaboration surface. Work
asynchronously with your human partner. Obtain their informed approval for
reviewer-divergent choices, including internal state, formats and lifecycles.
Never silently settle a choice a reasonable
reviewer could decide differently. Never infer observed runtime behavior from
code when the observed path is missing; ask the person who saw it.

## Complete reads and action loading

Select subsequent units from precise routes in files already loaded, never by
opening a target file to learn whether it applies. Load newly applicable units
before acting when the stage or next action changes; do not preload future-stage
procedures.

Read every applicable instruction file in full through its closing marker when
first needed. Reuse complete instruction bodies while they remain in context.
Reread affected files after a known workflow update, and reread required bodies
lost through compaction, context restoration or other body loss before continuing.
Summaries and saved identifiers do not replace instruction or contract bodies.

## Select the resident delivery reference

Use only the authoritative resident stub's client mode and environment, with
the closest project-scoped bootstrap and its adjacent package taking precedence
over the user or personal package. Never guess the client from available tools
or combine delivery modes. At the resident's startup or typed-turn triggers and
at each Uclusion activation, load only its selected complete delivery unit
before the action covered by that trigger, including setup, discovery or job
work:

| Resident client mode | Selected delivery unit |
| --- | --- |
| Codex native MCP | [references/codex-delivery.md](references/codex-delivery.md). |
| Claude Code session-owned delivery | [references/claude-delivery.md](references/claude-delivery.md). |
| Cursor chat-owned delivery | [references/cursor-delivery.md](references/cursor-delivery.md). |

Apply the complete-read/reload rules to the selected unit. With no resident stub,
continue human-started discovery and job work without loading a delivery
reference, setting up or arming delivery, or inventing a wait strategy.

## Common authorization

In every lane, implementation alone grants no authority to run tests or builds,
introduce or expand security behavior, deploy, commit or push. Preserve each
independent human permission and its limits. An unsettled permission blocks the
affected action; raise it through that lane's permitted tool. Job-specific
testing and security qualifications are in
[references/coordinator-execution.md](references/coordinator-execution.md), loaded only for that job
action. Standalone lanes keep [references/single-comment.md](references/single-comment.md)'s tool limits.

## Finding work and auto-take

For `auto_take_directions`, exposed `claim_work` (including deferred), or a held
claim, load [references/claims.md](references/claims.md) in full before affected discovery, activation
or ownership actions.

Call `find_work` at an unassigned session start, when an assignment ends, or
when the human explicitly requests other work. A Poke, delivery rearm, or
ordinary turn ending never triggers a call or another work list by itself.

While a human-guided assignment waits for input or a completion package,
retain it and report the pending decision or completed task. At the first such
wait or completed package in the session,
say once: "You can ask me to find other work at any time." Keep this hint
informational, without a question or `find_work` call. Carry whether it has
been shown into the session summary so compaction does not repeat it. Further
handoffs within that assignment do not repeat the hint or fetch work unless
the human asks. Completion-package waiting follows [references/operations.md](references/operations.md).

Whenever presenting `find_work` results or any equivalent current-work list,
render the complete result as a numbered list. Every numbered entry must include
both its exact `short_code_id` and returned `name` (its short description); never
present an entry as only a bug, job, suggestion, or other short code. For each
bug, also display its returned `severity_label` alongside the code and name;
use `unknown` when the label is missing. Priority comes from the bug's stored
severity, never notification urgency or list position. A list requested while
a human-guided assignment remains retained is informational until the human
explicitly switches that session.

If the response has `auto_take_directions`, present the list and use
[references/claims.md](references/claims.md) for selection and activation before loading a marked item.

When an empty response's directions explicitly say this is the "first AI
session" and the guidance is "served only once", follow those directions
immediately in the same turn before yielding. This one-time onboarding takes
precedence over every empty-list path below.

Otherwise, an empty auto-take view follows [references/claims.md](references/claims.md)'s dry-view
path instead of the human opt-in below.

For any other empty list while a human is active, ask exactly: "Your find work
list is empty. Would you like instructions for adding and working on a job?" If
yes, use the returned directions to explain job creation, find_work, selection,
stage gating, Debatable assistance, and Poke AI. In an autonomous session,
call `request_work` once per dry spell instead.

## Delivery contract

Use the selected resident's exact command and environment. Establish its mode
before find_work or job work, without substituting another strategy. Handle
every delivered line in arrival order. Never set `UCLUSION_CONSUMER` yourself;
it is a human-controlled knob for explicitly separated consumers.

Handle every delivered Poke before the next edit. When no delivery is armed,
reload the assigned lane's current state before editing, before a completion
package and after a package reply. For a job, [references/job.md](references/job.md) routes its stage
and action checks; a standalone comment uses [references/single-comment.md](references/single-comment.md).

## Backlog and session lifecycle

The selected delivery reference owns client startup, cursor and rearm mechanics.
Older output marked `(replayed)`
is history: drop it without reload, action, or user-facing narration. Never add
`--ignore-existing-pokes` or `--deliver-existing-pokes` unless the human
explicitly asks. Ignoring advances only that cursor past retained rows.
Delivering existing Pokes emits retained history as an unmarked private copy,
without changing other consumers; handle that copy exactly as the human's ask
directs, never as an automatic live Start. Neither flag deletes inbox rows.

Delivery to armed listeners is broadcast; every armed listener may receive
the same line. Broadcast is transport, not assignment. Delivery does not
transfer an assignment. Incorporate state only under the
assignment rules below and never race or coordinate through the inbox. Never
read, edit, or delete the inbox database.

Keep delivery in its client-owned harness under the selected reference's exit
and rearm rules; delivery outside that harness could claim work no agent sees.

## Assignment ownership

A default session has at most one assigned job or bug, except for the
related-task split defined in [references/review.md](references/review.md). Reading, classifying, or
reloading an object does not assign it. A human-guided assignment begins only
when the human selects work in that session, including a numbered find-work
selection, or when a live `Start` arrives. Optional auto-take activation follows
[references/claims.md](references/claims.md) under the conditions above.

A human-guided assignment remains with that session while work or required
human input is pending, including an unfinished completion package. It ends on
completion as defined below or when the human explicitly switches the session
to another assignment. Explicit human-configured roles may deliberately assign
multiple agents to the same work; that is outside the
default one-agent rule.

Job completion release is defined in [references/review.md](references/review.md); retained-work
gates are in [references/job.md](references/job.md). Merely ending a turn never releases an assignment.

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
An execution interval can hand off while its human-guided assignment
remains available for a matching continuation event.

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
explicit switch. Only unambiguous non-event human instruction language, such
as `switch from <current> to <target>`, may replace an active lane.

The first word is contractual:

- `Start <target>` comes only from an explicit human Poke AI click. While idle,
  start/resume it, including after a completed assignment.
  Mid-lane, defer an outside target. Replayed Start is history.
- `Added <target>` reports a created task, grouped task, question, suggestion,
  blocker, or other item.
- `Updated <target>` reports an edit, move, deletion, assignment/description
  change, or explicit stage change. When the target is the current
  intent/design capsule, follow the assigned-job update rules in
  [references/job.md](references/job.md). This never bypasses the assignment gate.
- `Responded <target>` hands an AI-authored assistance turn back after any
  semantic human reply, vote, or Resolve. Reload and inspect what it answers;
  perform every action actually unblocked and keep waiting when another
  dependency remains. For a job,
  [references/assistance.md](references/assistance.md) governs qualifying
  answers. A
  response on the assigned item's waiting completion package (the job's
  current AI review, or the resolved bug's sweep record) is that package's
  reply: load [references/operations.md](references/operations.md) and handle its
  completion package.
  It creates no assistance and does not itself change stage or resolution.

Job description, stage and capsule updates follow [references/job.md](references/job.md), after
the assignment gate. A job becoming executable never activates idle or
unrelated sessions.

Resolving a standalone bug is also an `Updated` state transition. For an
assigned bug, compare its reloaded resolution state with the state this session
last observed. When it changes from open to resolved, load
[references/completion.md](references/completion.md) and run both scans once. A
successful in-session Resolve follows the
same rule immediately. When this session completed that fix, the resolution
also opens the bug's completion package in
[references/operations.md](references/operations.md). Merely loading a bug
already resolved, or receiving another update while
it remains resolved, does not retrigger the sweep or reopen its package.
After a `reopen`, the bug is open again, so its next resolution is a new
transition that runs the sweep and, for a fix this session completed, opens a
new package.

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
apply `job.md`'s update rules before continuing. Soft-deleted direct items
reload as the enclosing job with the item absent.

Keep the initial lookup result. A result with a Job header enters
[references/job.md](references/job.md), whose entry procedure obtains only missing context and selects
the next action. A selected single top-level comment without a Job header enters
[references/single-comment.md](references/single-comment.md), without job-only instructions. A bug
converted into a Bugs job reloads the returned job and enters job.md. Standing
note bodies and history searches use [references/reading.md](references/reading.md). Direct lookup
handles its own retries. If a newly Added direct code still returns 404,
retry later rather than discarding it.

## Connection updates

Wait/listen and tool output may contain a `[Uclusion update notice ...]`. Tell
the human the local CLI, proxy, and workflow are stale and ask permission to run
the environment-correct `uclusion update`. If granted, run it from the session
directory and request a client restart or MCP reconnect. If declined, continue
without asking again that session. `uclusion update --check` is read-only.

## Independent action routes

Job stage and action routes live only in [references/job.md](references/job.md).
The following boundaries also apply without job work:

| Trigger | Applicable complete unit |
| --- | --- |
| Standing-note context, ordinary note reads or workspace-history/export search, including a request without a selected job | [references/reading.md](references/reading.md). |
| Ordinary durable writes, creation, reopening, dependencies, view notes or uncertain write receipts | [references/writes.md](references/writes.md), plus only the action's governing unit; ordinary note writes require no job assistance or capsule procedure. |
| Completion package, notification/inbox action or context-clear boundary | [references/operations.md](references/operations.md); its package section is the sole procedure, including its wait. Inbox work does not require review instructions. |
| Progress checkpoint while work continues | [references/handoffs.md](references/handoffs.md); operations loads only for an actual handoff, turn ending or its own action. |
| Actual lane handoff or turn ending | [references/handoffs.md](references/handoffs.md), with its operations route. |
| Auto-take directions, exposed claim_work (including deferred), or a held claim | [references/claims.md](references/claims.md) before affected discovery, activation or ownership actions. |
| Optional get_upload action when exposed | [references/uploads.md](references/uploads.md). |

<!-- /uclusion-skill:v1 -->
