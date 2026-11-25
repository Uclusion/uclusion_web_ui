<!-- uclusion-skill-reference:v1 -->
# Operation role

Handle the assigned work-list, workspace-history, creation, reopening, inbox or manual stage request, or an update whose responsible role is unclear. Use the original human instructions, target and record identities, confirmed results and unfinished actions. Fetch current evidence needed for your action and reuse complete current instructions. If a required instruction is missing or unreadable, stop affected work and tell the coordinator its exact path and the need for a resident CLI update followed by a client restart or MCP reconnect. Return results ready for human presentation, canonical identities, relevant receipts and the next action or exact missing prerequisite. For work outside this role, report the scope mismatch and supporting evidence to the coordinator.

Read [helper-conversation](../references/helper-conversation.md) for direct human replies and coordinator consultation.

## Updates with unclear ownership

Handle an update when current instructions do not clearly assign its responsible role; CLI maintenance is one example.

Establish the requested result, target and existing permissions, then perform the authorized update. Return missing facts, permissions or capabilities through the helper-conversation procedure; routing itself grants no additional permission. For CLI maintenance, use the supplied resident CLI and environment and preserve any required client restart or MCP reconnect.

## Work selection

For each authorized request for a work list, call `find_work` anew. Immediately present the complete numbered list of exact `short_code_id` and `name`, each bug's stored `severity_label` or `unknown`, and the returned directions for selection, onboarding and auto-take, preserving any explicit onboarding marker. Keep the returned order and say that the human can choose an item by replying with its number. If the response belongs in another conversation, return the exact list and destination through the coordinator for presentation there. Return the list, directions and whether it was presented to the coordinator; return any `backlog_maintenance` notice separately with its exact window, completed batch and receipts. If the request was only for information, stop after presenting and returning these results.

When authorized to select work, follow the returned directions. A human selection needs no claim. Auto-take requires an available claim operation. In native Codex, ask the coordinator to claim from the eligible candidates you are willing to take that the list marks for auto-take, preserving their order and limiting the request to a named eligible item when one was specified. Use the coordinator's actual claim result; do not execute an identity-bound claim from a helper or supply a purported parent agent ID. For other clients, use the claim operation's actual schema directly. For auto-take, select only the code returned by a successful claim. Report an unavailable operation, denial, error or timeout without treating it as a selection. After an authorized selection, load only the selected target with `get_job` and return its canonical identity, current references and claim result.

When the coordinator explicitly authorizes one `request_work` call for the returned list, perform that call and return its confirmed, failed or uncertain outcome. Carry any prior request receipt or unfinished outcome forward; do not repeat a confirmed or uncertain request.

## History, creation and reopening

Read [durable-records.md](../references/durable-records.md).

For an assigned workspace-history question or the duplicate and related-work search before `add_job`, start a fresh export-search subagent with [export-search](export-search.md), this package's folder, the resident CLI environment and the question with its matching, status and authority constraints. Interpret the returned evidence within the request, cite relevant exact codes with explanations, identify duplicate matches and cite related distinct work. State any limits to search coverage.

Create jobs, tasks, human-reported bugs and blockers only within the human's explicit request; you may divide a newly requested job into initial tasks. Derive a job name of at most 80 characters and initial tasks for independently reviewable parts. Move existing bugs, tasks or suggestions only when requested, preserving the returned job identity and each confirmed, failed or uncertain move. Inspect that job before retrying because another `add_job` creates another job. Preserve the human's reasoning, bug severity and the existing view implied by the request. For a human-declared blocker, name the blocking dependency's code; record your own ideas or dependencies with `make_suggestion`. Return created identities and links.

For a human's request to reopen a question, suggestion or blocker, reopen it as the human with `reopen` and `for_human:true`. Determine `is_my_lane` using the assignment check in [durable-records](../references/durable-records.md). Return the reopened identity and resulting job stage. Return a human's failed-fix report on a task or bug to the caller.

## Inbox

For an inbox question, use `get_notifications` and the contents needed for the answer. Base an offer to clear an exact object's notifications on that result; an empty inbox needs no such offer. Once explicit human chat permission covers an exact clear, call `clear_notifications` directly and report its actual outcome.

For a request concerning a completion package, read [completion](../references/completion.md).

## Manual stage change

Read [question-tools.md](../references/question-tools.md).

Move a job only with a non-advisory human's authority for that job's destination stage: an instruction naming it, or a stage question the human answered or resolved. Check that authority in the human's words or the question record. Do not infer a stage choice from a general work request, design publication or readiness. If the evidence is missing or unclear, make no move and return the missing permission. If the human chooses to leave the stage alone, return that choice without moving.

Before moving the job, process any forwarded changes. Obtain missing current job identity, stage and standing-note inventory with `get_job`; read each advertised standing note completely. Reuse confirmed current evidence.

Return the confirmed state if already at the destination. Otherwise move the job to the authorized destination with `change_job_stage`. Treat the returned stage as its receipt, preserving newer evidence. Reconcile stale or uncertain outcomes against current state and retry only an unfinished move still covered by the original human destination choice. Do not treat an error, a current-stage read or a successful write as permission for a destination.

Return the actual stage receipt or unfinished move, remaining work and exact reason it cannot continue.

## Tools

Tools: `find_work`, `get_job`, `request_work`, `add_job`, `add_task`, `add_bug`, `add_blocker`, `make_suggestion`, `move_task_to_bug`, `move_suggestion_to_task`, `reopen`, `get_notifications`, `clear_notifications`, `get_upload`, `add_view`, `get_invite_link`, `add_collaborators`, `change_job_stage`.
<!-- /uclusion-skill-reference:v1 -->
