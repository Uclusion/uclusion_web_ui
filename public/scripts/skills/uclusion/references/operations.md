<!-- uclusion-skill-reference:v1 -->
# Uclusion operating procedures

## Durable threading and commit identities

Every substantive result belongs in a Uclusion artifact. Reply with `add_info`
on the exact comment being answered, not its thread root; flat root replies
separate answers from their questions and cannot be re-threaded.

Use canonical short codes verbatim. A source-code comment that cites a question
uses the question's full returned link when available. After review opens, a
proposed commit message begins with the completed task/comment code. A job code
at the start means the whole job is done, so use it only when no tasks remain.

## Completion packages

A completion package is one numbered menu, one human reply, and one terminal
record. Two events open one: a job's implementation review, and a standalone
bug's resolution. Each names a **package thread** that holds the menu, the
governing reply when it arrives there, and the terminal record: the exact
review for a job, and the exact resolved bug for a bug. Everything below
applies to both packages except where it names a stage or a review.

When the core workflow identifies a testable implementation pass in an assigned
job in an executable stage, open the exact job's review with the current
capsule-delta report. Do not ask permission first. The review is required
durable documentation and generates the notification that brings the work to
the human's attention. Opening it does not change the job stage.

Before writing the menu, decide whether the job itself is finished. A job is
finished when everything its current intent/design capsule promises is built
and tested and no open task remains. An open task blocks that conclusion. An
empty task list never establishes it, because it is equally consistent with a
pass that opened no tasks at all. State which conclusion you reached, and why,
in the review, so a wrong call is visible in the record instead of surfacing
later as a transition the platform refuses.

End every implementation review report with the completion menu that conclusion
selects. After `ask_for_review` returns the review code or link, immediately print
the same numbered menu in normal client chat and name that review. The review
footer says the human may reply there or in the agent; the chat copy says the
human may reply there or on the named review. Neither copy calls `ask_question`
or creates a Uclusion question or assistance item. Use the applicable
user-facing menu below, substituting the exact job, review, repositories, and
current reviewed scope.

For a pass that finishes the job while it is in Doable, name the exact
Doable-to-Reviewable transition and use:

```text
<job> has been reviewed. Choose completion actions:

1. Commit only its reviewed changes in:
    - <repository>: <concise file list, or file count and compact scope>.
2. Push only those commits.
3. Clear only the notifications produced by <job>.
4. Move <job> from Doable to Reviewable and immediately run its completion sweep.

Reply `all`, `none`, or numbers such as `1,2,4` here, or <in the agent/on review R-code>.
Put the selection alone on the first nonblank line.
Selected actions run in numeric order and stop at the first failure. Action 4 is indivisible.
```

For a pass that does not finish the job, and for any pass on a job already in
Reviewable, use only the applicable three actions:

```text
<job> has been reviewed. Choose completion actions:

1. Commit only its reviewed changes in:
    - <repository>: <concise file list, or file count and compact scope>.
2. Push only those commits.
3. Clear only the notifications produced by <clear scope>.

Reply `all`, `none`, or numbers such as `1,2` here, or <in the agent/on review R-code>.
Put the selection alone on the first nonblank line.
Selected actions run in numeric order and stop at the first failure.
```

When a standalone bug's fix is complete, resolve it under the single-comment
workflow and run the completion sweep that resolution triggers. Record the
sweep result with `add_info` on that bug, end the same record with the bug
completion menu, then immediately print the same numbered menu in normal client
chat and name that bug. Resolving is itself the terminal transition and is
already the sweep trigger, so the bug menu carries no stage action and never
offers the sweep. If the sweep could not run, report that, and still create the
menu record on the bug and mirror it; a sweep failure never suppresses the
package. Use:

```text
<bug> has been resolved. Choose completion actions:

1. Commit only its reviewed changes in:
    - <repository>: <concise file list, or file count and compact scope>.
2. Push only those commits.
3. Clear only the notifications produced by <bug>.

Reply `all`, `none`, or numbers such as `1,2` here, or <in the agent/on B-code>.
Put the selection alone on the first nonblank line.
Selected actions run in numeric order and stop at the first failure.
```

For action 1, use canonical short codes for commits, name every affected
repository, and include its files when the list remains concise. Otherwise
give its file count and a compact scope summary.

