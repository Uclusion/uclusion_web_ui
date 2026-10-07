<!-- uclusion-skill-reference:v1 -->
# Poke AI delivery, triage, and work discovery

## Contents

- Finding work and auto-take
- Resident-stub delivery contract
- Backlog and session lifecycle
- Assignment ownership
- Single-lane triage
- Poke grammar and lookup routing
- Connection updates

## Finding work and auto-take

For `auto_take_directions`, exposed `claim_work` (including deferred), or a held
claim, load [claims.md](claims.md) in full before affected discovery, activation
or ownership actions.

Call `find_work` at an unassigned session start, when an assignment ends, or
when the human explicitly requests other work. A Poke, delivery rearm, or
ordinary turn ending never triggers a call or another work list by itself.

While a human-guided assignment waits for input or a completion package,
retain it and report the pending decision or completed task. At the first such wait or completed package in the session,
say once: "You can ask me to find other work at any time." This is an
informational hint, not a question or a `find_work` call. Carry whether it has
been shown into the session summary so compaction does not repeat it. Further
handoffs within that assignment do not repeat the hint or fetch work unless
the human asks. Completion-package waiting follows [operations.md](operations.md).

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
[claims.md](claims.md) for selection and activation before loading a marked item.

When an empty response's directions explicitly say this is the "first AI
session" and the guidance is "served only once", follow those directions
immediately in the same turn before yielding. This one-time onboarding takes
precedence over every empty-list path below.

Otherwise, an empty auto-take view follows [claims.md](claims.md)'s dry-view
path instead of the human opt-in below.

For any other empty list while a human is active, ask exactly: "Your find work
list is empty. Would you like instructions for adding and working on a job?" If
yes, use the returned directions to explain job creation, find_work, selection,
stage gating, Debatable assistance, and Poke AI. In an autonomous session,
call `request_work` once per dry spell instead.

## Delivery contract

The installed resident stub gives the authoritative client-specific delivery
mode, exact command, and environment. Establish that mode before find_work or
job work, and never substitute a different wait/listen strategy. Handle every
delivered line in arrival order. Never set `UCLUSION_CONSUMER` yourself; it is a
human-controlled knob for explicitly separated consumers.

No resident stub in context is itself the delivery mode: nothing to establish,
no listener to arm, and every turn started directly by the human. Work
discovery and the job workflow then proceed normally. Following a stated mode
is not substituting one, so the rule above still bars inventing a wait
strategy, and never install or configure anything to obtain delivery.

Handle every delivered Poke before the next edit. When no delivery is armed,
reload the assigned lane's current state before editing, before a completion
package and after a package reply. For a job, [job.md](job.md) routes its stage
and action checks; a standalone comment uses [single-comment.md](single-comment.md).

## Backlog and session lifecycle

A session's first delivery task starts its cursor at arm time. Claude Code
uses a persistent Monitor running `listen` when available; otherwise it runs
`wait --timeout 86400` as a background Bash command with the largest accepted
tool timeout. When that task ends, read its output, handle printed Pokes, and
arm the next task in the same turn, including after a quiet timeout or a
background time-limit stop. Both commands key the cursor on
`CLAUDE_CODE_SESSION_ID`, so re-arming or switching commands in the same session
continues that cursor and delivers Pokes that arrived between tasks.
An explicit `--consumer` or `UCLUSION_CONSUMER` overrides the session identity.
Outside Claude Code, a bare wait still uses the shared default cursor.
A Cursor listener exits at its
duration limit after printing `Uclusion listener rearm` and its consumer name.
The next listener passes that name with `--consumer`, so Pokes that arrived
between listeners are still delivered. Starting a Cursor listener stops every
other Cursor listener, any other process running `listen` with
`--max-seconds`. A listener with no time limit keeps running. When the person
types in a Cursor chat, that chat arms one unless this chat already armed one
that is still running. A listener this chat did not arm does not count,
including one still running in another chat or listed in the shared terminals
folder. Do not scan terminals or processes to adopt one. That start stops the
listener in the chat they left. If a Cursor listener
exits without printing `Uclusion listener rearm`, another chat took over. Do
not arm a replacement because of that exit. The chat that still owns the listener
still rearms when it prints that line. Older output marked `(replayed)`
is history: drop it without reload, action, or user-facing narration. Never add
`--ignore-existing-pokes` or `--deliver-existing-pokes` unless the human
explicitly asks. Ignoring advances only that cursor past retained rows.
Delivering existing Pokes emits retained history as an unmarked private copy,
without changing other consumers; handle that copy exactly as the human's ask
directs, never as an automatic live Start. Neither flag deletes inbox rows.

