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

A completion package is one numbered menu, one human reply, and one terminal
record. Two events open one: a job's implementation review, and a standalone
bug's resolution. Each names a **package thread** that holds the menu, the
governing reply when it arrives there, and the terminal record: the exact
review for a job, and the exact resolved bug for a bug. Everything below
applies to both packages except where it names a stage or a review.

A job gets one review, and it opens once every task you were asked to do in
that assigned job, in an executable stage, is written and tested. It is not
opened after each pass. Its capsule-delta report names each task and its
current capsule. Another open task, such as the human's own, only leaves the
job unfinished. Do not ask permission first.

A finished task that is not related enough to the rest of its job leaves it
for its own review instead of waiting on the others. You judge relatedness and
say why in that task's review. Once the task is written and tested, call
`add_job` with its code in `task_short_code_ids`, `view_short_code_id` naming
its job, a name taken from the task, and a description naming the job it came
from. This is the human's standing request for that move, so it needs no other
permission. The task keeps its code, thread and capsule. The new job starts in
the stage its job was in, so the job-finished menu applies there. If the
result says it started in the initial stage, it is not executable: ask about
its next stage as the core workflow says. The new job joins your assignment
beside the one it came from, so its menu wait does not stop work on the tasks
that remain there.

Open the review with the current capsule-delta report. The review is required
durable documentation and generates the notification that brings the work to
the human's attention. Opening it does not change the job stage.

Before writing the menu, decide whether the job itself is finished. A job is
finished when everything its current intent/design capsule promises is built
and tested and no open task remains. An open task blocks that conclusion. An
empty task list never establishes it, because it is equally consistent with a
pass that opened no tasks at all. State which conclusion you reached, and why,
in the review, so a wrong call is visible in the record instead of surfacing
later as a transition the platform refuses.

Before writing any job's menu, also check the job's open suggestions: the
ones you hold from your reads and Pokes, and then the `open_suggestions` that
the `ask_for_review` result lists. No job package is offered while one is
open: each is unfinished or deferred work, and moving the job to Reviewable
resolves it, so the work is lost. When any is open, open the review with its
report but no menu, or rewrite it without one if its result lists any. End the report, and the
chat copy that ends the turn, by naming each open suggestion, including those
this pass created, and asking the human to convert it to a task or resolve it.
Retain the lane, and end each later turn by naming the review and the
suggestions still open. When Pokes show none open, rewrite the review with
`update_review_short_code_id` to append the menu its conclusion now selects,
since a converted suggestion is an open task, and print that menu at the end
of the turn. A standalone bug holds no suggestions, so its menu is unaffected.

End every implementation review report with the completion menu that conclusion
selects, unless the job has an open suggestion, as below. After `ask_for_review`
returns the review code or link, print the same numbered menu in normal client
chat and name that review, as the final content of that turn's last message: a
menu printed earlier in the turn is buried by what follows it. The review
footer says the human may reply there or in the agent; the chat copy says the
human may reply there or on the named review. Neither copy calls `ask_question`
or creates a Uclusion question or assistance item. Use the applicable
user-facing menu below, substituting the exact job, review, repositories, and
current reviewed scope.

For a pass that finishes the job while it is in Doable, name the exact
Doable-to-Reviewable transition and use the menu below. Every task the pass
completed is already resolved, so its action 4 is that transition:

```text
<job> has been reviewed. Choose completion actions:

1. Commit only its reviewed changes in:
    - <repository>: <concise file list, or file count and compact scope>.
2. Push only those commits.
3. Clear only the notifications produced by <job>.
4. Move <job> from Doable to Reviewable and immediately run its completion sweep.

Reply `all`, `none`, or numbers such as `1,2,4` here, or <in the agent/on review R-code>.
Put the selection alone on the first nonblank line.
Selected actions run in numeric order and stop at the first failure, except
that a selected clear runs last so it covers this attempt's own record.
Action 4 is indivisible.
```

For any other pass that does not finish the job, and for a finishing pass on a
job already in Reviewable, use only the applicable three actions:

```text
<job> has been reviewed. Choose completion actions:

1. Commit only its reviewed changes in:
    - <repository>: <concise file list, or file count and compact scope>.
2. Push only those commits.
3. Clear only the notifications produced by <clear scope>.

Reply `all`, `none`, or numbers such as `1,2` here, or <in the agent/on review R-code>.
Put the selection alone on the first nonblank line.
Selected actions run in numeric order and stop at the first failure, except
that a selected clear runs last so it covers this attempt's own record.
```

