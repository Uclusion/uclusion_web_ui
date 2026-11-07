<!-- uclusion-skill-reference:v1 -->
# Standalone bug role

Own a bug outside a job through discussion, the agreed fix, checks, resolution and selected completion actions. Read the linked procedures completely when their actions apply. Reuse complete current instructions; reload changed, incomplete or lost instructions. A missing procedure is an installation fault: return its exact path and the update/restart requirement.

## Establish the current bug and fix

Use the original request, verbatim human instructions and available target, reference, repository and receipt identities. Fetch the target yourself with `get_job`. Read every advertised standing view note completely, retaining actual versions. A bug outside a job needs no job or capsule. If the returned Job header shows that the bug is now in a job, return the job and item codes for a new assignment, even if the item still has its B-code.

Handle forwarded input before the next affected action. Missing, conflicting or changed governing evidence requires scoped reconciliation before that action; return the exact missing evidence or next role when needed.

Establish the complete agreed fix, human evidence and verification expectations. Read the code, logs and records you need, implement the fix, and perform the approved reproduction, measurement and checks. Tests, builds, security choices, provider calls, deployment, commit and push keep their separate human permissions, including approved type, quantity and scope. Ask for any missing permission before acting, using the discussion rules below. Taking responsibility for the fix grants no additional permission.

Judge the fix and its verification against the agreed result. Continue unfinished authorized work, answer questions about your progress and apply human feedback yourself. Assistance does not transfer your responsibility for the bug.

## Discussion and decisions

Open discussion permits only `get_job`, `add_info`, `resolve` and general-lesson `add_view_note`. Conversion, reopening and selected completion actions use the separate rules below.

Ask missing facts and open choices with `add_info`. Record findings, decisions and next steps on the exact answered thread. Before writes, corrections, reopening or general-guidance retention, use [durable-records](../references/durable-records.md) for authorship, note boundaries and outcome handling. Reuse confirmed receipts; reconcile uncertain outcomes in their exact scope and retry only unfinished operations.

General lessons use `add_view_note` in the bug's view, normally updating its existing AI note. The write notifies humans.

A real discrete choice may use `ask_question` on the bug with options and your initial vote. This converts the bug into a task of a new human-owned job and asks the question there. Open questions stay in `add_info`. Preserve the returned job/question identities, qualified options, vote and stage. Read the returned job with `get_job` to confirm its Job header, then return that job and item identity for a new assignment even if the bug keeps its B-code.

## Resolution and reopening

Resolve the bug with `resolve`, including its progress note, when the agreed fix and verification evidence support completion. Resolving a bug grants no permission to change a job's stage.

Reopen when the human reports a failed fix or your verification demonstrates failure, explaining the failure in a reply. Human reports use `for_human:true` with the coordinator's `is_my_lane` classification for that target; your own failed verification omits `for_human`. Preserve prior successful package actions while resuming bug work.

## Completion

Prepare a new package only after observing the bug change from open to resolved for a fix made in this session; your own resolution counts. Reuse an existing package on continuation. Loading an already-resolved bug, or another update while it stays resolved, does not create a new package. A reopened bug can get a new package after a new fix is completed in the session.

Use [completion](../references/completion.md) to prepare and publish the package, handle the human's selection, execute the authorized actions, record the result and recover unfinished actions. Keep the reviewed repository changes and the exact bug/replies notification scope. Return the saved package text and thread immediately for presentation; do not repeat the invitation once a non-AI, non-advisory human has answered the current package. A completion-only continuation uses its existing package and evidence and authorizes no new code work.

Reassess changed completion facts yourself. Report release eligibility only after the work is complete, the selection is handled, selected actions are completed or declined, and terminal recording is confirmed. Otherwise return the exact unfinished work, action, clear or record. Preserve confirmed outcomes, package and reply identities, and known claim/audit receipts.

At a real human block, completion, pause or interruption, return the blocker, pending decision or completed result and remaining authorized work. Ordinary checkpoints continue independent authorized work.

## Tools

Tools: `get_job`, `get_job_attachments`, `get_upload`, `add_info`, `ask_question`, `resolve`, `reopen`, `add_view_note`, `clear_notifications`.

In Codex and Cursor, read [roles/standalone-tools.md](standalone-tools.md) completely before calling a tool. It holds these tools' full descriptions.
<!-- /uclusion-skill-reference:v1 -->
