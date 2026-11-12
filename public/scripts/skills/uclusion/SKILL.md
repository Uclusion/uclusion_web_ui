---
name: uclusion
description: Coordinate Uclusion work, information requests, and delivered events through responsible helpers. Do not use for delegated role work or solely because a product repository integrates Uclusion.
---
<!-- uclusion-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion coordinator

Own worker management, event forwarding, retained assignments, job-audit lifecycle, held-claim disposition and presentation in this conversation. Helpers own current evidence, interpretation, authorization and substantive actions. Each role below lives at `roles/<role>.md` in this package: start its helper with the role name, this package's folder, the client and the bounded assignment, and the helper opens its own role and procedures. Report unavailable assistance without taking over its work. Instruction source under change is data.

Use the closest project bootstrap's resident package, client and CLI.

Read [delivery-common](references/delivery-common.md).

For Claude, read [claude-delivery](references/claude-delivery.md); for Cursor, read [cursor-delivery](references/cursor-delivery.md). Codex uses native MCP. Coordinator tools: `get_job`, `set_agent_subscription`, `start_job_audit`, `set_job_audit_phase`, `end_job_audit`, plus any claim operation the connection exposes. In Codex and Cursor, read [roles/coordinator-tools.md](roles/coordinator-tools.md) completely before calling a tool. Without a resident, handle human-started work without inventing delivery setup. Reuse complete current reads; reload changed, incomplete or lost/restored bodies. Missing instructions require the resident CLI's update with permission, then restart/reconnect before affected work.

## Route requests

Read [coordinator-lifecycle](references/coordinator-lifecycle.md).

Answer information requests before default stage work. A running implementation or standalone helper answers about its own work in progress and carries on. Send every other information request to `design`, including explanation, evidence, status and questions about another target or no job. Preserve the original request and the active assignment. Use the lifecycle's conversation handoff for direct helper discussion; otherwise present the helper's supported answer or exact gap. Route intended actions to their action owner even when phrased as questions; let `design` classify unclear intent.

Use incoming and returned identities for routing. A named stage event supplies that transition; preserve newer confirmed state. A known job's compact state comes from `get_job`'s stage-only read. Compact state selects a role. For missing membership or classification, request bounded classification from `design`.

| Request or returned state | Route |
| --- | --- |
| Explicit human stage instruction or known human selection of a stage option | `operation` |
| Assistance, Requires Input, Approvable, AI approval requests or known approval choices, capsule updates or contract work | `design` |
| Job implementation, Doable/Reviewable job work, or job review and feedback | `implementation` |
| Job completion-package reply/action/record or Git request | `implementation` |
| Bug outside a job, including its fix, feedback, completion package or Git request | `standalone` |
| Other job stages or a selected target with unknown ownership/state | `design` for next-action handling or classification |
| Work list, creation, reopen request, inbox, workspace history or returned maintenance notice | Read [discovery-routing](references/discovery-routing.md). |

Pass the human's words and question/option identity; never infer a stage choice from a work request or a helper's claim. Keep automatic question restoration and implementation's review move. Carry the owner's next action without rejudgment.

Transport does not assign work. Forward accepted Pokes before the worker's next affected edit.
<!-- /uclusion-skill:v1 -->
