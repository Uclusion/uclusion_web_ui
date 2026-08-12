<!-- uclusion-workflow:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion job workflow

You have access to the Uclusion MCP server. When the user asks you to work
on a Uclusion job, task, bug, or comment (anything referenced by a short
code like `J-Marketing-22`, `T-Marketing-180`, or `B-...`), follow the
workflow below.

## Finding work

Whenever you have no specific work in front of you, call `find_work` on
your own initiative — do not wait to be asked — and present what it returns
as a numbered list. That means at session start when the user has not named
a specific job, task, file, or question (a greeting or "what should I do?"
counts as no specific work), and again right after finishing a piece of
work with nothing queued: before you report back and go idle, call
`find_work` so your "done" message already carries the next options. Skip
this only when the user has just named concrete work; reaching the end of a
task is itself a trigger, not an exemption, and deferred Pokes (see below)
never count as named concrete work — the state they reported is already in
Uclusion, so the find_work list is the current picture.

**Auto-take views.** A work_list item marked `auto_take` comes from a view
whose humans opted in (a view-level setting) to agents taking the next
available work instead of asking. When the response carries
`auto_take_directions` and you are idle: in the same turn, present the full
list as usual, call `get_job` for the FIRST `auto_take` item, and continue
its normal workflow — questions and suggestions included, its stage still
governing execution. Merely announcing that you will start is not enough.
Items without `auto_take` are never auto-started, an auto-take never
interrupts active work, and a human instruction always overrides it.

Once an item is auto-taken, a handoff rule lasts for its entire active work
lane: before ending any turn working it, you MUST leave a material handoff
in Uclusion recording every substantive result, decision, blocker, or next
step — the specialized tool when one applies (`ask_question`,
`make_suggestion`, `approve_job_or_option`, `resolve`, `ask_for_review`),
otherwise `add_info` on the active item. Chat may mirror the handoff but
never be its only copy; transient conversation need not be persisted.

When `find_work` comes back empty, ask "Your find work list is empty —
would you like instructions for adding and working on a job?" If yes, walk
through the instructions returned with the empty list: creating a job,
running find_work, selecting from the list, keeping a job out of Doable
until it should start, checking the job's Debatable section for questions
and suggestions, and using Poke AI after responding so you continue without
a separate chat message. When the list is empty and the human is NOT active
in chat — an autonomous session, or an auto-take view gone dry — call
`request_work` instead of asking in chat: it notifies the workspace humans,
whose inbox hands work over as an ordinary `Start` poke. Once per dry
spell, not repeatedly.

## Wait for Poke AI

The Uclusion MCP proxy writes inbound Poke AI prompts to a local queue on
this machine. Establish the delivery path at the first reasonable
opportunity in every session — before `find_work` or any job work, not once
you are already blocked: answers, votes, approvals, stage changes, review
feedback, and new work arrive at any time. Use the first path below your
harness supports, always with the same `-e` environment flag as every other
Uclusion CLI command (for example `uclusion -e stage listen`). A client
with the Codex bridge leaves queue ownership to that bridge; every other
client with a real event monitor keeps exactly one listener running for the
rest of the session.

**Codex launched with `uclusion codex`:** do not run `uclusion wait` or
`uclusion listen` — the launcher's companion owns the queue and delivers
each Poke to the Codex TUI's primary thread itself, as if the human typed
it: steering an active regular turn, starting a turn when idle. Review and
manual-compaction turns cannot be steered, so their Pokes wait for the turn
to end; update notices are idle-only; side agents and transient threads
never receive Pokes. By default the companion skips every Poke already
queued at startup — the cutoff advances only the Codex bridge cursor and
deletes nothing. Only when the user explicitly wants the retained backlog,
launch with `uclusion codex --deliver-existing-pokes` (before `--` and any
passthrough arguments); never add it yourself. Global `-c`/`--config`,
`--enable`, `--disable`, and `--strict-config` passthrough flags apply to
both the TUI and its private app-server; other passthrough arguments are
TUI-only. No Uclusion hooks need enabling or trusting, and until the TUI is
connected with a live primary thread the companion touches nothing. Do the
normal beginning-of-session work, including `find_work` when no concrete
work was named. If the companion cannot establish its private
frontend/backend path, run `uclusion update` and restart through
`uclusion codex`. The maintainer architecture document is not shipped with
installs; in the Uclusion source tree it is
`public/scripts/UCLUSION_CODEX_BRIDGE.md`.

**Bare Codex CLI/TUI, and Cursor chat agents:** a background process cannot
reliably wake an idle turn in these surfaces — hour-long `wait`, `listen`,
and Shell `notify_on_output` have all failed to start a real turn on
arrival, and a hung waiter can claim prompts no model ever sees. Never
leave `wait` or `listen` running here. At the beginning of each real
user-triggered turn, synchronously drain the pending backlog:

```sh
uclusion wait --timeout 0
```

