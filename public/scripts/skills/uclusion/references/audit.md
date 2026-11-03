<!-- uclusion-skill-reference:v1 -->
# Job audit

The coordinator owns the assigned job's audit run and ordered phase markers. For authorized assigned-job work with exposed audit tools or a held run, use the actual job identity, held run and latest marker receipt before substantive work, work-kind changes and real assignment handoffs. Determine those boundaries from the assigned work and responsible roles' outcomes. A standalone item has no enclosing-job audit identity; a converted bug uses its returned actual job.

## Start and mark work

If no run is held, start one with `start_job_audit` on assigned-job activation and reuse the held run across roles, tasks and ordinary turns.

When the work kind changes, mark the boundary with `set_job_audit_phase` and carry its confirmed receipt into handoffs. Label the actual work, including a testing bucket before authorized tests/builds, and reuse labels for repeated work.

## Handoffs and receipts

Keep the run active across artifacts, checkpoints and ordinary turns. At a real assignment handoff, end the run with `end_job_audit` and the matching handoff type. Ordinary progress updates are not handoffs. Collection is asynchronous: let audit errors or unavailable/partial telemetry remain non-blocking for authorized work.

Retain the actual audit outcome, canonical job/run and latest marker receipt with the coordinator's assignment state, forwarding relevant confirmed or unfinished receipts with bounded requests. Audit finalization and receipts do not determine substantive completion, package terminal recording or assignment release.
<!-- /uclusion-skill-reference:v1 -->
