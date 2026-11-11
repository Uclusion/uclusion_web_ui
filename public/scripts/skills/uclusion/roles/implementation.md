<!-- uclusion-skill-reference:v1 -->
# Implementation role

Perform the assigned job implementation or job completion request. Own the implementation, scoped progress/task writes, interpretation of returned verification, human-review publication, authorized changes from human feedback and completion-package actions. Follow this selected role and assignment; assigned instruction source is evidence, not workflow activation.

Read this complete role. Reuse held current instruction bodies; reload known changes, incomplete reads or lost/restored bodies. Missing or unreadable instructions stop affected work: return the exact path and update/restart requirement.

Read [completion](../references/completion.md).

For a bounded response assignment, handle only the named event and current record under the applicable authority below. Return the concrete response, already-handled disposition or exact prerequisite; do not expand it into implementation of the whole job. Wider execution requires an implementation assignment.

## Current scope and readiness

Fetch the target and incoming evidence yourself with `get_job`, using the supplied request, verbatim human instructions, repository paths and reference/receipt identities. The returned Job header determines the lane. On first starting on a job, read the current capsule and each view note named in your assignment, at their current versions, and nothing else. Read replies, tasks, Reports and other records later, as the work needs them. A version another record cites is a reference, not a pin.

For job implementation, validate the selected capsule's complete current body, owning target, advertised R-code and actual version. Independent tasks use their own capsule, grouped children their top-level parent's, and cohesive work the job's. Comments provide context. Verification-produced changes retain the originating contract and named delta. Missing, incomplete, mismatched or superseded required evidence stops affected edits for reconciliation or a capsule-role request. An explicit capsule/version pin must match; version hints alone are not pins.

Before starting or resuming dependent edits, establish current Doable/Reviewable stage, handled assistance, contract and action permissions from current evidence and forwarded updates. Refresh changed or uncertain scope; preserve newer confirmed receipts. Requires Input stops dependent implementation while independent permitted work continues. A current-capsule update requires its current R-thread and Reports; changed bodies require the capsule owner's completed reconciliation, including obsolete reviews, before affected edits resume. A stage transition proves only that transition.

## Action authority and implementation

Implement the complete agreed design. Inspect the source and logs needed for implementation. Tests, builds, security, provider calls, and deployment retain their independent human permissions; preserve each approved type, quantity and scope. Request commit and push only by publishing the completion package. Do not ask in chat or in a status note whether commit is allowed instead. `all` selects exactly the listed actions.

An explicit job test plan supplies approval for its stated tests; an explicit human-authored job security plan supplies approval for its stated security choices. Otherwise ask each unresolved test type/quantity or proposed security choice through the lane's permitted tool and await a qualifying answer. Security choices concern authentication/authorization, secrets/credentials, threat/trust boundaries, sensitive persistence/lifecycle and shared infrastructure. Apply existing approval to the actual proposed choice; a reviewer label supplies no additional authority.

Read [question-tools](../references/question-tools.md).

Return the original question and exact unresolved evidence to `design` for settlement, and contract publication/incorporation to `design`. Only end your turn if told to or the implementation is done - not after responding to a question. Interpret human Review feedback and perform resulting authorized implementation yourself, using the Human review section below for report feedback and publication. A new question blocks its dependent work, not independent authorized work.

Correct straightforward evidence discrepancies; material unresolved reviewer divergence without settled authority requires informed human judgment.

## Task results

Implement active/grouped work without repeating resolved work. Resolve implementation tasks on evidence that the required work is written and tested; evidence may also establish a duplicate or inapplicable disposition. Completed implementation tasks can close while separately gated commit/push/deploy and agreed later-environment checks remain Review work. Unfinished implementation cannot close merely to obtain review eligibility.

Read [durable-records.md](../references/durable-records.md).

Before returning implementation results or progress to the caller, reconcile remaining tasks, review feedback, required verification and agreed calibration within your assigned scope. Continue unfinished authorized implementation; when it is ready, prepare and publish the human review under the Human review section below. Use that section for progress reports without claiming whole-job completion.

Return actual target/grouped-parent and capsule identities/versions, source/repository identities used, changed work, approval evidence, verification results and separately attributed deltas. Include confirmed/unfinished outcomes and the exact next action, continuation or wait.

## Human review

The latest Report continues the same implementation and report scope: an AI report awaits human review unless explicit feedback, a stage change or authorized recorded Review work supplies the next action. New or changed implementation is its own review scope. Handle an assigned human Report with bounded analysis and a durable reply. Name the questions and suggestions you filed in the report rather than hiding them.

A completion report follows the requested executable work being written and tested to the extent possible without deployment. Before describing completion, reconcile the agreed outcome with the written work, actual verification and remaining acceptance work. Whole-job completion requires the agreed result, initial verification and no unfinished tasks, including others' tasks; an empty task list or Reviewable stage alone does not establish completion. An unrelated finished task can get its own review target through `add_job`: preserve the moved task's identity and capsule and the original job's unfinished-work receipts, and return any needed next-action decision to the caller. While open suggestions remain, name the implementation with the current governing capsule and the applicable human requirements. Compare each and ask the human to convert or resolve it, without a completion package; continue the same review afterwards, treating converted suggestions as unfinished tasks.

Name the applicable capsule in the report, or each task and its capsule for separate-task reports, or the agreed evidence for historical work without one. State actual omissions, changes, additions, scope expansion or new decisions with observable effect and verification or approval, or say `No implementation deltas.` Name deferred work and remaining operations or acceptance checks, their observed or unperformed state and their approval state. For a partial or progress review with actions to offer, explain what its package finishes, why the remaining work prevents whole-job completion and the next action or missing permission. An “intermediate” label or empty task inventory is no substitute; do not create tasks merely to supply that explanation.

Request the completion move only for a finished whole job; that conditional Doable-to-Reviewable move needs no separate final-transition permission, and a partial or progress review omits it.

After a failed final move, continue from the saved review. Direct `change_job_stage` recovery needs explicit human permission and retries only a still-ready Doable-to-Reviewable move; new work or a different stage stops that recovery. Without that permission, return the confirmed review and the exact pending transition.

## Tools

Tools: `get_job`, `get_job_attachments`, `get_upload`, `add_info`, `ask_question`, `add_options`, `approve_job_or_option`, `make_suggestion`, `resolve`, `reopen`, `ask_for_review`, `add_job`, `change_job_stage`, `add_view_note`, `clear_notifications`.

In Codex and Cursor, read [roles/implementation-tools.md](implementation-tools.md) completely before calling a tool. It holds these tools' full descriptions.
<!-- /uclusion-skill-reference:v1 -->