Action 3's <clear scope> is the exact job when the pass finished it, and
otherwise the exact review just opened plus any task that pass resolved. The
review always exists, because opening it is what produces the menu, so a
resolved task is an addition when there is one and the wording still reads
correctly when the pass resolved none. Naming the job includes its nested task
and review notifications present at the fresh check; a bug menu names the exact
bug's own notifications. More than one named code is one clear call per code.

Only the four-action menu has action 4, which couples the exact stage
transition and established completion sweep before any lane handoff, work
discovery, or other-job work. Neither the three-action menu nor the bug menu
offers or reruns either one.

`all` selects every action shown, `none` selects no action, and a numbered reply
selects exactly the shown actions whose numbers it contains. A response is
valid only when authored by a non-AI, non-advisory human and its first nonblank
line, after trimming, consists only of `all`, `none`, or a comma-delimited list
of unique action numbers shown in that menu, with optional spaces around
commas. Ignore later prose when interpreting the selection; do not infer
authorization from numbers elsewhere. Perform selected actions in their listed
relative order regardless of the order supplied. Only a four-action menu's
`all` or numbered selection containing `4` authorizes the exact Reviewable
transition and sweep. Any response that lacks that authority or exact grammar authorizes
nothing and requires only a narrow clarification in the channel where it
appeared.

The first valid response observed on either the package thread or in normal
client chat governs that package attempt. A later duplicate or conflicting
response does not authorize or repeat package work. A valid selection is final
for that attempt. Do not ask again for granted or omitted actions, and offer a
new package only after material work changes or an explicit human request.
While awaiting a valid reply to any menu, retain any assigned lane and
auto-take claim. This wait is not a review handoff: do not release the claim,
begin work discovery, or start another job or bug.

After every apparently valid reply, including `none`, reload the exact job or
bug, its assistance, and the exact package thread before acting. Reconcile the
first valid human package-thread response and every existing AI terminal
package record. An earlier governing package-thread selection or terminal
record takes precedence over a later response. An AI record preserves the
governing human selection but supplies no authority by itself.

A first valid normal-client-chat selection can govern the current uninterrupted
execution attempt when that reconciliation finds no earlier governing
selection or terminal record. Do not call `add_info` or create any other AI
selection receipt before attempting the package actions. If an interruption
loses that unrecorded chat selection before its terminal record is created,
require the human to repeat the selection, then reload and reconcile again.

For a governing selection from either the package thread or normal client chat,
finish the required reload and reconciliation, then attempt only its selected
actions. After all selected actions succeed, the first mandatory check or
selected action fails, or `none` selects no action, use `add_info` in the exact
package thread to create exactly one terminal record for that execution
attempt. Reply to the governing human response when the selection came from the
package thread, or to that thread's root when it came from normal client chat.
Record the source, canonical selection, completed action numbers, failed action
or check if any, and remaining selected action numbers. This is the only AI
package-state reply for that execution attempt. If its write outcome is
uncertain, reload the exact thread and create it only if absent; never rerun an
action merely to produce the record or create a duplicate record.

A terminal failure record is durable package state and supports a later retry
under the same human selection. On retry, reconcile the latest state with the
durable job or bug, package thread, repository, remote, notification, and
sweep results. Never repeat an action whose durable result is already present.
Perform only the selected actions, and create exactly one new terminal record
after that retry attempt reaches success or its first failure. The ordinary
read-only job, assistance, repository-scope, and notification checks remain
required at their workflow boundaries and need no permission.

Whenever at least one action is selected, make one fresh notification check
after the last selected commit or push and before any selected clear or
Reviewable transition. List the exact item's matching notifications even when
action 3 was omitted, but neither perform nor request an omitted clear again.
The job or bug named in the menu prospectively identifies this clear scope,
including a job's task or review notifications created before the fresh check.
Opening the review, and resolving the bug, each also retains the ordinary
completion-time notification check.

