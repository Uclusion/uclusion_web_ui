<!-- uclusion-skill-reference:v1 -->
# Review and publication

## Prepare the human review

Compare implementation with the current governing capsule and applicable human requirements. Use the latest Report to continue the same implementation/report scope: an AI report awaits human review unless explicit feedback, a stage change or authorized recorded Review work supplies the next action. New or changed implementation is its own review scope. Handle an assigned human Report with bounded analysis and a durable reply.

Attribute verification to its actual evidence, using available investigation findings where relevant. Keep verification-produced changes attributed to their originating pass as named deltas. Handle implementation findings and authorized human-feedback changes as the implementation owner.

File unsettled job facts/choices with `ask_question` and proposed follow-ups with `make_suggestion` under [job-assistance](job-assistance.md) and [question-tools](question-tools.md), citing their returned identities rather than hiding them in the report. Return question settlement to the question owner. Required unfinished implementation remains unfinished work.

## Establish the finished scope

A completion report follows the requested executable work being written and tested. Reconcile task results and closure receipts; resolve an evidenced finished task when no confirmed closure exists. Whole-job completion requires the agreed result, initial verification and no unfinished tasks, including others' tasks. An empty list or Reviewable stage alone does not establish completion. Keep remaining commit/push/deployment and agreed other-environment verification as Review work with their independent approval states.

An unrelated finished task can receive its own review target through `add_job`: use `task_short_code_ids`, the original job as `view_short_code_id`, a task-derived name and a description identifying the originating job and reason for the split. Preserve the moved task's identity and capsule. Use the returned stage and return any needed next-action decision to its owner. Reconcile the returned job and each move outcome before retrying because every call creates another job. Retain the original job's unfinished-work receipts.

Check current and returned open suggestions. While any remain, identify each and ask the human to convert or resolve it, without a completion package. Continue the same review after that decision; converted suggestions are unfinished tasks.

## Publish and reconcile

Name the applicable current capsule; separate-task reports name each task/capsule and attribute deltas separately. Historical completed work without a capsule identifies its agreed evidence. Report actual omissions, changes, additions, scope expansion or new decisions with observable effect and verification/approval, or say `No implementation deltas.` State deferred work and remaining operations/environment verification with their approval state. Include available runtime-visible AI product/model/version/effort information without inventing unavailable fields. Put the package last.

Publish with `ask_for_review`, rewriting an eligible active review of the same work and otherwise creating a new one, including after a resolved report. Supply the narrative and the package prepared under [completion](completion.md). Request the completion move only for a finished whole job; that conditional Doable-to-Reviewable move needs no separate final-transition permission. Partial/progress review omits it.

Return the confirmed report/package thread and text immediately for presentation before recovery or follow-on work. Inspect saved-review, inventory and transition outcomes separately. Reconcile an uncertain report through Reports or its exact thread, and an uncertain move through current stage/open work. Preserve a saved review after a later inventory or transition failure.

For a failed final move, continue from the saved review. Direct `change_job_stage` recovery requires explicit human permission and the observed `from_stage`; retry only a still-ready Doable-to-Reviewable move. New work or a different stage stops that recovery. Without that permission, return the confirmed review and exact pending transition. Ordinary manual transitions belong to operation.

## Return completion evidence

Return implementation completion evidence for the named scope, keeping package selection, action outcomes and terminal receipts distinct. Return execution needs and qualified human selections to the operation owner; use its confirmed receipts for completed or declined actions. Return exact pending work/actions or terminal failure for continuation. Later human review/signoff may remain pending.
<!-- /uclusion-skill-reference:v1 -->