Delivery is broadcast to each armed listener; every armed listener may receive
the same line. Cursor keeps a single listener, on the chat the person is
typing in. Broadcast is transport, not assignment. Incorporate state only under the
assignment rules below and never race or coordinate through the inbox. Never
read, edit, or delete the inbox database.

When exiting with a listener/wait running, choose the plain exit. Do not move a
poller outside its harness; it could claim work no agent will see. Arm or
relaunch delivery before the final chat message because some clients hide text
written before a tool call.

## Assignment ownership

A default session has at most one assigned job or bug, except for the
related-task split defined in [review.md](review.md). Reading, classifying, or
reloading an object does not assign it. A human-guided assignment begins only
when the human selects work in that session, including a numbered find-work
selection, or when a live `Start` arrives. Optional auto-take activation follows
[claims.md](claims.md) under the conditions above.

A human-guided assignment remains with that session while work or required
human input is pending, including an unfinished completion package. It ends on
completion as defined below or when the human explicitly switches the session
to another assignment. Explicit human-configured roles may deliberately assign
multiple agents to the same work; that is outside the
default one-agent rule.

Job completion release is defined in [review.md](review.md); retained-work
gates are in [job.md](job.md). Merely ending a turn never releases an assignment.

For a resolved standalone bug, retain the assignment through its completion
package. Release it only after the human's reply is handled, all authorized
actions succeed, the terminal record is confirmed and its triggered sweep is
complete. Declined actions are not pending work. An unfinished package or
failed authorized action retains the assignment.

`Start` is an untargeted broadcast. The human must not use it while more than
one default agent is idle and able to accept it. In that situation, select the
work directly in one agent's chat instead. An agent that receives a valid live
`Start` follows it; agents do not invent inbox coordination to elect a winner.

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
  selection, or the optional [claims.md](claims.md) path above. Silently ignore
  `Added`, `Updated`, and `Responded` while unassigned, including during startup.
  Do not load their targets or mention these discarded events in progress or the work list.
  They also never switch a session from a different assignment.

A new chat instruction does not stop a valid listener. Handle it while delivery
continues.

## Poke grammar and lookup routing

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
  [job.md](job.md). This never bypasses the assignment gate.
- `Responded <target>` hands an AI-authored assistance turn back after any
  semantic human reply, vote, or Resolve. Reload and inspect what it answers;
  perform every action actually unblocked and keep waiting when another
  dependency remains. For a job, [assistance.md](assistance.md) governs qualifying answers. A
  response on the assigned item's waiting completion package (the job's
  current AI review, or the resolved bug's sweep record) is that package's
  reply: read it and handle it as `operations.md`'s completion package says.
  It creates no assistance and does not itself change stage or resolution.

Job description, stage and capsule updates follow [job.md](job.md), after
the assignment gate. A job becoming executable never activates idle or
unrelated sessions.

Resolving a standalone bug is also an `Updated` state transition. For an
assigned bug, compare its reloaded resolution state with the state this session
last observed. When it changes from open to resolved, read `completion.md` and
run both completion scans once. A successful in-session Resolve follows the
same rule immediately. When this session completed that fix, the resolution
also opens the bug's completion package in `operations.md`. Merely loading a bug already resolved, or receiving another update while
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
inside a question, its qualified code. That returns just the item and what
hangs under it, not the whole thread or job again. Never globally load a bare
local code by itself.

Codes inside a question repeat across questions, so reads render each one
qualified by its question: `<question-code>_<local-code>`, such as
`Q-*_O-1`. Cite that form. Any tool that takes a local code accepts it
without `parent_question_short_code_id`, and `get_job` with it returns just
that option or record, with its votes or replies.

Added, Updated, and Responded are continuation events, not instructions to
abandon or acquire work. Incorporate matching assigned-lane changes; for a job,
apply `job.md`'s update rules before continuing. Soft-deleted direct items
reload as the enclosing job with the item absent.

Use `sections` (`description`, `tasks`, `assistance`, `reports`, `notes`, `resolved`) or
`thread_only` for reloads of a job already held. Follow
[reading.md](reading.md) for standing-note bodies and refresh after compaction;
job capsule reads are in [job-reading.md](job-reading.md). Direct lookup already retries five
times with bounded backoff. If a newly Added direct code still returns 404,
retry later rather than discarding it.

## Connection updates

Wait/listen and tool output may contain a `[Uclusion update notice ...]`. Tell
the human the local CLI, proxy, and workflow are stale and ask permission to run
the environment-correct `uclusion update`. If granted, run it from the session
directory and request a client restart or MCP reconnect. If declined, continue
without asking again that session. `uclusion update --check` is read-only.
<!-- /uclusion-skill-reference:v1 -->
