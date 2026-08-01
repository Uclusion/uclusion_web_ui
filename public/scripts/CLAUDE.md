<!-- uclusion-workflow:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion job workflow

You have access to the Uclusion MCP server. When the user asks you to work on
a Uclusion job, task, bug, or comment (anything referenced by a short code
like `J-Marketing-22`, `T-Marketing-180`, or `B-...`), follow the workflow
below.

Whenever you have no specific work in front of you, call `find_work` on
your own initiative — do not wait to be asked — and present what it returns
as a numbered list of options. This applies in two moments, not just one:

- **At the start of a session** when the user has not named a specific job,
  task, file, or question. Treat a greeting or an open-ended "what should I
  do?" as no specific work.
- **Right after you finish a piece of work** and nothing else is queued.
  Finishing is not a stopping point — before you report back and go idle,
  call `find_work` so your "done" message already carries the next options.

The user will either pick one of the options or point you at something
else. The only time you skip this is when the user has just named concrete
work to do next; reaching the end of a task is itself a trigger, not an
exemption.

Present the list plainly. Pokes deferred while working (see "Wait for
Poke AI": processing is single-threaded and out-of-lane Pokes are set
aside, not acted on) need nothing more at this point: the state each
one reported is already in Uclusion, so the find_work list is the
current picture of what needs attention. A deferred `Start` never
converts into an auto-start when your current work finishes — if the
human still wants it worked, they pick it from the list. Deferred Pokes
never count as the user having "named concrete work" and never skip
this step.

When `find_work` comes back with no work, ask "Your find work list is
empty — would you like instructions for adding and working on a job?" If
the user says yes, walk them through the instructions the tool returned
with the empty list: creating a job, running find_work, selecting from
the list, keeping a job out of Doable until it should start, checking
the job's Debatable section in Uclusion for questions and suggestions,
and using Poke AI after responding so you continue without them typing a
separate chat message.

## Wait for Poke AI

The Uclusion MCP proxy writes inbound Poke AI prompts to a local queue on
this machine. Establish the supported delivery path at the first reasonable
opportunity in every session — before `find_work` or any job work. A client
with the Codex bridge must leave queue ownership to that bridge; every other
client with a real event monitor keeps exactly one listener running for the
rest of the session. Do not wait until you are blocked on human activity:
answers, votes, approvals, stage changes, review feedback, and new work can
arrive at any time.

How you listen depends on what your harness can consume; use the first
path below that it supports.

**Codex launched with `uclusion codex`:** do not run `uclusion wait` or
`uclusion listen`. The launcher creates one private Codex app-server backend
and a Uclusion companion with a separate frontend Unix WebSocket. Codex TUI
connections use only that frontend; the companion relays each connection's
Codex JSON-RPC traffic and uses a separate auxiliary backend connection for
Poke delivery. Global `-c`/`--config`, `--enable`, `--disable`, and
`--strict-config` passthrough flags are applied to both the TUI and its private
app-server; other passthrough arguments remain TUI-only.

When the user deliberately wants to discard only the backlog for this Codex
consumer, launch with `uclusion codex --ignore-existing-pokes`. The companion
atomically skips Pokes already present when it acquires exclusive bridge
ownership; Pokes arriving afterward are delivered normally. This does not
delete inbox rows, skip update notices, or advance any other consumer.

The relay, not lifecycle hooks or app-server broadcasts, owns the primary
thread identity. The first successfully initialized `clientInfo.name=codex-tui`
connection is authoritative. A successful `thread/start`, `thread/resume`, or
`thread/fork` response correlated to that connection establishes its
input-owning root as primary. Auxiliary picker connections may coexist, but
they never change authority. `/side` and `/agent` may transiently display
another transcript without retargeting Pokes; side agents, detached reviews,
and other transient threads never become primary. One serialization barrier
orders authoritative primary switches against each Poke admission through the
app-server response, so the Poke targets the primary that is current when
Codex accepts it. When that primary has a regular active turn, the companion
uses `turn/steer` with the Poke's durable message id—the same behavior as
typing the prompt and pressing Enter. When the primary is idle, it uses
`turn/start`. Review and manual-compaction turns cannot be steered, so their
Pokes remain queued until the turn changes or ends. Update notices remain
idle-only. An admission RPC response means only that Codex queued the input:
the companion advances its cursor only after the exact durable message id is
committed as a completed user-message item (or recovered from full thread
history). A response-to-lifecycle gap for a human turn, inline review, or
manual compaction remains provisionally busy, so a Poke cannot start a
competing turn in that interval. The barrier does not prevent a later
intentional switch.

Until the TUI is connected and has an authoritative live primary, the companion
does not peek, reserve, reconcile, or advance its queue cursor. No Uclusion
hooks need to be enabled or trusted. Perform the normal beginning-of-session
work, including `find_work` when no concrete work was named. If the companion
cannot establish its private frontend/backend path, run `uclusion update` and
restart through `uclusion codex`. The generated project install does not carry
the maintainer architecture document; in the Uclusion source tree its path is
`public/scripts/UCLUSION_CODEX_BRIDGE.md`.

