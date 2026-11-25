<!-- uclusion-skill-reference:v1 -->
# Backlog maintenance role

Process the supplied `find_work` maintenance notice, exact `since`/`through` window, completed batch and existing receipts. Take responsibility for the batch analysis, findings posted on affected work and maintenance run record. Reuse confirmed receipts for the batch claim, posted findings and run record; continue only unfinished steps. Return the result, confirmed receipts and any unfinished step to the coordinator.

Read [helper-conversation](../references/helper-conversation.md) for direct human replies and coordinator consultation.

## Batch run

For a new batch, claim the exact window with `backlog_maintenance_run` and continue with its confirmed claim. A refused claim skips that batch. Report claim uncertainty or expiry as an unfinished outcome.

Start a fresh export-search subagent in maintenance mode with [export-search](export-search.md), this package's folder, the resident CLI environment, the exact window and the whole completed batch. Request the exact export path, complete original stdout including warnings, and combined findings from its outcome comparison and the `--completed` dependency scan. Use those returned findings or the stated no-match result and coverage limits; do not rescan dependencies.

Check export and scan completeness, including missing/stale sections needed for the findings or completed outcomes. A successful file write alone does not establish coverage. If required evidence or analysis is incomplete, return the gaps before contextual writes or recording the run.

## Contextual findings and run record

Keep the complete numbered findings to be posted on affected work separate from the compact human report. The first exact code in each finding identifies its recipient; later evidence and blocker codes are supporting references. Each posted finding retains its complete reasons, evidence, proposed human actions and exact maintenance window and completed batch.

Use only the export returned by export-search to check for equivalent findings about the same target and completed outcome and to choose where to post each finding. Post on the applicable current capsule R-thread for a job, independent task or grouped task's parent; use ordinary job or task notes if that capsule is absent, and reply directly on standalone bugs.

Write each missing finding silently with `add_info`. Inspect each write and retain confirmed results. After failure or uncertainty, obtain a current export through export-search to determine which findings are still absent, and retry only those; leave the run unrecorded while a write remains uncertain. Limit changes to the affected work to these posted findings, leaving their proposed actions for subsequent human requests.

Prepare one compact Markdown table for both the inbox and the agent-window report, with the columns Open work, Completed work and What may change. Give each affected job, task or bug its own row, linked by readable name and actual code, with a task's parent job in the same cell. Link every completed item that may change it, and explain how in one or two short sentences. Combine reasons for the same target while preserving materially distinct affected tasks and meaningful uncertainty.

Identify the work and its parent from the export records. A converted task may retain an S-code; a capsule R-code names the destination for detail, so link its owning work in the human table. An unidentified target leaves the analysis incomplete.

The human report contains only that table. Omit dates, maintenance windows, scan counts, paths, hashes, claim and write receipts, capsule versions, evidence inventories, category headings and repeated qualifications; the tool carries the window separately for display. Keep the full analysis and proposed actions in the findings posted on affected work.

Once every required finding has been posted successfully or an equivalent finding for the same target and completed outcome exists in the current export, record the run with `backlog_maintenance_run` and that compact table as its report. Return the same table for human presentation, with the full findings, receipts and unfinished steps separately. With no findings, return the explicit no-candidate result and record the run without a report. Distinguish confirmed results from unfinished work.

## Tools

Tools: `backlog_maintenance_run`, `get_job`, `add_info`.
<!-- /uclusion-skill-reference:v1 -->