Handle every returned line before the user's new request, then continue to
`find_work` when appropriate. This bare drain has no session identity and
advances the shared `default` cursor; concurrent bare drains share that
lane, and the human can give a session its own by setting the
`UCLUSION_CONSUMER` environment variable. (Autonomous Pokes do work through
the Codex bridge — that path is fine.) The Cursor install also registers a
`stop` hook (`uclusionCursorPokeDrain.py` in `~/.cursor/hooks.json` or the
project `.cursor/hooks.json`) running the same zero-timeout drain when a
turn ends, scoped to a per-conversation cursor so one chat's drain never
consumes another session's delivery; claimed lines return as
`followup_message` so Cursor auto-submits them. That covers Pokes arriving
DURING a turn — it does not wake a fully idle chat, so keep the turn-start
drain. Bare Codex without the bridge still needs a human chat turn (or a
pasted poke).

**Clients with a persistent line-event monitor (Claude Code's Monitor
tool):** launch the streaming form once per session and leave it running:

```sh
uclusion listen
```

In Claude Code arm it with the Monitor tool — command `uclusion listen`,
`persistent: true`, a description naming the Poke stream. `listen` never
exits: each claimed prompt prints as one line the harness raises as an
event — no timeout, no completion notice, no relaunching; a quiet hour is
completely silent. Stacked prompts arrive as consecutive lines, possibly
batched into one notification: handle every line in arrival order, and
when several name the same lookup short code one `get_job` covers them. If
the stream ever ends (monitor stopped or died), arm it again and simply
continue — a re-armed listener is a NEW session cursor starting at arm
time, so nothing older is redelivered.

Arming is once per MACHINE session, not per conversation: a `/clear` or
fresh conversation in the same harness process inherits any listener the
previous conversation armed, still running and still delivering into the
new conversation. ALWAYS check for a live listener before arming — in
Claude Code list the background tasks (TaskList) for a running monitor
whose command is `uclusion listen`, or check processes with
`pgrep -f "uclusion.*listen"`. One already running: reuse it and do not
arm another — every listener claims its own broadcast copy, so a second
one makes each prompt arrive twice. More than one running: keep one and
stop the extras (TaskStop in Claude Code) before continuing.

**Clients whose harness turns a background command's completion into a new
agent event:** run the bounded wait as a background (detached) task and
relaunch it after every completion — being able to poll a dormant process
later does not qualify, nor does a generic completion notice (bare Codex
and Cursor chat are handled above):

```sh
uclusion wait --timeout 3600
```

The hour is deliberate: the wait polls the inbox every quarter second, so
claims are just as fast, but a quiet hour produces ONE completion
notification instead of a stream. Pass `--timeout 3600` explicitly — the
CLI default is a short 55-second wait for contexts that cannot background
the call — and never run the hour-long form in the foreground, where it
freezes the conversation. A silent return means the timeout expired, not
that you may finalize: relaunch — a session keeps one wait running at all
times. When prompts have arrived, one wait prints the WHOLE pending
backlog, one per line, before exiting: handle every line in arrival order,
then relaunch. After an empty timeout keep the chat status line to one
short sentence; content the turn owes the user goes in that same final
message, after the relaunch.

**Clients with neither mechanism:** do not run the wait at all — end your
turn and let the user's next message or session pick up the queued
prompts.

**Backlog flags.** A fresh listener starts past the backlog automatically —
nothing to discard when arming. `--ignore-existing-pokes` (`listen` and
`wait` both accept it) matters on the shared `default` cursor, whose
backlog is otherwise live work for turn-start drains: it advances only
that consumer's cursor past what is already queued — later arrivals
deliver normally, no inbox rows are deleted, other cursors are untouched,
update notices still appear. The reverse, `--deliver-existing-pokes`,
starts the session's fresh cursor at zero and delivers the retained
backlog as a private copy, unmarked, in arrival order, affecting no other
consumer — for when the user explicitly asks to inspect what queued while
away, or runs a scheme of their own such as taking the first `Start` no
other session has taken; handle the lines exactly as the ask directs.
Never add EITHER flag on your own initiative — skipping the `default`
backlog unasked silently drops live work.

**Session exit.** Exiting while the listener or wait runs is safe: pick
the plain exit ("Exit anyway") when the client warns about background
work — the next session arms its own listener and interim prompts persist
in the inbox until claimed. Never choose "Move to background and exit" or
similar: a poller outliving its harness claims prompts no agent will
handle, and a prompt is never delivered twice. On POSIX an orphaned `wait`
or `listen` notices its parent died and exits before claiming anything;
native Windows cannot detect parent death, so there the choice genuinely
matters.

**Launch order within a turn.** Arm the listener (or relaunch the wait)
BEFORE writing the turn's final chat message: in some clients (Claude Code
included) text written before a tool call may not display, so
content → launch → status hides the content behind the status line.
Everything the user needs to read — find_work lists, questions, review
reports — goes in the final message AFTER the launch.

### Triage: your lane and everything else

Triage every delivered line in arrival order against the ONE job or bug
you are currently working — processing is single-threaded by default. Your
lane runs from the moment you begin a job or bug's workflow (reading and
questions included) until you post its review or it blocks on the human.

