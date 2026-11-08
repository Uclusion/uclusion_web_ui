<!-- uclusion-skill-reference:v1 -->
# Completion packages

## Prepare and publish

Prepare the concrete package for your reviewed finished scope, including available actions for partial work. Use the reviewed repository changes and exact notification scope from current evidence. Include a concise explanation of what this package finishes. For partial work, name what remains, why it prevents whole-job completion and the next action or missing permission. Keep detailed findings in the review narrative.

For a standalone bug, prepare a new package only after observing the bug change from open to resolved for a fix made in this session; your own resolution counts. Reuse an existing package on continuation. Loading an already-resolved bug, or another update while it stays resolved, does not create a new package. A reopened bug can get a new package after a new fix is completed in the session.

List the actual available actions in this order:

1. Commit only the identified reviewed changes, naming repositories/files or a compact unambiguous scope.
2. Push only those commits.
3. Clear the exact finished whole job, otherwise its review and identified resolved tasks; for a standalone bug, the exact bug/replies scope.

Omit commit/push when no repository work applies. Explain that `all` selects exactly the listed actions and scope. Other actions retain their independent permissions, and an actual notification clear additionally needs explicit chat permission for that exact scope.

Include the available runtime-visible AI product, model, version and effort information in the review or bug completion note without inventing fields. For a job, publish the narrative and this package together with `ask_for_review`, which appends the package last. A newly created review can be named as “this review”; its saved receipt supplies the canonical thread identity. For a bug fixed in this session, publish with `add_info` on its resolved bug thread.

End an unanswered offer on the package thread with: “Reply `all`, or tell me in your own words what you want.” If a non-AI, non-advisory human response to the applicable package has already arrived, retain its exact identity/message and execute its authorized remainder under the procedure below instead of requesting the same decision again.

Return the canonical saved thread, exact confirmed package text including the scope explanation and applicable invitation, current selection and pending action/terminal state immediately for presentation, before follow-on work. Later unchanged waits return the exact package/reply identity and pending state. Preserve your substantive completion confirmation for that scope, its target/applicable-contract identities and confirmed/unfinished receipts with any selected-action request.

## Execute selected actions

Use the exact package, reviewed changes, notification scope and human instruction. A completion-only request uses the existing package and completion evidence and authorizes no new code work. Fetch missing or changed package/thread/target evidence with `get_job`, including the actual job or bug state and every advertised standing note. Read a delivered reply before acting; a supplied chat instruction needs no thread read. Reuse current evidence and confirmed receipts, reconciling changes to reviewed scope or authorization before the affected action. Direct Git requests retain these reviewed-scope, package and permission requirements.

### Select and authorize

Only a non-AI, non-advisory human thread/chat response selects actions. `All` selects exactly the listed actions; interpret other wording against the package and clarify a materially ambiguous part where the instruction arrived. Declining completes that selection. Later replies are new instructions and preserve completed outcomes.

Check permission for each selected action. `clear_notifications` additionally requires explicit chat permission for the exact clear; ask for any missing grant in chat and keep that clear unfinished. The package's commit/push/clear selection supplies no permission for other actions.

### Execute the remaining work

Determine remaining commit/push work from actual Git state and prior confirmed outcomes. Act only on the selected reviewed scope, in package order. Stop at the first failed action or missing required permission, retain successful outcomes and identify the remaining work. Nothing remaining is a successful no-op. Clear a fixed authorized scope directly.

Compose each selected commit message beginning with the completed task/comment code. A job-code prefix means the whole job is finished and requires no remaining tasks.

### Record and recover

Write one terminal record per attempt on the human reply it answers, or on the package root for a chat instruction. Identify the instruction and the completed, declined, failed and remaining work as applicable, including any missing permission.

When prior actions succeeded and clearing is authorized, the last `clear_notifications` call carries the record. Otherwise record with `add_info`, silently when clearing was selected. Treat the returned action and record outcomes separately.

If a record's outcome is uncertain, check its exact thread before writing it again, and write it only if absent. A retry acts only on unfinished work and writes one new attempt record. Confirmed earlier action/record receipts remain valid after a later failure.

Return target/package/reply identities and known claim/audit receipts, distinguishing the selection, action outcomes, terminal-record receipts and exact failed, uncertain or pending work. For a finished Reviewable job or resolved bug, report release eligibility only when the work is confirmed complete, the selection is handled, selected actions are completed or declined, and terminal recording is confirmed. Reuse current completion evidence and reassess missing or changed facts yourself. Reconcile action and terminal-receipt gaps and return their exact unfinished outcome. A partial package leaves its unfinished enclosing job retained. Later human signoff may remain pending; held-claim and assignment release are distinct.
<!-- /uclusion-skill-reference:v1 -->
