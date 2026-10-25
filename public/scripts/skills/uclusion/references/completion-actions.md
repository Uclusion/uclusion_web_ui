<!-- uclusion-skill-reference:v1 -->
# Handle completion-package actions

Use the exact package, reviewed changes, notification scope and human instruction. Fetch missing or changed package/thread/target evidence with scoped `get_job`, including the actual job/bug state and advertised standing-note bodies. Read a Poked reply before acting; a supplied chat instruction needs no thread read. Reuse current confirmed receipts and reconcile changes to reviewed scope or authorization before the affected action.

## Select and authorize

Only a non-AI, non-advisory human thread/chat response selects actions. `All` selects exactly the listed actions; interpret other wording against the package and clarify a materially ambiguous part where the instruction arrived. Declining completes that selection. Later replies are new instructions and preserve completed outcomes.

Qualify the actual permission for each selected action. `clear_notifications` additionally requires explicit chat permission for the exact clear; ask for any missing grant in chat and retain that clear as unfinished. The package's commit/push/clear selection supplies no permission for other actions.

## Execute the remaining work

Determine remaining commit/push work from actual Git state and prior confirmed outcomes. Act only on the selected reviewed scope, in package order. Stop at the first failed action or missing required permission, retain successful outcomes and identify the remaining work. Nothing remaining is a successful no-op. Clear a fixed authorized scope directly, one call per code.

## Commit identities

Operation composes each selected commit message, beginning with the completed task/comment code. A job-code prefix means the whole job is finished and requires no remaining tasks.

## Record and recover

Write one terminal record per attempt on the human reply it answers, or on the package root for a chat instruction. Identify the instruction and the completed, declined, failed and remaining work as applicable, including any missing permission.

When prior actions succeeded and clearing is authorized, pass the record in the last `clear_notifications` call, including when there is nothing to clear. The tool posts it silently before clearing; a failed record prevents that clear. Otherwise record with `add_info`, silently when clearing was selected. Treat the returned action and record outcomes separately.

Reconcile an uncertain record on its exact thread before writing one only if absent. A retry acts only on unfinished work and writes one new attempt record. Confirmed earlier action/record receipts remain valid after a later failure.

Return target/package/reply identities, actual action and terminal-record receipts, and exact failed, uncertain or pending work. For a finished Reviewable job or resolved bug, report release eligibility by combining the producer's confirmation of the identified completed scope with current evidence of handled selection, completed or declined selected actions, and confirmed terminal recording. Reuse the producer's current confirmation; return a missing or changed substantive completion fact to that producer. Reconcile action and terminal-receipt gaps here and return their exact unfinished outcome. A partial package leaves its unfinished enclosing job retained. Later human signoff may remain pending; held-claim and assignment release are distinct.
<!-- /uclusion-skill-reference:v1 -->
