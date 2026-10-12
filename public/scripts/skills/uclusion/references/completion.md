<!-- uclusion-skill-reference:v1 -->
# Backlog maintenance and completion packages

## Batch run

A `find_work` result with `backlog_maintenance` starts one run covering every
item in its `completed` list. Call `backlog_maintenance_run` with action
`claim` and the key's exact `since` and `through`; when the claim is refused,
skip the run. Present the work list and handle the human's choice without
waiting for the run, under [the shared body](../SKILL.md)'s rules for waiting
for helpers.

Run the environment-correct `uclusion export` with `--completed` and every
completed code, and keep its exact reported path and complete output. That
output is the dependency scan: each completed item's line, each open blocker
whose body or replies name a completed code exactly, with the codes it
matched, and `incomplete` lines for anything it could not read or find.

Assign the outcome-impact scan for the whole batch to one fresh read-only
export-search helper under [helper-dispatch.md](helper-dispatch.md). Give it
the export path, that output, and every rule from Outcome impact through
Findings below. Require one merged numbered list that includes every
dependency match from the output, or the no-candidate result, naming anything
incomplete either way.

## Outcome impact

Evidence comes from the completed items' own sections, read at the output's
line numbers: job and task bodies, the current capsule, human-backed decisions
and the latest review. Rejected, unresolved and speculative proposals are not
evidence. If those sources conflict and the record does not settle that
conflict, do not classify a candidate.

Candidates are the export index's job and bug lines, each read at its line
number rather than searched for. Similar language is not enough: the completed
outcome must have causally changed whether or how the candidate should
proceed. Assign exactly one semantic category, in this order:

1. **duplicate**: the completed result already supplies the intended outcome;
2. **obsolete**: otherwise, the completed result makes the premise false; or
3. **modify**: otherwise, the work remains valuable but an assumption or its
   scope is now wrong.

Limit outcome analysis to the completed work's causal impact.

## Findings

Merge both scans by target into one numbered list. Use exactly this shape,
with codes as plain text so the inbox links them:

`1. **<exact code>**, <exact short description>: **<category>**. Evidence: <matching blocker code and completed code, or conflicting current-outcome evidence>. Proposed action: <specific human action>.`

Use **dependency** as the category when there is no semantic finding, and
include every matching blocker code. When one target has both kinds of finding,
show it once under its semantic category and include the blocker matches in its
evidence. For **duplicate** or **obsolete**, propose deciding whether to
resolve the target before offering to remove its blocker. For **modify**,
propose the needed revision before reconsidering its blocker. Offer each
matching blocker to the human; never resolve it automatically because it may
represent more than one condition.

If both scans find nothing, say: `No backlog maintenance candidates: no open
blocker named the completed work, and no unresolved job or bug became
duplicate, obsolete, or in need of modification.`

## Record the run

When the export failed or either scan reports anything incomplete, say what
was incomplete and do not record; the notice returns when the claim expires.
Otherwise, with findings, print them in chat, then call
`backlog_maintenance_run` with action `record`, the claim's `claim_id` and the
same Markdown as `report`. With no findings, print the no-candidate line in
chat and record without a report, so no inbox item is created.

The run only presents evidence and proposed actions. Never call
`make_suggestion`, `add_info` or any other mutating tool on a candidate, or
resolve, edit or change its stage. Before carrying out a later human choice,
reload the exact target because the export may no longer be current, then apply
the ordinary authorization and workflow gates.

## Completion packages

When the selected lane opens a completion package, explain what `all` does,
handle one human reply and write one terminal record per attempt. Use its
prepared **package thread**, reviewed repository changes and exact notification
scope, at that review or resolved bug. Package readiness and assignment release
remain with the selected lane.

### What the package says

End the review with the package; a standalone bug fixed in this session gets
its package as its own `add_info` record on the resolved bug. Neither calls
`ask_question` or creates assistance. Say exactly what `all` does for this
item, in this order:

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

Once a job's review or a bug's package record is confirmed durable,
immediately print that same package in normal client chat, naming its exact
package thread, before any follow-on work. Do not defer the chat copy until the
turn ends. A response on a bug's package record is the package reply.

If a qualifying human reply has already arrived, suppress any remaining
invitation and apply the reply handling below. A turn ending does not require
another full package copy.

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
