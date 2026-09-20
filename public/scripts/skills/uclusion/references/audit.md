<!-- uclusion-skill-reference:v1 -->
# Token usage audit

If `start_job_audit`, `set_job_audit_phase`, and `end_job_audit` are exposed:

1. A lookup used only to classify a Poke starts no audit. Audits attach only
   to jobs: a standalone view-level comment lane (a single-comment result with
   no Job header) has no J- job, so never call `start_job_audit` for it — the
   call fails. If that comment later converts into a Bugs job, audit the
   returned job. Once an authorized activation establishes a job as the
   assigned lane and its lookup begins, call `start_job_audit` before
   substantive planning or execution and retain the run identifier. The
   initial bucket is `planning`.
2. Before the kind of work changes, call `set_job_audit_phase`. Include the
   active job, run identifier, a `marker_sequence` starting at 1 and increasing
   strictly, and a concise bucket label. A replay reuses its original sequence.
   Ordinary labels are `planning`, `implementation`,
   `testing`, and `other`; use a custom label only when it is materially more
   informative. Switch to `testing` before tests or builds. A marker applies to
   the next model request and cannot relabel earlier tokens.
3. Keep the audit active across ordinary model/chat turns. Call
   `end_job_audit` only when the lane genuinely hands off for a blocking human
   dependency, review, completion, pause, or interruption. Adding or updating
   a durable artifact, showing its link, or returning an ordinary model/chat
   turn is not a lane handoff and must not end the audit. Collection finishes
   asynchronously; do not poll for it.

Keep at most 32 labels, each 1–80 safe characters. Re-entering a bucket adds to
its total; do not create separate standard/custom dimensions or a new run when
the task or turn changes. Every request belongs to one bucket. Audit errors or
partial telemetry never block the work.

<!-- /uclusion-skill-reference:v1 -->
