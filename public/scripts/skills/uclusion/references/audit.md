<!-- uclusion-skill-reference:v1 -->
# Job audit

The coordinator owns the assigned job's audit run and ordered phase markers. For authorized assigned-job work with exposed audit tools or a held run, use the actual job identity, held run and latest marker receipt before substantive work, work-kind changes and real assignment handoffs. Determine those boundaries from the assigned work and responsible roles' outcomes. A standalone item has no enclosing-job audit identity; a converted bug uses its returned actual job.

## Start and mark work

If no run is held, start once on assigned-job activation with `start_job_audit(job_id)`. A resolvable child is canonicalized to its enclosing job. Keep the returned `canonical_job_id`, `audit_run_id`, active state and initial `planning` bucket. Reuse the held run across roles, tasks and ordinary turns.

When the work kind changes, call `set_job_audit_phase` with `job_id`, `audit_run_id`, `bucket` and a strictly increasing `marker_sequence`, starting at 1 for the first boundary of a new run. A retry reuses that boundary's sequence. Although the plain-call schema permits omission, the native ordering contract requires increasing sequences. The marker applies to the next model request; carry its confirmed receipt into handoffs.

Use a label describing the actual work, including a testing bucket before authorized tests/builds. Labels are 1–80 ASCII letters, digits, spaces or `._:/+@-`, start with a letter or digit and have no trailing space. Use at most 32 aggregate labels per run, reusing labels for repeated work; each model request has one bucket.

## Handoffs and receipts

Keep the run active across artifacts, checkpoints and ordinary turns. At a real assignment handoff, call `end_job_audit` with `job_id`, `audit_run_id` and the matching `handoff_type`: `progress`, `blocked`, `review_requested`, `completed`, `paused` or `interrupted`. Ordinary progress updates are not handoffs.

The agent omits finalization and usage counts. Its end call returns `pending_finalization`; the collector supplies measured usage and later publishes the terminal note. An earlier bucket checkpoint does not complete the run. Collection is asynchronous: do not poll or wait for that note, and let audit errors or unavailable/partial telemetry remain non-blocking for authorized work.

Retain the actual audit outcome, canonical job/run and latest marker receipt with the coordinator's assignment state, forwarding relevant confirmed or unfinished receipts with bounded requests. Audit finalization and receipts do not determine substantive completion, package terminal recording or assignment release.
<!-- /uclusion-skill-reference:v1 -->
