---
name: uclusion
description: Use as coordinator for Uclusion jobs, tasks, bugs, questions, suggestions, comments, reviews, inbox notifications, find_work, Poke AI, Start/Added/Updated/Responded events, Uclusion short codes beginning J-, T-, B-, Q-, S-, O-, I-, R-, or C-, or workspace-history requests such as what was decided, what changed, and whether related/backlog work already exists. Also use when creating Uclusion work even if the prompt does not name Uclusion. Do not use for delegated design helpers or bounded implementation helpers, including assignments to edit Uclusion instruction source, or ordinary product or code work merely because a repository contains Uclusion integration code.
---
<!-- uclusion-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion workflow

Only the coordinator loads this core.

## Select the lane and load its rules

For a Uclusion request, the main agent is the coordinator. The coordinator first
reads [references/coordinator.md](references/coordinator.md). That router supplies
lookup and action choices and routes a result with a Job header to
[references/job.md](references/job.md), whose stage and action table selects
subsequent references.

Select subsequent units from routes in files already loaded, never by opening a
target file to learn whether it applies. The coordinator uses those routes for
its current stage and next action and loads newly applicable units before acting
when either changes.

Before reusing instructions, run the environment-correct local
`uclusion workflow-status <selected-package> [--loaded <content_id>]`, with the
selected package being the directory containing this SKILL.md. Its
`reload_required` governs reuse even without a resident bootstrap. Pass
`--loaded` only while the required complete bodies and their content ID remain
in context; omit it after compaction, restoration or body loss. Reload the
applicable units when true; otherwise reuse identical complete bodies across
paths. Read every required unit in full through its closing marker. References,
summaries and saved identifiers are not instruction or contract bodies.

<!-- /uclusion-skill:v1 -->