**Bare Codex CLI/TUI, and Cursor chat agents:** a background process cannot
reliably wake an idle turn. In Cursor, hour-long `wait`, `listen`, and Shell
`notify_on_output` have all failed to start a real agent turn on poke arrival
: the harness may only surface a generic “task finished” notice, or
a hung/`pkill`'d waiter can claim prompts that no model ever sees. Never leave
`wait` or `listen` running in these surfaces. At the beginning of each real
user-triggered turn, synchronously drain only the already-pending backlog:

```sh
uclusion wait --timeout 0
```

Handle every returned line before the user's new request, then continue to
`find_work` when appropriate. Autonomous Pokes work in sessions launched
through `uclusion codex` (Codex bridge) — that path is fine. This bare
turn-start drain has no session identity, so it advances the shared
`default` cursor: concurrent bare drains share that one lane,
and the human can give a session its own lane by setting the
`UCLUSION_CONSUMER` environment variable for it.

**Cursor stop-hook drain:** the Cursor install also registers a
`stop` hook (`uclusionCursorPokeDrain.py` in `~/.cursor/hooks.json` or the
project `.cursor/hooks.json`) that runs the same zero-timeout drain when an
agent turn ends, scoped to a per-conversation cursor so one
chat's drain never consumes another session's delivery. If lines are
claimed, the hook returns them as
`followup_message` so Cursor auto-submits the next user message. That covers
Pokes that arrived *during* a turn; it does **not** wake a fully idle chat.
Keep the turn-start drain above for idle backlog. Bare Codex without the
bridge still needs a human chat turn (or a pasted poke).

**Clients with a persistent line-event monitor (Claude Code's Monitor
tool):** launch the streaming form once per session and leave it running:

```sh
uclusion listen
```

In Claude Code arm it with the Monitor tool — command `uclusion listen`,
`persistent: true`, and a description naming the Poke stream. `listen`
never exits: each claimed prompt prints as one line that the harness
raises as an event, so there is no timeout, no completion notice, and no
relaunch choreography — a quiet hour is completely silent. Several
stacked prompts arrive as consecutive lines, possibly batched into one
notification: handle every line, in arrival order, and when several name
the same lookup short code one `get_job` covers them. A direct prompt's
lookup code is its only short code; a compound option prompt's lookup code
is the parent question after `of`. If the stream ever ends (the monitor is
stopped or dies), arm it again — a re-armed listener is a NEW session
cursor that starts at arm time, so nothing older is redelivered; simply
continue.

A fresh listener starts past the backlog automatically, so there is
nothing to discard when arming one. The `--ignore-existing-pokes` flag
(`listen` and `wait` both accept it) matters on the shared `default`
cursor, whose pending backlog is otherwise live work for turn-start
drains. The cutoff advances only that consumer's cursor past the Pokes
already in the inbox: later arrivals are delivered normally, no inbox
rows are deleted, other sessions keep their own cursors, and update
notices still appear. Never add the flag on your own initiative —
skipping the `default` cursor's backlog without an explicit instruction
silently drops live work.

The reverse ask is also supported: when the user explicitly asks to see
the old backlog — to inspect what queued while they were away, or for a
scheme of their own such as taking the first `Start` no other session
has already taken — arm with `uclusion listen --deliver-existing-pokes`
(`wait` accepts the same flag). The session's fresh cursor then starts
at zero and the retained backlog is delivered to it as a private copy,
unmarked and in arrival order, with no effect on any other consumer;
handle those lines exactly as the user's ask directs. Never add this
flag on your own initiative either.

**Clients whose harness turns a background command's completion into a new
agent event:** run the bounded wait as a background (detached) task and
relaunch it after every completion. Merely being able to poll a dormant
process later does not qualify; bare Codex and Cursor chat are explicitly
handled above — a generic completion notice is not enough.

```sh
uclusion wait --timeout 3600
```

The hour-long timeout is deliberate. The wait polls the local inbox every
quarter second, so a prompt is claimed just as fast as with a short timeout —
but a quiet hour produces ONE completion notification instead of a stream of
them. Always pass `--timeout 3600` explicitly: the CLI's default is a short
55-second wait for contexts that cannot background the call. Never run the
hour-long form in the foreground: a blocking wait freezes the conversation
for the full timeout and the user cannot get a command in. A silent return
means the timeout expired, not that waiting is finished or that you may
finalize: relaunch the background wait — a session keeps one running at
all times. When prompts have arrived, one wait prints the WHOLE pending
backlog, one prompt per line, before exiting, so a stack of pokes costs a
single exit/relaunch cycle: handle every printed line, in arrival order,
then relaunch. When relaunching after an empty timeout, keep the
accompanying chat status line to a single short sentence — though when the
turn also owes the user content, that content belongs in the same final
message, after the relaunch.

