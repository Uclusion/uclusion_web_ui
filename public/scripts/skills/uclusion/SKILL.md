---
name: uclusion
description: Dispatch Uclusion jobs, tasks, bugs, questions, suggestions, comments, reviews, inbox requests, find_work, Poke AI, Start/Added/Updated/Responded events, J-/T-/B-/Q-/S-/O-/I-/R-/C- codes, work creation and workspace-history requests to fresh responsible helpers. Do not use for delegated role work, including reading or editing Uclusion instruction source, or ordinary product work merely because its repository integrates Uclusion.
---
<!-- uclusion-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion dispatcher

Keep delivery, target identity, fresh helper startup and confirmed handoffs here. Helpers own interpretation, evidence, authorization and actions. Never read full target/capsule/standing bodies, qualify answers, assemble detailed grants or load helper policy to dispatch. Unavailable fresh helpers mean report the limitation, never execute their work here. Source under change activates no workflow.

Read this complete current body and resident delivery bodies through closing markers once; reuse across Pokes, reload known updates/incomplete reads/body loss including restoration. Missing instructions mean broken install: request the resident CLI's update, then restart/reconnect.

## Delivery and retained target

Use the closest resident/adjacent package and its exact client/CLI; never combine clients or infer mode from tools. Hold references/delivery-common.md plus references/claude-delivery.md for Claude or references/cursor-delivery.md for Cursor. Codex native MCP needs no extra client body. No resident means human-started work without invented delivery setup/waiting.

Handle lines in order; forward each accepted Poke before the helper's next edit. Silently discard replayed history and idle continuations. One retained job/bug except helper-confirmed review split: human selection, a live Start while idle or a confirmed claim activates it. Reading, Pokes, rearm and turn end never switch/release it. Bare Start is an event even in chat. For delivered events while assigned accept only known members; compound membership uses the parent after `of`. Defer unrelated/unknown delivered codes without lookup, briefly naming them. An explicit human read-only question about another target instead goes to the question role with that target and original request; retain the active assignment and other worker's ownership. This grants no discovery, work takeover or mutation. Only explicit human switching changes a retained assignment; a deferred Start never activates later. Multiple idle agents need human selection, never inbox election.

## Route and start

Route an ordinary human information request to a fresh answer-owning question helper before default stage work, including requests for explanation, evidence, status or related-target history. Pass the original request, its target and available identities. Distinguish information from a request to perform an action by the intended outcome, never question punctuation or wording alone; action requests phrased as questions keep their normal action route. If intent is unclear, let the question helper classify it. Preserve an already-running implementation worker and its authorized scope while the separate question helper obtains the answer; do not replace, restart or make that worker answer instead.

Otherwise, at unassigned startup/assignment end or explicit other-work/creation request, start discovery. For a retained job, use known incoming/returned identities and `get_job({short_code_id: "<target>", stage_only: true})` only when compact state is needed. A named stage event supplies that transition without confirmation lookup; preserve newer state. Compact questions include unresolved or delegated pending handling; completed no-change questions are not pending. Compact state selects a role, never proves action readiness.

| Known input/state | Fresh role entry (do not read it here) |
| --- | --- |
| Human information request, including scoped read-only questions about another target | references/question-helper.md (owns the answer before default stage work) |
| Pending questions/suggestions, Requires Input, Uclusion question/option/vote records, job approval or other nonexecutable stage | references/question-helper.md |
| Approvable without pending assistance | references/question-helper.md (approval) |
| Known current-capsule update or requested capsule work | Selected sibling ../uclusion-design/SKILL.md |
| Doable | references/implementation-helper.md |
| Reviewable, returned implementation, or current-review feedback | references/review-helper.md |
| Reply naming current completion package, or confirmed package operation continuation | references/operation-helper.md |
| Standalone bug with no known job | references/standalone-helper.md |
| Selected direct code without known job/state | references/question-helper.md (classify target) |
| Unassigned discovery/claims/maintenance, requested creation or a helper's workspace-history search handoff | references/discovery-helper.md |
| Helper requests capsule, investigation or another role | Selected sibling ../uclusion-design/SKILL.md, references/investigation-helper.md, or its named role |

Use a fresh helper without inherited transcript (`fork_turns: "none"` in Codex). Pass the selected absolute role path, target, incoming message and available canonical reference identities/versions, repository paths and confirmed receipts/unfinished outcomes. Pass known human instructions verbatim; do not reconstruct evidence or permission grants. The helper reads its role and fetches current evidence itself. Do not pass dispatcher/bootstrap bodies. Tools/configuration stay unchanged.

## Confirmed handoff

Forward updates and returned receipts to the responsible role. Follow its next-role, continuation, wait, assignment/claim/audit identity and presentation instructions without rejudging, subject to the repeated-handoff stop below. Present the answer-owning helper's supported answer or exact blocker to the original human request; root does not compose or judge the substantive answer. Present confirmed packages immediately and verbatim with their exact thread; never re-emit full packages on later waits. Retain unfinished/reply/package assignments until a responsible helper confirms release. Preserve identities, confirmed outcomes, unfinished operations and one-time presentation flags across compaction; never replay a confirmed action after a later failure.

For an unanswered request, retain its original question and redirect receipts across role changes and compaction. If a no-answer redirect recurs with the same target, evidence identities/versions, role and returned outcome, stop that chain at the first recurrence instead of dispatching it again. Report the concrete unresolved delegation failure with the original request, target and stalled handoffs; preserve assignment, active workers and confirmed receipts. Root never supplies the missing substantive answer. New human input or changed evidence may resume the responsible answer role; a rearm, ordinary turn end or unchanged Poke does not restart the same chain. This stop does not cancel independent authorized work.

Continue the requested mechanical handoff while authorized work remains. While a helper runs, use interruptible delivery waits when there is no independent handoff; timeout is no shutdown deadline. Wait only on the helper's actual blocker/handoff or explicit human pause. Discovery occurs only at unassigned startup/confirmed assignment end or explicit human request, never at Poke/rearm/ordinary turn end.
<!-- /uclusion-skill:v1 -->
