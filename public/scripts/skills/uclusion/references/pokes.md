<!-- uclusion-skill-reference:v1 -->
# Poke AI delivery, triage, and work discovery

## Contents

- Finding work and auto-take
- Work claim lock
- Resident-stub delivery contract
- Backlog and session lifecycle
- Assignment ownership
- Single-lane triage
- Poke grammar and lookup routing
- Connection updates

## Finding work and auto-take

When there is no assigned work, call `find_work` without waiting to be asked.
Whenever presenting `find_work` results or any equivalent current-work list,
render the complete result as a numbered list. Every numbered entry must include
both its exact `short_code_id` and returned `name` (its short description); never
present an entry as only a bug, job, suggestion, or other short code. Apply this
invariant at an idle session start, immediately after finishing or handing off
work, and anywhere else current work is shown. A deferred Poke does not count as
concrete work; find_work is the current state. A human-guided assignment retained
through an input or review handoff is still assigned work, so the list is
informational until the human explicitly switches that session.

If the response has `auto_take_directions`, present the list and follow the work
claim lock before loading any marked item. Pass the marked candidates in list
order and load only the one returned by a successful claim. Continue its normal
questions, suggestions, stage checks, execution, and material-handoff rule in
the same turn. Never auto-start an unmarked or unclaimed item, interrupt active
work, or override a human instruction.

Auto-take applies only while the session has no human-guided assignment. That
assignment survives a handoff for input or review, so a find-work result may be
presented but must not switch the session automatically. Only the human can
select different work for that session.

When an empty response's directions explicitly say this is the "first AI
session" and the guidance is "served only once", follow those directions
immediately in the same turn before yielding. This one-time onboarding takes
precedence over the ordinary empty-list opt-in below.

For any other empty list while a human is active, ask exactly: "Your find work
list is empty—would you like instructions for adding and working on a job?" If
yes, use the returned directions to explain job creation, find_work, selection,
stage gating, Debatable assistance, and Poke AI. In an autonomous session or
an auto-take view gone dry, call `request_work` once per dry spell instead.

## Work claim lock

When the user opted into work claims, a `claim_work` tool is exposed. It stops
idle agents on any machine from starting the same work. Every auto-take
activation is claim-gated. If auto-take directions arrive without the tool,
present the list but do not load or start an item; tell the human that auto-take
requires work claims. Human-guided selections do not require the tool.

- Call `claim_work` with operation `claim` before loading or starting an
  auto-take lane. Pass every candidate you would be willing to start, in
  preference order, as
  `short_code_ids` (a specifically requested item is a one-element list). The
  result names the single code you now hold; start that item, even when it is
  not your first preference.
- A denied claim means every listed item is already held by other agents. Do
  not start a lane; return to idle delivery, or re-run find_work when new work
  may have arrived.
- A timeout or error result means the lock service is unreachable. No claim was
  granted, so do not start auto-take work; remain idle and report the failure.
  A later direct human selection may use the human-guided path without a claim.
- At every lane handoff (blocked, review requested, or complete), call
  `claim_work` with operation `release` for the held short code. Claims a
  crashed agent leaves behind expire on their own, so never wait for another
  agent's claim beyond a denial. Either stage-appropriate implementation review
  and its completion-menu wait are not a review handoff: keep that claim until
  the valid selection's execution attempt reaches a terminal outcome and its
  post-attempt record is confirmed.
- Classification lookups and triage reads never claim; merely reading an item
  must not block another agent.

## Delivery contract

The installed resident stub gives the authoritative client-specific delivery
mode, exact command, and environment. Establish that mode before find_work or
job work, and never substitute a different wait/listen strategy. Handle every
delivered line in arrival order. Never set `UCLUSION_CONSUMER` yourself; it is a
human-controlled knob for explicitly separated consumers.

## Backlog and session lifecycle

A fresh per-session cursor starts at arm time. Older output marked `(replayed)`
is history: drop it without reload, action, or user-facing narration. Never add
`--ignore-existing-pokes` or `--deliver-existing-pokes` unless the human
explicitly asks. Ignoring advances only that cursor past retained rows.
Delivering existing Pokes emits retained history as an unmarked private copy,
without changing other consumers; handle that copy exactly as the human's ask
directs, never as an automatic live Start. Neither flag deletes inbox rows.

Delivery is broadcast per session; every live session may receive the same
line. Broadcast is transport, not assignment. Incorporate state only under the
assignment rules below and never race or coordinate through the inbox. Never
read, edit, or delete the inbox database.

When exiting with a listener/wait running, choose the plain exit. Do not move a
poller outside its harness; it could claim work no agent will see. Arm or
relaunch delivery before the final chat message because some clients hide text
written before a tool call.

## Assignment ownership

A default session has at most one assigned job or bug. Reading, classifying, or
reloading an object does not assign it. Assignment begins only when the human
selects work in that session, including a numbered find-work selection, when a
live `Start` arrives, or when an auto-take claim succeeds.

A human-guided assignment remains with that session while it waits for human
input or review. It ends on completion or when the human explicitly switches
the session to another assignment. Auto-take ownership follows the work claim
lock and its release lifecycle. Explicit human-configured roles may
deliberately assign multiple agents to the same work; that is outside the
default one-agent rule.