When a standalone bug's fix is complete, resolve it under the single-comment
workflow and run the completion sweep that resolution triggers. Record the
sweep result with `add_info` on that bug, end the same record with the bug
completion menu, then print the same numbered menu in normal client chat and
name that bug, as the final content of that turn's last message. Resolving is itself the terminal transition and is
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
Selected actions run in numeric order and stop at the first failure, except
that a selected clear runs last so it covers this attempt's own record.
```

Actions 1 and 2 appear only when the work changed repository files. When the
pass or bug fix changed none, leave both out of whichever menu applies instead
of showing them as no-ops. Keep every other action's number, and use only
shown numbers in the reply line's example, such as `3,4`, or `3` when the
clear is the only action left. A job-finished menu then offers 3 and 4, and
the three-action and bug menus offer 3 alone.

For action 1, use canonical short codes for commits, name every affected
repository, and include its files when the list remains concise. Otherwise
give its file count and a compact scope summary.

Action 3's <clear scope> is the exact job when the pass finished it, and
otherwise the exact review just opened plus any task that pass resolved.
The review always exists, because opening it is what produces the menu, so a
resolved task is an addition when there is one and the wording still reads
correctly when the pass resolved none. Naming the job includes its nested task
and review notifications present at the fresh check; a bug menu names the exact
bug's own notifications. More than one named code is one clear call per code.

The job-finished menu's action 4 is the one terminal state change shown. It
couples the exact Reviewable transition and established completion sweep before
any lane handoff, work discovery, or other-job work. The three-action menu and
the bug menu have no action 4.

`all` selects every action shown, `none` selects no action, and a numbered reply
selects exactly the shown actions whose numbers it contains. A response is
valid only when authored by a non-AI, non-advisory human and its first nonblank
line, after trimming, consists only of `all`, `none`, or a comma-delimited list
of unique action numbers shown in that menu, with optional spaces around
commas. Ignore later prose when interpreting the selection; do not infer
authorization from numbers elsewhere. Perform selected actions in their listed
relative order regardless of the order supplied. Only the job-finished
four-action menu's `all` or numbered selection containing `4` authorizes the
exact Reviewable transition and sweep. Any response that lacks
the shown action's authority or exact grammar authorizes nothing and requires
only a narrow clarification in the channel where it appeared.

The first valid response observed on either the package thread or in normal
client chat governs that package attempt. A later duplicate or conflicting
response does not authorize or repeat package work. A valid selection is final
for that attempt. Do not ask again for granted or omitted actions, and offer a
new package only after material work changes or an explicit human request.
While awaiting a valid reply to any menu, retain any assigned lane and
auto-take claim, and end each later turn, whatever ended it, with one line
naming the review or bug that holds the menu rather than the whole menu. This wait is not a review handoff: do not release the claim,
begin work discovery, or start another job or bug.

After every apparently valid reply, including `none`, read the reply its Poke
names before acting; a chat reply needs no read. Reconcile the first valid
human package-thread response and every existing AI terminal package record
you hold from Pokes and your own writes. An earlier governing package-thread selection or terminal
record takes precedence over a later response. An AI record preserves the
governing human selection but supplies no authority by itself.

A first valid normal-client-chat selection can govern the current uninterrupted
execution attempt when that reconciliation finds no earlier governing
selection or terminal record. Do not call `add_info` or create any other AI
selection receipt before attempting the package actions. If an interruption
loses that unrecorded chat selection before its terminal record is created,
require the human to repeat the selection, then reconcile again.

For a governing selection from either the package thread or normal client chat,
finish the required reconciliation, then attempt only its selected
actions. A selected clear is the exception to numeric order and runs last, after
every other selected action and after this attempt's terminal record, because a
record written after the clear leaves a notification the human just asked to be
rid of. After every other selected action succeeds, the first mandatory check or
selected action fails, or `none` selects no action, use `add_info` in the exact
package thread to create exactly one terminal record for that execution
attempt, then perform the selected clear. That record names the clear among its
remaining selected action numbers, since it is written before the clear runs; a
failed clear is reported in chat and never creates a second record. Reply to the governing human response when the selection came from the
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
including a job's task or review notifications created before the fresh check
and this attempt's own terminal record, which is created after it.
Opening the review, and resolving the bug, each also retains the ordinary
completion-time notification check.

The Reviewable transition and its completion sweep are one coupled action for
authorization: without permission for that exact transition, do neither. A
failed stage change does not trigger a sweep. Take the selected stage action
by calling `change_job_stage` with `from_stage` Doable; it refuses when the job
is no longer in Doable and names the stage it is in. If the refusal names
Reviewable, the exact assigned job has newly entered Reviewable: run the
triggered completion sweep immediately, then handle any assistance. For any
other stage, stop at that action and preserve the current stage. After a successful stage change, finish the sweep in the same
turn before any lane handoff, work discovery, or other job starts. If the sweep
fails, leave the job in Reviewable, report the failure, and block any lane
switch until the sweep succeeds. An incomplete failed sweep remains work from
its original transition trigger and must be retried directly, without a new
transition or package permission. Package permission applies only to the named
job or bug, the changes covered by its review or its bug thread, their affected
branches, and that item's notifications. It does not authorize tests,
builds, deployment, security work, force-push, unrelated dirty changes, another
job or bug, a broader notification clear, completion-candidate mutation, or a
conversation/context clear.

Stop at the first mandatory check or selected action that fails. Report what
succeeded, what failed, and which selected actions remain; do not attempt later
actions or roll back successful ones. A later retry resumes the incomplete
work under the same selection without repeating completed irreversible work.
Having no applicable commit, push or exact-item notification to act on is a
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
