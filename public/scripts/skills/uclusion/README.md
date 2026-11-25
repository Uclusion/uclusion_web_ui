# Maintaining the Uclusion skill

This guide helps people review and change the skill. The linked files contain
the agent instructions; this README is not an additional required agent read.

## Who does what

| Role | Responsibility and limits |
| --- | --- |
| [Coordinator](SKILL.md) | Routes requests, keeps the assigned work and helpers, manages delivery and audit, and presents results addressed to its conversation. The working roles decide what the work needs. |
| [Design](roles/design.md) | Answers information requests, handles questions and suggestions, writes the implementation design, and assesses AI approval. It does not make manual stage changes or implement code. |
| [Implementation](roles/implementation.md) | Implements job work, runs approved checks, reports results, and carries out the job's approved completion actions. It stays with the work through review and completion. |
| [Operation](roles/operation.md) | Finds work, answers questions about workspace history, and handles requested creation, moves, inbox work and manual stage changes. Handles any update whose owner current instructions leave unclear. Reopens questions, suggestions and blockers on request. It does not assess AI approval or settle questions. |
| [Standalone](roles/standalone.md) | Owns a bug outside a job through discussion, fixing, approved checks, the completion package, and resolution after the human responds and any selected commit succeeds. It keeps the work through feedback and recovery. |
| [Export search](roles/export-search.md) | Prepares and searches a workspace export, then returns findings and sources. It does not change Uclusion records. |
| [Backlog maintenance](roles/backlog-maintenance.md) | Checks how completed work affects open work and records findings. Proposed changes to that work remain for the human to choose. |

## The main flows

Each helper receives only one assigned job or bug at a time. The coordinator
can manage several helpers across different work, including implementation
and a review response. Independent tasks in the same job can have separate
helpers. Adding authorized work for one helper does not cancel another's work.

The human can continue a discussion directly with its responsible helper when
the actual client surface supports helper input and coordinator consultation.
Switch advice is limited to that surface; direct human entry needs no prior advice.
The helper keeps its role and scope,
answers there, and consults the coordinator when routing is unclear. A switch
does not transfer delivery, assignment or audit ownership. Saved presentation
receipts prevent a second rendering of the same answer or completion package.
The [helper conversation procedure](references/helper-conversation.md) covers
this path; unsupported clients keep the coordinator relay.

Design, standalone and implementation share the
[collaboration procedure](references/collaboration.md). Each reads it before
substantive work and surfaces material choices a reasonable human could decide differently,
including internal implementation choices, so the human understands and approves
the approach. They reuse settled human decisions and explicit delegation,
distinguish source facts from choices that need an answer, and explain their
recommendation's evidence and tradeoffs. They ask through their own discussion
procedures before settling affected work and continue independent authorized work.
Design then publishes a design that explains how to build it, with concrete
behavior and content so an abstract outline cannot conceal unsettled choices.
The job's current Markdown determines the next
step. A stated return to Doable happens automatically after its questions and
suggestions are resolved. If AI approval is required and allowed, design assesses
the job without asking whether to approve. For a ready Approvable job that permits
AI approval but does not require it, design asks one question: **Move to Doable**
first, then **Perform AI approval**, with its vote on Doable. An existing AI vote
means no further AI approval.

A manual stage change needs an explicit human instruction naming the destination,
a choice of a stage option, or a stage question the human resolved so the AI picks.
A request to do, fix or continue work, or a published design, supplies no such
choice. Operation checks that authority in the human's words or the question
record, even when a helper or capsule claims permission. A stage choice goes directly to
operation; an approval choice goes directly to design. Design clarifies unclear
intent. When the request is an update but current instructions leave its owner
unclear, operation handles it instead of inferring an implementor. This applies
to any kind of update, including CLI maintenance, and preserves explicit owners
and existing permission requirements.

Implementation uses the agreed design, writes the change, checks it and presents
the result for review. It also handles the human's later selection of completion
actions. Finishing the code does not grant permission to commit, push or deploy.
The completion package is how commit, push, and the notification clear are
requested. A separate chat or status question is not that request. `all`
selects exactly the listed actions. For a bug outside a job, standalone
performs the fix and checks, publishes the completion package while the bug is
open, and resolves only after the human responds and any selected commit of
repository changes has succeeded. Push and notification clearing come after
that resolution. A conversion into an actual job changes
that ownership. An unrelated finished task already in a job is a different case:
implementation may move it into a separate job for review.

Both owners use the shared [completion procedure](references/completion.md).

