---
name: uclusion
description: Use as coordinator for Uclusion jobs, tasks, bugs, questions, suggestions, comments, reviews, inbox notifications, find_work, Poke AI, Start/Added/Updated/Responded events, Uclusion short codes beginning J-, T-, B-, Q-, S-, O-, I-, R-, or C-, or workspace-history requests such as what was decided, what changed, and whether related/backlog work already exists. Also use when creating Uclusion work even if the prompt does not name Uclusion. Do not use for delegated design, export-search, investigation, code-review or implementation helpers, including assignments to read or edit Uclusion instruction source, or ordinary product or code work merely because a repository contains Uclusion integration code.
---
<!-- uclusion-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion workflow

Use the Uclusion MCP server as the durable collaboration surface. Coordinators own delivery/assignment/stage/authority, Uclusion reads/writes except bounded capsule publication/implementation reads, CLI, human conversation, helper grants/returns, commits/pushes/packages. Other work requires fresh helpers; unavailable helpers never fall back to coordinator execution. Source inspection activates no workflow. Obtain informed human approval for reviewer-divergent choices; never silently settle them; never infer missing observed runtime behavior from code.

## Complete reads and current action routing

Select from known event/lane/stage/action before opening a leaf. Read required complete current bodies through closing markers once; reuse while held across Pokes, reload only known updates/incomplete reads/body loss including restoration/compaction. Summaries/IDs never substitute. Missing required instructions mean broken install: request resident-environment update permission, then restart/reconnect.

## Authority before lookup

One default job/bug except review split; reading/delivery/turn end never assign/switch/release. Activation requires human selection, live Start while idle or successful optional claim. Bare Start remains an event even in chat. Retain pending work/input/packages under lane release rules.

Do not end a turn on a retained Doable job while authorized unfinished work can proceed. Resolving questions, receiving replies and reaching checkpoints require [remaining-work reconciliation](references/session-handoff.md) before a final response; do not wait for another Poke to continue.

Before lookup silently discard replayed history and idle continuations; while assigned accept only known membership, deferring unrelated/unknown bare codes without lookup and briefly naming them. Compound parent after of determines membership; deferred Start never activates later.

First selected whole-scope lookup uses initial_read:true: selected capsule/comments including resolved replies, or active ordinary notes if absent. Other capsules remain references; threads/sections keep requested scope and standing/resolved bodies need explicit reads. Actual returned Job header determines lane. Without armed delivery refresh assigned state before edits/package and after reply, plus job effective-stage gates.

Discovery only at unassigned start, assignment end or explicit other-work request, never Poke/rearm/turn end. The first wait/completed package of this session's retained human-guided assignment selects work-discovery.md's once/session informational hint.

## Current required set

Core/lane authority applies to each selected action; no future-action preload.

| Known trigger/action | Complete reference |
| --- | --- |
| Discovery/list/empty/auto-take or first-wait hint | [work-discovery](references/work-discovery.md) |
| Accepted event or assignment activation/switch/release | [event-routing](references/event-routing.md) |
| Returned Job header | [job-coordinator](references/job-coordinator.md), then its current route |
| Standalone bug, no Job header | [single-comment](references/single-comment.md) |
| Question/option/vote or standalone view question | [question-tools](references/question-tools.md) |
| Listed standing notes/view work, note change/body loss, helper constraints/returned-question qualification | [standing-instructions](references/standing-instructions.md) |
| History/possibly settled answer/duplicate search/ANY design delegation/reliance on another design | [history-search](references/history-search.md) |
| Durable writes/creation/reopening/correction OR encountering general guidance before retention choice | [durable-records](references/durable-records.md) |
| Fresh helper dispatch/return except export search | [helper-dispatch](references/helper-dispatch.md) |
| Current lane-prepared package | [completion](references/completion.md) |
| find_work backlog_maintenance | [backlog-maintenance](references/backlog-maintenance.md) |
| auto_take_directions/exposed claim_work (including deferred)/held claim, before affected discovery/ownership/package/handoff | [claims](references/claims.md) |
| Inbox decision/progress/handoff/helper wait/turn end/fresh-context offer | [session-handoff](references/session-handoff.md) |

## Select the resident delivery reference

Closest project resident/adjacent package overrides personal/user. Its client and CLI environment are authoritative; never infer mode from tools or combine clients. At resident startup/typed-turn/output/exit/Uclusion triggers hold its selected client body plus [delivery-common](references/delivery-common.md); reuse never replaces required delivery actions. No resident means human-started work without delivery loading/setup/invented waiting.

| Resident | Client body |
| --- | --- |
| Codex native MCP | [codex-delivery](references/codex-delivery.md) |
| Claude session-owned | [claude-delivery](references/claude-delivery.md) |
| Cursor chat-owned | [cursor-delivery](references/cursor-delivery.md) |

## Common authorization

Implementation never grants tests/builds/security expansion/deploy/commit/push. Keep independent human permissions; unsettled permission blocks only its action and uses lane's permitted question tool. Job execution owns its extra qualifications; standalone discussion limits remain.
<!-- /uclusion-skill:v1 -->