- A line about that work (the item itself or anything nested in it) is
  handled immediately as described below.
- A line about anything else is DEFERRED: do not reload its target or act
  on it — briefly tell the human you are setting it aside (best-effort;
  some clients hide text between tool calls) and keep working. A compound
  line classifies itself: the parent code after `of` names the enclosing
  work, so when that parent is not your lane, defer with no reload at all.
  The one exception is a BARE direct code you cannot place — not your
  current work, not visible in its markdown (as a freshly Added top-level
  item is): give it ONE classification reload with `get_job`; handle it if
  the enclosing work is your lane, otherwise mention what it belongs to
  and defer with no further action.
- The human can override at any moment ("take that up now"); otherwise a
  deferred line needs nothing more. A deferred `Start` never converts into
  an auto-start when the current work finishes — another session may have
  taken it or the click gone stale; if the human still wants it, they pick
  it from the find_work list.
- With no active work, a `Start`, `Responded`, or `Added` line is handled
  immediately, its loaded target becoming the active work under the same
  stage and workflow checks. An `Updated` line while idle never starts
  work on its own: note it and remain idle — find_work surfaces it when
  work begins.

Delivery is broadcast per session: every armed session has its own cursor
and sees every prompt arriving while armed — a listener auto-generates a
per-session identity, the Cursor stop hook scopes to its conversation, the
Codex bridge keeps its dedicated cursor, and only a bare `wait` with no
session identity falls back to the shared `default` cursor
(`UCLUSION_CONSUMER` gives such a surface its own lane when the human sets
it). A new session's cursor starts at arm time: the retained backlog is
history it never receives — anything still needing attention is on
find_work. (An older CLI may deliver backlog lines suffixed ` (replayed)`
— drop them: no reload, no action.) Within one session a prompt is
delivered once; across sessions everyone gets a copy. Single-threaded
triage makes broadcast safe whether one session runs or five — the human
divides the labor. When a reload shows a prompt's work already handled by
another session, incorporate that state and move on: never race to claim
it, and never coordinate sessions through the inbox. `--consumer` and
`UCLUSION_CONSUMER` are the human's knobs for explicit multi-agent
schemes — never pass or set them yourself. A newer chat instruction does
not require stopping the listener: handle it while listening continues,
and whatever arrives meanwhile is your next instruction after it. Never
read, edit, or delete the inbox database directly. Prompts stay queued
until they age out — nothing is lost while you work.

### Poke grammar and handling

Correlated Poke prompts use four verbs whose first word is a contract:

- `Start <target>`: reserved exclusively for an explicit human click on
  Poke AI in the UI — automatic collaborator activity never uses it. Idle:
  the user's instruction to start or resume the named work. Mid-work with
  an outside target: defer like any out-of-lane prompt — with broadcast
  delivery the click may be meant for another session — and continue
  unless the human tells this session to switch. A `Start ... (replayed)`
  line is history, not an instruction. Only an unmarked, live `Start`
  while idle starts work.
- `Added <target>`: a task, grouped task, question, suggestion, or blocker
  was created.
- `Updated <target>`: a response-worthy edit, move, deletion, assignment
  change, description change, or explicit stage change.
- `Responded <target>`: human activity handed an outstanding turn back to
  the AI. After loading a `Responded` target inside your current work,
  immediately perform every workflow action the response unblocked — do
  not merely report the response or stage change, and if the job still
  depends on human activity afterward, resume polling. A legacy bare
  `Responded.` has no target: when idle, call `get_job` for every
  outstanding Uclusion dependency so no response is missed; mid-work,
  reload only the current item — other dependencies' responses surface on
  the next find_work.

Targets are direct (`Updated J-all-123`) or compound
(`<verb> <ticket-code> of <parent-ticket-code>`, as in `Added C-1 of
Q-all-556`). The parent names the enclosing work: a comment nested under a
job carries that job, a view-level reply carries its thread root, and
anything inside a question's inline market — an option, a vote, a comment
on an option — carries the enclosing question. Only a target that is
itself top level (a job, a bug, a standalone question or suggestion) stays
direct. For a direct prompt call `get_job` with exactly its short code (it
loads the enclosing job when the target is nested); for a compound prompt
call `get_job` with the parent code after `of` — always globally
resolvable — then locate and act on the named item within it. An
inline-market first code (like `C-1` or `O-2`) is local to the option
market and not globally resolvable — never call `get_job` with such a
local code alone.

`Added` and `Updated` are additive event notices, not instructions to
replace work underway: for a target inside your current work, reload,
incorporate the new state, and keep going. The reloaded job's stage still
governs what work is allowed: if it locks execution, respond to the
assistance it awaits, and if the job then remains blocked on the human,
treat the work as finished for now and run find_work. When a direct
job-item target was soft-deleted, `get_job` identifies the deletion and
returns the enclosing job with the item absent; incorporate the removal.

Reload economically: when the job's markdown is already in context, pass
`sections` (any of `tasks`, `assistance`, `reports`, `notes`, `resolved`)
to render only what changed, or `thread_only` true to get one comment's
thread. A full reload is still right when you have lost track of the job's
overall state.

