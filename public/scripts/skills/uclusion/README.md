# Maintaining the Uclusion skill

This guide helps people review and change the skill. The linked files contain
the agent instructions; this README is not an additional required agent read.

## Who does what

| Role | Responsibility and limits |
| --- | --- |
| [Coordinator](SKILL.md) | Routes requests, keeps the assigned work and helpers, manages delivery and audit, and presents results addressed to its conversation. The working roles decide what the work needs. |
| [Design](roles/design.md) | Answers information requests, handles questions and suggestions, writes the implementation design, and assesses AI approval. It does not make manual stage changes or implement code. |
| [Implementation](roles/implementation.md) | Implements job work, runs approved checks, reports results, and carries out the job's approved completion actions. It stays with the work through review and completion. |
| [Operation](roles/operation.md) | Finds work, answers questions about workspace history, and handles requested creation, moves, inbox work and manual stage changes. Reopens questions, suggestions and blockers on request. It does not assess AI approval or settle questions. |
| [Standalone](roles/standalone.md) | Owns a bug outside a job through discussion, fixing, approved checks, the completion package, and resolution after the human responds and any selected commit succeeds. It keeps the work through feedback and recovery. |
| [Export search](roles/export-search.md) | Prepares and searches a workspace export, then returns findings and sources. It does not change Uclusion records. |
| [Backlog maintenance](roles/backlog-maintenance.md) | Checks how completed work affects open work and records findings. Proposed changes to that work remain for the human to choose. |

## The main flows

The human can continue a discussion directly with its responsible helper when
the actual client surface supports helper input and coordinator consultation.
Switch advice is limited to that surface; direct human entry needs no prior advice.
The helper keeps its role and scope,
answers there, and consults the coordinator when routing is unclear. A switch
does not transfer delivery, assignment or audit ownership. Saved presentation
receipts prevent a second rendering of the same answer or completion package.
The [helper conversation procedure](references/helper-conversation.md) covers
this path; unsupported clients keep the coordinator relay.

Design surfaces material choices a reasonable human could decide differently,
including internal implementation choices, so the human understands and approves
the design. It reuses settled human decisions and distinguishes facts the source
requires from choices that still need an answer. It asks before settling the approach,
continues independent authorized work while waiting, then publishes a design
that explains how to build it. The job's current Markdown determines the next
step. A stated return to Doable happens automatically after its questions and
suggestions are resolved. If AI approval is required and allowed, design assesses
the job without asking whether to approve. For a ready Approvable job that permits
AI approval but does not require it, design asks one question: **Move to Doable**
first, then **Perform AI approval**, with its vote on Doable. An existing AI vote
means no further AI approval.

A manual stage change needs an explicit human instruction naming the destination
or choosing a stage option. A request to do, fix or continue work, or a published
design, supplies no such choice. Operation checks the original human instruction
even when a helper or capsule claims permission. A stage choice goes directly to
operation; an approval choice goes directly to design. Design also clarifies
unclear requests.

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

## Where to change a rule

Change a role file for what that role does. Change the coordinator's routing
table for which role receives a request. Keep shared procedures in
[references/](references/), and link to them from the roles that use them.
A role file should describe its own actions, not repeat another role's job.

Tool arguments and response handling belong in the tool descriptions in
`uclusion_investible_api/handlers/mcp_serve.py`. Run
`generateRoleToolFiles.py` from the web UI repository to generate the
`roles/*-tools.md` guides; do not edit those guides by hand.

When changing a responsibility, check the role, routing table and the relevant
flow here together. Keep headings accurate and explain actions in the order
they happen. Keep this guide short; the detailed procedures stay in their
linked files.
