---
name: uclusion
description: Use as coordinator for Uclusion jobs, tasks, bugs, questions, suggestions, comments, reviews, inbox notifications, find_work, Poke AI, Start/Added/Updated/Responded events, Uclusion short codes beginning J-, T-, B-, Q-, S-, O-, I-, R-, or C-, or workspace-history requests such as what was decided, what changed, and whether related/backlog work already exists. Also use when creating Uclusion work even if the prompt does not name Uclusion. Do not use for delegated export-search or design helpers, or bounded implementation helpers, including assignments to edit Uclusion instruction source, or ordinary product or code work merely because a repository contains Uclusion integration code.
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

Read every required unit in full through its closing marker when first needed.
Reuse complete instruction bodies while they remain in context. Reread affected
units after a known workflow update, and reread required bodies lost through
compaction or context restoration before continuing. Summaries and saved
identifiers do not replace instruction or contract bodies.

<!-- /uclusion-skill:v1 -->