Trust the lookup's mechanics: a direct lookup makes five short-code
attempts, with 100, 200, 400, and 800 millisecond backoffs after an
initial 404 — bounded recovery for a lagging index, not proof a new code
is absent; if a direct `Added` target still 404s, retry `get_job` later
rather than discarding the event. When adding an item causes a derived
stage or readiness change, Uclusion withholds the `Added` event until the
workflow write commits: the one event keeps the item's exact short code
and its `get_job` reload includes both the new item and the current
stage — never wait for a second stage Poke, and never continue from a
stage cached before the reload.

## Updating the AI connection

The listener doubles as the update watcher: at launch and every 15 minutes
or so it compares the installed release against the current one; the first
time it sees a newer release it prints a "[Uclusion update notice ...]"
line instead of a prompt — `wait` exits after printing it, `listen` keeps
running. When any tool result or wait/listen output contains such a
notice, the local install (CLI, MCP proxy, workflow docs) is stale: tell
the user and ask permission to run `uclusion update` (same `-e` flag as
every command). Granted: run it from the session's directory, then remind
the user to restart the client session — or reconnect the MCP server — so
the updated connection loads. Declined: continue and do not ask again that
session. Either way the notice never repeats for the same release.
`uclusion update --check` reports status without changing anything.

## Workflow

Run the steps in order. Don't skip ahead: questions and suggestions come
BEFORE approval, approval BEFORE execution, and review AFTER a testable
result exists.

The job's **stage** is not your **step**. The stage (for example
"Approvable", "Doable", or "Reviewable") says which actions Uclusion
permits right now — not which step you are on, and it never waives earlier
steps: a job already in "Doable" or "Reviewable" does NOT mean your step-2
questions and step-3 suggestions are done. "Requires Input" means an open
question or suggestion is waiting on a human and locks execution exactly
like a job in neither executable stage: respond to the open assistance and
implement only after the job returns to "Doable" or "Reviewable".
Assistance can open at any moment, so recheck the stage right before you
start editing files — not just when you first read the job.

ALL workflow artifacts — questions, suggestions, approvals, votes, info
notes, resolutions, review requests — go through the Uclusion MCP tools
(`ask_question`, `make_suggestion`, `approve_job_or_option`,
`vote_on_suggestion`, `add_info`, `resolve`, `ask_for_review`,
`start_job_audit`, `set_job_audit_phase`, `end_job_audit`). Never
substitute a built-in or local equivalent (`AskUserQuestion`, inline
multiple-choice prompts, chat-only "which would you prefer?", plain-text
approvals or progress reports in chat) — even when the user critiques
prior work and asks for a redo: the clarifying questions before redoing
(what is wrong, which direction, what to keep) are step-2 questions for
`ask_question`, not a local clarification prompt. The only exception is a
question not about the job but about this flow or something else.

### Token usage audit (when enabled)

When the server exposes `start_job_audit`, `set_job_audit_phase`, and
`end_job_audit`, use them to attach token-usage statistics to the job. A
lookup done only to classify an inbound Poke does not start an audit; as
soon as a lookup establishes the job as your active work lane, call
`start_job_audit` before substantive planning or execution and retain the
returned run identifier. The initial bucket is `planning`.

Call `set_job_audit_phase` with the single `bucket` argument whenever the
kind of work changes. Labels describe the actual work, not a fixed
taxonomy: the defaults are `planning`, `implementation`, `testing`, and
`other`, but a marketing job might use `web searches`, `source review`,
and `copywriting`. Keep labels concise (1–80 safe characters), at most 32
distinct per run, no separate standard/custom dimensions; re-entering a
bucket adds to its total. Do not let one bucket silently absorb work a
reader would expect broken out — in particular switch to `testing` when
you begin running tests, builds, or other validation. Prefer a fitting
default over a synonym; reserve custom labels like `commit and push` for
work no default describes, so runs of the same job stay comparable.

A marker applies to the NEXT model request — it cannot relabel tokens
already consumed, so set it before the new kind of work. Include a
monotonically increasing `marker_sequence` starting at 1 for the run
(replaying a marker reuses its original sequence) so delayed delivery
cannot reorder transitions. Every request belongs to exactly one active
bucket. Do not create a new run merely because a task or turn changes
within the same active job.

Call `end_job_audit` at a material handoff ending the lane for now: the
job blocks on human input, a testable result goes to review, or the work
completes. Ending marks the run pending while collection finishes out of
band — do not wait or poll for the final note. Audit failures, missing
tools, or partial telemetry never block the workflow: continue and let the
collector report an honest partial result.

### Plan mode

