<!-- uclusion-skill-reference:v1 -->
# Completion packages

## Prepare and publish

Prepare the concrete package for the reviewed work you have finished, including available actions for a completed part of a larger job. Identify its scope by the reviewed repository changes and completed job, task or bug codes. Explain what this package finishes. For partial work, name what remains, why it prevents whole-job completion and the next action or missing permission. Keep detailed findings in the review narrative.

For a standalone bug, publish the package while the bug is still open, after the fix is written and checked in this session. Do not resolve the bug to make publication possible; its resolution conditions are in Execute the remaining work below. Reuse an existing package when continuing that completion. Reading an already-resolved bug or receiving another update while it stays resolved does not require a new package. A reopened bug can get a new package after a new fix is ready in the session, while the bug is open.

List the actual available actions in this order:

1. Commit only the identified reviewed changes, naming repositories/files or a compact unambiguous scope.
2. Push only those commits.
3. Clear all remaining notifications for the exact finished whole job, otherwise its review and identified resolved tasks; for a standalone bug, the exact bug and its replies.

Always offer that scoped notification clear without calling `get_notifications` first, even if an earlier read was empty; publishing the package can create notifications. If the human has already declined that clear, retain the decline instead of offering it again, and exclude it from `all`.

Omit commit and push when no repository work applies. Publish the package to request commit, push and notification-clear permission. Do not replace it with a permission question in chat, a status note or another message. Explain that `all` selects exactly the listed actions and scope. The human's reply grants permission for the actions it selects. Other actions retain their independent permissions.

Include the AI product, model, version and effort information actually exposed by your runtime in the review or bug completion note; do not invent unavailable fields. For a job, publish the narrative and this package together with `ask_for_review`, which appends the package last. A newly created review can be named as “this review”; its saved receipt supplies the canonical thread identity. For a bug fixed in this session, publish with `add_info` on its open bug thread.

End an unanswered offer on the package thread with: “Reply `all`, or tell me in your own words what you want.” If a non-AI, non-advisory human response to the applicable package has already arrived, retain its exact identity/message and execute its authorized remainder under the procedure below instead of requesting the same decision again.

When this conversation is the response destination, immediately present the canonical saved thread and exact confirmed package text, including its scope explanation and applicable invitation, before further work. Otherwise return them with the responsible helper and response destination through the coordinator for presentation there. Report whether the package was presented, what the human selected or that no answer has arrived, which actions remain, and whether the attempt's result was recorded. Do not immediately present a package again when its presentation is already confirmed. Preserve the evidence that the reviewed work is finished, its target and governing capsule or agreed requirements, and all confirmed and unfinished action results.

## Execute selected actions

Use the exact package, reviewed changes, notification scope and human instruction. A request only to complete package actions uses the existing package and completion evidence and authorizes no new code work. Fetch missing or changed package, thread or target evidence with `get_job`, including the actual job or bug state and every advertised standing note. Read a delivered reply before acting; a supplied chat instruction needs no thread read. Reuse current evidence and confirmed receipts, reconciling changes to reviewed scope or authorization before the affected action. Apply the same reviewed-scope, package and permission requirements to a direct Git request.

### Select and authorize

Only a non-AI, non-advisory human response in the thread or chat selects actions. `All` selects exactly the listed actions; interpret other wording against the package and clarify a materially ambiguous part where the instruction arrived. Record a decline as the human's decision without performing the declined action. Treat later replies as new instructions while preserving completed outcomes.

The human's reply supplies permission for each selected action, including the listed notification clear when `all` is chosen. Perform that clear after the preceding selected actions succeed without asking for another grant. The selection supplies no permission for actions outside the package.

### Execute the remaining work

Determine remaining commit and push work from actual Git state and prior confirmed outcomes. Act only on the selected reviewed scope, in package order. For a standalone bug, call `resolve` with its progress note after the human has responded and before any selected push or notification clear. If the reviewed fix includes repository changes, resolve only after the selected commit of those changes succeeds; a declined, missing or failed commit leaves the bug open and prevents pushing those changes or clearing that bug's notifications. If the fix has no repository changes, the human response is sufficient for resolution. Resolving the bug does not authorize a job-stage change. Stop at the first failed action or missing required permission, retain successful outcomes and identify the remaining work. Clear the exact authorized scope directly without a notification preview. If nothing remains to do, including when the authorized notification scope is empty, report a successful no-op.

Compose each selected commit message beginning with the task, bug or comment code. A job-code prefix means the whole job is finished and requires no remaining tasks.

### Record and recover

Record the result of each attempt once on the human reply it answers, or on the package root for a chat instruction. Identify the instruction and the completed, declined, failed and remaining work as applicable, including any missing permission.

When prior selected actions succeeded and clearing is authorized, include the attempt record in the last `clear_notifications` call. Otherwise record it with `add_info`, silently when clearing was selected. Check the returned action and record outcomes separately.

If recording is uncertain, check the exact thread before writing again, and write only if the record is absent. A retry acts only on unfinished work and writes one new attempt record. Confirmed earlier action and record receipts remain valid after a later failure.

Return the job or bug, package and reply identities and known claim or audit receipts. State separately whether the assigned work is finished, what the human selected or left unanswered, each action's outcome, whether its attempt was recorded, and the exact next action. Reuse current completion evidence and reassess missing or changed facts yourself.

For a finished Reviewable job, tell the coordinator that the job's implementation is complete even if the presented package is unanswered or its notification clear is unfinished. An unfinished clear or missing record of that clear attempt does not require keeping the job assigned. Selected commit and push actions still require execution or recovery; return their exact unfinished step. Do not report an unfinished whole job as complete merely because a partial package is ready, or a standalone bug as resolved before its resolution conditions above are met.

Keep responsibility for this package after the implementation assignment ends, with its response destination, exact offer, later replies, human selection and confirmed or unfinished actions and records. Return later replies and reminders through the coordinator when it is the response destination, and remind the human of an unanswered package from time to time without requiring a reply before other work can be assigned. Do not replay completed actions or request permission already granted. Report completion for this job or bug; the coordinator decides which work may be assigned next.
<!-- /uclusion-skill-reference:v1 -->
