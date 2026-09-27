<!-- uclusion-skill-reference:v1 -->
# Uclusion operating procedures

## Durable threading and commit identities

Record substantive information once with the tool and artifact that own it.
Use `add_info` only for findings, decisions, blockers or next steps missing from
the durable thread. Do not add notes that merely recap a question and answer,
capsule, state transition or completed instruction reload. A decision belongs
in the capsule when drafting or making an already permitted revision; avoiding
a duplicate note does not authorize rewriting a sent capsule. Required reviews,
completion-package records and audit telemetry remain mandatory without an
extra recap note. Reply on the exact comment being answered, not its thread
root; flat root replies separate answers from their questions and cannot be
re-threaded.

To correct an existing active AI-authored ordinary note, reply or option Info,
use `add_info` with `update_info_short_code_id`, `update_info_version` and the
complete replacement `info`, omitting the creation target `short_code_id`.
Supply the version returned with the body you actually read. Keep
`parent_question_short_code_id` for a record inside a question. On conflict,
reload and reconcile the current body; never retry with an unseen version.
Replacement preserves identity and threading without saving the old body or
adding a history note. Omitted attachment metadata keeps existing files.
Human-authored records, capsules, reviews, standing view notes and machine
audit records cannot use this form; retain their dedicated tools and
protections. `for_human` applies only to creation.

Use canonical short codes verbatim. A source-code comment that cites a question
uses the question's full returned link when available. After review opens, a
proposed commit message begins with the completed task/comment code. A job code
at the start means the whole job is done, so use it only when no tasks remain.

## Completion packages

A completion package is how finished work reaches the human for its
operational permission: one explanation of what `all` does, one human reply,
and one terminal record per attempt. It opens at a job's implementation review
and at a standalone bug's resolution. Its **package thread** is that exact
review, or that exact resolved bug. This section is its only statement; the
core skill and the other references point here.

### The review and when it opens

A job gets one review, opened without asking once every task you were asked to
do in that assigned job, in an executable stage, is written and tested; never
after each pass. Another open task, such as the human's own, only leaves the
job unfinished. The review is the capsule-delta report the core workflow
describes, naming each task and its current capsule. Opening it is required
documentation and brings the work to the human; it does not change the stage.

A finished task not related enough to the rest of its job gets its own review
instead; say why in that task's review. Once it is written and tested, call
`add_job` with its code in `task_short_code_ids`, `view_short_code_id` naming
its job, a name taken from the task, and a description naming the job it came
from. This is the human's standing request, so it needs no other permission.
The task keeps its code, thread and capsule. The new job starts in its job's
stage; if the result says it started in the initial stage, ask about its next
stage as the core workflow says. It joins your assignment beside the job it
came from, so waiting on its package does not stop the tasks remaining there.

A job is finished when everything its current capsule promises is built and
tested and no open task remains; an empty task list alone never shows that.
State in the review which you concluded and why.

Each open suggestion on the job is unfinished or deferred work that moving the
job to Reviewable would resolve and lose. Check the ones you hold and the
`open_suggestions` that `ask_for_review` returns. While any is open, end the
review, and the chat copy that ends the turn, by naming each one, including
those this pass created, and asking the human to convert it to a task or
resolve it; offer no package. End each later turn by naming the review and the
suggestions still open. When Pokes show none open, rewrite the review with
`update_review_short_code_id` to append the package, since a converted
suggestion is an open task. A standalone bug holds no suggestions.

### What the package says

End the review, or the bug's completion-sweep record, with the package. Then
print the same package in normal client chat, naming its thread, as the final
content of that turn's last message; anything printed earlier is lost in what
follows. Neither copy calls `ask_question` or creates assistance. Say exactly
what `all` does for this item, in this order:

1. commit only the reviewed changes, naming each repository with its files, or
   with a file count and compact scope when a list would be long;
2. push only those commits;
3. only when the pass finishes a job that is in Doable: move that exact job
   from Doable to Reviewable and immediately run its completion sweep;
4. clear only this work's notifications: the exact job when the pass
   finishes it, otherwise the exact review plus each task the pass resolved,
   and for a bug the exact bug with its replies. This runs last, one call per
   code with the terminal record on the last, so nothing the attempt writes can
   notify after it.

Leave out the commit and push when the work changed no repository files. A
bug's sweep record is written even when its sweep could not run, so a sweep
failure never suppresses the package. End with:
"Reply `all`, or tell me in your own words what you want, here or on <thread>."

### The reply

Only a reply from a non-AI, non-advisory human counts, on the package thread
or in normal client chat. `all` authorizes exactly the listed actions,
including a listed Reviewable move. Any other reply is an ordinary instruction
under the core workflow's authorization rules: it authorizes a stage change
only when it names the exact job and destination, and an ambiguous reply gets
one narrow clarification where it appeared. A reply declining everything
completes the package with no action. A later reply is a new instruction and
never repeats work that has already completed. The package never authorizes
tests, builds, deployment, security work, force-push, unrelated changes,
another job or bug, a broader clear, candidate mutation, or a context clear.

Until a reply arrives, retain the assignment and any work claim, and end each
later turn with one line naming the package thread rather than the whole
package. This wait is not a handoff: no claim release, work discovery, or other
job or bug.

