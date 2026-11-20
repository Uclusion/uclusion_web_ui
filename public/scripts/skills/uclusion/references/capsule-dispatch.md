<!-- uclusion-skill-reference:v1 -->
# Capsule publication and incorporation

Use this procedure to publish the design capsule for your assigned job or task, or to reconcile an update to that capsule. Author and publish its changes yourself. If a different job or task needs its own capsule author, request that publication through the coordinator while retaining your assignment.

Save new supporting context with `add_info` on the current capsule R-thread, or in ordinary job or task notes while its capsule is absent.

## Publish the selected contract

Confirm the job or task that owns the capsule and read its current body. Create a capsule only after confirming that this target has none. Replace a published body when later settled human input changes the agreed design; ask for a human decision when newly discovered older input conflicts with it. Do not change a published contract merely for review or style preferences.

Publish with `set_design_capsule`, creating the selected target's capsule or replacing its current capsule in place. Validate the owning job or task against current evidence. If it does not match your assigned target, stop publication and reconcile that mismatch. After a version conflict, read the current capsule and reconcile its identity, body and authority before retrying; a newer version alone does not authorize repeating the old write.

Inspect the publication status and identity separately from any later question or review updates; a confirmed publication receipt establishes the saved capsule. Preserve that successful publication if recording question handling or resolving obsolete reviews remains unfinished. Reconcile uncertain results and retry only unfinished operations.

## Confirm question incorporation

First determine whether the question still carries an unapplied design decision. Answered explanatory questions, superseded or irrelevant choices, and answers that change no capsule can be resolved immediately with `included_in_capsule:false` and the handled evidence version. Future capsule creation and other unfinished reconciliation remain separate work; they do not keep these questions open. Retain that work's owner, targets and settled requirements. This closure does not confirm incorporation or make a conflicting capsule ready for implementation.

For each still-applicable answer that changes a capsule, identify every job or task whose capsule must include it. Retain the full question code, selected option when present, and the positive evidence version shown in the question you handled. Keep its incorporation pending until every required capsule is confirmed and the tool confirms that the answer has been included. A publication result of `unchanged` also confirms that target's capsule.

When an answer affects several capsules, publish the earlier targets without marking that question as included. Once all other required targets are confirmed, the final `set_design_capsule` call may record inclusion for answered questions on that capsule's own job, including human-resolved questions still awaiting AI handling.

Inspect each question result separately and require the tool's confirmation that the question has been handled and its answer included in the capsule. Keep the evidence version you handled distinct from the settlement version the tool returns. After all required capsules are confirmed, use `resolve` to finish any remaining question acknowledgements, supplying the handled evidence version and recording inclusion in the capsule. If acknowledgement fails or is uncertain, retain confirmed publications, reconcile that question and retry only its unfinished handling. If its evidence has changed, reconcile the answer and every affected capsule first. Settlement precedes an optional progress note, so a later note version does not replace the returned settlement version.

## Reconcile current updates and return

After a capsule update, do not report it ready for implementation until its current identity and requirements are reconciled and obsolete reviews are resolved. For a replaced capsule, resolve the connected AI user's obsolete open reviews named in the publication result; read Reports if that inventory is unavailable or failed. For a human edit, read the current R-thread and Reports and resolve that AI user's open reviews naming the affected capsule before reporting that reconciliation is complete.

Return each actual target's canonical link, capsule R-code and version; each question's handled evidence version, settlement version and delegated and included results; obsolete-review results; and any unfinished recovery or decision with its exact next action. Report the contract ready only when the current body, required question handling and obsolete-review resolutions are confirmed. Retain the published body and supporting evidence. Refresh the job's stage only when the next action needs it, preserving newer events; publishing a capsule does not authorize a manual stage change or implementation actions.
<!-- /uclusion-skill-reference:v1 -->
