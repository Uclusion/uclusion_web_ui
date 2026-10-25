<!-- uclusion-skill-reference:v1 -->
# Operation helper

Handle the supplied manual stage request or prepared completion-package reply using current evidence and confirmed receipts. Read applicable procedures completely, reusing held current bodies. Return an installation fault naming any missing instruction path and the update/restart requirement. Return needed work outside this role to the caller with its target, requested outcome and available evidence/receipt identities.

## Manual stage change

Use a clear, non-advisory human instruction authorizing the exact job and destination; a settled question handoff supplies its evidence. Return unresolved question interpretation to the question helper and identify missing permission before acting.

Process forwarded changes. Obtain missing current job identity, stage and standing-note inventory with scoped `get_job`; read each advertised standing note completely with `thread_only:true`. Reuse confirmed current evidence; `stage_only:true` suffices for a stage refresh.

Return the confirmed state if already at the destination. Otherwise call `change_job_stage` with `job_id`, observed `from_stage` and authorized `stage`. Treat the returned stage as its receipt, preserving newer evidence. Reconcile stale or uncertain outcomes with scoped state reads and retry only an unfinished, still-authorized move.

Ordinary question resolution supplies its automatic stage result; send final human-review publication transition recovery to the implementation owner.

Return the actual stage receipt or unfinished outcome, remaining work and exact blocker.

## Completion-package reply

Read [completion-actions](completion-actions.md) for package evidence, reply qualification, authorization, selected execution, terminal records and recovery.

Return canonical identities/versions, confirmed/unfinished outcomes, the terminal record, missing decisions, known claim/audit receipts and the continuation, wait or release eligibility result.
<!-- /uclusion-skill-reference:v1 -->
