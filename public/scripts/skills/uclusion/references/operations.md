<!-- uclusion-skill-reference:v1 -->
# Uclusion operating procedures

For ordinary durable writes and receipt reconciliation,
load [writes.md](writes.md); for exports and decision search, load
[reading.md](reading.md).

## Completion packages

Open a completion package at a job's implementation review or a standalone
bug's resolution: explain what `all` does, handle one human reply, and write one
terminal record per attempt. Keep the **package thread** at that exact review
or resolved bug.

Job review opening, readiness and publication recovery are governed by
[review.md](review.md). The package mechanics below apply to both its review and a
resolved standalone bug.

### What the package says

End the review, or the bug's completion-sweep record, with the package. Neither
copy calls `ask_question` or creates assistance. Say exactly what `all` does for
this item, in this order:

1. commit only the reviewed changes, naming each repository with its files, or
   with a file count and compact scope when a list would be long;
2. push only those commits;
3. clear only this work's notifications: the exact job when the pass
   finishes it, otherwise the exact review plus each task the pass resolved,
   and for a bug the exact bug with its replies. This runs last, one call per
   code with the terminal record on the last, so nothing the attempt writes can
   notify after it.

Leave out the commit and push when the work changed no repository files. End with:
"Reply `all`, or tell me in your own words what you want, here or on <thread>."

### Publication and presentation

Once durable job-package publication is confirmed, immediately print that same
package in normal client chat, naming its exact package thread, before the
triggered completion sweep or any follow-on work. When publication confirms an
actual entry into Reviewable, this chat copy is the sole intervening presentation
step before its sweep; other actual entries sweep immediately under
[job.md](job.md). Do not defer the chat copy until the turn ends.

A standalone bug keeps its package at the end of its saved completion-sweep
record, including a failed-sweep record. Immediately after that save is
confirmed, mirror the result and package in normal client chat, naming the exact
package thread. A sweep failure never suppresses this record or presentation.

If a qualifying human reply has already arrived, suppress any remaining
invitation and apply the reply handling below. For a publication-confirmed
Reviewable entry, the sweep remains next after the chat copy. A turn ending
does not require another full package copy.

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

Until a reply arrives, retain the assignment and end each
later turn with only one line naming the package thread rather than the whole
package. This wait is not a handoff: no work discovery or other job or bug.
If a claim is held, load [claims.md](claims.md) before affected package or
handoff actions.

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
the record as `clear_notifications`' `record`, even when nothing is left to clear. Otherwise post it with
`add_info`, silently when the clear was authorized. Apply writes.md's receipt
reconciliation to an uncertain terminal record, writing it only if absent from
the package thread. A retry under the same reply reconciles what is already
durable, performs only what remains, and
writes one new record.

After a terminal attempt, apply the core's assignment ownership rules.
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
finds nothing. Once that scope is fixed and its clear authorized, clear directly
and report the tool's actual outcome.

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
