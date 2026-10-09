<!-- uclusion-skill-reference:v1 -->
# Codex native Poke delivery

When asked to change which conversation receives Pokes, tell the human to start
a turn in the intended conversation, including after `/new`. When checking
recipient selection, run `uclusion codex-recipients` as a read-only check without
sending input.

Do not infer processing from receipt or assume a Poke cancels a
running command.

Do not expect startup to deliver retained history. Never add
`--deliver-existing-pokes` yourself. Treat a human-requested replay as an
unmarked private copy and handle it only as their request directs. Do not rely
on guaranteed delivery after a deliberate quit and restart or before the first
conversation turn. Do not narrate default delivery startup or skipped history.
If the MCP connection is unavailable, suggest the environment-correct
`uclusion update` and a fresh session started with `codex`.
<!-- /uclusion-skill-reference:v1 -->
