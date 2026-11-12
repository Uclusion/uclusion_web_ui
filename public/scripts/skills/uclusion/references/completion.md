<!-- uclusion-skill-reference:v1 -->
# Completion packages

## Prepare and publish

Prepare the concrete package for your reviewed finished scope, including available actions for partial work. Use the reviewed repository changes and exact notification scope from current evidence. Include a concise explanation of what this package finishes. For partial work, name what remains, why it prevents whole-job completion and the next action or missing permission. Keep detailed findings in the review narrative.

For a standalone bug, publish the package while the bug is still open, after the fix is written and checked in this session. Do not resolve the bug before a human responds to that package, and do not resolve it in order to publish the package. When the fix includes repository changes, leave the bug open until the selected commit has succeeded. A declined, missing or failed commit leaves the bug open; do not push those changes or clear that bug's notifications until that commit has succeeded. When the fix has no repository changes, resolve only after the human responds to the package. After that response, and after the required commit when there is one, resolve with `resolve` and its progress note before any selected push or notification clear. Reuse an existing package on continuation. Loading an already-resolved bug, or another update while it stays resolved, does not create a new package. A reopened bug can get a new package after a new fix is ready in the session, while the bug is open.

List the actual available actions in this order:

1. Commit only the identified reviewed changes, naming repositories/files or a compact unambiguous scope.
2. Push only those commits.
3. Clear the exact finished whole job, otherwise its review and identified resolved tasks; for a standalone bug, the exact bug/replies scope.

Omit commit/push when no repository work applies. This package is how commit, push, and the notification clear are requested. Publish it. Do not ask in chat, in a status note, or in any other message whether those actions are allowed instead. Explain that `all` selects exactly the listed actions and scope. A separate question asking whether commit is allowed is not the request. The human's reply to the package is the grant for the actions it selects. Other actions retain their independent permissions.

Include the available runtime-visible AI product, model, version and effort information in the review or bug completion note without inventing fields. For a job, publish the narrative and this package together with `ask_for_review`, which appends the package last. A newly created review can be named as “this review”; its saved receipt supplies the canonical thread identity. For a bug fixed in this session, publish with `add_info` on its open bug thread.

End an unanswered offer on the package thread with: “Reply `all`, or tell me in your own words what you want.” If a non-AI, non-advisory human response to the applicable package has already arrived, retain its exact identity/message and execute its authorized remainder under the procedure below instead of requesting the same decision again.

Present the canonical saved thread and exact confirmed package text, including the scope explanation and applicable invitation, immediately when this conversation is its destination, before follow-on work. Otherwise return them with the responsible owner and response destination through the coordinator for presentation there. Return the current selection, pending action/terminal state and actual presentation receipt with the package; a confirmed presentation needs no second rendering. Later unchanged waits return the exact package/reply identity and pending state. Preserve your substantive completion confirmation for that scope, its target/applicable-contract identities and confirmed/unfinished receipts with any selected-action request.

## Execute selected actions

Use the exact package, reviewed changes, notification scope and human instruction. A completion-only request uses the existing package and completion evidence and authorizes no new code work. Fetch missing or changed package/thread/target evidence with `get_job`, including the actual job or bug state and every advertised standing note. Read a delivered reply before acting; a supplied chat instruction needs no thread read. Reuse current evidence and confirmed receipts, reconciling changes to reviewed scope or authorization before the affected action. Direct Git requests retain these reviewed-scope, package and permission requirements.

### Select and authorize

Only a non-AI, non-advisory human thread/chat response selects actions. `All` selects exactly the listed actions; interpret other wording against the package and clarify a materially ambiguous part where the instruction arrived. Declining completes that selection. Later replies are new instructions and preserve completed outcomes.

The human's reply to the package is the permission for each action it selects. `all` selects exactly the listed commit, push, and notification clear. Perform that clear in the same completion. Do not stop after commit and push and leave the clear for a later grant, and do not ask again in chat or in a status note. An unfinished clear does not delay find work. The package's commit/push/clear selection supplies no permission for other actions.

### Execute the remaining work

Determine remaining commit/push work from actual Git state and prior confirmed outcomes. Act only on the selected reviewed scope, in package order. For a standalone bug, `resolve` is the exception: call it with its progress note only after the human response and, when the reviewed fix includes repository changes, only after the selected commit of those changes has succeeded, and before any selected push or notification clear. A declined, missing or failed commit leaves the bug open; do not push those changes or clear that bug's notifications until that commit has succeeded. Stop at the first failed action or missing required permission, retain successful outcomes and identify the remaining work. Nothing remaining is a successful no-op. Clear a fixed authorized scope directly.

Compose each selected commit message beginning with the task, bug or comment code. A job-code prefix means the whole job is finished and requires no remaining tasks.

### Record and recover

Write one terminal record per attempt on the human reply it answers, or on the package root for a chat instruction. Identify the instruction and the completed, declined, failed and remaining work as applicable, including any missing permission.

When prior actions succeeded and clearing is authorized, the last `clear_notifications` call carries the record. Otherwise record with `add_info`, silently when clearing was selected. Treat the returned action and record outcomes separately.

If a record's outcome is uncertain, check its exact thread before writing it again, and write it only if absent. A retry acts only on unfinished work and writes one new attempt record. Confirmed earlier action/record receipts remain valid after a later failure.

Return target/package/reply identities and known claim/audit receipts, distinguishing the selection, action outcomes, terminal-record receipts and exact failed, uncertain or pending work. For a finished Reviewable job or resolved bug, report release eligibility only when the work is confirmed complete, the selection is handled, selected actions are completed or declined, and terminal recording is confirmed. Reuse current completion evidence and reassess missing or changed facts yourself. Reconcile action and terminal-receipt gaps and return their exact unfinished outcome. A partial package leaves its unfinished enclosing job retained. Later human signoff may remain pending; held-claim and assignment release are distinct.
<!-- /uclusion-skill-reference:v1 -->
