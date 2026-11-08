<!-- uclusion-skill-reference:v1 -->
# Job audit

The coordinator owns the assigned job's audit run and ordered phase markers. For authorized assigned-job work with exposed audit tools or a held run, use the actual job identity, held run and latest marker receipt before substantive work, work-kind changes and real assignment handoffs. Determine those boundaries from the assigned work and responsible roles' outcomes. A standalone item has no enclosing-job audit identity; a converted bug uses its returned actual job.

## Start and mark work

If no run is held, start one with `start_job_audit` on assigned-job activation and reuse the held run across roles, tasks and ordinary turns.

When the work kind changes, use the configured bucket choices advertised by `set_job_audit_phase`. Send a phase marker only when a choice reasonably matches the actual work and differs from the current bucket; reuse its exact label and carry the confirmed receipt into handoffs. Do not invent labels or force a match. If no configured bucket fits, continue the authorized work without a phase marker or token note. Tests/builds use a matching configured bucket only when authorized. Defaults are planning, research, implementation, testing and review; planning is required for startup. The human can edit the other defaults or add buckets during installation or with the resident CLI's `features --token-audit-buckets 'planning,implementation,testing,review'`, then reconnect the client.

## Handoffs and receipts

Keep the run active across artifacts, checkpoints and ordinary turns. At a real assignment handoff, end the run with `end_job_audit` and the matching handoff type. Ordinary progress updates are not handoffs. Collection is asynchronous: let audit errors or unavailable/partial telemetry remain non-blocking for authorized work.

Retain the actual audit outcome, canonical job/run and latest marker receipt with the coordinator's assignment state, forwarding relevant confirmed or unfinished receipts with bounded requests. Audit finalization and receipts do not determine substantive completion, package terminal recording or assignment release.
<!-- /uclusion-skill-reference:v1 -->