Plan mode's harness banner governs changes to the user's machine and
repo — file edits, config changes, commits, installs, deploys. It does NOT
govern the Uclusion MCP tools: posting to a job is not a system change, it
IS the plan medium. Do not lump `ask_question`, `add_info`,
`make_suggestion`, `approve_job_or_option`, or `resolve` in with file
edits, and do not defer them until plan mode exits. Concretely: (1) any
step-2 question — including a choice between approaches you would
otherwise surface for a plan — is filed with `ask_question` (preference
voted with `approve_job_or_option`) the moment it arises, not held for
after approval and not asked in chat or a local prompt (only questions not
about the job may use a local prompt); (2) put the plan in the job with
`add_info` BEFORE calling ExitPlanMode — planning is not done while the
plan lives only in chat or the local plan file; after posting, tell the
user and link it by short code. About to call ExitPlanMode without the
plan posted? Stop and call `add_info` first.

### 1. Read

Call `get_job` with the short code to load the job and all its child
tasks, grouped tasks, questions, suggestions, blockers, and reviews. Notes
are included only when `include_all_resolved` is true — except a note with
a reply, which always is; the same flag returns resolved comments in full
instead of truncated. The markdown may carry a "View Notes" section:
standing guidance humans attach to a view (development policies,
conventions, preferences) applying to every job in it — treat it as
instructions governing how you do the job's work. If get_job returns only
a single comment, no Job J-... header, use the single comment workflow at
the end of this document.

### 2. Ask questions

Call `ask_question` for anything ambiguous OR any judgment call the job
doesn't pin down where a reasonable reviewer could pick differently
(visual density, which artifact to reference, whether public-facing
content should mention a known caveat, tone, scope cuts...). "I have a
default in mind but the user might disagree" is a step-2 question, not a
silent decision. One tool call per question — never pack several into one.
Provide options when there is a discrete set of choices.

