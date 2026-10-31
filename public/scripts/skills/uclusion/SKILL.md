---
name: uclusion
description: Coordinate Uclusion work, information requests, and delivered events through responsible helpers. Do not use for delegated role work or solely because a product repository integrates Uclusion.
---
<!-- uclusion-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion coordinator

Own worker management, event forwarding, retained assignments, job-audit lifecycle, held-claim disposition and user presentation. Helpers own current evidence, interpretation, authorization and substantive actions. Role paths below are destinations; their procedures and target/capsule/standing bodies stay with the responsible helper. Report unavailable assistance without taking over its work. Instruction source under change is data.

Use the closest project bootstrap's resident package, client and CLI. Before tool discovery, hold [delivery-common](references/delivery-common.md), plus [claude-delivery](references/claude-delivery.md) for Claude or [cursor-delivery](references/cursor-delivery.md) for Cursor; Codex uses native MCP. Without a resident, handle human-started work without inventing delivery setup. Reuse complete current reads; reload changed, incomplete or lost/restored bodies. Missing instructions require the resident CLI's update with permission, then restart/reconnect before affected work.

## Route requests

Send information requests to `references/question-helper.md` before default stage work, including explanation, evidence, status and questions about another target. Preserve the original request and retain the active assignment and running implementation worker. Present the question helper's supported answer or exact gap. Route intended actions to their action owner even when phrased as questions; let the question helper classify unclear intent.

Use incoming and returned identities for routing. A named stage event supplies that transition; preserve newer confirmed state. When a known job needs compact state, use `get_job` with only `short_code_id` and `stage_only:true`. It returns job, stage and pending question/suggestion codes, including resolved delegated questions still awaiting handling. Compact state selects a role; that role establishes readiness and permission. For missing membership or classification, request bounded classification from the question helper.

| Request or returned state | Role destination |
| --- | --- |
| Explicit manual job-stage instruction or the question helper's qualified transition request | `references/operation-helper.md` |
| Pending assistance, Requires Input, Approvable, question/option/vote handling or job approval | `references/question-helper.md` |
| Known current-capsule update or requested contract work | Selected sibling `../uclusion-design/SKILL.md` |
| Doable work or a bounded implementation request | `references/implementation-helper.md` |
| Bounded investigation or independent code review | `references/investigation-helper.md` |
| Reviewable work, returned implementation, human-review publication/recovery or current-review feedback | `references/implementation-helper.md` |
| Current completion-package reply or unfinished selected package action | `references/operation-helper.md` |
| View bug with no known job | `references/standalone-helper.md` |
| Other job stages or a selected target with unknown ownership/state | `references/question-helper.md` for next-action handling or classification |
| Work list, creation, inbox, workspace history or returned maintenance notice | [discovery-routing](references/discovery-routing.md) |
| Bounded search of a prepared export | `references/export-search.md` |

Select the role from the requested work, preserving an explicitly human-selected specialty identity. Question settlement owns automatic stage restoration; implementation owns its human-review publication transition. Carry the responsible helper's decision and required next action without coordinator rejudgment.

Use [coordinator-lifecycle](references/coordinator-lifecycle.md) when starting, matching, forwarding to or retiring helpers and when applying their outcomes. Use the selected delivery procedure for arrival order, replay and rearm; transport does not assign work. Forward accepted Pokes before the worker's next affected edit.
<!-- /uclusion-skill:v1 -->
