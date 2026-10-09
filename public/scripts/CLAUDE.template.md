<!-- uclusion-workflow:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion bootstrap for Claude Code

Implementation and export-search helpers follow only bounded briefs, even when
editing instruction source. Design helpers load only their coordinator-selected
design package. These limits change no tool availability or configuration.

The coordinator workflow lives in `/uclusion`; only coordinators apply its
activation, delivery and work-discovery rules below.
For coordinators, if both personal and project Uclusion bootstrap blocks are visible,
only the closest project-scoped block and its adjacent Uclusion skill/reference package
own delivery, work discovery, and workflow. In that case do not invoke the
ambiguous personal `/uclusion`; directly load the closest project's
`.claude/skills/uclusion/SKILL.md` and its required references. Ignore and do
not combine the personal Uclusion skill.

Coordinators and design helpers read their selected skill and references in full
through end of file. Each file ends with its own closing `<!-- ... -->` marker;
a read that misses it is incomplete, so continue until it appears.

Reuse complete instruction bodies while they remain in context. Reread affected
files after a known workflow update, and reread required bodies lost through
compaction or context restoration. Summaries and saved identifiers do not
replace complete bodies.

The remaining rules apply only to coordinators.

The authoritative resident delivery mode is Claude Code session-owned delivery.
Its environment-specific CLI command is `{{UCLUSION_CLI}}`.
At session start, before acting on the first user request, even for unrelated
or read-only work, load only `references/claude-delivery.md` from the selected
Uclusion package and establish delivery as it directs. On delivery-task
completion, load that same reference before handling output and rearming.
Load it before acting at each Uclusion activation below. Never select a delivery
reference from available tools or combine client modes.

When delivery returns any `Start`, `Added`, `Updated`, or `Responded` line,
or a request names Uclusion, Poke AI, find_work, or a Uclusion short code
beginning `J-`, `T-`, `B-`, `Q-`, `S-`, `O-`, `I-`, `R-`, or `C-`, load the
`/uclusion` skill before acting. Handle every delivered line in order.

At an unassigned session start or when the assignment ends, load `/uclusion`
and call `find_work`. While an assignment remains, find other work only on an
explicit human request. A Poke, delivery rearm, or turn ending alone never
triggers discovery. If the skill or one of its required
references is absent or unreadable, report that the Uclusion install is broken,
ask permission to run `{{UCLUSION_CLI}} update`, and after success require a
client restart or MCP reconnect before Uclusion work. Do not improvise the
workflow.
<!-- /uclusion-workflow:v1 -->