Options are not the default kind. When you do not actually understand
something the job depends on — how to reproduce a bug, what an observed
behavior was, which screen or flow is meant, what a term refers to, why
the author believes the behavior wrong — ask a plain open-ended question
with NO options. Do NOT paper over the gap with a plausible story
reconstructed from the code: reverse-engineering "the path that would
produce this bug" is a guess, and guesses ship as the wrong fix. For any
bug whose reproduction steps are not spelled out, ask for the actual steps
before you diagnose. The same bar covers cause and fix, not just symptom —
a precise statement of what happens and what is wanted instead does not
clear you to patch from inference. Be most suspicious exactly when the
code at the reported spot already looks correct: theorizing that the real
cause hides in a layer you cannot see ("must be getting overridden /
ignored / clobbered downstream") is inferring runtime behavior you have
not observed. If you cannot name the single line producing the wrong
behavior without a chain of "this must then propagate to that," the chain
is the guess — ask the person who saw the bug what they actually observed;
their answer confirms or kills the theory far more cheaply than a fix in
the wrong place. Tells that should stop you: "the bug must be…", "this is
presumably…", "I think the author means…", "the only way this is a real
bug is if…", "this already looks right, so the real problem must be…".
Asking "I don't understand X, can you show me how to hit it?" is expected
and welcome — far cheaper than confidently fixing a bug you only imagined.

Vote your preferred option with `approve_job_or_option` to inform the
user, then hold a reasoned position: never reverse your recommendation
just because the user restates, emphasizes, or pushes back on a priority —
emphasis is not new evidence. Change your vote only for new evidence or a
genuinely changed requirement, saying explicitly what changed; when the
user stresses a concern, fold it into an honest tradeoff and name the fact
that would settle the choice. Flip-flopping to match tone erodes trust.

A question counts as answered when an option has a "For" vote not marked
"From AI user", or a non-AI user replied with a clear direction, or a
human resolved it without vote or reply — the human thereby accepts the
risk the question described and keeps current behavior; it does not
silently select an option, and you do not reopen or re-ask because no
reply was recorded. Even answered, when the non-AI votes are all 50 out of
100 or less: propose a better option with `add_options` if you have one
you are more certain of than your current vote; otherwise add a
certainty-raising clarification — what the option really means, an
unweighed consequence, unseen evidence — as a reply on the question or
option; with neither, proceed with the answer as voted.

Call `resolve` on answered questions needing no further operations —
immediately when you become aware, or the user cannot see what still needs
attention. Do not resolve a question and then reply or operate inside it —
that errors. A reply with any ambiguity gets a clarifying reply back, not
a resolve; resolve only when the direction is completely clear. Only
options in stage 'Approvable' can be voted on or considered as answers. If
later — approving, executing, or writing the review — you catch yourself
wanting to say "flag if you'd rather X" or "verify Y reads correctly",
that is a step-2 question you missed: stop and file it via `ask_question`
before continuing; never defer such questions to the step-6 review report.

#### Visual options are an aid, not the option itself

A job may ask you to show choices visually — a temporary build file or
page with each option labeled, screenshots taken with Playwright, and so
on. The picture is only a *picture of* the choices: the canonical, votable
options live on the question, via `ask_question` (or `add_options` to
extend). A choice existing only as a labeled panel or as prose in an
`add_info` reply is NOT an option — it cannot be voted and the next
session cannot see it. Every direction shown must be a real Uclusion
option. Label each panel with the option's Uclusion identity — short code
(`O-1`, `O-2`, …) and/or exact name — never a parallel scheme (A/B/C,
1/2/3): it shadows the platform's `O-` codes and hides which votable
option a panel maps to. Keep picture and options in lockstep: revising the
set means updating Uclusion in the SAME turn (`add_options` for new
directions), and a changed meaning never silently reuses a label — keep
the label tied to its original meaning, or `resolve` the stale question
and open a fresh one. Never let a screenshot disagree with the question's
current options. Labels are stable identifiers: once `O-1` means a thing
it keeps meaning it; a different meaning is a new option, not a relabel.

### 3. Make suggestions

Call `make_suggestion` when you see a better path than the job describes —
push back without blocking instead of silently doing something different.
Not limited to jobs: any idea you would voice as a suggestion in chat — an
improvement, a better approach, a follow-up worth doing — is created in
Uclusion FIRST (`make_suggestion`, omitting `job_id` for non-job ideas,
which then live at view level), and only then mentioned in chat with the
link returned on creation. A chat-only suggestion is invisible to other
sessions and cannot be voted on.

Suggestions also flow the other way: one a human authors on a job is
addressed to YOU. Reply with a definitive accept or reject and what you
will do about it — never a noncommittal acknowledgment, never deferring
the decision back to its author. When the markdown states voting is
enabled, also record your position with `vote_on_suggestion` (for or
against, certainty 1–5, and your reason) so it is weighed alongside the
human votes that may settle it; the reply still carries the decision and
next steps. Voting not enabled: your reply is the whole signal. Never vote
on suggestions you authored — creating one already states your position.
An open human suggestion holds the job in "Requires Input", so answer it
before any implementation. An accept that changes the plan gets recorded
(update or add tasks, or `add_info`), and the suggestion `resolve`d once
settled and acted on. A human resolving an AI-authored suggestion without
reply or vote is accepting the described risk and declining the
mitigation — do not reopen or recreate it.

**Precondition — do NOT offer to do work on a task or approve the job
while any question on it is open and unanswered.** If some tasks are
completely disjoint from the questioned ones, you may ask the user about
starting those first.

### 4. Approve — only if the job is in "Approvable" with no "From AI user" approval at the job level

Offering to approve a job with open questions defeats the workflow — the
decisions those questions gate are not pinned down. Call
`approve_job_or_option` with a certainty score (1–5) and a written reason;
score low freely when the job is badly designed or of unclear customer
value.

Before approving, surface and test the job's premise on your own
initiative — the user should not have to challenge you first. Most jobs
carry an unstated assumption about why they are worth doing: the strategy
behind them, the value they deliver, or that the approach will work. Name
that premise explicitly and ground it against evidence you can reach —
related and sibling jobs, prior decisions and results already in Uclusion,
plain reasoning about likelihood of success. A weak, untested, or
already-contradicted premise gets a low or moderate certainty with a
written reason — and missing information is a step-2 question to file with
`ask_question`; approving on the author's say-so is not an option.

If the job markdown says the AI user is a required approver, approval is
mandatory once your suggestions are made and questions answered. Otherwise
ask whether you should approve.

### 5. Execute and document — only if the job is in "Doable" or "Reviewable"

"Doable" means a human accepted the job into the work queue; "Reviewable"
means it reached review, where review actions, requested revisions, or
remaining execution may still be required. Both unlock execution; neither
puts steps 2–3 behind you — an already-executable job STILL requires
reading, filing every question, and making your suggestions, with
execution starting only after all your questions are answered. For a
Reviewable job, step 6's review-direction rules still decide whether to
work or wait — stage permission alone is not an instruction to re-review
AI work or change it without feedback.

In neither executable stage and ready for initial implementation
(questions answered, suggestions made)? Offer to change the stage to
"Doable" for the user, or ask the user to change it. When the user
instructs you to move a job to "Doable", that means change the stage AND
immediately begin or continue execution unless they explicitly say
stage-only or not to start: in the same turn, change it, call `get_job`,
sweep as below, and execute the active tasks — a stage change is an
intermediate transition, not completed work, and reporting it alone while
actionable tasks remain is not a finished turn.

**Before ANY work in this step, sweep the job:** `resolve` every open
question whose answer is already in it (a "For" vote not marked "From AI
user", or a clear non-AI reply) — dangling answered questions confuse
later sessions — and `resolve` tasks that turn out already done (in the
diff, in a prior resolved item, or no longer applicable) instead of
re-implementing them. Only after that sweep, start implementing.

Do the task and its grouped tasks; never attempt tasks whose short codes
start with Resolved. As you go, `resolve` tasks you finish and `add_info`
at job or task level anything a reviewer should know — decisions,
trade-offs, follow-ups, anything non-obvious from the diff.

### 6. Ask for review

**Precondition — a review that would include actionable items (like
testing still to be done) gets those items filed as suggestions first,
then referenced in the review.**

When a set of tasks has a testable output, call `ask_for_review` with a
concise progress report describing what is ready to look at — the signal
that human or AI review can begin.

On a "Reviewable" job, never infer who reviews from the stage alone:
reload and check the author of the LATEST comment in Reports. Marked "From
AI user": your own request for humans to review AI work — do not review it
again; handle explicit feedback or status change a Poke carried, otherwise
wait for the human review. From a human: the human is asking the AI to
review THEIR work — do that review and respond to their comment through
Uclusion. A Poke on a Reviewable job only signals a reload; it does not
override the direction set by the latest review comment's author.

Write the report as if the code will not get checked in: the review plus
the job's other artifacts (questions, suggestions, notes) must together
hold enough detail to reproduce the work without human help. Do not lean
on the diff — name the approach, the files and functions changed and how,
and the decisions that shaped the implementation; anything essential
living only in the diff or chat goes into the job with `add_info` before
the review opens. The report describes finished work — what was built,
what was skipped and why, which tasks are now depicted and safe to
resolve — and is NOT the place for choices you should have asked about
earlier: "verify that X reads correctly" or "flag if you'd rather Y" are
step-2 questions — go back, file them, and only then send the review. End
with a signature line naming the AI product, exact model version, and
effort level that wrote it, for example "— Claude Code (claude-fable-5,
high effort)".

## Notifications

The human's Uclusion inbox for this workspace is reachable through
`get_notifications`: notifications as markdown, most urgent first, each
with the short code it is about. Use it when the user asks what needs
their attention, to review the inbox on request, and automatically at
every completion moment — you resolve a bug or job, open its review, or
the human signs off and the work is committed. At that moment look for
notifications about the short code(s) just worked, never reusing an
earlier check — the finished work itself generates notifications. If any
exist, list them and ask in chat whether to clear, exactly like you ask
before committing: "Want me to clear these notifications for B-x-12?"
None are exempt, including the review report's own notification —
load-bearing while the review is pending, clutter once the human signs
off. If none exist, do not ask: never offer to clear notifications you
have not seen. Call `clear_notifications` only after the human explicitly
agrees, and never clear anything broader than the object the permission
named — asking is the only way to guarantee nothing in the inbox is lost.
Clearing follows the UI's own safety rule: unread notifications are
removed, persistent ones just lose their highlight.

## Offering a context clear

You cannot clear your own context — only the human can (in Claude Code,
`/clear`). What you can do is notice the boundaries where clearing helps
and offer it, so the human confirms a prompt at the right moment instead
of having to remember the advice themselves. In the final message that
reports the work finished, add one short sentence offering a clear at
exactly these boundaries:

- After resolving a view-level (single comment) bug or question, when the
  next piece of work is unknown or unrelated: "If your next item is
  unrelated to this one, now is a good point to /clear."
- After a job fully completes — its review signed off and any commit made —
  with nothing else queued. Every artifact is already written back into
  Uclusion, so a fresh session can reload the whole thread.

Offer it nowhere else: never mid-job (the thread in context is the working
state), never between comments touching the same area of code (warm files
save re-reading), and never while work is still active or awaiting a
response. The offer is advice — never wait on it, and if the human ignores
it, do not repeat it for the same boundary.

## Searching the workspace

The whole workspace exports to local markdown: every job, task, bug, note,
question, and suggestion with its options, votes, and reasons — resolved
or not. Run `uclusion export` and search the file it reports writing
whenever the user asks anything the workspace data can answer and the
answer is not already in front of you — much broader than decision recall:
"do we have a backlog job that includes work X?", "did we resolve a bug on
Y recently?", "who approved Z and how certain were they?". Recency is
answerable directly from the file: job, comment, reply, and vote lines
carry an "(updated YYYY-MM-DD)" annotation — the UTC day that item last
changed (a new item shows its creation day), restated in the export's own
legend header — so "what changed this week?" is a date scan, not a guess,
remembering UTC can run one day ahead of the user's local calendar.

Present each found item with enough inline detail to judge relevance — you
have the full contents locally, so never make the user open Uclusion just
to see what a result says. Offer to drill into any found item right in the
conversation, and include each item's short code so the user can open the
live object when they want to act on it. Decisions are the special case:
before re-opening a debate, or whenever you need to know if something was
already decided ("what did we decide about X?"), search the export first
and cite what you find instead of re-litigating; reopen a found decision
only when there is new evidence.

## Creating jobs

Creating a job with `add_job` starts with the same export: search first
for duplicates and related items — the same feature area, the same code or
screens, or wording that overlaps the request. If an existing job or bug
already covers the work, surface it with its short code instead of
creating a duplicate and let the human decide. With related-but-distinct
items, still create the job but cite their short codes in its description
so the relationships are visible on the job itself, not just in chat. When
the work decomposes naturally, pass `tasks` on the `add_job` call so the
pieces land as real tasks at creation — a task is anything that might be
reviewed, committed, or have info added on separately.

## Creating tasks, bugs, and blockers

`add_task` (a task on a job), `add_bug` (a view-level bug with a severity
the human indicates: RED critical, YELLOW normal, BLUE minor), and
`add_blocker` (a blocker issue on a job) create artifacts AS THE HUMAN,
exactly like `add_job`. Use them only to record what the human explicitly
asked for in their own words — never for your own ideas: those go through
`make_suggestion`, which the human can convert. The one exception is the
`tasks` list on `add_job` itself, where the AI decomposing the
just-requested job is expected.

The view-level creators — `add_job`, `add_bug`, and `make_suggestion`
without a `job_id` — can target an existing bug or job's view instead of
the default view. Use that when the human names or implies a view (for
example work clearly belonging to the same view as an item just
discussed); the tool descriptions cover the argument.

## Attaching images and files

To put a screenshot or file ON a Uclusion artifact: call `get_upload` with
the file's MIME type and exact byte size (the CLI form takes a path and
sizes it for you). POST the returned presigned_post fields plus the file
as multipart form data to presigned_post.url — every fields entry first,
the file last; `curl -F` does this. Then create the artifact with the body
referencing the returned file_url (markdown image syntax for images) and
the metadata object passed in `uploaded_files` on the creating call
(`add_info`, `ask_question`, `make_suggestion`, `ask_for_review`) — an
upload not referenced this way is not retained. The bytes never pass
through the model; any shell-capable agent can do the POST itself.

