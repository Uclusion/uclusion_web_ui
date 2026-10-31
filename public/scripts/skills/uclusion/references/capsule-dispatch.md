<!-- uclusion-skill-reference:v1 -->
# Capsule publication and incorporation

The capsule author uses this procedure to publish a contract or reconcile an observed current-capsule update. Requesting roles supply their scoped need and available target, question, option, version and receipt identities through the coordinator, then consume the confirmed outcome.

## Publish the selected contract

Confirm the actual target, owner and current body. Create only after confirming the selected owner's capsule is absent. Replace a sent body when later settled human input establishes the changed contract; newly discovered older input needs a human decision. Review or style preferences alone leave a sent contract unchanged.

Use `set_design_capsule` with complete nonblank Markdown. Creation identifies `job_id` and, for a task, `task_id`. Replacement identifies the current `update_capsule_short_code_id` and `update_capsule_version` with the complete body. Update mode may omit both `job_id` and `task_id`, or include the matching `job_id` and optional `task_id`; `task_id` requires `job_id`. Validate the owning job/task against current evidence. A target mismatch holds publication for reconciliation of the assigned target. Reconcile a conflict with the newly read identity, body and authority before retrying; a newer version alone cannot authorize the old write.

Inspect the publication status and identity separately from subsequent outcomes. A confirmed `created`, `updated` or `unchanged` receipt establishes its produced state. Preserve successful publication when acknowledgement or cleanup is unfinished. Reconcile uncertain state and retry only unfinished operations. Prior-body archives are asynchronous ordinary unpinned notes, outside the publication receipt and current contract.

## Confirm question incorporation

For each capsule-changing question, establish every intended target and retain its full question code, selected-option identity when present, and positive rendered evidence version actually handled. Keep handling open/pending until every required target and its incorporation acknowledgement are confirmed. An `unchanged` publication receipt confirms its target too.

Publish earlier targets without question acknowledgement. Once all other intended targets have confirmed receipts, the final eligible publication may acknowledge answered questions on that capsule's job with `resolve_question_short_code_ids` in resolution order and `resolve_question_versions` mapping exactly those unique full codes to their handled versions, including pending human-resolved questions. Respect the same-job restriction. The tool validates selected questions before saving and acknowledges only after confirmed publication.

Inspect each question outcome separately. Incorporation requires a completed settlement with a positive returned `question_version`, `resolved:true`, `delegated:false` and `included_in_capsule:true`. Keep the handled evidence version distinct from the returned settlement version. After all intended targets are confirmed, finish only remaining acknowledgements with `resolve`, the handled `expected_question_version` and `included_in_capsule:true`. A failed or unconfirmed acknowledgement leaves confirmed publications intact and requires reconciliation of that question before retrying unfinished handling. If its evidence has changed, reconcile it and its intended targets first. Settlement precedes an optional progress note, so a later note version does not replace the returned settlement version.

## Reconcile current updates and return

A current-capsule update holds affected implementation until current identity, requirements and necessary obsolete-review cleanup are reconciled. For an `updated` publication, resolve the same AI author's obsolete open reviews named in the returned `open_ai_reviews_naming_capsule` inventory; read Reports if the inventory is unavailable or failed. For a human edit, read the current R-thread and Reports and resolve that AI author's open reviews naming the affected capsule before returning ready evidence.

Use one complete final handoff when ready; do not precede it with the same receipt message. Send interim receipts when they unblock work before the rest of your scope finishes. Return each normalized target's canonical link, R-code and actual version; each question's handled evidence version, returned settlement version and delegated/included outcome; obsolete-review outcomes; and the exact unfinished recovery or decision with the next bounded handoff. Affected work is ready only when its current contract and required incorporation/cleanup are confirmed. Retain the sent body and supporting evidence with the author. Implementation obtains its own current governing body and retains its execution permissions. Obtain a scoped stage refresh only when the effective stage is needed for the next action, preserving newer events; publication supplies no manual-transition permission.
<!-- /uclusion-skill-reference:v1 -->
