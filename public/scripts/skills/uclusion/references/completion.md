<!-- uclusion-skill-reference:v1 -->
# Completion sweeps and packages

## Completion trigger and isolated scans

Use the selected lane's prepared trigger, exact completed-code set and current
authoritative outcome evidence. At its actual transition or incomplete retry,
select a successful export under [the shared body](../SKILL.md)'s reuse and
freshness rules. If no suitable export is available, say that the completion
sweep could not run and stop after any standalone bug's required record and
presentation below.

Assign both scans together to one fresh read-only isolated export-search helper
under the shared isolated-search rules. Give the export-search helper the exact
successful export path, the exact completed-code set and current authoritative
outcome evidence prepared by the lane, and all scan and result rules in this
unit. Require concise merged findings or an explicit no-candidate result,
identifying any incomplete scan or unsettled evidence. Record and present the
result yourself and retain later decisions and authorized actions; keep raw
export research with the export-search helper.

## Scans

For dependencies, find an exact completed-code or exact Uclusion-link-target
match inside open blockers on other jobs or bugs. Partial-code substrings,
resolved blocker content, and the triggering source itself do not match.

Keep each matching blocker once even when it names several completed codes.
Retain the dependent job or bug, the blocker code, and every exact completed
code that matched. Offer the blocker to the human; never resolve it
automatically because it may represent more than one condition.

For outcome impact, examine unresolved jobs in every stage except Reviewable
and Skippable, plus unresolved view-level bugs. Exclude the triggering source.
Similar language is not enough: the current outcome must have causally changed
whether or how the candidate should proceed. Assign exactly one semantic
category, in this order:

1. **duplicate** — the current result already supplies the intended outcome;
2. **obsolete** — otherwise, the current result makes the premise false; or
3. **modify** — otherwise, the work remains valuable but an assumption or its
   scope is now wrong.

Limit outcome analysis to the completion's causal impact.

## Present and act

Merge both scans by target into one numbered list. Use exactly this shape:

`1. **<exact code> — <exact short description>** — **<category>**. Evidence: <matching blocker code and completed code, or conflicting current-outcome evidence>. Proposed action: <specific human action>.`

Apply the shared durable-write rules when recording that numbered result, the
explicit no-candidate result below, or a standalone bug's failed-sweep outcome,
with `add_info` on the triggering source item. Mirror a job's result in chat.
When the trigger was resolving a standalone bug, use the completion-package
procedure below for that same result or failed-sweep record and its chat
counterpart. The proposed actions are part of the completion-sweep result, not
new suggestion artifacts. Do not call `make_suggestion`, `add_info`, or any
other mutating tool on a candidate during the sweep.

Use **dependency** as the category when there is no semantic finding, and
include every matching blocker code. When one target has both kinds of finding,
show it once under its semantic category and include the blocker matches in its
evidence. For **duplicate** or **obsolete**, propose deciding whether to
resolve the target before offering to remove its blocker. For **modify**,
propose the needed revision before reconsidering its blocker.

If both scans find nothing, say: `No completion-sweep candidates: no open
dependency blocker matched the triggering work, and no unresolved job or bug
became duplicate, obsolete, or in need of modification.`

The sweep only presents evidence and proposed actions, apart from recording its
result on the triggering source. Never resolve, edit, or change a candidate's
stage during it. Before carrying out a later human choice, reload the exact
target because the export may no longer be current, then apply the ordinary
authorization and workflow gates.

## Completion packages

When the selected lane opens a completion package, explain what `all` does,
handle one human reply and write one terminal record per attempt. Use its
prepared **package thread**, reviewed repository changes and exact notification
scope, at that review or resolved bug. Package readiness, trigger preparation
and assignment release remain with the selected lane.

### What the package says

End the review, or the bug's completion-sweep record, with the package. Neither
copy calls `ask_question` or creates assistance. Say exactly what `all` does
for this item, in this order:

1. commit only the reviewed changes, naming each repository with its files, or
   with a file count and compact scope when a list would be long;
2. push only those commits;
3. clear only this work's notifications: the exact job when the pass
   finishes it, otherwise the exact review plus each task the pass resolved,
   and for a bug the exact bug with its replies. This runs last, one call per
   code with the terminal record on the last, so nothing the attempt writes can
   notify after it.

Leave out the commit and push when the work changed no repository files. End
with: "Reply `all`, or tell me in your own words what you want, here or on
<thread>."

### Publication and presentation

Once durable job-package publication is confirmed, immediately print that same
package in normal client chat, naming its exact package thread, before the
triggered completion sweep or any follow-on work. When the lane's confirmed
publication also establishes its actual sweep trigger, this chat copy is the
sole intervening presentation step before that sweep; other actual transitions
invoke their lane-prepared sweep immediately. Do not defer the chat copy until
the turn ends.

A standalone bug keeps its package at the end of its saved completion-sweep
record, including a failed-sweep record. Immediately after that save is
confirmed, mirror the result and package in normal client chat, naming the
exact package thread. A sweep failure never suppresses this record or
presentation.

If a qualifying human reply has already arrived, suppress any remaining
invitation and apply the reply handling below. For a publication-confirmed
sweep trigger, the sweep remains next after the chat copy. A turn ending does
not require another full package copy.

### The reply

Only a reply from a non-AI, non-advisory human counts, on the package thread or
in normal client chat. `all` authorizes exactly the listed actions. Any other
reply is an ordinary instruction under the shared body's authorization rules;
an ambiguous reply gets one narrow clarification where it appeared. A reply
declining everything completes the package with no action. A later reply is a
new instruction and never repeats work that has already completed. The package
never authorizes tests, builds, deployment, security work, force-push,
unrelated changes, another job or bug, a broader clear, candidate mutation, or
a context clear.

Until a reply arrives, retain the assignment and end each later turn with only
one line naming the package thread rather than the whole package. This wait is
not a handoff: no work discovery or other job or bug. Apply the shared body's
claim route before affected package or handoff actions.

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
`add_info`, silently when the clear was authorized. Apply the shared write-receipt
reconciliation to an uncertain terminal record, writing it only if absent from
the package thread. A retry under the same reply reconciles what is already
durable, performs only what remains, and
writes one new record.

After a terminal attempt, apply the shared assignment ownership rules.
Apply the selected lane's held completion-release conditions.
<!-- /uclusion-skill-reference:v1 -->