`Start` is an untargeted broadcast. The human must not use it while more than
one default agent is idle and able to accept it. In that situation, select the
work directly in one agent's chat instead. An agent that receives a valid live
`Start` follows it; agents do not invent inbox coordination to elect a winner.

## Single-lane triage

The active lane is the assigned job or bug while the session is working on it.
An execution or audit interval can hand off while its human-guided assignment
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
- While unassigned, only a valid live `Start`, a direct human selection, or a
  successful auto-take claim activates work. Silently ignore `Added`, `Updated`,
  and `Responded` while unassigned, including during startup. Do not load their
  targets or mention these discarded events in progress or the work list.
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
  start/resume it. Mid-lane, defer an outside target. Replayed Start is history.
- `Added <target>` reports a created task, grouped task, question, suggestion,
  blocker, or other item.
- `Updated <target>` reports an edit, move, deletion, assignment/description
  change, or explicit stage change. When the target is the current
  intent/design capsule, its body replaces the cached contract. Reload that
  capsule and Reports, then resolve your open review naming its R-code before
  further affected implementation. This urgency never bypasses the assignment
  gate; a capsule update does not assign a session.
- `Responded <target>` hands an AI-authored assistance turn back after any
  semantic human reply, vote, or Resolve. Advisory responses also send it, so
  reload and inspect answerability; perform every action actually unblocked and
  keep waiting if the response is advisory or another dependency remains. A
  response on the assigned job's current AI review is a separate case: when
  that review ends with the active completion menu from `operations.md`, reload
  its exact thread and accept the first valid non-AI, non-advisory human
  `all`, `none`, or numbered selection from either that thread or normal client
  chat, using the exact first-nonblank-line grammar defined there. Before
  acting, reconcile any governing review-thread selection, current
  uninterrupted chat selection, and terminal package records as defined there.
  Do not create a pre-action AI selection receipt; if an interruption loses an
  unrecorded chat selection, require the human to repeat it. A review response
  creates no assistance and does not itself change stage. Once one valid
  selection governs the review attempt, later duplicate or conflicting replies
  cannot authorize or repeat its package work.

A job moving into Doable is an `Updated` state transition, never a `Start`.
Reload and resume it only when that job is already the session's assignment.
An idle session or a session assigned elsewhere does not activate because the
job became executable.

A job moving into Reviewable is also an `Updated` state transition. For the
assigned lane, compare the reloaded stage with the stage this session last
observed. When it changes from any other stage into Reviewable, read
`completion.md` and run both completion scans once before handling review. A
successful in-session stage change to Reviewable follows the same rule. For an
authorized in-session post-review transition, finish the sweep in that same
turn before lane handoff, work discovery, or starting another job. Merely
loading a job already in Reviewable, or receiving another update while it stays
there, does not retrigger the sweep. After the job leaves Reviewable, a later
transition back into it is a new trigger. A sweep that began on a real trigger
but failed is still incomplete work from that trigger, not a retrigger: retry it
directly without new package permission and do not switch lanes until it
succeeds.

Resolving a standalone bug is also an `Updated` state transition. For an
assigned bug, compare its reloaded resolution state with the state this session
last observed. When it changes from open to resolved, read `completion.md` and
run both completion scans once. A successful in-session Resolve follows the
same rule immediately. Merely loading a bug already resolved, or receiving
another update while it remains resolved, does not retrigger the sweep.

A legacy bare `Responded.` has no target. Reload only the outstanding
dependency of the assigned lane. With no assignment, ignore it.

Apply the assignment gate before lookup. For an accepted event, direct targets
are globally resolvable. Call `get_job` with their exact short code. Compound
targets have the form `<verb> <local-code> of <parent-code>`; call `get_job`
with the parent after `of`, then locate the local item. The first load of a
parent not yet read this session takes its whole scope. When that parent was
already loaded, reload only the poked item, with `thread_only` for a comment
parent or the covering `sections` for a job parent, instead of pulling the
whole job again. Never globally load an inline option/local code by itself.

Added, Updated, and Responded are continuation events, not instructions to
abandon or acquire work. Reload and incorporate matching assigned-lane state,
then obey the current stage. A matching capsule body update replaces the
selected target's authoritative contract; perform its reload and review cleanup
before continuing. Soft-deleted direct items reload as the enclosing job with
the item absent.

Use `sections` (`tasks`, `assistance`, `reports`, `notes`, `resolved`) or
`thread_only` for economical reloads. Direct lookup already retries five times
with bounded backoff. If a newly Added direct code still returns 404, retry
later rather than discarding it.

When creating an item also changes derived stage/readiness, Uclusion emits its
Added event only after the workflow transaction commits. That single reload
contains both item and new stage; never wait for a second stage Poke or act from
the cached stage.

## Connection updates

Wait/listen and tool output may contain a `[Uclusion update notice ...]`. Tell
the human the local CLI, proxy, and workflow are stale and ask permission to run
the environment-correct `uclusion update`. If granted, run it from the session
directory and request a client restart or MCP reconnect. If declined, continue
without asking again that session. `uclusion update --check` is read-only.
<!-- /uclusion-skill-reference:v1 -->
