<!-- uclusion-skill-reference:v1 -->
# Uclusion operating procedures

## Durable threading and commit identities

Record substantive information once with the tool and artifact that own it.
Use `add_info` only for findings, decisions, blockers or next steps missing from
the durable thread. Do not add notes that merely recap a question and answer,
capsule, state transition or completed instruction reload. A decision belongs
in the current design when its workflow permits that write; avoiding a
duplicate note does not authorize rewriting a sent contract. Required reviews
and completion-package records remain mandatory without an extra recap note.
Reply on the exact comment being answered, not its thread root; flat root
replies separate answers from their questions and cannot be re-threaded.

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
uses the question's full returned link when available. A proposed bug commit
message begins with the completed comment code. Job commit identities are
defined in [job.md](job.md).

## Completion packages

A completion package is how finished work reaches the human for its
operational permission: one explanation of what `all` does, one human reply,
and one terminal record per attempt. It opens at a job's implementation review
and at a standalone bug's resolution. Its **package thread** is that exact
review, or that exact resolved bug. This section is its only statement; the
core skill and the other references point here.

Job review opening, readiness and publication recovery are governed by
[job.md](job.md). The package mechanics below apply to both its review and a
resolved standalone bug.

### What the package says

End the review, or the bug's completion-sweep record, with the package. Then
print the same package in normal client chat, naming its thread, as the final
content of that turn's last message; anything printed earlier is lost in what
follows. Neither copy calls `ask_question` or creates assistance. Say exactly
what `all` does for this item, in this order:

1. commit only the reviewed changes, naming each repository with its files, or
   with a file count and compact scope when a list would be long;
2. push only those commits;
3. clear only this work's notifications: the exact job when the pass
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
or in normal client chat. `all` authorizes exactly the listed actions.
Any other reply is an ordinary instruction under the core workflow's
authorization rules; an ambiguous reply gets one narrow clarification where
it appeared. A reply declining everything
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
clear is a successful no-op. For an authorized clear with a fixed exact scope,
call `clear_notifications` directly and report its actual outcome. Do not call
`get_notifications` merely to preview matches.

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

After a terminal attempt, apply `pokes.md`'s assignment ownership rules.
Job completion release is defined in [job.md](job.md).

## Reopening resolved work

`reopen` reopens a resolved bug, task, question, suggestion or blocker.
On your own, reopen only a
bug or task whose fix is shown to still fail, by a human's report or a failed
verification, and say why in a reply on it. Reopen a question, suggestion or
blocker only on a human's instruction, and never a question they resolved to
delegate; ask a new question instead.

A human's report that a fix still fails is their request to reopen it, so pass
`for_human: true` with `is_my_lane` as the core skill describes. A failure your
own verification finds is yours, so omit `for_human`. Job-stage outcomes of
reopening a task are in [job.md](job.md).

A reopened item is open work again. A reopened standalone bug's next resolution
is a new open-to-resolved transition, so its completion sweep runs again and, for a
fix you completed, a new completion package opens. What an earlier package did
stands; nothing is rolled back.

## Notifications

`ask_for_review` does not read or return notifications. Call `get_notifications`
when the human asks for their inbox or a decision requires inbox contents.
Do not fetch them merely to resolve a bug or job, open a review, present its
completion package, receive sign-off, commit, or preview a fixed exact clear
scope.

The package is its item's only clear offer. Outside a package, ask before
clearing the exact scope of the item just worked. Read and list matches only
when that decision needs inbox contents, making no clear call when that read
finds nothing. `clear_notifications` takes one exact short code and covers
what is nested under it, so naming a job includes its tasks and reviews;
never offer or perform a broader clear. Once that scope is fixed and its
clear authorized, clear directly and report the tool's actual outcome.

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

For a requested new job, load [job.md](job.md) for duplicate search and
creation outcomes before creating it.

`add_job`, `add_task`, `add_bug`, and `add_blocker` create content as the human.
Use them only for the human's explicit request. AI-originated ideas use
`make_suggestion`. The one exception is decomposing a newly requested job into
its initial task list.

For `add_bug`, use the human-indicated severity: RED critical, YELLOW normal,
BLUE minor. For a dependency the AI discovers, suggest it; create a blocker only
when the human explicitly says the job is blocked. View-level creation should
target the implied existing job/bug view when one is named.

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