## Job dependencies

There is no first-class depends-on link between jobs; the convention is a
blocker whose text links the dependency. When job A cannot start until job
B completes, a blocker on A names B by short code (for example "Blocked
until J-x-22 ships") so the completion sweep can find it. `add_blocker`
runs as the human per the section above — a job is not really blocked
until a human confirms — so use it only when the human explicitly says the
job is blocked, and `make_suggestion` when you discover the dependency
yourself. The blocker moves A out of the doable flow and shows the reason
and the link in one place.

Sweep for unblocks at every completion moment — you `resolve` the job, its
J- short code goes into a commit message, or the user says it shipped or
is done. At each one, run `uclusion export` and search for the completed
job's short code inside open blockers on other jobs; for each hit, show
the user the blocked job and offer to `resolve` its blocker so it
re-enters the flow — never resolve unasked, the blocker may be waiting on
more than the completed dependency. A dependency known before work starts
does not always need a blocker: simply not moving the job to Doable also
prevents execution while approval proceeds; use a blocker when the wait
should be visible on the job itself and caught by the completion sweep.

## Saving lessons: view notes, not private memory

A lesson learned while working — a correction from the human, a practice
that turned out to matter, guidance any future session should follow —
belongs in the agent's private memory only when it is genuinely specific
to this machine or user: environments, local paths, personal quirks.
Everything general goes where every session and every human can see it: a
standing view note, written with `add_view_note`.

- Target it with the bug or job you are working to land in that item's
  view, or update the view's existing AI-authored note — the tool's own
  description covers the arguments.
- Default to updating: every job markdown renders its view's notes, so
  fold the new lesson into the AI note already there and prune anything
  it supersedes — the note is a tight topical digest that rides along
  with every job in the view, not an append-only log. Create a second
  note only when topics genuinely diverge. Never edit a human's note;
  propose changes to those with a reply or `make_suggestion`.
- Save autonomously — no permission ask needed. Creating or modifying the
  note notifies the view's humans so they can review, edit, or delete it;
  treat the note's current text as authoritative afterward, human edits
  included.
- The first time you act under this instruction, run a one-time sweep:
  test each existing private memory against the machine-specific bar,
  move the general ones into view notes with `add_view_note`, and delete
  them from private memory.

## Notes

- Every question, option, suggestion, approval, and progress note lives
  inside the job — written as Uclusion artifacts, not summarized away into
  chat replies, so the next session (yours or someone else's) can pick up
  the thread.
- Thread `add_info` under the thing it answers: when responding to a
  specific reply or comment, pass THAT comment's short code, not the
  thread root's — the root is only for new top-level information. A flat
  reply on the root separates an answer from its question and cannot be
  re-threaded afterward.
- The short code (for example `J-Marketing-22`) is the canonical id: use
  it verbatim in tool calls, chat, commit messages, and code comments not
  referencing a question; a code comment that references a question uses
  the full link returned on question creation if you have it.
- After the job review has been opened and you are offering to commit, the
  commit message should begin with the short code of what was done —
  however a job short code, beginning with a 'J', in a commit message
  indicates the job is done, so only use it when there are no tasks left
  on the job.
- A completed job may unblock others — whenever a job finishes, run the
  completion sweep described in "Job dependencies".

# Uclusion single comment workflow

A single comment markdown has no Job J-... header. For a single comment
that is a bug use only the `get_job`, `add_info`, `resolve`, and — for
saving a general lesson learned from it — `add_view_note` tools; for
a single comment that is a question use only `get_job`, `add_info`, and —
for options inside it — `approve_job_or_option`. Use `add_info` to ask
questions or explain the work done. Offer to commit after resolving, with
the commit message beginning with the short code so that any action
invoked by the commit can use it. After resolving, when the next piece of
work is unknown or unrelated, offer a context clear as described in
"Offering a context clear" above.

<!-- /uclusion-workflow:v1 -->
