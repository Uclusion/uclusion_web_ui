<!-- uclusion-skill-reference:v1 -->
# Job audit

The coordinator owns the assigned job's audit run and records its work phases in order. For authorized work on that job with exposed audit tools or a held run, use the actual job identity, held run and latest phase receipt before substantive work, changes in the kind of work and actual assignment handoffs. Determine those points from the assigned work and responsible roles' outcomes. A standalone item has no enclosing job to audit; after a bug is converted into a job, use the returned job identity.

## Start and mark work

Discover the exact needed tool description and schema at each action: `start_job_audit` for activation, `set_job_audit_phase` for a work-kind change, and `end_job_audit` for a real handoff. Reuse held definitions; do not load all three merely because this procedure is read.

If no run is held for that job, start one with `start_job_audit` when work on the job is adopted. Reuse that job's run across its roles, task helpers and ordinary turns, keeping each job's run and phase receipts separate.

When the kind of work changes, use the configured bucket choices advertised by `set_job_audit_phase`. Send a phase marker only when a choice reasonably matches the actual work and differs from the current bucket; reuse its exact label and carry the confirmed receipt into handoffs. Do not invent labels or force a match. If no configured bucket fits, continue the authorized work without a phase marker or token note. Use a matching bucket for tests or builds only when those checks are authorized. Defaults are planning, research, implementation, testing and review; planning is required for startup. The human can edit the other defaults or add buckets during installation or with the resident CLI's `features --token-audit-buckets 'planning,implementation,testing,review'`, then reconnect the client.

## Handoffs and receipts

Keep the run active across artifacts, checkpoints and ordinary turns. At an actual handoff of that job, end its run with `end_job_audit` and the matching handoff type. A task helper finishing while the job remains assigned does not end the run, and neither does an ordinary progress update. Collection is asynchronous: audit errors and unavailable or partial telemetry must not block authorized work.

Retain the actual audit outcome, canonical job and run identities, and latest phase receipt with the coordinator's assignment state, forwarding relevant confirmed or unfinished receipts with bounded requests. Ending an audit does not prove that implementation is complete, that package actions were recorded, or that the assignment has ended.
<!-- /uclusion-skill-reference:v1 -->
