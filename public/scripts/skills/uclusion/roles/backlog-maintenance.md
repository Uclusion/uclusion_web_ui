<!-- uclusion-skill-reference:v1 -->
# Backlog maintenance role

Process the supplied `find_work` maintenance notice, exact `since`/`through` window, completed batch and existing receipts. Own the batch analysis, contextual findings and run record. Reuse confirmed claim, contextual-write and run-record receipts; continue only unfinished steps. Return the result, confirmed receipts and any unfinished step to the coordinator.

Read [helper-conversation](../references/helper-conversation.md) for direct human replies and coordinator consultation.

## Batch run

For a new batch, claim the exact window with `backlog_maintenance_run` and continue with its confirmed claim. A refused claim skips that batch. Report claim uncertainty or expiry as an unfinished outcome.

Start a fresh export-search subagent in maintenance mode with [roles/export-search.md](export-search.md), this package's folder, the resident CLI environment, the exact window and the whole completed batch. It runs the `--completed` export with every completed code and returns the exact export path, the complete original stdout including warnings, and its merged findings. The stdout supplies the dependency findings and incomplete lines; use the subagent's merged candidate list or qualified no-match/incomplete result without rescanning dependencies.

Check export and scan completeness, including missing/stale sections needed for the findings or completed outcomes. A successful file write alone does not establish coverage. If required evidence or analysis is incomplete, return the gaps before contextual writes or recording the run.

## Contextual findings and run record

Keep the complete numbered contextual findings separate from the human report. The first exact code in each finding identifies its recipient; later evidence/blocker codes are supporting references. Each contextual finding retains its complete reasons, evidence, proposed human actions and exact run context.

Use only the synced export to reconcile equivalent findings for the same target and completed outcome and to choose each destination: the current capsule R-code for its owning job or independent task, a grouped task's parent capsule, ordinary job/task notes when that applicable capsule is absent, and direct bug replies.

Write each absent contextual finding silently with `add_info`. Inspect each write and retain confirmed results. After failure or uncertainty, reconcile against the synced export and retry only absent findings; uncertainty leaves the run unrecorded. Confine candidate mutations to these contextual findings, leaving their proposed actions for subsequent human requests.

Prepare one compact Markdown list for both the inbox and the agent-window report. Each entry links the affected job, task or bug by readable name and actual code, followed by one or two short sentences explaining why completed work may affect it. Include a task's parent job as context. Combine reasons for the same target while preserving materially distinct affected tasks and meaningful uncertainty.

Identify the work and its parent from the export records. A converted task may retain an S-code; a capsule R-code names the destination for detail, so link its owning work in the human list. An unidentified target leaves the analysis incomplete.

The human report contains only that list. Omit dates, maintenance windows, scan counts, paths, hashes, claim/write receipts, capsule versions, evidence inventories, category headings and repeated qualifications. The backend carries the window separately for the UI to format. Keep the full analysis and proposed actions in the contextual findings.

Once every required contextual write has succeeded or an equivalent finding for the same target and completed outcome exists in the synced export, record the run with `backlog_maintenance_run` and that compact list as its report. Return the same list for human presentation, with contextual findings, receipts and unfinished status separately. With no findings, send the explicit no-candidate result and record without a report. Preserve confirmed and unfinished outcomes separately.

## Tools

Tools: `backlog_maintenance_run`, `get_job`, `add_info`.

In Codex and Cursor, read [roles/backlog-maintenance-tools.md](backlog-maintenance-tools.md) completely before calling a tool. It holds these tools' full descriptions.
<!-- /uclusion-skill-reference:v1 -->
