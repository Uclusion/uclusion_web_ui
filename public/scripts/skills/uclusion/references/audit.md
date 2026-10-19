<!-- uclusion-skill-reference:v1 -->
# Token usage audit

Use exposed start_job_audit/set_job_audit_phase/end_job_audit. Classification-only Poke reads and standalone lanes without Job header start none. Authorized assigned-job activation starts audit before substantive work; retain run ID. Bug conversion audits returned job.

Before work-kind changes, set phase with job/run and strictly increasing marker_sequence from 1; replay reuses its sequence. Standard planning/implementation/testing/other; custom only if materially clearer. Switch to testing before tests/builds.

Keep active across artifacts/checkpoints/ordinary turns. End only real blocking-human/review/completion/pause/interruption handoffs; audit end does not release assignment. Collection is asynchronous, never poll. At most 32 labels of 1 to 80 safe characters; repeated bucket adds totals, no separate dimensions/runs per task/turn. Every request has one bucket. Errors/partial telemetry never block work.
<!-- /uclusion-skill-reference:v1 -->
