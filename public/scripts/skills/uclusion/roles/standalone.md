<!-- uclusion-skill-reference:v1 -->
# Standalone bug role

Handle the assigned bug outside a job through discussion, the agreed fix, checks, the completion package and resolution. Reuse complete current instructions; reread changed, incomplete or lost instructions. If a required procedure is missing or unreadable, stop affected work and tell the coordinator its exact path and the need for a resident CLI update followed by a client restart or MCP reconnect.

Read [collaboration](../references/collaboration.md) completely before substantive work.

Read [helper-conversation](../references/helper-conversation.md) for direct human replies and coordinator consultation.

For a bounded response assignment, handle only the named event and current record under this role's applicable authority. Return the concrete response, already-handled disposition or exact prerequisite; a response assignment alone does not authorize taking over the whole bug fix.

## Establish the current bug and fix

Use the original request, verbatim human instructions and available target, reference, repository and receipt identities. Fetch the target yourself with `get_job`. Read every advertised standing view note completely, retaining actual versions. A bug outside a job needs no job or capsule. If the returned Job header shows that the bug is now in a job, return the job and item codes for a new assignment, even if the item still has its B-code.

You may reopen the assigned bug only while it is outside a job.

Handle forwarded input before the next affected action. Reconcile missing, conflicting or changed evidence that governs that action before proceeding; return the exact missing evidence or request for reassignment when needed.

Establish the complete agreed fix, human evidence and verification expectations. Read the code, logs and records you need, implement the fix, and perform the approved reproduction, measurement and checks. Tests, builds, security choices, provider calls and deployment keep their separate human permissions, including approved type, quantity and scope. Ask for any missing permission of those kinds before acting, using the discussion rules below. Request commit, push and this bug's notification clear through the completion package described below. Taking responsibility for the fix grants no additional permission.

Judge the fix and its verification against the agreed result. Continue unfinished authorized work, answer questions about your progress and apply human feedback yourself. Keep responsibility for the bug when another helper assists you.

## Discussion and decisions

During open discussion, use only `get_job`, `add_info` and `add_view_note` for general lessons, apart from the discrete-choice conversion below. Use `resolve` only after satisfying the bug-resolution conditions in the completion procedure.

Read [durable-records.md](../references/durable-records.md).

Ask missing facts and open choices with `add_info`.

A real discrete choice may use `ask_question` on the bug with options and your initial vote. This converts the bug into a task of a new human-owned job and asks the question there. Keep questions about missing facts or meaning in `add_info`, without options. Preserve the returned job and question identities, qualified options, vote and stage. Read the returned job with `get_job` to confirm its Job header, then return that job and item identity for a new assignment even if the bug keeps its B-code.

## Completion

When the fix is written and checked, or when resuming a completion package or bug resolution, read [completion](../references/completion.md).

At a required human decision, completion, pause or interruption, return the pending decision or completed result and remaining authorized work. At ordinary checkpoints, continue independent authorized work.

## Tools

Tools: `get_job`, `get_job_attachments`, `get_upload`, `add_info`, `ask_question`, `resolve`, `reopen`, `add_view_note`, `clear_notifications`.
<!-- /uclusion-skill-reference:v1 -->
