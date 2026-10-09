<!-- uclusion-skill-reference:v1 -->
# Coordinator capsule design and publication

Only the coordinator loads this unit for absent-capsule design help and
publication, permitted new-human-contract replacement, or obsolete-review cleanup.
Detailed design instructions remain in the fresh design helper. Implementation
dispatch uses [coordinator-execution.md](coordinator-execution.md); implementation
helpers load no Uclusion workflow units.
Before publication or review cleanup, load [writes.md](writes.md). Target
selection and complete current-body acquisition are prerequisites owned by
[job.md](job.md), including its confirmation from a sent-body receipt.

## Capsule authority

Once sent, keep the capsule body stable unless human input that arrives after
it establishes a new contract. Finding older human input you had not read is not
that; raise it as a question instead. When a new contract is established, update
the capsule to say it before further affected edits and before the lane ends,
even when there are no edits. A settled decision must not sit beside a capsule
that still states what it replaced. The capsule stands alone and preserves the
actor-visible outcome, not merely decisions or components.

## Absent-capsule design dispatch and publication

When job.md's selected target has no current capsule, continue read-only
investigation and settle every reviewer-divergent choice.
Complete drafting and cold review below before calling `set_design_capsule` in
target mode. For a job, send `job_id` and the complete `capsule`. For a
top-level or grouped task, send its current
`job_id`, `task_id`, and the complete `capsule`; a grouped `task_id` normalizes
to its top-level parent. Uclusion strongly validates that the task still
belongs to the stated job and refuses a missing or stale job/task pairing.
Reload the task and use its current job before retrying.

Delegate planning, capsule composition, revision and cold review to a fresh
helper without inherited conversation history (`fork_turns: "none"` in Codex).
Give it the selected target, bounded relevant evidence, the current capsule
when present, new human requirements since publication, and
`../uclusion-design/SKILL.md` resolved from the selected `uclusion` package root.
Copy the core's complete-read and instruction-reuse/reload rules into the
dispatch, adapted to the selected design package and its required files, even
without a resident bootstrap; do not send core or coordinator reference bodies.

Request the shortest complete contract, directing the helper to delete sentences
whose removal loses no necessary behavior, constraint, navigation, evidence or
permission limit; impose no numeric cap. Require full reads of its selected
skill and references and keep research, alternatives, planning rationale and
transcripts with that helper. Do not read those helper-only instructions or
examples before delegation.

Accept only the complete cold-reviewed capsule with claim-local evidence links
or typed unresolved questions. Do not import raw export searches, skill bodies
or the planning transcript. The main agent alone files and resolves questions,
checks stages and permissions, publishes with `set_design_capsule`, and
coordinates execution. Delegation grants no implementation permission. If the
helper cannot load its skill or a required reference, report a broken Uclusion
install, suggest an environment-correct `uclusion update`, and require a client
restart or MCP reconnect after success; do not improvise a writing workflow.
After each create or permitted replacement, apply job.md's current-contract
prerequisite, using the held publication receipt. A later cold review does
not authorize polishing or rewriting a sent capsule.

When permitted implementation is the next action after publication, load
[coordinator-execution.md](coordinator-execution.md) for its independent gates
and fresh independent-task dispatch, against job.md's held current contract.
Keep the full capsule and its tracking evidence yourself; compile the complete
implementation brief under that unit rather than sending workflow context.
Delegation creates no separate ownership claim and grants no unlisted action.

Replace a sent capsule only when new human input establishes a new contract.
AI discoveries and implementation differences do not authorize a replacement;
report those differences once in the review. Unsettled choices still require
questions under [assistance.md](assistance.md). For a permitted replacement,
finish drafting and cold review, then call `set_design_capsule` in update mode
with the current R-code and version held under job.md as `update_capsule_short_code_id` and
`update_capsule_version`, and the complete replacement body. Never patch
fragments or blindly retry a version conflict; reload the capsule on one.
Replies remain discussion until new human input establishes a new contract
and is folded into the body. A real replacement keeps the capsule R-code; its
former body appears asynchronously as an ordinary unpinned note. Do not wait
for that archive or treat it as current implementation context.

Capsule writes are human-facing, not scratch storage. A create or replacement
puts an inbox item in front of the current human assignees without email or
Slack; explicit mentions keep their ordinary delivery behavior.

After an AI replacement, resolve each review its result lists in
`open_ai_reviews_naming_capsule` before further affected edits. After job.md's
current-body and Reports refresh for a human capsule edit,
resolve your open review naming that capsule first, then reconcile in-progress
work with the new authoritative body. Review cleanup is agent workflow, not backend review parsing or linkage.

## Publication receipts and partial success

`set_design_capsule` returns the stored R-code/version and, for a replacement,
the open reviews naming it. Use job.md's receipt confirmation and writes.md's
generic outcome reconciliation.

When `set_design_capsule` also resolves selected questions, inspect the capsule
receipt and each resolution outcome. A failed or uncertain publication resolves
no questions; a later resolution failure leaves the published capsule in place
and stops the remaining resolutions. Resume resolutions only after confirming
the intended capsule was published; otherwise reconcile and publish that contract first. Once publication
is confirmed, resolve only unfinished questions rather than replaying a stale
capsule write. If the review-inventory lookup failed, load Reports for the
existing obsolete-review cleanup. After the last operation, use `stage_only`
before acting on the stage.
<!-- /uclusion-skill-reference:v1 -->
