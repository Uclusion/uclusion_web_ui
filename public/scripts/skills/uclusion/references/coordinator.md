<!-- uclusion-skill-reference:v1 -->
# Coordinator lane and action routing

Only the coordinator loads this router. It retains assignment, delivery, Pokes,
human questions, stage and permission checks, capsule publication, final review
and the completion package. Design helpers load their selected design package;
implementation helpers receive only a bounded dispatch brief.

Use the Uclusion MCP server as the durable collaboration surface. The resident
client stub owns delivery setup. Work asynchronously with your human partner.
They must understand and approve reviewer-divergent choices, including internal
state, formats and lifecycles. Never silently settle a choice a reasonable
reviewer could decide differently. Never infer observed runtime behavior from
code when the observed path is missing; ask the person who saw it.

Load [pokes.md](pokes.md) for ownership, delivery, discovery and event routing,
applying its assignment gate before lookup. Assigned lookup and standing
instructions use [reading.md](reading.md). A Job header routes to
[job.md](job.md), then the units for the current stage and action. A single
top-level comment without a Job header loads
[single-comment.md](single-comment.md), without job-only instructions. A bug
converted into a Bugs job follows job routing after reloading the returned job.

## Common authorization

In every lane, implementation alone grants no authority to run tests or builds,
introduce or expand security behavior, deploy, commit or push. Preserve each
independent human permission and its limits. An unsettled permission blocks the
affected action; raise it through that lane's permitted tool. Job-specific
testing and security qualifications are in
[coordinator-execution.md](coordinator-execution.md), loaded only for that job
action. Standalone lanes keep [single-comment.md](single-comment.md)'s tool limits.

## Action routes

| Next action | Applicable complete units |
| --- | --- |
| Scoped job context or current capsule body | [job-reading.md](job-reading.md). |
| Job questions, suggestions or their resolution | [assistance.md](assistance.md). |
| Approvable job approval | [approval.md](approval.md). |
| Capsule selection, helper dispatch, publication or changed contract | [capsules.md](capsules.md). |
| Permitted job implementation | [coordinator-execution.md](coordinator-execution.md); read [execution.md](execution.md) only to copy its generic rules into the helper's brief. |
| Review direction, publication or job completion handoff | [review.md](review.md). |
| Durable writes, creation, reopening, dependencies, view notes or receipt reconciliation | [writes.md](writes.md), with the action's governing unit. |
| Exports or decision searches | [reading.md](reading.md). |
| Completion package, notification action or context boundary | [operations.md](operations.md); its completion-package section is the sole procedure, including its wait. |
| Completion-sweep trigger or incomplete retry | [completion.md](completion.md), under the selected lane's transition rules. |
| Progress checkpoint, lane handoff or ending a turn | [handoffs.md](handoffs.md). |
| Optional claim_work or get_upload action when exposed | [claims.md](claims.md) or [uploads.md](uploads.md), respectively. Job diagnostics route from job.md after job selection. |

Load newly applicable complete units before acting after a stage or action
change. The core's complete-read and reload invariants govern every route.
<!-- /uclusion-skill-reference:v1 -->
