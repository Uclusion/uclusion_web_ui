<!-- uclusion-skill-reference:v1 -->
# Maintenance role: backlog maintenance

Process the supplied `find_work` maintenance notice, exact `since`/`through` window, completed batch and existing receipts. Own the batch analysis, contextual findings and run record. Reuse confirmed claim, contextual-write and run-record receipts; continue only unfinished steps. Return the result, confirmed receipts and any unfinished step to the coordinator.

## Batch run

For a new batch, call `backlog_maintenance_run` with `action:claim` and the exact window; continue with its confirmed `claim_id`. A refused claim skips that batch. Report claim uncertainty or expiry as an unfinished outcome.

Use [history-search](history-search.md) to export to the configured destination with `--completed` and every completed code. Retain the exact successful path and complete original stdout, including warnings. Send the coordinator a bounded maintenance-analysis request with that export path, the whole completed batch and original stdout. The stdout supplies the dependency findings and incomplete lines; use the worker's merged candidate list or qualified no-match/incomplete result without rescanning dependencies.

Check export and scan completeness, including missing/stale sections needed for the findings or completed outcomes. A successful file write alone does not establish coverage. If required evidence or analysis is incomplete, return the gaps before contextual writes or recording the run.

## Contextual findings and run record

Send the complete numbered findings to the coordinator. The first exact code in each finding identifies its recipient; later evidence/blocker codes are supporting references. Each contextual finding retains its complete reasons, evidence and proposed human actions.

Use only the synced export to reconcile equivalent findings for the same target and completed outcome and to choose each destination: the current capsule R-code for its owning job or independent task, a grouped task's parent capsule, ordinary job/task notes when that applicable capsule is absent, and direct bug replies.

Write each absent contextual finding with `add_info` and `is_silent:true`. Silent writes suppress extra human notifications while preserving normal UI pushes and existing Poke routing, including author routing. Inspect each write and retain confirmed results. After failure or uncertainty, reconcile against the synced export and retry only absent findings; uncertainty leaves the run unrecorded. Confine candidate mutations to these contextual findings, leaving their proposed actions for subsequent human requests.

Once every required contextual write has succeeded or an equivalent finding for the same target and completed outcome exists in the synced export, record with `backlog_maintenance_run`, `action:record`, the same `claim_id` and the aggregate Markdown report. That report produces one linked human inbox item. With no findings, send the explicit no-candidate result and record without a report or inbox item. Preserve confirmed and unfinished outcomes separately.
<!-- /uclusion-skill-reference:v1 -->