### Carrying it out

A reply that arrives by Poke is read before acting; a chat reply needs no read.
Perform the authorized actions in the listed order and stop at the first
failure, without rolling back what succeeded. Having nothing to commit, push or
clear is a successful no-op. Whenever any action is authorized, make one
fresh notification check after the last commit or push and before the stage
move and clear, and list the item's matches.

The stage move and its sweep are one action: never one without the other. For
the move, call `change_job_stage` with `from_stage` Doable. A refusal naming
Reviewable means the job has already entered it, so run the sweep now; any
other refusal stops there with the stage preserved. After a successful move,
finish the sweep in the same turn before any handoff, discovery or other job. A
failed sweep leaves the job in Reviewable and is retried directly, without new
permission, before any lane switch.

Write exactly one terminal record for each attempt, on the package thread,
replying to the human's reply when it came from there and to the thread's root
when it came from chat. It states the reply, what completed, what failed, and
what remains. When the clear is authorized and nothing before it failed, pass
the record as `clear_notifications`' `record`: the server posts it silently,
then clears, even when nothing is left to clear. Otherwise post it with
`add_info`, silently when the clear was authorized. If a record's write outcome
is uncertain, reload the thread and write it only if absent. A retry under the
same reply reconciles what is already durable, performs only what remains, and
writes one new record.

After a successful package for a finished job now in Reviewable, release the
assignment under `pokes.md`'s Assignment ownership rule, once any clear and
triggered sweep are complete. An unfinished package keeps it.

## Notifications

Call `get_notifications` whenever the human asks for their inbox and at every
completion moment: opening a review, resolving a bug or job, or receiving
sign-off and committing. A failed check never delays or suppresses a package.
The package is its item's only clear offer. Outside a package, list the
notifications for the item just worked and ask before clearing those exact
ones, making no call when nothing matches. `clear_notifications` takes one
exact short code and covers what is nested under it, so naming a job includes
its tasks and reviews; never offer or perform a broader clear.

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

## Workspace export and decision search

When workspace data can answer a request and is not already loaded, run the
environment-correct `uclusion export` and search the reported Markdown.
Run it without `-o` or `--output` so the CLI uses the configured
`uclusionMDFolderPath`, then search the path reported by the command. Never
redirect an ordinary workflow export to `/tmp` or another destination; override
the configured path only when the human explicitly requests a different one.
Exports include jobs, comments, options, votes, reasons, and UTC update dates.
Use those dates for recency.

Search it before you create a design, before you rely on a design you did not
write yourself, and before you answer something in case it was already decided,
and cite what you find. The first two stop a design re-deciding something
settled or resting on something that has gone stale; the third finds what
settled it. A design is whatever records the agreed approach, which is the
current intent/design capsule where one exists and otherwise the design written
into the item's own thread, as a standalone bug carries one. Present enough
inline detail for relevance and its short code; offer to drill in without
requiring the human to open Uclusion.

## Creating jobs and human-authored artifacts

Before `add_job`, export and search for duplicates and related work. Surface an
existing match instead of duplicating it. Cite related-but-distinct short codes
in the new description. Pass initial `tasks` when parts could be reviewed,
committed, or documented separately.

When the human requests a new job containing existing bugs, pass their short
codes in `bug_short_code_ids` alongside any new `tasks`. Only standalone bugs
can move, and only into the job created by that call. Each distinct bug has a
`moved`, `failed`, or `unconfirmed` outcome; one failure does not stop the other
moves. Report those outcomes with the returned new job identity. Preserve that
identity when checking an unconfirmed result with `get_job`: each `add_job`
call creates another job, so repeating the call is not a retry of that job.

`add_job`, `add_task`, `add_bug`, and `add_blocker` create content as the human.
Use them only for the human's explicit request. AI-originated ideas use
`make_suggestion`. The one exception is decomposing a newly requested job into
its initial task list.

For `add_bug`, use the human-indicated severity: RED critical, YELLOW normal,
BLUE minor. For a dependency the AI discovers, suggest it; create a blocker only
when the human explicitly says the job is blocked. View-level creation should
target the implied existing job/bug view when one is named.

## Visual options

Visuals only depict canonical Uclusion options. Create every choice with
`ask_question` or `add_options`, and label each panel with its stable Uclusion
option code/name—never a parallel A/B/C scheme. Keep the artifact and options
in sync in the same turn. Never silently reuse an existing label for a changed
meaning; create a new option or question. An accepted, durably recorded human
suggestion explicitly authorizes `update_option` on that canonical option
while preserving its identity.

## Recording dependencies

A human-confirmed blocker on the blocked job names the prerequisite job's short code.

## Saving general lessons as view notes

Machine-, environment-, or user-specific facts may stay private. General
guidance belongs in an AI-authored view note through `add_view_note`.

Default to updating the existing AI note in the active item's view. Fold in the
lesson, prune superseded material, and keep a tight topical digest. Create a
second note only for a genuinely separate topic. Never edit a human-authored
note; reply or suggest a revision.

Save qualifying lessons autonomously. The first time this rule applies, sweep
existing private memory: migrate general lessons to view notes and delete those
private copies. Treat later human edits to the note as authoritative.

<!-- /uclusion-skill-reference:v1 -->