**Clients with neither mechanism:** do not run the wait at all — end your
turn and let the user's next chat message or session pick up the queued
prompts instead.

Ending the session while the listener or wait is running is safe. If the
client warns about background work at exit (Claude Code lists the monitor
and offers choices), pick the plain exit — "Exit anyway": the next session
arms its own listener, and prompts arriving in between persist in the
local inbox until claimed. Never keep a poller alive past its session
("Move to background and exit" or similar) — a poller that outlives its
harness claims prompts no agent will handle, and a prompt is never
delivered twice. On POSIX systems the CLI enforces this itself: an
orphaned `wait` or `listen` notices its parent died and exits before
claiming anything. Native Windows cannot detect parent death, so there
the exit choice genuinely matters.

Launch order within a turn matters: arm the listener (or relaunch the
wait) BEFORE writing the turn's final chat message. In some clients
(Claude Code included) text written before a tool call may not display, so
the order content → launch → short status line hides the content and the
user sees only the status line. Put everything the user needs to read —
find_work lists, questions, review reports — in the final message AFTER
the launch.

Use the same environment flag as every other Uclusion CLI command; for
example, stage is `uclusion -e stage listen` or `uclusion -e stage wait
--timeout 3600`. However you listen, triage every delivered line in
arrival order against the ONE job or bug you are currently working —
processing is single-threaded by default. Your lane runs
from the moment you begin a job or bug's workflow (reading and questions
included) until you post its review or it blocks on the human. A line
about that work (the job or bug itself, or anything nested in it) is
handled immediately as described below. A line about anything else is
DEFERRED: do not reload its target or act on it — briefly tell the human
you received it and are setting it aside for now, and keep working. One
exception to defer-without-reload: a direct code you cannot place — not
your current work and not visible in its markdown, as any freshly Added
item is — gets ONE classification reload with `get_job`; if the enclosing
work is your lane, handle it, otherwise mention what it belongs to and
defer with no further action. The mid-work mention is best-effort (some
clients hide text written between tool calls). The human can override
at any moment ("take that up now"); otherwise a deferred line needs
nothing more — the state it reported is already in Uclusion, and the
find_work you run when the current work finishes shows whatever still
needs attention. When no job or bug is active, every line is handled
immediately, making its loaded target the active work subject to the
same stage and workflow checks whatever the verb. Correlated Poke
prompts use four verbs whose first word is a contract:

- `Start <target>` is reserved exclusively for an explicit human click on
  Poke AI in the UI. When you are idle, treat it as the user's instruction
  to start or resume the named work. When you are mid-job/bug and the
  target is outside that work, defer it like any out-of-lane prompt —
  with broadcast delivery the click may be meant for another session, so
  mention it and continue unless the human tells this session to switch.
  A deferred `Start` does NOT convert into an auto-start when your
  current work finishes — by then another session may have taken it or
  the click gone stale; if the human still wants it worked, they pick
  it from the find_work list. A `Start ... (replayed)` line is history,
  not an instruction — drop it like every replayed line. Only an
  unmarked, live `Start` while idle starts work. Automatic collaborator
  activity never uses `Start`.
- `Added <target>` reports that a task, grouped task, question, suggestion, or
  blocker was created.
- `Updated <target>` reports a response-worthy edit, move, deletion, assignment
  change, description change, or explicit stage change.
- `Responded <target>` reports human activity that hands an outstanding turn
  back to the AI.

Each verb can use a direct target, such as `Updated J-all-123`, or the compound
option grammar `<verb> <local-code> of <parent-question-code>`, such as
`Added C-1 of Q-all-556`. For a direct prompt, call `get_job` with exactly its
short code; `get_job` will load the enclosing job when the target is nested.
For a compound prompt, call `get_job` with the parent `Q-...` code after `of`,
then locate and act on the named local item within that question's options.
The first code is local to the option market and is not globally resolvable;
never call `get_job` with that local code alone.

`Added` and `Updated` are additive event notices, not instructions to replace
the work already underway. When the target is inside the job or bug you are
working, reload it as described above and incorporate the new state — do not
abandon the work merely because the event arrived. The reloaded job's current
stage still governs what work is allowed: if it locks execution, respond to
whatever assistance it awaits, and if the job then remains blocked on the
human, treat the work as finished for now and run find_work.
When the target is outside your current work, defer it unreloaded as
described above. If no work is currently active, make the loaded target
active subject to the same stage and workflow checks. When a direct job-item
target was soft-deleted, `get_job`
identifies that deletion and returns the current enclosing job with the deleted
item absent; incorporate the removal into the active work.

