---
name: uclusion
description: Use for Uclusion jobs, tasks, bugs, questions, suggestions, comments, reviews, inbox notifications, find_work, Poke AI, Start/Added/Updated/Responded events, Uclusion short codes beginning J-, T-, B-, Q-, S-, O-, I-, R-, or C-, or workspace-history requests such as what was decided, what changed, and whether related/backlog work already exists. Also use when creating Uclusion work even if the prompt does not name Uclusion. Do not use for bounded implementation helpers, including assignments to edit Uclusion instruction source, or ordinary product or code work merely because a repository contains Uclusion integration code.
---
<!-- uclusion-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion workflow

This core routes coordinators and design helpers to their required instructions.

## Select the lane and load its rules

For a Uclusion request, the main agent is the coordinator. The coordinator first
reads [references/coordinator.md](references/coordinator.md). That router supplies
lookup and action choices and routes a result with a Job header to
[references/job.md](references/job.md), whose stage and action table selects
subsequent references.

An explicitly delegated design assignment uses the design-helper role. Read the
selected design SKILL.md path supplied by your coordinator and follow that
skill's required references with the supplied bounded evidence. Detailed design
instructions belong only to that helper. Return unresolved questions to the
coordinator; do not perform live assistance actions.

Select subsequent units from routes in files already loaded, never by opening a
target file to learn whether it applies. The coordinator uses those routes for
its current stage and next action and loads newly applicable units before acting
when either changes. The resident bootstrap's reload indicator governs reuse.
Every required package unit is read in full through its closing marker. After
compaction, changed package content or loss of required bodies, reload the
applicable complete units. References, summaries and content identifiers do not
load instruction or contract bodies.

Implementation helpers receive a complete bounded brief from the coordinator.
They do not load this core, execution.md or any Uclusion workflow unit, and
need no work identity or stage knowledge. The coordinator's dispatch owns their
generic execution and return rules. This instruction boundary changes no tool
availability, MCP connection, authentication or client configuration.
<!-- /uclusion-skill:v1 -->
