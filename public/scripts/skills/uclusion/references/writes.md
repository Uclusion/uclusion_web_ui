<!-- uclusion-skill-reference:v1 -->
# Durable writes and their outcomes

The coordinator loads this unit before durable writes or reconciling uncertain
write outcomes. The action-specific unit still governs what may be written;
this unit never grants a stage, testing, security or operational permission.
Completion-package mechanics remain solely in [operations.md](operations.md),
loaded for that action. Workspace exports and decision searches use
[reading.md](reading.md).

## Authorship and permitted records

Record every question, suggestion, approval, vote, resolution and review through
its Uclusion tool. Record designs, questions and new findings in the artifact
that owns the lane; chat may mirror a durable record but never replace it.
Ask each unsettled decision through the lane's permitted tool. AI-originated
questions, suggestions and reviews need no permission and
are never offered or deferred. A completion package in operations.md is the
one compound permission ordinary chat may answer. Standalone tool limits in
[single-comment.md](single-comment.md) still apply.

For records the human tells you to create in their name, set `for_human` only
for their words and reasoning, with required boolean
`is_my_lane` true for
assigned work to avoid an echo Poke, and false otherwise so agents receive it
and can potentially take up the work.
Ask for their vote's certainty and reason before recording it; never invent
them. Choose independently for nested `initial_vote` values.
Use the exact short code returned by Uclusion in tools, chat, commit messages
and durable notes.

## Durable threading and commit identities

Record substantive information once with the tool and artifact that own it.
Use `add_info` only for findings, decisions, blockers or next steps missing from
the durable thread. Do not add notes that merely recap a question and answer,
capsule, state transition or completed instruction reload. A decision belongs
in the current design when its workflow permits that write; avoiding a
duplicate note does not authorize rewriting a sent contract. Required reviews
and completion-package records remain mandatory without an extra recap note.
Reply on the exact comment being answered, not its thread root; flat root
replies separate answers from their questions and cannot be re-threaded.

To correct an existing ordinary note, reply or option Info, use `add_info`'s
update form with the complete replacement body, omitting the creation target.
Supply the version returned with the body you actually read. Keep
`parent_question_short_code_id` for a record inside a question. On conflict,
reload and reconcile the current body; never retry with an unseen version.
Replacement preserves identity and threading without adding a history note.
Omitted attachment metadata keeps existing files.
Human-authored records, capsules, reviews, standing view notes and machine
audit records cannot use this form; retain their dedicated tools and
protections. `for_human` applies only to creation.

Use canonical short codes verbatim. A source-code comment that cites a question
uses the question's full returned link when available. A proposed bug commit
message begins with the completed comment code. Job commit identities are
defined in [review.md](review.md).

## Write receipts and reconciliation

A write's result is the reload for what it produced. Inspect each outcome
separately: a later failure does not erase an earlier successful write.
Reconcile unconfirmed writes with scoped reads and retry only unfinished
steps. Do not call `get_job` to see a write you made and still have in context;
call it to see a write you did not make or no longer hold. `resolve` reports
only what it resolved. Others' changes arrive as Pokes, so handle those
instead of rereading the item. For a job, when you need the stage after `resolve`,
call `get_job` with `stage_only: true`.

## Reopening resolved work

On your own, reopen only a bug or task whose fix is shown to still fail, by a
human's report or a failed
verification, and say why in a reply on it. Reopen a question, suggestion or
blocker only on a human's instruction, and never a question they resolved to
delegate; ask a new question instead.

A human's report that a fix still fails is their request to reopen it, so pass
`for_human: true` with `is_my_lane` as the authorship rule above describes.
A failure your own verification finds is yours, so omit `for_human`. Job-stage outcomes of
reopening a task are in [job.md](job.md).

A reopened item is open work again. A reopened standalone bug's next resolution
is a new open-to-resolved transition, so its completion sweep runs again and, for a
fix you completed, a new completion package opens. What an earlier package did
stands; nothing is rolled back.

## Creating jobs and human-authored artifacts

For a requested new job, use the duplicate search and creation outcomes below
before creating it.

Use `add_job`, `add_task`, `add_bug`, and `add_blocker` only for the human's
explicit request. AI-originated ideas use `make_suggestion`. The one exception
is decomposing a newly requested job into
its initial task list.

For `add_bug`, use the human-indicated severity. For a dependency the AI discovers,
suggest it; create a blocker only when the human explicitly says the job is blocked. View-level creation should
target the implied existing job/bug view when one is named.

## Saving general lessons as view notes

Machine-, environment-, or user-specific facts may stay private. General
guidance belongs in an AI-authored view note through `add_view_note`.

Fold in the lesson, prune superseded material, and keep a tight topical digest.
Create a second note only for a genuinely separate topic. Never edit a human-authored
note; reply or suggest a revision.

Save qualifying lessons autonomously. The first time this rule applies, sweep
existing private memory: migrate general lessons to view notes and delete those
private copies. Treat later human edits to the note as authoritative.

## Requested job creation

Before `add_job`, export and delegate the duplicate/related-work search under
[reading.md](reading.md). Surface an
existing match instead of duplicating it. Cite related-but-distinct short codes
in the new description. Pass initial `tasks` when parts could be reviewed,
committed, or documented separately.

When the human requests a new job containing existing bugs, pass their short
codes in `bug_short_code_ids` alongside any new `tasks`. Each distinct bug has a
`moved`, `failed`, or `unconfirmed` outcome. Report those outcomes with the returned
new job identity. Preserve that identity when checking an unconfirmed result with `get_job`: each `add_job`
call creates another job, so repeating the call is not a retry of that job.
<!-- /uclusion-skill-reference:v1 -->
