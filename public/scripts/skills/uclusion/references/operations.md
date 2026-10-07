<!-- uclusion-skill-reference:v1 -->
# Uclusion operating procedures

Load this unit for a completion package, notification/inbox action or a
context-clear boundary. For ordinary durable writes and receipt reconciliation,
load [writes.md](writes.md); for exports and decision search, load
[reading.md](reading.md).

## Completion packages

A completion package is how finished work reaches the human for its
operational permission: one explanation of what `all` does, one human reply,
and one terminal record per attempt. It opens at a job's implementation review
and at a standalone bug's resolution. Its **package thread** is that exact
review, or that exact resolved bug. This section is its only statement; the
core skill and the other references point here.

Job review opening, readiness and publication recovery are governed by
[review.md](review.md). The package mechanics below apply to both its review and a
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
Job completion release is defined in [review.md](review.md).

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
<!-- /uclusion-skill-reference:v1 -->
