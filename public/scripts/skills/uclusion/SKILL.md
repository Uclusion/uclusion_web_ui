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

Before an accepted `get_job` lookup, hold this complete main body, the
authoritative resident delivery body at its current trigger, and applicable
claims. Keep the lookup result and choose the lane from its actual returned Job
header, never from a `B-` or other code prefix. Select only the current lane
and action's complete units; do not preload future stages.

| Returned lane or current action | Additional complete units |
| --- | --- |
| Result with a Job header | [references/job-coordinator.md](references/job-coordinator.md), then only its current stage/action set. |
| Selected standalone bug without a Job header | [references/single-comment.md](references/single-comment.md). For its resolution, incomplete sweep or package, prepare its lane inputs and use completion.md. |
| Standalone view-level question without a Job header | Use the shared question tools and answer rules below. |
| Standing notes, isolated searches, durable writes/creation/reopening, notifications, progress or handoff | Use the applicable common procedure in this body and the selected lane's current limits. |
| Current completion package or incomplete-sweep retry | [references/completion.md](references/completion.md), with lane-prepared sweep inputs or package thread/scope for the current action. Job review/release requirements come only from the job lane's current route. |
| `auto_take_directions`, exposed `claim_work` (including deferred), or a held claim | [references/claims.md](references/claims.md) before affected discovery, activation, ownership, package or handoff actions. |

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
assigned lane's checks.

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
  intent/design capsule, follow the held job-coordinator update rules. This never bypasses the assignment gate.
- `Responded <target>` hands an AI-authored assistance turn back after any
  semantic human reply, vote, or Resolve. Reload and inspect what it answers;
  perform every action actually unblocked and keep waiting when another
  dependency remains. For a job, the held job-coordinator qualifying-answer rules apply. A
  response on the assigned item's waiting completion package (the job's
  current AI review, or the resolved bug's sweep record) is that package's
  reply: use the routed completion unit's package procedure.
  It creates no assistance and does not itself change stage or resolution.

Job description, stage and capsule updates follow the held job-coordinator
rules after the assignment gate. A job becoming executable never activates idle
or unrelated sessions. An assigned standalone bug's resolution update follows
its held single-comment transition and completion-input rules.

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
apply the held job-coordinator update rules before continuing. Soft-deleted
direct items reload as the enclosing job with the item absent.

Keep the initial lookup result and apply the lane table above. A result with a
Job header requires the complete job-coordinator body and its current units; a
selected standalone bug requires single-comment, while a view-level question
stays common. If a bug converts into a Bugs job, reload that returned job, then
read complete job-coordinator and its current stage/action units before job
work. Use the returned Job header even when its code retains a `B-` prefix.
Standing-note bodies and history searches use the common reading rules below.
Direct lookup handles its own retries. If a newly Added direct code still
returns 404, retry later rather than discarding it.

## Connection updates

Wait/listen and tool output may contain a `[Uclusion update notice ...]`. Tell
the human the local CLI, proxy, and workflow are stale and ask permission to
run the environment-correct `uclusion update`. If granted, run it from the
session directory and request a client restart or MCP reconnect. If declined,
continue without asking again that session. `uclusion update --check` is
read-only.

## Shared question tools

Use the selected lane's permitted tool for each unsettled decision. When
`ask_question` is permitted, give options only for a real discrete choice. When
facts, reproduction steps, observed behavior or meaning are unknown, ask an
open-ended question with no options. Apply the observed-behavior rule above.

Every option-bearing `ask_question` and every `add_options` call must include
one `initial_vote` with certainty 1–5 and a nonblank reason. With
`add_options`, make clear whether the added alternatives change your
preference. Supply exactly one selector.

`update_option` names what it updated. Do not repeat the initial vote in a
separate `approve_job_or_option` call; use that tool for later preference changes.
Hold your position through mere restatement or pressure; change it only for new
evidence or a changed requirement, and name what changed.

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
rereading the item.

### Reopening resolved work

On your own, reopen only a bug or task whose fix is shown to still fail, by a
human's report or a failed verification, and say why in a reply on it. Reopen a
question, suggestion or blocker only on a human's instruction, and never a
question they resolved to delegate; ask a new question instead.

A human's report that a fix still fails is their request to reopen it, so pass
`for_human: true` with `is_my_lane` as the authorship rule above describes.
A failure your own verification finds is yours, so omit `for_human`. A reopened
task follows its held job-coordinator stage rules.

A reopened item is open work again and follows its lane's transition rules.
What an earlier package did stands; nothing is rolled back.

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
- Apply the claim route and any active assigned-job audit route to affected handoff actions.
- Leave an exact blocking dependency in Uclusion.
- For a resolved standalone bug, finish the completion unit's sweep and package before work discovery.
  A job follows its retained-work gates and the routed review-release procedure.
- Apply the notification and context-boundary rules and applicable commit gates.

### Waiting for helpers

While awaiting helpers, continue useful authorized independent work. When none
remains, use the longest interruptible event wait the current client/tool
permits, relying on helper progress and completion messages and waking for
actual updates or human input. A wait expiration is never a helper shutdown
deadline.

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