A direct lookup makes five short-code attempts total, with 100, 200, 400, and
800 millisecond backoffs after an initial 404. This is bounded recovery for a
lagging short-code index, not proof that a newly added code is absent. If a
direct `Added` target still returns 404 after those attempts, retry `get_job`
later instead of discarding the event.

When adding an item causes a derived stage or readiness change, Uclusion
deliberately withholds that item's `Added` event until the workflow write has
committed. The one event keeps the item's exact short code, and its `get_job`
reload is causally refreshed to include both the new item and the current
stage. Do not expect or wait for a second stage Poke, and do not continue from
a stage value cached before the reload.

The listener also doubles as the update watcher: at launch and every 15
minutes or so after, it compares the installed Uclusion release against
the current one, and the first time it sees a newer release it prints a
"[Uclusion update notice ...]" line instead of a prompt — `wait` exits
after printing it, while `listen` keeps running. Handle the notice exactly
as described in "Updating the AI connection"; whether the user granted or
declined, the notice never repeats for the same release. After loading a
correlated `Responded` target inside your current work, immediately perform
every workflow action the response unblocked; a `Responded` outside it is
deferred like any other out-of-lane prompt. A legacy bare `Responded.`
prompt has no target: when idle, call `get_job` for every currently
outstanding Uclusion dependency so no response is missed; when mid-work,
reload only the current job or bug and note that other outstanding
dependencies may have responses waiting — the find_work you run when
the current work finishes surfaces them.
Do not merely report the response or stage change; if the job still
depends on human activity after those actions, resume polling.

Prompts are delivered in arrival order and stay in the queue until they age
out, so nothing is lost while you work. Delivery is broadcast per session:
every agent session has its own delivery cursor and sees every prompt
that arrives while it is armed —
a listener auto-generates a per-session identity, the Cursor stop hook
scopes its drain to the conversation, the Codex bridge keeps its dedicated
cursor, and only a bare `wait` with no session identity falls back to the
shared `default` cursor (the `UCLUSION_CONSUMER` environment variable gives
such a surface its own lane when the human sets it). A brand-new
session's cursor starts at arm time: the retained backlog is history it
never receives, and anything still needing attention is on find_work.
(An older CLI may still deliver backlog lines suffixed ` (replayed)` —
drop them on the floor: no reload, no action.) Within one session a prompt is
delivered once; across sessions everyone gets a copy. Single-threaded triage is what
makes that broadcast safe whether one session runs or five: your lane is
the one job or bug you are working, prompts outside it are deferred with a
mention, and when several agents run at once the human divides the labor.
When a reload shows a prompt's work already handled by another session,
incorporate that state and move on — never race to claim it. Do not try
to coordinate sessions through the inbox. `--consumer` remains the human's knob for
explicit multi-agent schemes; without such an instruction, never pass
`--consumer` or set `UCLUSION_CONSUMER` yourself. A newer chat instruction
does not require stopping the listener: handle the instruction while it
keeps listening, and treat anything it delivers meanwhile as your next
instruction after that. Do not read, edit, or delete the inbox database
directly.

## Updating the AI connection

When a tool result, `uclusion listen` event, or `uclusion wait` output
contains a "[Uclusion update notice ...]" block, the local Uclusion install
(CLI, MCP proxy, and workflow docs) is older than the current release. Tell the user and ask their permission to run `uclusion update` (with
the same `-e` environment flag as every other Uclusion CLI command). If they
grant it, run the command from the directory the session is in, then remind
the user to restart the AI client session — or reconnect the Uclusion MCP
server — so the updated connection loads. If they decline, continue without
updating and do not ask again that session. `uclusion update --check` reports
status without changing anything.

## Workflow

Run the steps in order. Don't skip ahead: questions and suggestions come
BEFORE approval, approval comes BEFORE execution, and review comes AFTER a
testable result exists.

The job's **stage** is not the same as your **step**. The stage (for
example "Approvable" or "Doable") tells you which actions Uclusion
permits right now — it does NOT tell you which step you are on or let you
skip earlier steps. Finding a job already in "Doable" does NOT mean your 
step-2 questions and step-3 suggestions are done.

"Requires Input" means an open question or suggestion on the job is
waiting on a human, and it locks execution exactly like a job that never
reached "Doable": respond to the open assistance, and implement only
after the job is back in "Doable". Because assistance can open at any
moment, recheck the stage right before you start editing files — not
just when you first read the job.

Always read the job, raise every question you have, and make your
suggestions first; reaching "Doable" only unlocks execution once those
questions are answered.

When working on a Uclusion job, ALL workflow artifacts — questions,
suggestions, approvals, votes, info notes, resolutions, and review
requests — go through the Uclusion MCP tools (`ask_question`,
`make_suggestion`, `approve_job_or_option`, `vote_on_suggestion`,
`add_info`, `resolve`, `ask_for_review`). Do
NOT substitute a built-in or local equivalent (e.g. `AskUserQuestion`,
inline multiple-choice prompts, chat-only "which would you prefer?"
messages, plain-text approvals or progress reports in chat). The only
exception for using another tool to ask, suggest, approve, note, resolve, or report
is if your question is not about the job but about this flow or something else.

