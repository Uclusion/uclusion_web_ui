<!-- uclusion-skill-reference:v1 -->
# Completion sweeps

## Completion trigger and isolated scans

At an actual completion transition or incomplete retry in the selected lane,
load [reading.md](reading.md) and select a successful export under its reuse and
freshness rules. If no suitable export is available, say that the completion
sweep could not run and stop after any standalone bug's required record and
presentation below.

Assign both scans together to one fresh read-only isolated export-search helper
under [reading.md](reading.md). Give the export-search helper the exact successful
export path, the exact completed-code set and current authoritative outcome
evidence defined below, and all scan and result
rules in this unit. Require concise merged findings or an explicit no-candidate
result, identifying any incomplete scan or unsettled evidence. Record and present
the result yourself and retain later decisions and authorized actions; keep raw
export research with the export-search helper.

## Job outcome record

The completed-code set starts with the Reviewable job's exact short code.
Also include every contained item rendered as a `Task` or
`Grouped task`, including resolved forms and retained non-`T-` prefixes.
Membership comes from its rendered role and containment, not its prefix;
ordinary assistance and replies do not qualify merely because they are in the
job.

For outcome impact, use the record available at the trigger: the Reviewable job
and all its task bodies, plus the current
intent/design capsule, human-backed decisions, and current completion/review
report when each is present. Rejected, unresolved, and speculative proposals
are not evidence. If those sources conflict and the current record does not
settle that conflict, do not classify a candidate. A later qualifying transition
uses the then-current record and can supersede the earlier result.

## Completed work

For a standalone bug, the completed-code set is its exact short code.
For a job trigger, use the set defined above.

For outcome impact, use the resolved bug thread, human-backed decisions, and
current completion report when present; a job trigger uses its outcome record
defined above. Rejected, unresolved, and speculative proposals are not
evidence. If the current record does not settle a conflict, do not classify
a candidate.

## Scans

For dependencies, find an exact completed-code or exact Uclusion-link-target
match inside open blockers on other jobs or bugs. Partial-code substrings,
resolved blocker content, and the triggering source itself do not match.

Keep each matching blocker once even when it names several completed codes.
Retain the dependent job or bug, the blocker code, and every exact completed
code that matched. Offer the blocker to the human; never resolve it
automatically because it may represent more than one condition.

For outcome impact, examine unresolved jobs in every stage except Reviewable and
Skippable, plus unresolved view-level bugs. Exclude the triggering source.
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

Load [writes.md](writes.md) before recording that numbered result, the
explicit no-candidate result below, or a standalone bug's failed-sweep outcome,
with `add_info` on the triggering source item. Mirror a job's result in chat.
When the trigger was resolving a standalone bug, use [operations.md](operations.md)'s
completion-package route for that same result or failed-sweep record and its
chat counterpart. The proposed actions are part of the completion-sweep result,
not new suggestion artifacts. Do not call `make_suggestion`, `add_info`, or any
other mutating tool on a candidate during the sweep.

Use **dependency** as the category when there is no semantic finding, and
include every matching blocker code. When one target has both kinds of finding,
show it once under its semantic category and include the blocker matches in its
evidence. For **duplicate** or **obsolete**, propose deciding whether to resolve
the target before offering to remove its blocker. For **modify**, propose the
needed revision before reconsidering its blocker.

If both scans find nothing, say: `No completion-sweep candidates: no open
dependency blocker matched the triggering work, and no unresolved job or bug
became duplicate, obsolete, or in need of modification.`

The sweep only presents evidence and proposed actions, apart from recording its
result on the triggering source. Never resolve, edit, or change a candidate's
stage during it. Before carrying out a later human choice, reload the exact
target because the export may no longer be current, then apply the ordinary
authorization and workflow gates.
<!-- /uclusion-skill-reference:v1 -->