A finished job can stop occupying an assignment while its completion offer is
unanswered or notification cleanup remains unfinished. Its owner keeps the
package and action records for later replies, and the coordinator gives
occasional reminders without delaying other work. Unfinished implementation
and partial jobs still need their existing owners. Automatic work discovery
resumes when no assigned work remains; an explicit human request for other
work remains available while helpers are working.

## Where to change a rule

Change a role file for what that role does. Change the coordinator's routing
table for which role receives a request. Keep shared procedures in
[references/](references/), and link to them from the roles that use them.
A role file should describe its own actions, not repeat another role's job.
Review every sentence from the intended reader's available context. Keep its
purpose, actor, action and trigger clear without relying on an unread role or
procedure. Nearby context is sufficient; do not repeat actors mechanically.
Test behavior, package integrity and reachable references rather than requiring
particular instruction sentences.

The coordinator always reads the entrypoint, delivery contract and compact
[lifecycle](references/coordinator-lifecycle.md). Detailed coordinator rules
load completely at their action boundaries:

| Boundary | Procedure |
| --- | --- |
| Adoption, a bug-to-job move or unfinished subscription | [Adoption](references/coordinator-adoption.md) |
| Delivered Poke or its unfinished handling | [Events](references/coordinator-events.md) |
| Direct-helper offer, destination change or consultation | [Conversation](references/coordinator-conversation.md) |
| Human wait, package follow-up, assignment end or fresh-chat advice | [Completion](references/coordinator-completion.md) |
| Authorized discovery, creation, reopen, inbox or history request | [Discovery routing](references/discovery-routing.md) |

The existing events procedure owns all Poke processing, including replay and
native-context checks, owner matching, forwarding, ignored codes and recovery.
The coordinator consumes activation and transport metadata before handing off
bounded work. Helpers receive the human's substantive words, record identities
and receipts, then read their own evidence. Initial assignments and later events
use the same boundary; routing and record status do not become human approval or
instructions to omit the helper's questions or permission checks.
The core keeps only its recognition and complete-read trigger. Pending completion
owners remain valid routing matches after their assignments end. A coordinator
with no Poke or unfinished Poke response does not read this procedure.
Client listener startup, configuration and restart stay in the selected delivery
reference so delivery can work before the first Poke. CLI history flags belong
there too; they are not part of the native Codex coordinator's shared core.

Audit detail loads for an enabled exposed job-audit capability, or directly for
recovery of a held run. The coordinator also reads the claim procedure directly
when recovering or deciding whether to retain or release a held claim, even if
claims are now disabled. With either feature disabled and no state held for it,
the coordinator does not read that feature's operational procedure. The work
hint loads at the first applicable human wait or completed package. Discovery has no
back-link requiring the lifecycle again. Links do not recursively activate
other reads. Reuse current complete bodies and reread missing, incomplete or
changed bodies; retain the package/client and active operation across compaction.
Keep each read gate to the trigger and context needed to reach that read. Put
ordering, deferral, recovery and subsequent actions in the target procedure;
do not repeat them after the read at the callsite. Each action discovers only
its needed tool definitions, with names first and full schemas for selected
calls. Helpers continue to open their own roles.

Design reads the [Approvable job procedure](references/design-approvable.md)
only when working on a job in that stage. Keep its approval decisions and
ordering in that procedure; the role contains only the conditional read.

The installer renders [claims.md](references/claims.md) and
[audit.md](references/audit.md) from their saved feature settings and refreshes
them on feature changes. Disabled installs say only that the feature is not
enabled; enabled installs link to the optional
[claim procedure](references/claims-enabled.md) or
[audit procedure](references/audit-enabled.md). Both complete procedures stay
installed. Job audit uses `tokenAudit.enabled`; the passive collector alone
does not enable audit instructions. Ordinary, global, project and demo installs
use the same rendering. Keep assignment rules that apply in both states in the
coordinator lifecycle.

Tool arguments and response handling belong in the tool descriptions in
`uclusion_investible_api/handlers/mcp_serve.py`. MCP discovery returns those
complete descriptions for every client. Claude registrations set
`alwaysLoad: false` so the client can load tools on demand; clients that do
not support deferral still receive complete guidance. Keep tool descriptions
in the catalog instead of duplicating them in skill references.

When changing a responsibility, check the role, routing table and the relevant
flow here together. Keep headings accurate and explain actions in the order
they happen. Keep this guide short; the detailed procedures stay in their
linked files.
