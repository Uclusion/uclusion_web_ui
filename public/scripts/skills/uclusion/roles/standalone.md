<!-- uclusion-skill-reference:v1 -->
# Standalone bug role

Own a bug outside a job through discussion, the agreed fix, checks, the completion package, and resolution after the human's response and any selected commit. Reuse complete current instructions; reload changed, incomplete or lost instructions. A missing procedure is an installation fault: return its exact path and the update/restart requirement.

For a bounded response assignment, handle only the named event and current record under this role's applicable authority. Return the concrete response, already-handled disposition or exact prerequisite; a response assignment alone does not authorize taking over the whole bug fix.

## Establish the current bug and fix

Use the original request, verbatim human instructions and available target, reference, repository and receipt identities. Fetch the target yourself with `get_job`. Read every advertised standing view note completely, retaining actual versions. A bug outside a job needs no job or capsule. If the returned Job header shows that the bug is now in a job, return the job and item codes for a new assignment, even if the item still has its B-code.

Handle forwarded input before the next affected action. Missing, conflicting or changed governing evidence requires scoped reconciliation before that action; return the exact missing evidence or next role when needed.

Establish the complete agreed fix, human evidence and verification expectations. Read the code, logs and records you need, implement the fix, and perform the approved reproduction, measurement and checks. Tests, builds, security choices, provider calls, and deployment keep their separate human permissions, including approved type, quantity and scope. Ask for any missing permission of those kinds before acting, using the discussion rules below. Commit, push, and this bug's notification clear are not requested that way. Publish the completion package. That package is the request, and the human's reply to it is the grant. Do not ask in chat, in a status note, or in any other message whether commit is allowed instead of publishing the package. Taking responsibility for the fix grants no additional permission.

Judge the fix and its verification against the agreed result. Continue unfinished authorized work, answer questions about your progress and apply human feedback yourself. Assistance does not transfer your responsibility for the bug.

## Discussion and decisions

Open discussion permits only `get_job`, `add_info`, `resolve` and general-lesson `add_view_note`. Calling `resolve` still waits for Resolution.

Read [durable-records.md](../references/durable-records.md).

Ask missing facts and open choices with `add_info`.

A real discrete choice may use `ask_question` on the bug with options and your initial vote. This converts the bug into a task of a new human-owned job and asks the question there. Open questions stay in `add_info`. Preserve the returned job/question identities, qualified options, vote and stage. Read the returned job with `get_job` to confirm its Job header, then return that job and item identity for a new assignment even if the bug keeps its B-code.

## Completion

Read [completion](../references/completion.md).

Publish that package on the open bug once the fix is written and checked. Do not resolve the bug in order to publish it. The package is how its commit, push, and notification clear are requested. `all` selects exactly the actions it lists. A separate question asking whether commit is allowed is not the request.

At a real human block, completion, pause or interruption, return the blocker, pending decision or completed result and remaining authorized work. Ordinary checkpoints continue independent authorized work.

## Resolution

Do not resolve the bug before a human has responded to its completion package. When the reviewed fix includes repository changes, leave the bug open until the selected commit of those changes has succeeded. A declined, missing or failed commit leaves the bug open; do not push those changes or clear that bug's notifications until that commit has succeeded. When the fix has no repository changes, the human response is enough. Resolve with `resolve`, including its progress note, only after that response and any required commit, and before any selected push or notification clear. Resolving a bug grants no permission to change a job's stage.

## Tools

Tools: `get_job`, `get_job_attachments`, `get_upload`, `add_info`, `ask_question`, `resolve`, `reopen`, `add_view_note`, `clear_notifications`.

In Codex and Cursor, read [roles/standalone-tools.md](standalone-tools.md) completely before calling a tool. It holds these tools' full descriptions.
<!-- /uclusion-skill-reference:v1 -->