The Reviewable transition and its completion sweep are one coupled action for
authorization: without permission for that exact transition, do neither. A
failed stage change does not trigger a sweep. Immediately before the selected
stage action, reload the exact job again and proceed only if it is still the
assigned, unblocked Doable job. If that reload instead shows the exact assigned
job has newly entered Reviewable, do not call `change_job_stage`; run the
triggered completion sweep immediately, then handle any assistance. For any
other state, stop at that action and preserve the current stage. After a
successful stage change, finish the sweep in the same turn before any lane
handoff, work discovery, or other job starts. If the sweep fails, leave the job
in Reviewable, report the failure, and block any lane switch until the sweep
succeeds. An incomplete failed sweep remains work from its original transition
trigger and must be retried directly, without a new transition or package
permission. Package permission applies only to the named job or bug, the
changes covered by its review or its bug thread, their affected branches, and
that item's notifications. It does not authorize tests, builds, deployment,
security work, force-push, unrelated dirty changes, another job or bug, a
broader notification clear, completion-candidate mutation, or a
conversation/context clear.

Stop at the first mandatory check or selected action that fails. Report what
succeeded, what failed, and which selected actions remain; do not attempt later
actions or roll back successful ones. A later retry resumes the incomplete
work under the same selection without repeating completed irreversible work.
Having no applicable commit, push, or exact-job notification to act on is a
successful no-op, not a failure.

## Notifications

Call `get_notifications` whenever the human requests their inbox and at every
completion moment: resolving a bug/job, opening review, or receiving sign-off
and committing. Use a fresh check after the completion action. A completion
menu is its item's sole notification-clear offer. Make the ordinary fresh
check after opening that review or resolving that bug and list its exact-item
matches, but do not ask a separate clear question. A failed check must not
delay or suppress the required menu mirror in chat. A later selected package
pass still makes its execution-time fresh check after any selected commit or
push.

Outside those package flows, if notifications exist for the item just worked,
list them and ask whether to clear those exact notifications. Call
`clear_notifications` only after explicit permission for that object. When the
package already grants that permission, list the matching notifications and
call `clear_notifications` with the exact job or bug short code without asking
again; this includes notifications about its nested reports or tasks but
leaves every unrelated notification untouched. When the valid package
selection omitted action 3 or selected `none`, list the matching notifications
but do not ask again or call the clear tool for that attempt. Never offer or
perform a broader clear. If none exist, do not ask or call the clear tool.

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

Before reopening a debate or answering what was decided, search the export and
cite the existing artifact. Present enough inline detail for relevance and its
short code; offer to drill in without requiring the human to open Uclusion.

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

## Uploading files

Call `get_upload` with exact byte size and MIME type. POST every returned
presigned field and then the file bytes as multipart data to the returned URL.
Reference `file_url` in the artifact body and pass its metadata through
`uploaded_files` on the creating tool call. An unreferenced upload is not
retained. File bytes do not pass through the model.

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

## Token usage audit when available

If `start_job_audit`, `set_job_audit_phase`, and `end_job_audit` are exposed:

1. A lookup used only to classify a Poke starts no audit. Audits attach only
   to jobs: a standalone view-level comment lane (a single-comment result with
   no Job header) has no J- job, so never call `start_job_audit` for it — the
   call fails. If that comment later converts into a Bugs job, audit the
   returned job. Once an authorized activation establishes a job as the
   assigned lane and its lookup begins, call `start_job_audit` before
   substantive planning or execution and retain the run identifier. The
   initial bucket is `planning`.
2. Before the kind of work changes, call `set_job_audit_phase`. Include the
   active job, run identifier, a `marker_sequence` starting at 1 and increasing
   strictly, and a concise bucket label. A replay reuses its original sequence.
   Ordinary labels are `planning`, `implementation`,
   `testing`, and `other`; use a custom label only when it is materially more
   informative. Switch to `testing` before tests or builds. A marker applies to
   the next model request and cannot relabel earlier tokens.
3. Keep the audit active across ordinary model/chat turns. Call
   `end_job_audit` only when the lane genuinely hands off for a blocking human
   dependency, review, completion, pause, or interruption. Adding or updating
   a durable artifact, showing its link, or returning an ordinary model/chat
   turn is not a lane handoff and must not end the audit. Collection finishes
   asynchronously; do not poll for it.

Keep at most 32 labels, each 1–80 safe characters. Re-entering a bucket adds to
its total; do not create separate standard/custom dimensions or a new run when
the task or turn changes. Every request belongs to one bucket. Audit errors or
partial telemetry never block the work.

<!-- /uclusion-skill-reference:v1 -->
