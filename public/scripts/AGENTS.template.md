<!-- uclusion-workflow:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion bootstrap for Codex

This shared bootstrap selects reader rules. Implementation helpers follow only
their bounded brief, even when editing instruction source. Design helpers load
only their coordinator-selected design package. These limits change no tool
availability or configuration.

The coordinator workflow lives in `$uclusion`; only coordinators apply its
activation, delivery and work-discovery rules below.
For coordinators, if both user and project Uclusion bootstrap blocks are visible,
only the closest project-scoped block and its adjacent Uclusion skill/reference package
own delivery, work discovery, and workflow. In that case do not invoke the
ambiguous user `$uclusion`; directly read the closest project's
`.agents/skills/uclusion/SKILL.md` and its required references. Ignore and do
not combine the user Uclusion skill.

Coordinators and design helpers read their selected skill and references in full
through end of file. Each file ends with its own closing `<!-- ... -->` marker;
a read that misses it is incomplete, so continue until it appears.

Coordinators and design helpers use
`{{UCLUSION_CLI}} workflow-status <selected-package> [--loaded <content_id>]`
for `reload_required`. Pass `--loaded` only with required complete bodies and
their ID still in context; omit it after compaction, restoration, or body loss.
Reload when true; otherwise reuse identical bodies across paths. Check your
role's package; summaries and saved IDs are not bodies.

The remaining rules apply only to coordinators.

The installed Uclusion MCP integration owns automatic Poke AI delivery through
Codex's native steering and queue APIs. Start ordinary `codex` with that integration; never run
`uclusion wait` or `uclusion listen`, and never start a separate companion.
Each registered root in its workspace/environment receives its own copy. Busy
agents receive Pokes as input to their active turn; idle agents wake through the
native queue. Pokes do not cancel a running command. After `/new`, both the old and new
conversations remain recipients while their Uclusion roots remain registered;
receiving a Poke never grants ownership of another agent's work.

Fresh startup starts after retained history. Never add
`--deliver-existing-pokes` yourself. A human-requested replay is an unmarked
private copy and is handled only as their request directs. Delivery after a
deliberate quit and restart, and recovery before the first conversation turn,
are outside the delivery guarantee. Do not narrate default delivery startup or
skipped history. If the MCP connection is unavailable, suggest an
environment-correct `uclusion update` and a fresh session started with `codex`.

On any `Start`, `Added`, `Updated`, or `Responded` line, or when a request
names Uclusion, Poke AI, find_work, or a Uclusion short code beginning `J-`,
`T-`, `B-`, `Q-`, `S-`, `O-`, `I-`, `R-`, or `C-`, invoke `$uclusion` before
acting.

At an unassigned session start or when the assignment ends, invoke `$uclusion`
and call `find_work`. While an assignment remains, find other work only on an
explicit human request. A Poke, delivery rearm, or turn ending alone never
triggers discovery. If the skill or one of its required references
is absent or unreadable, report that the Uclusion install is broken, suggest
permission to run `{{UCLUSION_CLI}} update`, and after success require a
client restart or MCP reconnect before Uclusion work. Do not improvise the
workflow.
<!-- /uclusion-workflow:v1 -->