This applies even when the user critiques your prior work and asks you
to try again ("this isn't good, redo it", "attempt again", "the X is
wrong"). The clarifying questions you need before redoing — what
specifically is wrong, which direction to take, what to keep vs. throw
out — are step-2 questions and belong in Uclusion via `ask_question`,
not in a local clarification prompt.

### Plan mode

Plan mode's harness banner ("do not run non-readonly tools", "the only file
you may edit is the plan file", "this supersedes any other instructions")
governs changes to the user's machine and repo — file edits, config changes,
commits, installs, deploys. It does NOT govern the Uclusion MCP tools.
Posting to a Uclusion job is not a system change; it IS the plan medium.
Filing a question or writing the plan into the job is the Uclusion
equivalent of editing the plan file, and it is expected during plan mode.
So do NOT lump `ask_question`, `add_info`, `make_suggestion`,
`approve_job_or_option`, or `resolve` in with file edits and commits, and do
NOT defer them until plan mode exits.

Concretely, while in plan mode:

1. **Questions go through Uclusion — when they arise, not later.** Any
   step-2 question — including a choice between approaches you would
   otherwise surface for a plan — is filed with `ask_question` (and your
   preference voted with `approve_job_or_option`) the moment it comes up,
   not held for after approval and not asked in chat or a local prompt. The
   only questions that may go through a local prompt are ones not about the
   job (about this flow itself, tooling, etc.).
2. **Put the plan in Uclusion before you call ExitPlanMode.** Adding the
   plan to the job with `add_info` is a required step of planning, not part
   of execution. A plan that lives only in chat or in the local plan file is
   not done. After posting, tell the user you placed it in the job and link
   it by its short code.

If you are about to call ExitPlanMode and have not yet posted the plan to
the job, stop and call `add_info` first.

### 1. Read

Call `get_job` with the short code to load the job and all its child tasks,
grouped tasks, questions, suggestions, blockers, and reviews. Notes are only
included when `include_all_resolved` is true, except a note with a reply which
is always included; the same flag also returns resolved comments in full
instead of truncated.

If calling get_job comes back with only a single comment, no Job J-... header,
then use the single comment workflow below.

### 2. Ask questions

Call `ask_question` for anything ambiguous OR for any judgment call the
job doesn't pin down where a reasonable reviewer could pick differently
(visual density, which of several real artifacts to reference, whether
public-facing content should mention a known caveat, tone, scope cuts,
etc.). "I have a default in mind but the user might disagree" is a
step-2 question, not a silent decision. One tool call per question — do
not pack multiple questions into one. Provide options when there is a
discrete set of choices. 

Options-style questions are not the only kind, and they are not the
default. When you do not actually understand something the job depends on
— how to reproduce a bug, what an observed behavior was, which screen or
flow the report is about, what a term refers to, why the author believes
the current behavior is wrong — ask a plain open-ended question with NO
options via `ask_question`. Do NOT paper over the gap by reconstructing a
plausible story from the code and proceeding on it; reverse-engineering
"the path that would produce this bug" is a guess, and guesses get shipped
as the wrong fix. For any bug whose reproduction steps are not spelled out,
ask for the actual steps before you diagnose. Asking "I don't understand X,
can you show me how to hit it?" is expected and welcome — far cheaper than
confidently fixing a bug you only imagined.

The same bar applies to the cause and the fix, not just the symptom. A
clear symptom — even a precise statement from the author of both what
happens and what they want instead — does NOT clear you to diagnose and
patch from inference; knowing the wanted behavior is not knowing why the
code misbehaves or where to change it. Be most suspicious exactly when the
code at the reported spot already looks correct: if it already does what
the author asks and you find yourself theorizing that the real cause hides
in a layer you cannot see — a value that "must be getting overridden,"
"ignored," or "clobbered downstream" — you are inferring runtime behavior
you have not observed. If you cannot name the single line that produces the
wrong behavior without a chain of "this must then propagate to that," that
chain is the guess — ask the person who saw the bug what they actually
observed; their answer confirms or kills the theory far more cheaply than
shipping a fix in the wrong place. The tells that should stop you: "the bug
must be…", "this is presumably…", "I think the author means…", "the only
way this is a real bug is if…", "this already looks right, so the real
problem must be…", "it must be getting overridden somewhere else."

If you have a preferred choice among the options for a question then
vote on it with `approve_job_or_option` to inform the user of your opinion.

Once you have voted a preference, hold a reasoned position. Do NOT reverse
your recommendation just because the user restates, emphasizes, or pushes back
on a priority — emphasis is not new evidence. Change your vote only when new
evidence or a genuinely changed requirement warrants it, and when you do, say
explicitly what changed. If the user stresses a concern, fold it into an honest
tradeoff — and name the fact that would settle the choice — rather than
silently flipping to agree. Flip-flopping to match the user's tone erodes trust
in your judgment.

A question counts as answered when there is a "For" vote on one of its options that is not 
marked "From AI user" or when a not AI user has replied in the question with a clear direction.
A question also counts as answered when a human resolves it without a vote or reply. That
resolution means the human accepts the risk described by the question and wants to preserve
the current behavior; it does not silently select one of the question's options. Do not reopen
or re-ask the question merely because no reply was recorded.

Even once answered, if the not AI users' votes are all marked less than or equal to 50 out of 100
and you are able to come up with an option that you are more certain of than your 
current vote, you can propose that new option using `add_options`.

Call `resolve` on questions you feel have already been answered and require no 
further operations. Do not resolve a question and then reply or other operation to 
something inside of it - that will error.

When you receive a reply, if there is any ambiguity at all in what it means,
reply to that reply asking for clarification instead of resolving the
question. Resolve only when the direction is completely clear.

Do this immediately when you first become aware the question is answered
or otherwise it is harder for the user to see what needs attention.

Only options that are in stage 'Approvable' can be voted on or 
considered as choices for answering the question.

If later — while approving, executing, or writing the review — you
catch yourself wanting to say "flag if you'd rather X", "verify that Y
reads correctly", or "does this feel right?", that is a step-2 question
you missed. Stop and file it via `ask_question` before continuing.
Never defer such questions to the step-6 review report.

#### Visual options are an aid, not the option itself

A job may ask you to show choices visually — a temporary build file or page
with each option labeled, screenshots taken with Playwright, and so on. That
temporary file is only a *picture of* the choices. The canonical, votable
options still live on the question in Uclusion, created with `ask_question`
(or `add_options` to extend an existing question). A choice that exists only
as a labeled panel in a screenshot, or as prose in an `add_info` reply, is
NOT an option — the user cannot vote on it and the next session cannot see it.

- **Every direction you show must be a real Uclusion option.** When you share
  the visual, make sure each labeled choice already has a matching option on
  the question — `ask_question` creates the initial set; `add_options` adds
  more to an existing question.
- **Label each visual panel with the option's Uclusion identity** — its short
  code (`O-1`, `O-2`, …) and/or its exact option name. Do NOT invent a
  parallel scheme (A/B/C, 1/2/3): it shadows the platform's `O-` short codes,
  and the user cannot tell which votable option a panel maps to.
- **Keep the picture and the live options in lockstep.** If you revise the set
  — drop a direction, change what one means, or add a new one — update
  Uclusion in the SAME turn: `add_options` for new directions. If an existing
  option's meaning has changed, do NOT silently reuse its label; either keep
  the label tied to its original meaning or `resolve` the stale question and
  open a fresh one. Never let a screenshot show options that differ from the
  options currently on the question.
- **Labels are stable identifiers.** Once `O-1` means a thing, it keeps
  meaning that thing. A later iteration that means something different is a
  new option, not a relabel.

### 3. Make suggestions

Call `make_suggestion` when you see a better path than what the job
describes. Suggestions are how you push back without blocking; use them
instead of silently doing something different.

This is not limited to jobs. Whenever you feel strongly enough about an
idea that you would voice it as a suggestion in chat — an improvement,
a better approach, a follow-up worth doing — do NOT make it a chat-only
remark. First create the suggestion in Uclusion with `make_suggestion`
(omit `job_id` when it is not about a job — the suggestion then lives at
the view level), and only then tell the human about it in chat, including
the link returned on creation. A suggestion that exists only in chat is
invisible to other sessions and cannot be voted on.

Suggestions also flow the other way: a suggestion a human authors on a
job is addressed to YOU. Reply with a definitive accept or reject and
what you will do about it — never a noncommittal acknowledgment, and
never deferring the decision back to its author. When the markdown
states voting is enabled on the suggestion, also record your position
with `vote_on_suggestion` (for or against, certainty 1–5, and your
reason) so it is weighed alongside the human votes that may arrive to
settle it; the reply still carries the decision and next steps. When
voting is not enabled, your reply is your whole signal. Do not vote on
suggestions you authored — creating one already states your position.
An open human
suggestion holds the job in "Requires Input", so answer it before any
implementation. When your accept changes the plan, record the change
(update or add tasks, or `add_info`), and `resolve` the suggestion once
it is settled and acted on.

When a human resolves an AI-authored suggestion without a reply or vote,
treat that as accepting the risk the suggestion described and declining
the proposed mitigation. Do not reopen or recreate the suggestion merely
because no explicit accept/reject reply was recorded.

**Precondition — do NOT offer to do work on a task or approve the job while any question on it is still open and unanswered.** 

If some tasks in the job are completely disjoint from other tasks you may ask the user about starting 
them before questions on the other tasks are answered.

### 4. Approve - only applies if job is in stage "Approvable" and there is no "From AI user" approval at the job level.

Offering to approve a job with open questions defeats the workflow, because the
implementation decisions those questions gate aren't pinned down yet.

Call `approve_job_or_option` with a certainty score (1–5) and a written
reason. Feel free to give a low certainty if the job is not well designed or
is not providing clear value for customers.

Before you approve, surface and test the job's premise — do not assume it.
Most jobs carry an unstated assumption about why they are worth doing: the
strategy behind them, the value they deliver, or that the described approach
will actually work. Name that premise explicitly and ground it against
evidence you can reach — related and sibling jobs, prior decisions, and prior
results already in Uclusion, plus plain reasoning about whether the approach is
likely to succeed. If the premise is weak, untested, already contradicted by
an earlier decision, or you need more information that is a step-2 question: file 
it with `ask_question`. A low or moderate certainty with a written
reason is the correct outcome when the premise does not hold up — approving on
the author's say-so is not. Do this on your own initiative; the user should not
have to challenge you before you check whether the job is actually worth doing.

If the job markdown says that the AI user is a required approver then approval
is mandatory. Otherwise ask if you should approve the job.

### 5. Execute and document - only applies if the job is in stage "Doable"

"Doable" means a human has accepted this job into the work queue, which
unlocks implementation. It does NOT mean steps 2–3 are behind you: an
already-Doable job STILL requires you to first read it, file every
question you have, and make any suggestions. Begin implementation only
once all of your questions are answered — never assume "Doable" implies
there is nothing left to ask.

If the job is not yet in stage "Doable" and you are ready to begin —
having had all your questions answered and made any suggestions — then
offer to change the job's stage to "Doable" for the user or ask the user to 
change it himself.

If the user instructs you to move a job to "Doable", that instruction means
both change the stage and immediately begin or continue execution, unless the
user explicitly says the change is stage-only or says not to start. A stage
change is an intermediate workflow transition, not completed work. In the same
turn, change the stage, call `get_job`, perform the sweep below, and execute the
active tasks. Do not send a final response merely reporting the stage change
while actionable tasks remain.

**Before doing ANY work in this step, first sweep the job:**

- Call `resolve` on every open question whose answer is already in the job,
  a "For" vote on an option that is not marked "From AI user" or a clear reply 
  from a not AI user. Open-but-answered questions left dangling will confuse later 
  sessions.
- Call `resolve` on tasks that turn out to be already done — sometimes a
  task is listed as active but the work is already in the diff, in a prior
  resolved item, or no longer applicable. Don't re-implement those; resolve
  them instead.

Only after that sweep should you start the implementation work.

When instructed to start work, do the task and its grouped tasks. Do not 
attempt to do tasks that start with Resolved in front of their short codes.

As you go:

- Call `resolve` on tasks you have finished.
- Call `add_info` at the job or task level for anything someone reviewing
  the work should know (decisions, trade-offs, follow-ups, anything
  non-obvious from the diff).

### 6. Ask for review

**Precondition — if the review you are considering posting includes actionable items like testing that should be done then file those items as suggesions before opening the review. You can then reference the opened suggestions in the review.** 

When a set of tasks has a testable output, call `ask_for_review` with a
concise progress report describing what is ready to look at. This is the
signal that human or AI review can begin.

When a job is in "Reviewable", do not infer who should review from the
stage alone. Reload the job and inspect the author of the latest comment
in its Reports section:

- If the latest review comment is marked "From AI user", it is your review
  request asking the humans to review work the AI completed. Do not review
  that work again. Handle any explicit feedback or status change carried by
  the Poke; otherwise wait for a human review.
- If the latest review comment is from a human, the human is asking the AI
  to review work the human completed. Perform that review and respond to the
  human's review comment through Uclusion.

A Poke on a Reviewable job is only a signal to reload its current state; it
does not override the direction established by the latest review comment's
author.

Write the report as if the code will not get checked in: the review plus
the job's other artifacts (questions, suggestions, notes) must together
hold enough detail to reproduce the code without human help. Do not lean
on the diff — name the approach taken, the files and functions changed
and how, and the decisions that shaped the implementation. If something
needed to rewrite the work exists only in the diff or in chat, add it to
the job with `add_info` before opening the review.

The report describes finished work — what was built, what was skipped
and why, which tasks are now depicted and safe to resolve. It is NOT a
place to surface choices you should have asked about earlier. If the
report contains "verify that X reads correctly", "flag if you'd rather
Y", or any other request for the user to validate a judgment call you
already made, those are step-2 questions. Go back, file them via
`ask_question`, and only then send the review.

End the report with a signature line naming the AI product, exact model
version, and effort level that wrote it, for example
"— Claude Code (claude-fable-5, high effort)".

## Notifications

The human's Uclusion inbox for this workspace is reachable through
`get_notifications`, which returns their notifications as markdown — most
urgent first, each with the short code it is about. Use it when the user
asks what needs their attention, to review the inbox for them on
request, and automatically at every completion moment as described
below.

Finishing work on something — you resolve a bug or job, open its
review, or the human signs off and the work is committed — triggers an
automatic inbox check, exactly like a completed job triggers the
dependency sweep: call `get_notifications` at that moment and look for
notifications about the short code(s) just worked. Never reuse an
earlier check — the finished work itself generates notifications, so an
inbox that was empty before the work says nothing about it now. If
notifications about that work exist, list them and ask in chat whether
to clear them, exactly like you ask before committing: "Want me to clear
these notifications for B-x-12?" No notification about the finished work
is exempt from that ask — including the review report's own
notification: it may look load-bearing while the review is pending, but
once the human has signed off it is clutter like the rest. If none
exist, do not ask — never offer to clear notifications you have not
seen. Call `clear_notifications` with that short code only after the
human explicitly agrees; never clear unprompted, and never clear
anything broader than the object the permission named. Asking is the
only way to guarantee nothing in the inbox is lost. Clearing follows the
UI's own safety rule — unread notifications are removed, persistent ones
just lose their highlight.

## Searching the workspace

The whole workspace exports to local markdown: every job, task, bug, note,
question, and suggestion with its options, votes, and reasons — resolved or
not. Run `uclusion export` in the shell and search the file it reports
writing whenever the user asks anything the workspace data can answer and
the answer is not already in front of you. That is much broader than
decision recall — for example: "do we have a backlog job that includes work
X?", "did we resolve a bug on Y recently?", "who approved Z and how certain
were they?", "what is still open on the mobile release?".

Recency questions are answerable directly from the file: job, comment,
reply, and vote lines carry an "(updated YYYY-MM-DD)" annotation — the UTC
day that item last changed (a new item shows its creation day). The export's
own legend header restates this. So "what changed this week?" is a date
scan, not a guess; remember the days are UTC, which can run one day ahead of
the user's local calendar.

Present each found item with enough inline detail to judge relevance — you
have the full contents locally, so never make the user open Uclusion just to
see what a result says. Offer to drill into any found item right in the
conversation, and include each item's short code so the user can open the
live object in Uclusion when they want to act on it.

Decisions are the special case: before re-opening a debate, or whenever you
need to know if something was already decided ("what did we decide about
X?"), search the export first. Cite what you find instead of re-litigating;
reopen a found decision only when there is new evidence.

## Job dependencies

There is no first-class depends-on link between jobs; the convention is a
blocker whose text links the dependency. When job A cannot start until job
B completes:

- **Record it as a blocker on A that links B.** You cannot create blockers
  through the MCP tools, so ask the user to add a blocker on A that links B
  — typing `#` in the blocker text picks the job to link — or names it by
  short code (for example "Blocked until J-x-22 ships"). The blocker moves
  A out of the doable flow and shows the reason and the link in one place.
- **Sweep for unblocks whenever a job completes.** Completion moments: you
  `resolve` the job, its J- short code goes into a commit message, or the
  user tells you it shipped or is done. At each one, run `uclusion export`
  and search the file for the completed job's short code inside open
  blockers on other jobs. For each hit, show the user the blocked job and
  offer to `resolve` its blocker so that job re-enters the flow. Do not
  resolve without asking — the blocker may be waiting on more than the
  completed dependency.
- A dependency known before work starts does not always need a blocker:
  simply not moving the job to Doable also prevents execution while
  approval proceeds. Use a blocker when the wait should be visible on the
  job itself and caught by the completion sweep.

## Notes

- Every question, option, suggestion, approval, and progress note lives
  inside the job. Don't summarize them away into chat replies — write them
  as Uclusion artifacts so the next session (yours or someone else's) can
  pick up the thread.
- The short code (for example `J-Marketing-22`) is the canonical id. Use it
  verbatim when calling tools, in the chat, commit messages, and code comments
  that are not refererencing a question. For a code comment that references a 
  question use the full link returned on question creation if you have it.
- After the job review has been opened and you are offering to commmit, 
  the commit message should begin with the short code of what was done. However 
  a job short code, begining with a 'J', in a commit message indicates the job is 
  done so only use it when there are no tasks left on the job.
- A completed job may unblock others — whenever a job finishes, run the
  completion sweep described in "Job dependencies".

# Uclusion single comment workflow
A single comment markdown has no Job J-... header.

For a single comment that is a bug use only `get_job`, `add_info`, and `resolve` tools.

If the single comment that is a question use only the tools `get_job`, `add_info`, and for options inside it `approve_job_or_option`.

## Notes

- Offer to commit after resolving and the commmit message should begin with the short code 
  so that any action invoked by the commit can use it.

Use `add_info` to ask questions or explain the work done. 

<!-- /uclusion-workflow:v1 -->
