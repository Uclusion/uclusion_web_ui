<!-- uclusion-skill-reference:v1 -->
# Standalone bug work

## Permitted tools and discussion

Use only `get_job`, `add_info`, `resolve` and, for a general lesson,
`add_view_note` while discussion is open-ended. Ask for missing facts or
decisions with `add_info`. A discrete-options question uses `ask_question`
with the bug's code, a nonempty options list and one `initial_vote` giving
certainty 1–5 and a nonblank reason. Never convert a bug merely to ask an
open-ended question. If it converts into a Bugs job, reload that returned job
then read [job-coordinator.md](job-coordinator.md) in full through its closing
marker and its complete current stage/action units before job work. Classify
the returned Job header, even when the code retains a `B-` prefix.

## Progress and resolution

Use `add_info` for progress or questions while the bug is open. Resolving a
standalone bug is also an `Updated` state transition. For an assigned bug,
compare its reloaded resolution state with the state this session last
observed. When it changes from open to resolved, prepare the completion inputs
below and invoke [completion.md](completion.md)'s two scans once immediately. A
successful in-session Resolve follows the same rule. When this session
completed that fix, the resolution also opens the bug's completion package,
including when the sweep could not run.

Merely loading a bug already resolved, or receiving another update while it
stays resolved, does not retrigger the sweep or reopen its package. After a
`reopen`, the bug is open again; its next resolution is a new sweep trigger
and, for a fix this session completed, opens a new package. Retry an incomplete
sweep with its prepared inputs before switching lanes. A proposed commit
message begins with the comment code.

## Prepare bug completion inputs

The trigger and completed-code set use the resolved bug's exact short code. For
outcome impact, supply the resolved bug thread, human-backed decisions and
current completion report when present. Rejected, unresolved and speculative
proposals are not evidence. If the current record does not settle a conflict,
do not classify a candidate. For a fix this session completed, prepare its package at the exact resolved
bug thread, with the reviewed repository changes and exact bug/reply notification
scope.
Prepare the outcome before invoking a transition sweep or incomplete retry;
a package-only action uses its held thread and scope without retriggering a sweep.
<!-- /uclusion-skill-reference:v1 -->
