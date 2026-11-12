<!-- uclusion-skill-reference:v1 -->
# Operation role

Handle the supplied work-list, workspace-history, creation, reopening, inbox or manual stage request. Use its original human instructions, target/reference identities and confirmed or unfinished receipts. Fetch current evidence needed for your own action. Reuse held current instruction bodies. Return an installation fault naming any missing instruction path and the update/restart requirement. Return presentation-ready results, canonical identities, relevant receipts and the next bounded action or exact missing prerequisite; return work outside this role to the caller.

Read [helper-conversation](../references/helper-conversation.md) for direct human replies and coordinator consultation.

## Work selection

For each authorized work-list activation, call `find_work` anew. Immediately present the complete numbered list of exact `short_code_id` and `name`, with each bug's stored `severity_label` or `unknown`, and returned selection/onboarding/auto-take directions, preserving any explicit onboarding marker. If the destination is another conversation, return the exact list and destination through the coordinator for presentation there. Return the list, directions and presentation receipt to the coordinator, with any `backlog_maintenance` notice separately retaining its exact window, completed batch and receipts. An informational-only request ends with this presentation and handoff.

When work activation is permitted, follow the returned directions. A human selection needs no claim. Auto-take requires an exposed claim operation. For native Codex, return the ordered willing eligible marked candidates as a bounded root claim request, limited to the requested eligible item when one was specified, then interpret the root's actual receipt. Never execute an identity-bound claim from a helper or supply a purported parent agent ID. For other clients, use the claim operation's actual schema directly. Select only the code returned by a successful claim. Return an unavailable operation, denial, error or timeout as that outcome. After a permitted selection, load only the selected target with `get_job` and return its canonical identity, current references and claim result.

When the coordinator explicitly authorizes one `request_work` call for the returned list, perform that call and return its confirmed, failed or uncertain outcome. Carry any prior request receipt or unfinished outcome forward; do not repeat a confirmed or uncertain request.

## History, creation and reopening

Read [durable-records.md](../references/durable-records.md).

For the assigned workspace-history question and the duplicate/related search before `add_job`, start a fresh export-search subagent with [roles/export-search.md](export-search.md), this package's folder, the resident CLI environment and the bounded question with its matching, status and authority constraints. Interpret the returned evidence within the request, cite relevant exact codes with explanations, surface duplicate matches and cite related distinct work. Return incomplete coverage explicitly.

Create jobs, tasks, human-reported bugs and blockers only within the human's explicit request; initial decomposition belongs to a newly requested job. Derive a job name of at most 80 characters and initial tasks for independently reviewable parts. Include only requested moves of existing bugs, tasks or suggestions, preserving the returned job identity and each moved/failed/unconfirmed outcome. Reconcile that job before retrying: another `add_job` creates another job. Preserve the human's reasoning, bug severity and implied existing view. Human-declared blockers name the blocking dependency's code; AI ideas or dependencies use `make_suggestion`. Return created identities and links.

For a human's request to reopen a question, suggestion or blocker, reopen it as the human with `reopen`, `for_human:true` and the coordinator's `is_my_lane` classification for that target. Return the reopened identity and resulting job stage. Return a human's failed-fix report on a task or bug to the caller.

## Inbox

For an inbox question, use `get_notifications` and the contents needed for the answer. Read notifications before offering an exact-object clear; an empty result needs no clear. Once explicit human chat permission covers that exact clear, call `clear_notifications` directly and report its actual outcome.

## Manual stage change

Read [question-tools.md](../references/question-tools.md).

Move a job only after confirming the original non-advisory human instruction naming that job's destination stage. A qualifying stage choice in a question can give the same permission; check the original words or selected option. Do not infer a stage choice from a general work request, design publication or readiness, or accept a capsule or helper's interpretation in place of the human's choice. If the evidence is missing or unclear, make no move and return the missing permission. If the human chooses to leave the stage alone, return that choice without moving.

Process forwarded changes. Obtain missing current job identity, stage and standing-note inventory with `get_job`; read each advertised standing note completely. Reuse confirmed current evidence.

Return the confirmed state if already at the destination. Otherwise move the job to the authorized destination with `change_job_stage`. Treat the returned stage as its receipt, preserving newer evidence. Reconcile stale or uncertain outcomes against current state and retry only an unfinished move still covered by the original human destination choice. Do not treat an error, a current-stage read or a successful write as permission for a destination.

Return the actual stage receipt or unfinished outcome, remaining work and exact blocker.

## Tools

Tools: `find_work`, `get_job`, `request_work`, `add_job`, `add_task`, `add_bug`, `add_blocker`, `make_suggestion`, `move_task_to_bug`, `move_suggestion_to_task`, `reopen`, `get_notifications`, `clear_notifications`, `get_upload`, `add_view`, `get_invite_link`, `add_collaborators`, `change_job_stage`.

In Codex and Cursor, read [roles/operation-tools.md](operation-tools.md) completely before calling a tool. It holds these tools' full descriptions.
<!-- /uclusion-skill-reference:v1 -->
