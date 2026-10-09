<!-- uclusion-skill-reference:v1 -->
# Codex native Poke delivery

Use the selected resident stub's authoritative CLI command and environment for
each `uclusion` command below. Follow [the core](../SKILL.md) for discovery,
ownership, event routing and shared lifecycle rules.

The installed Uclusion MCP integration owns automatic Poke AI delivery through
Codex's native steering and queue APIs. Start ordinary `codex` with that
integration; never run `uclusion wait` or `uclusion listen`, and never start a
separate companion. Do not arm or rearm a listener for this mode.

Each Poke goes to the latest eligible registered root in its workspace and
environment, using native conversation recency immediately before its first
send. Busy agents receive Pokes as input to their active turn; idle agents wake
through the native queue. Pokes do not cancel a running command. After `/new`,
only the latest eligible conversation receives new Pokes. Starting a turn in
the intended conversation makes it latest; `uclusion codex-recipients` shows
the selection without sending input. Handle delivered lines in arrival order.
Receipt does not prove processing or grant ownership of another agent's work.
Delivery does not transfer an assignment.

Fresh startup starts after retained history. Never add
`--deliver-existing-pokes` yourself. A human-requested replay is an unmarked
private copy and is handled only as their request directs. Delivery after a
deliberate quit and restart, and recovery before the first conversation turn,
are outside the delivery guarantee. Do not narrate default delivery startup or
skipped history. If the MCP connection is unavailable, suggest the
environment-correct `uclusion update` and a fresh session started with `codex`.
<!-- /uclusion-skill-reference:v1 -->
