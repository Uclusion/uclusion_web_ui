<!-- uclusion-skill-reference:v1 -->
# Poke AI delivery, triage, and work discovery

## Contents

- Finding work and auto-take
- Resident-stub delivery contract
- Backlog and session lifecycle
- Single-lane triage
- Poke grammar and lookup routing
- Connection updates

## Finding work and auto-take

When there is no specific work, call `find_work` without waiting to be asked and
present the full result as a numbered list. This applies at an idle session
start and immediately after finishing or handing off work. A deferred Poke does
not count as concrete work; find_work is the current state.

If the response has `auto_take_directions`, present the list and immediately
load the first item marked `auto_take`. Continue its normal questions,
suggestions, stage checks, execution, and material-handoff rule in the same
turn. Never auto-start an unmarked item, interrupt active work, or override a
human instruction.

If the list is empty while a human is active, ask exactly: "Your find work list
is empty—would you like instructions for adding and working on a job?" If yes,
use the returned directions to explain job creation, find_work, selection,
stage gating, Debatable assistance, and Poke AI. In an autonomous session or
an auto-take view gone dry, call `request_work` once per dry spell instead.

## Delivery contract

The installed resident stub gives the authoritative client-specific delivery
mode, exact command, and environment. Establish that mode before find_work or
job work, and never substitute a different wait/listen strategy. Handle every
delivered line in arrival order. Never set `UCLUSION_CONSUMER` yourself; it is a
human-controlled knob for explicitly separated consumers.

## Backlog and session lifecycle

A fresh per-session cursor starts at arm time. Older output marked `(replayed)`
is history: drop it without reload or action. Never add
`--ignore-existing-pokes` or `--deliver-existing-pokes` unless the human
explicitly asks. Ignoring advances only that cursor past retained rows.
Delivering existing Pokes emits retained history as an unmarked private copy,
without changing other consumers; handle that copy exactly as the human's ask
directs, never as an automatic live Start. Neither flag deletes inbox rows.

Delivery is broadcast per session; another active session may handle the same
state first. Incorporate the loaded current state and never race or coordinate
through the inbox. Never read, edit, or delete the inbox database.

When exiting with a listener/wait running, choose the plain exit. Do not move a
poller outside its harness; it could claim work no agent will see. Arm or
relaunch delivery before the final chat message because some clients hide text
written before a tool call.

## Single-lane triage

The active lane begins when you start reading a job or bug and ends when it
hands off for human input, review, or completion.

- Handle an event for the active item or anything nested under it immediately.
- Defer an unrelated event without loading it. Briefly name the deferral and
  continue. In a compound event, the parent after `of` identifies the lane.
- For a bare direct code not visible in current context, make one classification
  `get_job` call. Handle it if it belongs to the lane; otherwise name its parent
  and defer without further action.
- A deferred Start never auto-starts after the lane ends. It may belong to
  another session; find_work will surface anything still actionable.
- While idle, live Start, Responded, and Added events load and activate their
  targets subject to normal stage/workflow checks. Updated alone is noted but
  does not start work.

A new chat instruction does not stop a valid listener. Handle it while delivery
continues.

## Poke grammar and lookup routing

The first word is contractual:

- `Start <target>` comes only from an explicit human Poke AI click. While idle,
  start/resume it. Mid-lane, defer an outside target. Replayed Start is history.
- `Added <target>` reports a created task, grouped task, question, suggestion,
  blocker, or other item.
- `Updated <target>` reports an edit, move, deletion, assignment/description
  change, or explicit stage change.
- `Responded <target>` hands an AI-authored assistance turn back after any
  semantic human reply, vote, or Resolve. Advisory responses also send it, so
  reload and inspect answerability; perform every action actually unblocked and
  keep waiting if the response is advisory or another dependency remains.

A legacy bare `Responded.` has no target. While idle, reload every outstanding
Uclusion dependency; mid-lane, reload only the active item.

Direct targets are globally resolvable. Call `get_job` with their exact short
code. Compound targets have the form `<verb> <local-code> of <parent-code>`;
call `get_job` with the parent after `of`, then locate the local item. The
first load of a parent not yet read this session takes its whole scope. When
that parent was already loaded, reload only the poked item, with
`thread_only` for a comment parent or the covering `sections` for a job
parent, instead of pulling the whole job again. Never globally load an inline
option/local code by itself.

Added and Updated are additive, not instructions to abandon active work. Reload
and incorporate in-lane state, then obey the current stage. Soft-deleted direct
items reload as the enclosing job with the item absent.

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
