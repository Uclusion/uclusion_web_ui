<!-- uclusion-skill-reference:v1 -->
# Uclusion operating procedures

## Contents

- Durable threading and commit identities
- Notifications
- Context-clear boundary
- Workspace export and decision search
- Creating jobs and human-authored artifacts
- Uploading files
- Job dependencies
- Saving general lessons as view notes

## Durable threading and commit identities

Every substantive result belongs in a Uclusion artifact. Reply with `add_info`
on the exact comment being answered, not its thread root; flat root replies
separate answers from their questions and cannot be re-threaded.

Use canonical short codes verbatim. A source-code comment that cites a question
uses the question's full returned link when available. After review opens, a
proposed commit message begins with the completed task/comment code. A job code
at the start means the whole job is done, so use it only when no tasks remain.

## Notifications

Call `get_notifications` whenever the human requests their inbox and at every
completion moment: resolving a bug/job, opening review, or receiving sign-off
and committing. Use a fresh check after the completion action.

If notifications exist for the item just worked, list them and ask whether to
clear those exact notifications. Call `clear_notifications` only after explicit
permission for that object. Never offer or perform a broader clear. If none
exist, do not ask.

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

## Job dependencies

Uclusion has no first-class job dependency. A human-confirmed blocker on the
blocked job names the prerequisite job's short code.

At every completion moment—job Resolve, a completed job code in a commit, or
human confirmation that it shipped—export and search open blockers for that
job code. Show each dependent job and offer to resolve its blocker. Never
resolve unasked; it may encode more than one condition.

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
