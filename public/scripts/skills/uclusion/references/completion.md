<!-- uclusion-skill-reference:v1 -->
# Completion sweeps

## Triggers and export

Run both scans when a standalone bug is resolved or whenever a job transitions
into Reviewable. Reviewable is a reliable handoff signal, not proof that the job
is final: if the job leaves Reviewable and later returns, that later transition
runs a new sweep. Merely loading a job that is already Reviewable, or receiving
another update while it remains there, is not a trigger.

Individual task completion, the act of requesting review, using a completed
code in a commit, resolving the job, later human signoff, and shipped or fixed
confirmation are not independent job triggers. A subsequent transition into
Reviewable remains a trigger.

At each signal, load the export rules in `operations.md` and run one fresh,
environment-correct `uclusion export` through the configured destination. Use
only the path reported by that successful command for both scans. If the command
fails or reports no path, say that the completion sweep could not run and stop;
never use an older export or redirect the export to `/tmp` or elsewhere.

## Completed work

The completed-code set starts with the resolved bug or Reviewable job's exact
short code. For a job, also include every contained item rendered as a `Task` or
`Grouped task`, including resolved forms and retained non-`T-` prefixes.
Membership comes from its rendered role and containment, not its prefix;
ordinary assistance and replies do not qualify merely because they are in the
job.

For outcome impact, use the record available at the trigger: the resolved bug
thread, or the Reviewable job and all its task bodies, plus the current
intent/design capsule, human-backed decisions, and current completion/review
report when each is present. Rejected, unresolved, and speculative proposals
are not evidence. If those sources conflict and the current record does not
settle that conflict, do not classify a candidate. A later Reviewable
transition uses the then-current record and can supersede the earlier result.

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

This is completion-impact analysis, not generic backlog cleanup or a server-side
search.

## Present and act

Merge both scans by target into one numbered list. Use exactly this shape:

`1. **<exact code> — <exact short description>** — **<category>**. Evidence: <matching blocker code and completed code, or conflicting current-outcome evidence>. Proposed action: <specific human action>.`

Record that numbered result, or the explicit no-candidate result below, with
`add_info` on the triggering source item and mirror it in chat. The proposed
actions are part of the completion-sweep result, not new suggestion artifacts.
Do not call `make_suggestion`, `add_info`, or any other mutating tool on a
candidate during the sweep.

Use **dependency** as the category when there is no semantic finding, and
include every matching blocker code. When one target has both kinds of finding,
show it once under its semantic category and include the blocker matches in its
evidence. For **duplicate** or **obsolete**, propose deciding whether to resolve
the target before offering to remove its blocker. For **modify**, propose the
needed revision before reconsidering its blocker. This avoids recommending both
unblocking and discarding the same work.

If both scans find nothing, say: `No completion-sweep candidates: no open
dependency blocker matched the triggering work, and no unresolved job or bug
became duplicate, obsolete, or in need of modification.`

The sweep only presents evidence and proposed actions, apart from recording its
result on the triggering source. Never resolve, edit, or change a candidate's
stage during it. Before carrying out a later human choice, reload the exact
target because the export may no longer be current, then apply the ordinary
authorization and workflow gates.
<!-- /uclusion-skill-reference:v1 -->
