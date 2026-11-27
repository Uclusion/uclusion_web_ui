<!-- uclusion-skill-reference:v1 -->
# Human waits, completion and assignment end

## Present a human wait

Keep operational coordination, such as missing severity for a requested bug filing, in the human/agent conversation, including its answer and filing receipt. Do not require or delegate a Uclusion write for these exchanges.

For product/design questions and work-approval requests, obtain the responsible helper's confirmation that the exact request is saved on its Uclusion thread and that the exact request and canonical thread link were presented in the chosen conversation before waiting for human input. Present any missing request here when this is its response destination; otherwise forward the exact saved request to the destination helper for presentation. A saved completion package satisfies this requirement after its exact offer is presented. Ask the owner to save any such request that lacks a record. Reuse current saved and presentation receipts instead of duplicating them. A saved request covers only itself.

## Continue the completion owner

Keep interpretation of completion replies, permission checks, execution and retries with the responsible job or bug owner. The coordinator does not need to read the owner's full completion procedure. When replacing a completion owner, give the replacement the saved package, the human's exact selection or the fact that no reply has arrived, the actions the previous owner completed, and the action still unfinished. Also carry the reviewed scope, the owner's confirmation of completed work, and the identities of package presentations and records of action attempts. Reuse the current owner whenever available.

## Apply the owner's assignment result

The responsible job or bug owner reports whether the work is complete and whether this conversation can stop holding that assignment. Apply that result only to the matching work, separately from pending completion-package follow-up and any work-claim outcome; preserve other helpers' assignments. Return missing or changed completion facts to the owner for reassessment; package silence does not prove that the work is complete.

An unanswered completion package, unfinished notification clear or missing record of that clear does not require keeping a finished assignment. Preserve that follow-up with its owner as described below. A partial package or unfinished substantive work keeps the enclosing job assigned. Releasing a work claim does not by itself end the assignment. An ordinary answer, task resolution, intermediate handoff or audit receipt alone does not end it either. Preserve a confirmed assignment end through compaction; an old open AI review does not assign the work again.

Use the helper tools named in the lifecycle to forward completion presentations and continue their owner.

When recovering a held work claim or deciding whether to retain or release it, even if claims are now disabled, read [claims-enabled.md](claims-enabled.md) completely.

For an audit handoff or recovery of a held audit run, use the lifecycle's audit read trigger.

## Present results and suggest a fresh conversation

When this conversation is the response destination, present an owner's exact saved package text and canonical thread link immediately, once, unless its presentation is already confirmed. Keep the package owner and response destination, target and package identities, reviewed scope, completion confirmation, exact human reply or unanswered status, and confirmed or unfinished action and attempt-record outcomes after the assignment ends. Route later replies and unfinished actions to that owner without replaying completed actions.

Occasionally include a brief reminder of an unanswered package in a relevant conversation update, naming its thread and the pending reply. Retain the latest presentation or reminder so continued work does not repeat the offer every turn. Reminders do not delay other authorized work or replace work discovery required when no assigned work remains.

At the first human wait or completed package for assigned work the human is directing, read [work-discovery.md](work-discovery.md) completely.

Suggest a fresh conversation after the responsible role confirms resolution of a standalone view bug or question with unrelated or unknown next work, or confirms that this conversation's assignment to a finished job has ended. Determine next work from the coordinator's assignment and queue. When no assignment, queued or ongoing work, or related next work remains, show the client's normal fresh-chat command once for that completion before follow-on discovery. Pending notification cleanup does not delay this advice or the find-work list. The advice does not discard current context or ask for an answer; later human signoff may remain pending. Preserve whether this advice was shown separately from the session's work-hint state.
<!-- /uclusion-skill-reference:v1 -->
