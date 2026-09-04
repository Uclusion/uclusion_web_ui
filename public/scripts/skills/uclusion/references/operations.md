<!-- uclusion-skill-reference:v1 -->
# Uclusion operating procedures

## Contents

- Durable threading and commit identities
- Doable post-review completion package
- Notifications
- Context-clear boundary
- Workspace export and decision search
- Creating jobs and human-authored artifacts
- Uploading files
- Recording dependencies
- Saving general lessons as view notes

## Durable threading and commit identities

Every substantive result belongs in a Uclusion artifact. Reply with `add_info`
on the exact comment being answered, not its thread root; flat root replies
separate answers from their questions and cannot be re-threaded.

Use canonical short codes verbatim. A source-code comment that cites a question
uses the question's full returned link when available. After review opens, a
proposed commit message begins with the completed task/comment code. A job code
at the start means the whole job is done, so use it only when no tasks remain.

## Doable post-review completion package

When the core workflow identifies a complete, testable job-level code pass in
Doable, open the exact job's review with the current capsule-delta report. Do
not ask permission first. The review is required durable documentation and
generates the notification that brings the work to the human's attention.
Opening it does not change the job stage.

End the review report with the completion menu below. After `ask_for_review`
returns the review code or link, immediately print the same numbered menu in
normal client chat and name that review. The review footer says the human may
reply there or in the agent; the chat copy says the human may reply there or on
the named review. Neither copy calls `ask_question` or creates a Uclusion
question or assistance item. Both copies name the exact job and its exact
transition from Doable to Reviewable. Use this user-facing menu, substituting
the exact job, review, repositories, and current reviewed scope:

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

For action 1, use canonical short codes for commits, name every affected
repository, and include its files when the list remains concise. Otherwise
give its file count and a compact scope summary. Action 3 includes the exact
job's nested task and review notifications present at the fresh check. Action 4
couples the exact stage transition and established completion sweep before any
lane handoff, work discovery, or other-job work.

`all` selects actions 1 through 4, `none` selects no action, and a numbered
reply selects exactly the actions whose numbers it contains. A response is
valid only when authored by a non-AI, non-advisory human and its first nonblank
line, after trimming, consists only of `all`, `none`, or a comma-delimited list
of unique digits from `1` through `4`, with optional spaces around commas.
Ignore later prose when interpreting the selection; do not infer authorization
from action numbers elsewhere. Perform selected actions in their listed
relative order regardless of the order supplied. Only `all` or a numbered
selection containing `4` authorizes the exact Reviewable transition and sweep.
Any response that lacks that authority or exact grammar authorizes nothing and
requires only a narrow clarification in the channel where it appeared.

The first valid response observed on either the review or in normal client chat
governs that review attempt. A later duplicate or conflicting response does not
authorize or repeat package work. A valid selection is final for that attempt.
Do not ask again for granted or omitted actions, and offer the package again
only after material work changes or an explicit human request. While awaiting a
valid reply, retain the assigned lane and any auto-take claim. This wait is not
a review handoff: do not release the claim, begin work discovery, or start
another job.

After every apparently valid reply, including `none`, reload the exact job,
its assistance, and the exact review thread before acting. An earlier valid
human selection or accepted chat-selection record on that review governs over
a later response. A first review-thread selection is already its durable
package-state root, with no actions completed initially. When the current chat
reply is first, call `add_info` on the exact review to record its source,
canonical selection, and initial selected, completed, and remaining action
numbers. Then reload the thread and confirm that response or record still
governs. The AI-authored chat record preserves the human's authorization; it
supplies no authority by itself. If the record or reconciliation fails, perform
no package action.

At successful
completion, the first failure, or a later retry handoff, reply on that thread
with the completed and remaining actions. A `none` record is already terminal.
On retry, reconcile the latest state with the durable job, review, repository,
remote, notification, and sweep results. Never repeat an action whose durable
result is already present. Perform only the selected actions. The ordinary
read-only job, assistance, repository-scope, and notification checks remain
required at their workflow boundaries and need no permission.

Whenever at least one action is selected, make one fresh notification check
after the last selected commit or push and before any selected clear or
Reviewable transition. List the exact job's matching notifications even when
action 3 was omitted, but neither perform nor request an omitted clear again.
The job named in the menu prospectively identifies this clear scope, including
its task or review notifications created before the fresh check. Opening the
review also retains the ordinary completion-time notification check.

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
permission. Package permission applies only to the named job, the job- or
task-owned changes covered by its review, their affected branches, and the
job's notifications. It does not authorize tests, builds, deployment, security
work, force-push, unrelated dirty changes, another job, a broader notification
clear, completion-candidate mutation, or a conversation/context clear.

Stop at the first mandatory check or selected action that fails. Report what
succeeded, what failed, and which selected actions remain; do not attempt later
actions or roll back successful ones. A later retry resumes the incomplete
work under the same selection without repeating completed irreversible work.
Having no applicable commit, push, or exact-job notification to act on is a
successful no-op, not a failure.

## Notifications

Call `get_notifications` whenever the human requests their inbox and at every
completion moment: resolving a bug/job, opening review, or receiving sign-off
and committing. Use a fresh check after the completion action. The required
Doable review's completion menu is its sole notification-clear offer. Make the
ordinary fresh check after opening that review and list its exact-job matches,
but do not ask a separate clear question. A failed check must not delay or
suppress the required menu mirror in chat. A later selected package pass still
makes its execution-time fresh check after any selected commit or push.

Outside that required Doable review flow, if notifications exist for the item
just worked, list them and ask whether to clear those exact notifications. Call
`clear_notifications` only after explicit permission for that object. When the
package already grants that permission, list the matching notifications and
call `clear_notifications` with the exact job short code without asking again;
this includes notifications about its nested reports or tasks but leaves every
unrelated notification untouched.
When the valid package selection omitted action 3 or selected `none`, list the
matching notifications but do not ask again or call the clear tool for that
attempt. Never offer or perform a broader clear. If none exist, do not ask or
call the clear tool.

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

Uclusion has no first-class job dependency. A human-confirmed blocker on the
blocked job names the prerequisite job's short code.

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
